import {
  calculateRSI,
  calculateSMA,
  calculateEMA,
  calculateMACD,
  calculateATR,
  calculateVolatilityPercent,
  calculateSupportResistance,
} from "./indicators.js";

const SYMBOL_MAP = {
  bitcoin: "BTC",
  ethereum: "ETH",
  binancecoin: "BNB",
  solana: "SOL",
  ripple: "XRP",
  cardano: "ADA",
  polkadot: "DOT",
  chainlink: "LINK",
  "avalanche-2": "AVAX",
  "polygon-pos": "MATIC",
  dogecoin: "DOGE",
  tron: "TRX",
  litecoin: "LTC",
  "internet-computer": "ICP",
  dai: "DAI",
  "ethereum-classic": "ETC",
  stellar: "XLM",
  cosmos: "ATOM",
  filecoin: "FIL",
  "the-open-network": "TON",
};

function calculateRiskReward(entry, stopLoss, takeProfit) {
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);
  if (risk < 0.00000001 || !isFinite(risk)) return null;
  const rr = reward / risk;
  return isFinite(rr) ? parseFloat(rr.toFixed(1)) : null;
}

function formatCurrency(value) {
  if (!value && value !== 0) return "--";
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  if (value >= 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(8)}`;
}

function validateLevels(entry, stopLoss, takeProfit, type) {
  if (type === "buy") {
    if (takeProfit <= entry) takeProfit = entry * 1.05;
    if (stopLoss >= entry) stopLoss = entry * 0.95;
  } else {
    if (takeProfit >= entry) takeProfit = entry * 0.95;
    if (stopLoss <= entry) stopLoss = entry * 1.05;
  }
  return { stopLoss, takeProfit };
}

export function generateSignals(coinId, ohlcv) {
  if (!ohlcv || ohlcv.length < 30) {
    return { spot: [], futures: { scalp: [], swing: [] }, indicators: null };
  }

  const closes = ohlcv.map((c) => c.close);
  const lastPrice = closes[closes.length - 1];
  const lastCandle = ohlcv[ohlcv.length - 1];

  const rsi = calculateRSI(closes);
  const sma7 = calculateSMA(closes, 7);
  const sma25 = calculateSMA(closes, 25);
  const sma50 = calculateSMA(closes, 50);
  const sma99 = calculateSMA(closes, 99);
  const ema20 = calculateEMA(closes, 20);
  const macd = calculateMACD(closes);
  const volatility = calculateVolatilityPercent(closes);
  const atr = calculateATR(ohlcv);
  const sr = calculateSupportResistance(ohlcv);

  const i = closes.length - 1;
  const currentRSI = rsi[i];
  const currentSMA7 = sma7[i];
  const currentSMA25 = sma25[i];
  const currentSMA50 = sma50[i];
  const currentSMA99 = sma99[i];
  const currentEMA20 = ema20[i];
  const currentMACD = macd.macdLine[i];
  const currentSignal = macd.signalLine[i];
  const currentVol = volatility[i];

  let currentATR = atr[i];
  if (!currentATR || currentATR <= 0 || !isFinite(currentATR)) {
    const tr = Math.max(
      lastCandle.high - lastCandle.low,
      Math.abs(
        lastCandle.high - (ohlcv[ohlcv.length - 2]?.close || lastCandle.close),
      ),
      Math.abs(
        lastCandle.low - (ohlcv[ohlcv.length - 2]?.close || lastCandle.close),
      ),
    );
    currentATR = tr > 0 ? tr : lastPrice * 0.02;
  }

  const symbol =
    SYMBOL_MAP[coinId] || coinId.replace(/-/g, "").toUpperCase().slice(0, 6);

  const indicators = {
    symbol,
    rsi: currentRSI,
    sma7: currentSMA7,
    sma25: currentSMA25,
    sma50: currentSMA50,
    sma99: currentSMA99,
    ema20: currentEMA20,
    macd: currentMACD,
    signal: currentSignal,
    volatility: currentVol,
    atr: currentATR,
    support: sr.support,
    resistance: sr.resistance,
    price: lastPrice,
  };

  const spot = [];
  const scalp = [];
  const swing = [];
  const volPercent = currentVol || 0;

  // ========== SPOT SIGNALS ==========

  if (currentRSI < 30) {
    let stopLoss = Math.min(lastPrice - currentATR * 2, sr.support * 0.995);
    let takeProfit = lastPrice + currentATR * 2 * 2;
    ({ stopLoss, takeProfit } = validateLevels(
      lastPrice,
      stopLoss,
      takeProfit,
      "buy",
    ));

    spot.push({
      asset: symbol,
      type: "buy",
      title: "Potential BUY Zone",
      desc: `RSI oversold at ${currentRSI.toFixed(1)}`,
      confidence: currentRSI < 20 ? "High" : "Medium",
      indicators: ["RSI < 30"],
      entry: lastPrice,
      stopLoss,
      takeProfit,
      riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
    });
  } else if (currentRSI > 70) {
    let stopLoss = Math.max(lastPrice + currentATR * 2, sr.resistance * 1.005);
    let takeProfit = lastPrice - currentATR * 2 * 2;
    ({ stopLoss, takeProfit } = validateLevels(
      lastPrice,
      stopLoss,
      takeProfit,
      "sell",
    ));

    spot.push({
      asset: symbol,
      type: "sell",
      title: "Potential SELL Zone",
      desc: `RSI overbought at ${currentRSI.toFixed(1)}`,
      confidence: currentRSI > 80 ? "High" : "Medium",
      indicators: ["RSI > 70"],
      entry: lastPrice,
      stopLoss,
      takeProfit,
      riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
    });
  }

  if (currentSMA7 > currentSMA25 && lastPrice > currentSMA7) {
    let stopLoss = Math.min(lastPrice - currentATR * 2, currentSMA25 * 0.998);
    let takeProfit = lastPrice + currentATR * 2 * 2;
    ({ stopLoss, takeProfit } = validateLevels(
      lastPrice,
      stopLoss,
      takeProfit,
      "buy",
    ));

    spot.push({
      asset: symbol,
      type: "buy",
      title: "Uptrend Confirmed",
      desc: "Price above MA7 & MA25",
      confidence: lastPrice > currentSMA99 ? "High" : "Medium",
      indicators: ["MA Bullish"],
      entry: lastPrice,
      stopLoss,
      takeProfit,
      riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
    });
  } else if (currentSMA7 < currentSMA25 && lastPrice < currentSMA7) {
    let stopLoss = Math.max(lastPrice + currentATR * 2, currentSMA25 * 1.002);
    let takeProfit = lastPrice - currentATR * 2 * 2;
    ({ stopLoss, takeProfit } = validateLevels(
      lastPrice,
      stopLoss,
      takeProfit,
      "sell",
    ));

    spot.push({
      asset: symbol,
      type: "sell",
      title: "Downtrend Confirmed",
      desc: "Price below MA7 & MA25",
      confidence: lastPrice < currentSMA99 ? "High" : "Medium",
      indicators: ["MA Bearish"],
      entry: lastPrice,
      stopLoss,
      takeProfit,
      riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
    });
  }

  const prevMACD = macd.macdLine[i - 1];
  const prevSignal = macd.signalLine[i - 1];
  if (prevMACD !== null && prevSignal !== null) {
    if (currentMACD > currentSignal && prevMACD <= prevSignal) {
      let stopLoss = lastPrice - currentATR * 2;
      let takeProfit = lastPrice + currentATR * 2 * 2;
      ({ stopLoss, takeProfit } = validateLevels(
        lastPrice,
        stopLoss,
        takeProfit,
        "buy",
      ));

      spot.push({
        asset: symbol,
        type: "buy",
        title: "MACD Bullish Crossover",
        desc: "MACD crossed above signal line",
        confidence: "Medium",
        indicators: ["MACD Crossover"],
        entry: lastPrice,
        stopLoss,
        takeProfit,
        riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
      });
    } else if (currentMACD < currentSignal && prevMACD >= prevSignal) {
      let stopLoss = lastPrice + currentATR * 2;
      let takeProfit = lastPrice - currentATR * 2 * 2;
      ({ stopLoss, takeProfit } = validateLevels(
        lastPrice,
        stopLoss,
        takeProfit,
        "sell",
      ));

      spot.push({
        asset: symbol,
        type: "sell",
        title: "MACD Bearish Crossover",
        desc: "MACD crossed below signal line",
        confidence: "Medium",
        indicators: ["MACD Crossover"],
        entry: lastPrice,
        stopLoss,
        takeProfit,
        riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
      });
    }
  }

  // ========== FUTURES — SCALPING ==========

  if (volPercent > 2) {
    scalp.push({
      asset: symbol,
      type: "neutral",
      title: "High Volatility Alert",
      desc: `Volatility at ${volPercent.toFixed(2)}% — scalp with caution`,
      confidence: volPercent > 4 ? "High" : "Medium",
      indicators: ["Volatility Alert"],
      leverage: volPercent > 4 ? "1x-2x" : "1x-3x",
      style: "scalp",
    });
  }

  if (currentRSI < 35) {
    let stopLoss = Math.min(lastPrice - currentATR * 1.5, sr.support * 0.99);
    let takeProfit = lastPrice + currentATR * 1.5 * 3;
    ({ stopLoss, takeProfit } = validateLevels(
      lastPrice,
      stopLoss,
      takeProfit,
      "buy",
    ));

    scalp.push({
      asset: symbol,
      type: "buy",
      title: "Scalp Long",
      desc: `RSI oversold (${currentRSI.toFixed(1)}) — quick reversal play`,
      confidence: currentRSI < 25 ? "High" : "Medium",
      indicators: ["RSI < 35"],
      leverage: volPercent > 3 ? "1x-3x" : "3x-5x",
      entry: lastPrice,
      stopLoss,
      takeProfit,
      riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
      style: "scalp",
    });
  } else if (currentRSI > 65) {
    let stopLoss = Math.max(lastPrice + currentATR * 1.5, sr.resistance * 1.01);
    let takeProfit = lastPrice - currentATR * 1.5 * 3;
    ({ stopLoss, takeProfit } = validateLevels(
      lastPrice,
      stopLoss,
      takeProfit,
      "sell",
    ));

    scalp.push({
      asset: symbol,
      type: "sell",
      title: "Scalp Short",
      desc: `RSI overbought (${currentRSI.toFixed(1)}) — quick reversal play`,
      confidence: currentRSI > 75 ? "High" : "Medium",
      indicators: ["RSI > 65"],
      leverage: volPercent > 3 ? "1x-3x" : "3x-5x",
      entry: lastPrice,
      stopLoss,
      takeProfit,
      riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
      style: "scalp",
    });
  }

  if (
    currentSMA7 > currentSMA25 &&
    lastPrice > currentSMA7 &&
    volPercent > 1.5
  ) {
    let stopLoss = Math.min(lastPrice - currentATR * 1.5, currentSMA25 * 0.995);
    let takeProfit = lastPrice + currentATR * 1.5 * 2.5;
    ({ stopLoss, takeProfit } = validateLevels(
      lastPrice,
      stopLoss,
      takeProfit,
      "buy",
    ));

    scalp.push({
      asset: symbol,
      type: "buy",
      title: "Momentum Scalp Long",
      desc: "Short-term momentum burst",
      confidence: lastPrice > currentSMA99 ? "High" : "Medium",
      indicators: ["MA Bullish", "Momentum"],
      leverage: volPercent > 2.5 ? "2x-3x" : "3x-5x",
      entry: lastPrice,
      stopLoss,
      takeProfit,
      riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
      style: "scalp",
    });
  } else if (
    currentSMA7 < currentSMA25 &&
    lastPrice < currentSMA7 &&
    volPercent > 1.5
  ) {
    let stopLoss = Math.max(lastPrice + currentATR * 1.5, currentSMA25 * 1.005);
    let takeProfit = lastPrice - currentATR * 1.5 * 2.5;
    ({ stopLoss, takeProfit } = validateLevels(
      lastPrice,
      stopLoss,
      takeProfit,
      "sell",
    ));

    scalp.push({
      asset: symbol,
      type: "sell",
      title: "Momentum Scalp Short",
      desc: "Short-term momentum burst",
      confidence: lastPrice < currentSMA99 ? "High" : "Medium",
      indicators: ["MA Bearish", "Momentum"],
      leverage: volPercent > 2.5 ? "2x-3x" : "3x-5x",
      entry: lastPrice,
      stopLoss,
      takeProfit,
      riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
      style: "scalp",
    });
  }

  // ========== FUTURES — SWING TRADING ==========

  if (
    currentEMA20 > currentSMA50 &&
    lastPrice > currentEMA20 &&
    lastPrice > currentSMA50
  ) {
    const trendStrength = ((currentEMA20 - currentSMA50) / currentSMA50) * 100;

    let stopLoss = Math.min(lastPrice - currentATR * 3, currentSMA50 * 0.97);
    let takeProfit = lastPrice + currentATR * 3 * 4;
    ({ stopLoss, takeProfit } = validateLevels(
      lastPrice,
      stopLoss,
      takeProfit,
      "buy",
    ));

    swing.push({
      asset: symbol,
      type: "buy",
      title: "Swing Long",
      desc: `EMA20 above SMA50 (${trendStrength.toFixed(2)}% trend strength) — multi-day uptrend`,
      confidence: trendStrength > 2 ? "High" : "Medium",
      indicators: ["EMA20 > SMA50", "Trend Following"],
      leverage: volPercent > 3 ? "2x-3x" : "3x-5x",
      entry: lastPrice,
      stopLoss,
      takeProfit,
      riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
      holdTime: "2-7 days",
      style: "swing",
    });
  }

  if (
    currentEMA20 < currentSMA50 &&
    lastPrice < currentEMA20 &&
    lastPrice < currentSMA50
  ) {
    const trendStrength = ((currentSMA50 - currentEMA20) / currentSMA50) * 100;

    let stopLoss = Math.max(lastPrice + currentATR * 3, currentSMA50 * 1.03);
    let takeProfit = lastPrice - currentATR * 3 * 4;
    ({ stopLoss, takeProfit } = validateLevels(
      lastPrice,
      stopLoss,
      takeProfit,
      "sell",
    ));

    swing.push({
      asset: symbol,
      type: "sell",
      title: "Swing Short",
      desc: `EMA20 below SMA50 (${trendStrength.toFixed(2)}% trend strength) — multi-day downtrend`,
      confidence: trendStrength > 2 ? "High" : "Medium",
      indicators: ["EMA20 < SMA50", "Trend Following"],
      leverage: volPercent > 3 ? "2x-3x" : "3x-5x",
      entry: lastPrice,
      stopLoss,
      takeProfit,
      riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
      holdTime: "2-7 days",
      style: "swing",
    });
  }

  const prevSMA50 = sma50[i - 1];
  const prevSMA99 = sma99[i - 1];
  if (prevSMA50 !== null && prevSMA99 !== null) {
    if (currentSMA50 > currentSMA99 && prevSMA50 <= prevSMA99) {
      let stopLoss = lastPrice - currentATR * 4;
      let takeProfit = lastPrice + currentATR * 4 * 5;
      ({ stopLoss, takeProfit } = validateLevels(
        lastPrice,
        stopLoss,
        takeProfit,
        "buy",
      ));

      swing.push({
        asset: symbol,
        type: "buy",
        title: "Golden Cross Swing",
        desc: "SMA50 crossed above SMA99 — major bullish trend starting",
        confidence: "High",
        indicators: ["Golden Cross", "Major Trend"],
        leverage: "2x-3x",
        entry: lastPrice,
        stopLoss,
        takeProfit,
        riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
        holdTime: "3-14 days",
        style: "swing",
      });
    } else if (currentSMA50 < currentSMA99 && prevSMA50 >= prevSMA99) {
      let stopLoss = lastPrice + currentATR * 4;
      let takeProfit = lastPrice - currentATR * 4 * 5;
      ({ stopLoss, takeProfit } = validateLevels(
        lastPrice,
        stopLoss,
        takeProfit,
        "sell",
      ));

      swing.push({
        asset: symbol,
        type: "sell",
        title: "Death Cross Swing",
        desc: "SMA50 crossed below SMA99 — major bearish trend starting",
        confidence: "High",
        indicators: ["Death Cross", "Major Trend"],
        leverage: "2x-3x",
        entry: lastPrice,
        stopLoss,
        takeProfit,
        riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
        holdTime: "3-14 days",
        style: "swing",
      });
    }
  }

  const validRSI = rsi.filter((v) => v !== null);
  const recentRSI = validRSI.slice(-10);
  const recentCloses = closes.slice(-10);

  if (recentRSI.length >= 2 && recentCloses.length >= 2) {
    const priceHigherHigh = lastPrice > Math.max(...recentCloses.slice(0, -1));
    const rsiLowerHigh = currentRSI < Math.max(...recentRSI.slice(0, -1));
    const priceLowerLow = lastPrice < Math.min(...recentCloses.slice(0, -1));
    const rsiHigherLow = currentRSI > Math.min(...recentRSI.slice(0, -1));

    if (priceHigherHigh && rsiLowerHigh && currentRSI > 50) {
      let stopLoss = lastPrice + currentATR * 3;
      let takeProfit = lastPrice - currentATR * 3 * 4;
      ({ stopLoss, takeProfit } = validateLevels(
        lastPrice,
        stopLoss,
        takeProfit,
        "sell",
      ));

      swing.push({
        asset: symbol,
        type: "sell",
        title: "Bearish Divergence Swing",
        desc: "Price making higher highs but RSI weakening — trend exhaustion",
        confidence: "Medium",
        indicators: ["RSI Divergence", "Trend Exhaustion"],
        leverage: "2x-3x",
        entry: lastPrice,
        stopLoss,
        takeProfit,
        riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
        holdTime: "2-7 days",
        style: "swing",
      });
    } else if (priceLowerLow && rsiHigherLow && currentRSI < 50) {
      let stopLoss = lastPrice - currentATR * 3;
      let takeProfit = lastPrice + currentATR * 3 * 4;
      ({ stopLoss, takeProfit } = validateLevels(
        lastPrice,
        stopLoss,
        takeProfit,
        "buy",
      ));

      swing.push({
        asset: symbol,
        type: "buy",
        title: "Bullish Divergence Swing",
        desc: "Price making lower lows but RSI strengthening — trend reversal",
        confidence: "Medium",
        indicators: ["RSI Divergence", "Trend Reversal"],
        leverage: "2x-3x",
        entry: lastPrice,
        stopLoss,
        takeProfit,
        riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
        holdTime: "2-7 days",
        style: "swing",
      });
    }
  }

  const distToSupport = (Math.abs(lastPrice - sr.support) / lastPrice) * 100;
  const distToResistance =
    (Math.abs(lastPrice - sr.resistance) / lastPrice) * 100;

  if (distToSupport < 2 && lastPrice > sr.support * 0.98 && currentRSI < 45) {
    let stopLoss = sr.support * 0.95;
    let takeProfit = sr.resistance * 0.98;
    ({ stopLoss, takeProfit } = validateLevels(
      lastPrice,
      stopLoss,
      takeProfit,
      "buy",
    ));

    swing.push({
      asset: symbol,
      type: "buy",
      title: "Support Bounce Swing",
      desc: `Price near support (${formatCurrency(sr.support)}) — multi-day bounce expected`,
      confidence: distToSupport < 1 ? "High" : "Medium",
      indicators: ["Support Level", "Bounce Play"],
      leverage: "2x-3x",
      entry: lastPrice,
      stopLoss,
      takeProfit,
      riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
      holdTime: "3-10 days",
      style: "swing",
    });
  } else if (
    distToResistance < 2 &&
    lastPrice < sr.resistance * 1.02 &&
    currentRSI > 55
  ) {
    let stopLoss = sr.resistance * 1.05;
    let takeProfit = sr.support * 1.02;
    ({ stopLoss, takeProfit } = validateLevels(
      lastPrice,
      stopLoss,
      takeProfit,
      "sell",
    ));

    swing.push({
      asset: symbol,
      type: "sell",
      title: "Resistance Rejection Swing",
      desc: `Price near resistance (${formatCurrency(sr.resistance)}) — multi-day rejection expected`,
      confidence: distToResistance < 1 ? "High" : "Medium",
      indicators: ["Resistance Level", "Rejection Play"],
      leverage: "2x-3x",
      entry: lastPrice,
      stopLoss,
      takeProfit,
      riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
      holdTime: "3-10 days",
      style: "swing",
    });
  }

  const histogram = macd.histogram;
  const prevHist = histogram[i - 1];
  const prevPrevHist = histogram[i - 2];

  if (prevPrevHist !== null && prevHist !== null) {
    if (
      histogram[i] > 0 &&
      prevHist < 0 &&
      prevPrevHist < 0 &&
      currentSMA50 > currentSMA99
    ) {
      let stopLoss = lastPrice - currentATR * 3;
      let takeProfit = lastPrice + currentATR * 3 * 4;
      ({ stopLoss, takeProfit } = validateLevels(
        lastPrice,
        stopLoss,
        takeProfit,
        "buy",
      ));

      swing.push({
        asset: symbol,
        type: "buy",
        title: "MACD Momentum Swing Long",
        desc: "Histogram turning positive with SMA50 above SMA99 — momentum building",
        confidence: "Medium",
        indicators: ["MACD Histogram", "Momentum Build"],
        leverage: "2x-3x",
        entry: lastPrice,
        stopLoss,
        takeProfit,
        riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
        holdTime: "2-7 days",
        style: "swing",
      });
    } else if (
      histogram[i] < 0 &&
      prevHist > 0 &&
      prevPrevHist > 0 &&
      currentSMA50 < currentSMA99
    ) {
      let stopLoss = lastPrice + currentATR * 3;
      let takeProfit = lastPrice - currentATR * 3 * 4;
      ({ stopLoss, takeProfit } = validateLevels(
        lastPrice,
        stopLoss,
        takeProfit,
        "sell",
      ));

      swing.push({
        asset: symbol,
        type: "sell",
        title: "MACD Momentum Swing Short",
        desc: "Histogram turning negative with SMA50 below SMA99 — momentum building",
        confidence: "Medium",
        indicators: ["MACD Histogram", "Momentum Build"],
        leverage: "2x-3x",
        entry: lastPrice,
        stopLoss,
        takeProfit,
        riskReward: calculateRiskReward(lastPrice, stopLoss, takeProfit),
        holdTime: "2-7 days",
        style: "swing",
      });
    }
  }

  return { spot, futures: { scalp, swing }, indicators };
}
