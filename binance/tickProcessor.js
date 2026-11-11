const { saveCandle } = require('../db/candleDao');

const TICK_SIZES = [500, 1500, 4500];
const TICK_BUFFERS = new Map(); // Map<tickSize, Tick[]>

function processTick(tickSize, price, qty, timestamp) {
  if (!TICK_BUFFERS.has(tickSize)) TICK_BUFFERS.set(tickSize, []);
  const buffer = TICK_BUFFERS.get(tickSize);

  buffer.push({ price, qty: parseFloat(qty), timestamp });

  if (buffer.length >= tickSize) {
    const ticks = buffer.splice(0, tickSize);
    const prices = ticks.map(t => t.price);
    const volume = ticks.reduce((sum, t) => sum + t.qty, 0);

    const candle = {
      // Keep milliseconds for uniqueness; frontend expects ms now.
      time: ticks[ticks.length - 1].timestamp,
      open: ticks[0].price,
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: ticks[ticks.length - 1].price,
      volume,
    };

    saveCandle(tickSize, candle);
    console.log(`[SAVE] ${tickSize} ->`, candle);
  }
}

function handleTrade(pair, trade) {
  const price = parseFloat(trade.p);
  const qty = trade.q; // trade quantity
  const timestamp = trade.T;
  TICK_SIZES.forEach(size => processTick(size, price, qty, timestamp));
}

module.exports = { handleTrade };
