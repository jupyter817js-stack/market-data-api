// candleDao.js
const db = require("./index");

async function saveCandle(tickSize, { time, open, high, low, close, volume }) {
  try {
    await db.query(
      `INSERT INTO candle_data (tick_size, time, open, high, low, close, volume)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (tick_size, time) DO NOTHING`,
      [tickSize, time, open, high, low, close, volume]
    );
  } catch (err) {
    console.error("❌ DB INSERT ERROR:", err);
  }
}

async function getRecentCandles(tickSize) {
  const result = await db.query(
    `SELECT time, open, high, low, close, volume
     FROM candle_data
     WHERE tick_size = $1
     ORDER BY time DESC`,
    [tickSize]
  );
  return result.rows.reverse();
}

async function getCandles(tickSize, { limit, before, after }) {
  const params = [tickSize];
  let conditions = [];

  if (before) {
    conditions.push(`time < $${params.length + 1}`);
    params.push(before);
  }
  if (after) {
    conditions.push(`time > $${params.length + 1}`);
    params.push(after);
  }

  let query = `SELECT time, open, high, low, close, volume
               FROM candle_data
               WHERE tick_size = $1`;

  if (conditions.length) query += " AND " + conditions.join(" AND ");

  if (after) query += ` ORDER BY time ASC LIMIT $${params.length + 1}`;
  else query += ` ORDER BY time DESC LIMIT $${params.length + 1}`;

  params.push(limit);

  const { rows } = await db.query(query, params);
  return after ? rows : rows.reverse();
}

module.exports = { saveCandle, getRecentCandles, getCandles };
