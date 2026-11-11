const express = require('express');
const cors = require('cors');
const { listenToBinance } = require('./binance/websocket');
const apiRoutes = require('./api/routes');

const app = express();
const PAIRS = ['btcusdt'];

app.use(cors());
app.use('/api', apiRoutes);

app.listen(8765, () => {
  console.log('REST API server started on http://localhost:8765');
});

// Binance WebSocket start
PAIRS.forEach(listenToBinance);
