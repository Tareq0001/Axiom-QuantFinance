/**
 * Axiom QuantFinance - Quantitative Technical Indicators Engine
 * Mathematical implementation of Trend, Momentum, and Volatility Oscillators
 * @author أ. طارق ابوعشي
 */

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(data, period) {
  const result = new Array(data.length).fill(null);
  if (data.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  result[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    sum += data[i] - data[i - period];
    result[i] = sum / period;
  }
  return result;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(data, period) {
  const result = new Array(data.length).fill(null);
  if (data.length < period) return result;

  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  let prevEMA = sum / period;
  result[period - 1] = prevEMA;

  for (let i = period; i < data.length; i++) {
    const currentEMA = data[i] * k + prevEMA * (1 - k);
    result[i] = currentEMA;
    prevEMA = currentEMA;
  }
  return result;
}

/**
 * Relative Strength Index (RSI - Wilder's Smoothing)
 */
export function calculateRSI(closes, period = 14) {
  const rsi = new Array(closes.length).fill(null);
  if (closes.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  rsi[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }

  return rsi;
}

/**
 * Moving Average Convergence Divergence (MACD)
 */
export function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine = new Array(closes.length).fill(null);
  for (let i = 0; i < closes.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine[i] = fastEMA[i] - slowEMA[i];
    }
  }

  // Filter valid entries for signal calculation
  const validIdx = macdLine.findIndex(v => v !== null);
  const signalLine = new Array(closes.length).fill(null);
  const histogram = new Array(closes.length).fill(null);

  if (validIdx !== -1) {
    const validMacd = macdLine.slice(validIdx);
    const validSignal = calculateEMA(validMacd, signalPeriod);

    for (let i = 0; i < validSignal.length; i++) {
      const globalIdx = validIdx + i;
      signalLine[globalIdx] = validSignal[i];
      if (signalLine[globalIdx] !== null && macdLine[globalIdx] !== null) {
        histogram[globalIdx] = macdLine[globalIdx] - signalLine[globalIdx];
      }
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Bollinger Bands (SMA + 2 StdDev)
 */
export function calculateBollingerBands(closes, period = 20, multiplier = 2) {
  const middle = calculateSMA(closes, period);
  const upper = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);
  const bandwidth = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const meanVal = middle[i];
    let sumSq = 0;
    for (let j = 0; j < slice.length; j++) {
      const diff = slice[j] - meanVal;
      sumSq += diff * diff;
    }
    const sd = Math.sqrt(sumSq / period);
    upper[i] = meanVal + multiplier * sd;
    lower[i] = meanVal - multiplier * sd;
    bandwidth[i] = meanVal !== 0 ? ((upper[i] - lower[i]) / meanVal) * 100 : 0;
  }

  return { middle, upper, lower, bandwidth };
}

/**
 * Average True Range (ATR)
 */
export function calculateATR(highs, lows, closes, period = 14) {
  const atr = new Array(closes.length).fill(null);
  if (closes.length <= period) return atr;

  const tr = new Array(closes.length);
  tr[0] = highs[0] - lows[0];

  for (let i = 1; i < closes.length; i++) {
    const h = highs[i], l = lows[i], prevC = closes[i - 1];
    tr[i] = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
  }

  let sum = 0;
  for (let i = 0; i < period; i++) sum += tr[i];
  atr[period - 1] = sum / period;

  for (let i = period; i < closes.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }

  return atr;
}
