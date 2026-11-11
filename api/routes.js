const express = require('express');
const router = express.Router();
const { getCandles } = require('../db/candleDao');

// GET /api/candles?tick_size=500&limit=500&before=TIMESTAMP_MS
// GET /api/candles?tick_size=500&limit=500&after=TIMESTAMP_MS

// router.get('/candles', async (req, res) => {
//   const tickSize = parseInt(req.query.tick_size, 10);
//   if (![500, 1500, 4500].includes(tickSize)) {
//     return res.status(400).json({ error: 'Invalid tick_size' });
//   }
//   const candles = await getRecentCandles(tickSize);  

//   // momentum add
//   const momentum = calculateMomentum(candles);
//   const merged = candles.map((c, i) => ({
//     ...c,
//     momentum: momentum[i]?.momentum ?? null,
//     divergence: momentum[i].divergence ?? null,
//   }));
//   console.log(merged);
//   res.json(merged);
// });

router.get('/candles', async (req, res) => {
  const tickSize = parseInt(req.query.tick_size, 10);
  if (![500, 1500, 4500].includes(tickSize)) {
    return res.status(400).json({ error: 'Invalid tick_size' });
  }

  const limit = parseInt(req.query.limit, 10) || 300;
  const before = req.query.before ? parseInt(req.query.before, 10) : null;
  const after  = req.query.after  ? parseInt(req.query.after, 10) : null;

  const candles = await getCandles(tickSize, { limit, before, after });
  res.json(candles);
});


module.exports = router;
