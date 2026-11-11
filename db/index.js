// index.js
const { Pool, Client } = require("pg");

const DB_NAME = process.env.PGDATABASE || "rado";
if (!process.env.PGPASSWORD) {
  throw new Error("Set PGPASSWORD before starting the server. See README.md.");
}

// Base connection (no database specified here)
const baseConfig = {
  user: process.env.PGUSER || "postgres",
  host: process.env.PGHOST || "127.0.0.1",   // <-- local default
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT || 5432),
};

// Validate db name to avoid SQL injection in CREATE DATABASE
function assertSafeDbName(name) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(`Unsafe database name: ${name}`);
  }
}

async function ensureDatabaseExists(dbName) {
  assertSafeDbName(dbName);

  // Connect to default "postgres" database to create target DB if missing
  const admin = new Client({ ...baseConfig, database: "postgres" });
  await admin.connect();

  try {
    const check = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (check.rowCount === 0) {
      // Identifiers cannot be parameterized; validated above.
      await admin.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Created database: ${dbName}`);
    }
  } finally {
    await admin.end();
  }
}

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS candle_data (
  tick_size INTEGER NOT NULL,
  time BIGINT NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low  NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume NUMERIC NOT NULL,
  PRIMARY KEY (tick_size, time)
);
`;

const pool = new Pool({ ...baseConfig, database: DB_NAME });

async function maybeMigrateTimeToMs() {
  const { rows } = await pool.query("SELECT MAX(time) AS max_time FROM candle_data");
  const maxTime = rows?.[0]?.max_time ? Number(rows[0].max_time) : null;
  if (!maxTime) return;

  // If time looks like seconds (10-digit), convert to milliseconds once.
  if (maxTime < 100000000000) {
    await pool.query("UPDATE candle_data SET time = time * 1000");
    console.log("Migrated candle_data time to milliseconds");
  }
}

// initPromise ensures: DB exists -> table exists, before any query runs
const initPromise = (async () => {
  await ensureDatabaseExists(DB_NAME);

  // If DB was just created, pool might have been created before DB existed.
  // In that case, first query could fail once. We'll retry once after DB creation.
  try {
    await pool.query(CREATE_TABLE_SQL);
  } catch (e) {
    // retry once
    await new Promise((r) => setTimeout(r, 200));
    await pool.query(CREATE_TABLE_SQL);
  }

  await maybeMigrateTimeToMs();
  console.log("candle_data table ensured");
})();

// Export a "pool-like" object so existing code using pool.query keeps working
module.exports = {
  query: (...args) => initPromise.then(() => pool.query(...args)),
  end: (...args) => pool.end(...args),
  _pool: pool,
  _init: initPromise,
};
