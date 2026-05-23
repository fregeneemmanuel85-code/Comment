import {
  fetchMarkets,
  fetchOHLC,
  fetchFearGreed,
} from "../../lib/coingecko.js";
import { generateSignals } from "../../lib/signals.js";
import { cache } from "../../lib/cache.js";

const TOP_COINS_COUNT = 50;
const CACHE_TTL = 600;

const SKIP_COINS = new Set([
  "figure-heloc",
  "hashnote-usyc",
  "usds",
  "whitebit",
  "rain",
  "memecore",
  "hyperliquid",
  "aster-2",
  "falcon-finance",
  "world-liberty-financial",
  "pi-network",
  "sky",
]);

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function isAuthorized(req) {
  const host = req.headers.host || "";
  const isLocalDev = host.includes("localhost") || host.includes("127.0.0.1");
  if (isLocalDev) return true;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = req.headers.authorization || "";
  return authHeader === `Bearer ${cronSecret}`;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  if (!isAuthorized(req))
    return res.status(401).json({ error: "Unauthorized" });

  const startTime = Date.now();

  try {
    console.log("[cron] Fetching market data...");
    const marketsRaw = await fetchMarkets(250);

    const normalizedMarkets = marketsRaw.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h,
      volume: coin.total_volume,
      marketCap: coin.market_cap,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      image: coin.image,
      rank: coin.market_cap_rank,
    }));

    await cache.set("markets", normalizedMarkets, CACHE_TTL);

    console.log("[cron] Fetching fear & greed...");
    try {
      const fearGreedRaw = await fetchFearGreed();
      const fearGreed = fearGreedRaw.data?.[0]
        ? {
            value: parseInt(fearGreedRaw.data[0].value, 10),
            classification: fearGreedRaw.data[0].value_classification,
            timestamp: fearGreedRaw.data[0].timestamp,
          }
        : null;
      await cache.set("fear-greed", fearGreed, 1800);
    } catch (e) {
      console.error("[cron] Fear & Greed fetch failed:", e.message);
    }

    const allIndicators = {};
    const allSpotSignals = [];
    const allFuturesSignals = [];
    const allConsensus = {};

    const topCoins = normalizedMarkets.slice(0, TOP_COINS_COUNT);

    for (const coin of topCoins) {
      if (SKIP_COINS.has(coin.id)) continue;

      try {
        const ohlcv = await fetchOHLC(coin.id, 1);

        if (!ohlcv || ohlcv.length < 30) {
          console.warn(`[cron] Insufficient OHLC data for ${coin.id}`);
          continue;
        }

        const formattedOHLC = ohlcv.map((c) => ({
          timestamp: c[0],
          open: c[1],
          high: c[2],
          low: c[3],
          close: c[4],
        }));

        const { spot, futures, indicators } = generateSignals(
          coin.id,
          formattedOHLC,
        );

        if (!indicators) {
          console.warn(`[cron] No indicators for ${coin.id}`);
          continue;
        }

        allIndicators[coin.id] = indicators;
        spot.forEach((s) => allSpotSignals.push({ ...s, coinId: coin.id }));

        if (futures && typeof futures === "object") {
          if (Array.isArray(futures.scalp)) {
            futures.scalp.forEach((s) =>
              allFuturesSignals.push({ ...s, coinId: coin.id, style: "scalp" }),
            );
          }
          if (Array.isArray(futures.swing)) {
            futures.swing.forEach((s) =>
              allFuturesSignals.push({ ...s, coinId: coin.id, style: "swing" }),
            );
          }
        }

        let consensus = "NEUTRAL";
        const rsi = indicators.rsi;
        const sma7 = indicators.sma7;
        const sma25 = indicators.sma25;

        if (rsi < 30 && sma7 > sma25) consensus = "STRONG_BUY";
        else if (rsi < 30) consensus = "BUY";
        else if (rsi > 70 && sma7 < sma25) consensus = "STRONG_SELL";
        else if (rsi > 70) consensus = "SELL";
        else if (sma7 > sma25) consensus = "BULLISH";
        else if (sma7 < sma25) consensus = "BEARISH";

        allConsensus[coin.id] = {
          consensus,
          rsi: indicators.rsi,
          price: indicators.price,
          symbol: indicators.symbol,
        };

        await new Promise((r) => setTimeout(r, 1200));
      } catch (e) {
        console.error(`[cron] Failed to process ${coin.id}:`, e.message);
      }
    }

    await Promise.all([
      cache.set("indicators", allIndicators, CACHE_TTL),
      cache.set("spot-signals", allSpotSignals, CACHE_TTL),
      cache.set("futures-signals", allFuturesSignals, CACHE_TTL),
      cache.set("consensus", allConsensus, CACHE_TTL),
    ]);

    const duration = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      durationMs: duration,
      coinsProcessed: Object.keys(allIndicators).length,
      marketsCached: normalizedMarkets.length,
      spotSignals: allSpotSignals.length,
      futuresSignals: allFuturesSignals.length,
    });
  } catch (error) {
    console.error("[cron] Fatal error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
