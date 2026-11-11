const WebSocket = require('ws');
const { handleTrade } = require('./tickProcessor');

function listenToBinance(pair) {
  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${pair}@trade`);

  ws.on('open', () => console.log(`📡 Listening to ${pair.toUpperCase()}`));
  ws.on('message', msg => {
    try {
      const trade = JSON.parse(msg);
      // console.log(trade);
      handleTrade(pair, trade);
    } catch (e) {
      console.error('Parse Error:', e);
    }
  });
  ws.on('close', () => {
    console.warn(`Closed. Reconnecting...`);
    setTimeout(() => listenToBinance(pair), 5000);
  });
  ws.on('error', console.error);
}

module.exports = { listenToBinance };
