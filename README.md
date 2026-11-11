# Market-data collection and candle API

A Node.js research backend that receives BTC/USDT trades from Binance's public WebSocket stream, groups them into tick-based OHLCV candles, stores completed candles in PostgreSQL, and exposes them through a REST API.

Frontend: https://github.com/jupyter817js-stack/market-chart-ui

## Implemented scope

- BTC/USDT public trade-stream ingestion.
- Candles formed from 500, 1,500, or 4,500 trades, rather than fixed time intervals.
- PostgreSQL persistence and chronological candle retrieval with before/after pagination.
- Reconnection after a WebSocket close.

This is a market-data and charting research project, not a complete trading platform. It does not implement order execution, wallet custody, or smart contracts. The repository name does not imply affiliation with TradingView.

## Data flow

```text
Binance trade stream -> websocket.js -> tickProcessor.js
 -> candleDao.js -> PostgreSQL -> GET /api/candles -> React charts
```

## Local setup

Use Node.js 22+ and a dedicated development PostgreSQL database. Startup creates the database if absent, creates its table, and may convert existing second-based timestamps to milliseconds. The development database role needs appropriate permissions.

```powershell
npm ci
Copy-Item .env.example .env
# Edit .env and set your own database password.
node --env-file=.env server.js
```

The server listens on port 8765. Plain `node server.js` does not load `.env`; use the command above or supply environment variables through your process manager. Never commit credentials.

## API

```http
GET /api/candles?tick_size=500&limit=300
GET /api/candles?tick_size=500&limit=300&before=TIMESTAMP_MS
GET /api/candles?tick_size=500&limit=300&after=TIMESTAMP_MS
```

Supported tick sizes: `500`, `1500`, `4500`. Records contain `time`, `open`, `high`, `low`, `close`, and `volume`. Timestamps are Unix milliseconds; PostgreSQL numeric fields can arrive as strings and are converted by the frontend.

## Current boundaries

- One instrument only: buffers and table keys do not distinguish symbols.
- Incomplete candles are in memory and lost on restart; reconnection does not backfill missing trades.
- Insert errors are logged without durable retry.
- API access is unauthenticated, CORS is unrestricted, and query validation is limited. Keep the development service private until production controls are implemented.
- No production trading reliability or strategy profitability is claimed.

Start a code review with `server.js`, `binance/tickProcessor.js`, `db/candleDao.js`, and `api/routes.js`.
