// calculateBetterMomentum.js

function calculateMomentum(candles, period = 14, zeroValue = 50) {
  const result = [];

  // Values for calculation
  let HH = 0, LL = 0;
  let OscHigh = 0, OscHighOld = 0, OscHighOlder = 0;
  let OscLow = 0, OscLowOld = 0, OscLowOlder = 0;
  let PriceHigh = 0, PriceHighOld = 0, PriceHighOlder = 0;
  let PriceLow = 0, PriceLowOld = 0, PriceLowOlder = 0;
  let CountH = 0, CountL = 0;

  // Simple momentum indicator: price change (close - previous close)
  let prevClose = null;
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    let momentum = null;
    let divergence = null;

    if (prevClose !== null) {
      const value2 = c.close - prevClose; // Momentum based on price change

      // Momentum oscillator based
      if (value2 > 0 && value2 >= HH) { HH = value2; CountH = 0; }
      if (value2 < 0 && value2 <= LL) { LL = value2; CountL = 0; }
      CountH++; CountL++;

      // Track lows
      if (value2 > LL / 2 && value2 < 0) {
        OscLowOlder = OscLowOld;
        OscLowOld = OscLow;
        OscLow = LL;
        PriceLowOlder = PriceLowOld;
        PriceLowOld = PriceLow;
        PriceLow = c.low;
      }

      // Track highs
      if (value2 < HH / 2 && value2 > 0) {
        OscHighOlder = OscHighOld;
        OscHighOld = OscHigh;
        OscHigh = HH;
        PriceHighOlder = PriceHighOld;
        PriceHighOld = PriceHigh;
        PriceHigh = c.high;
      }

      // Divergence conditions
      const isBullDiv = OscLow > OscLowOld && PriceLow <= PriceLowOld;
      const isBearDiv = OscHigh < OscHighOld && PriceHigh >= PriceHighOld;
      if (isBullDiv) divergence = "bull";
      if (isBearDiv) divergence = "bear";

      momentum = value2 + zeroValue;
    }

    result.push({
      time: c.time,
      momentum,
      divergence
    });
    prevClose = c.close;
  }

  return result;
}

module.exports = calculateMomentum;