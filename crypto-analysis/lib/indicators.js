export function calculateSMA(data, period) {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
      continue;
    }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

export function calculateEMA(data, period) {
  const ema = [];
  const multiplier = 2 / (period + 1);
  const firstSMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(null);
    } else if (i === period - 1) {
      ema.push(firstSMA);
    } else {
      ema.push((data[i] - ema[i - 1]) * multiplier + ema[i - 1]);
    }
  }
  return ema;
}

export function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return closes.map(() => null);

  const rsi = new Array(closes.length).fill(null);
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;

  const firstRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi[period] = 100 - 100 / (1 + firstRs);

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i] = 100 - 100 / (1 + rs);
  }

  return rsi;
}

export function calculateMACD(closes) {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  const macdLine = ema12.map((v, i) =>
    v !== null && ema26[i] !== null ? v - ema26[i] : null,
  );

  const firstValid = macdLine.findIndex((v) => v !== null);
  if (firstValid === -1) {
    const nulls = macdLine.map(() => null);
    return { macdLine, signalLine: nulls, histogram: nulls };
  }

  const validMacd = macdLine.slice(firstValid).filter((v) => v !== null);
  if (validMacd.length < 9) {
    const nulls = macdLine.map(() => null);
    return { macdLine, signalLine: nulls, histogram: nulls };
  }

  const signalLineFull = calculateEMA(validMacd, 9);
  const signalLine = new Array(closes.length).fill(null);

  for (let i = 0; i < signalLineFull.length; i++) {
    if (signalLineFull[i] !== null) {
      signalLine[firstValid + i] = signalLineFull[i];
    }
  }

  const histogram = macdLine.map((v, i) =>
    v !== null && signalLine[i] !== null ? v - signalLine[i] : null,
  );

  return { macdLine, signalLine, histogram };
}

export function calculateATR(ohlcv, period = 14) {
  if (ohlcv.length < period) return new Array(ohlcv.length).fill(null);

  const tr = [];
  for (let i = 0; i < ohlcv.length; i++) {
    if (i === 0) {
      tr.push(ohlcv[i].high - ohlcv[i].low);
      continue;
    }
    const tr1 = ohlcv[i].high - ohlcv[i].low;
    const tr2 = Math.abs(ohlcv[i].high - ohlcv[i - 1].close);
    const tr3 = Math.abs(ohlcv[i].low - ohlcv[i - 1].close);
    tr.push(Math.max(tr1, tr2, tr3));
  }

  const atr = new Array(ohlcv.length).fill(null);
  const firstATR = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  atr[period - 1] = firstATR;

  for (let i = period; i < tr.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }

  for (let i = 0; i < atr.length; i++) {
    if (atr[i] === null || isNaN(atr[i]) || atr[i] <= 0) {
      atr[i] = tr[i] || ohlcv[i].high - ohlcv[i].low || 0.0001;
    }
  }

  return atr;
}

export function calculateVolatility(closes, period = 20) {
  if (closes.length < period) return closes.map(() => null);

  const sma = calculateSMA(closes, period);
  const vols = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      vols.push(null);
      continue;
    }
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = sma[i];
    if (mean === 0) {
      vols.push(0);
      continue;
    }
    const variance =
      slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
    vols.push(Math.sqrt(variance));
  }
  return vols;
}

export function calculateVolatilityPercent(closes, period = 20) {
  const vols = calculateVolatility(closes, period);
  const sma = calculateSMA(closes, period);
  return vols.map((v, i) =>
    v !== null && sma[i] !== 0 ? (v / sma[i]) * 100 : null,
  );
}

export function calculateSupportResistance(ohlcv, period = 20) {
  if (!ohlcv || ohlcv.length === 0) {
    return { resistance: null, support: null, pivot: null };
  }

  const effectivePeriod = Math.min(period, ohlcv.length);
  const recent = ohlcv.slice(-effectivePeriod);
  const highs = recent.map((c) => c.high);
  const lows = recent.map((c) => c.low);

  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);

  return {
    resistance: highestHigh,
    support: lowestLow,
    pivot: (highestHigh + lowestLow + recent[recent.length - 1].close) / 3,
  };
}

// NEW: Combined function that calculates all indicators at once
export function calculateIndicators(coinId, ohlcv) {
  if (!ohlcv || ohlcv.length < 30) return null;

  const closes = ohlcv.map((c) => c.close);
  const lastClose = closes[closes.length - 1];

  const sma7 = calculateSMA(closes, 7);
  const sma25 = calculateSMA(closes, 25);
  const sma50 = calculateSMA(closes, 50);
  const sma99 = calculateSMA(closes, 99);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const atr = calculateATR(ohlcv, 14);
  const volatility = calculateVolatilityPercent(closes, 20);
  const sr = calculateSupportResistance(ohlcv, 20);

  const lastIndex = closes.length - 1;

  return {
    symbol: coinId.toUpperCase(),
    price: lastClose,
    sma7: sma7[lastIndex],
    sma25: sma25[lastIndex],
    sma50: sma50[lastIndex],
    sma99: sma99[lastIndex],
    ema12: ema12[lastIndex],
    ema26: ema26[lastIndex],
    rsi: rsi[lastIndex],
    macd: macd.macdLine[lastIndex],
    macdSignal: macd.signalLine[lastIndex],
    macdHistogram: macd.histogram[lastIndex],
    atr: atr[lastIndex],
    volatility: volatility[lastIndex],
    support: sr.support,
    resistance: sr.resistance,
    pivot: sr.pivot,
  };
}
