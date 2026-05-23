import {
  fetchMarkets,
  fetchOHLC,
  fetchFearGreed,
} from "../../lib/coingecko.js";
import { generateSignals } from "../../lib/signals.js";
import { cache } from "../../lib/cache.js";

const TOP_COINS_COUNT = 50;
const CACHE_TTL = 120; // 2 minutes
const BATCH_SIZE = 10;

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
  return (req.headers.authorization || "") === `Bearer ${cronSecret}`;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  if (!isAuthorized(req))
    return res.status(401).json({ error: "Unauthorized" });

  const startTime = Date.now();
  console.log("[cron] Starting fetchMarkets cron...");

  try {
    // Fetch markets and fear & greed in parallel
    console.log("[cron] Fetching markets and fear & greed...");
    const [marketsRaw, fearGreedRaw] = await Promise.all([
      fetchMarkets(250),
      fetchFearGreed().catch((e) => {
        console.error("[cron] Fear & Greed fetch failed:", e.message);
        return null;
      }),
    ]);
    console.log(`[cron] Fetched ${marketsRaw.length} markets`);

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

    // Save fear & greed
    if (fearGreedRaw?.data?.[0]) {
      const fearGreed = {
        value: parseInt(fearGreedRaw.data[0].value, 10),
        classification: fearGreedRaw.data[0].value_classification,
        timestamp: fearGreedRaw.data[0].timestamp,
      };
      await cache.set("fear-greed", fearGreed, 1800);
      console.log("[cron] Fear & greed saved:", fearGreed.value);
    }

    const allIndicators = {};
    const allSpotSignals = [];
    const allFuturesSignals = [];
    const allConsensus = {};

    const topCoins = normalizedMarkets
      .slice(0, TOP_COINS_COUNT)
      .filter((c) => !SKIP_COINS.has(c.id));

    console.log(
      `[cron] Processing ${topCoins.length} coins in batches of ${BATCH_SIZE}...`,
    );

    // Process in batches
    for (let i = 0; i < topCoins.length; i += BATCH_SIZE) {
      const batch = topCoins.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(topCoins.length / BATCH_SIZE);

      console.log(
        `[cron] Batch ${batchNum}/${totalBatches}: ${batch.map((c) => c.symbol).join(", ")}`,
      );

      await Promise.all(
        batch.map(async (coin) => {
          try {
            const ohlcv = await fetchOHLC(coin.id, 30);
            if (!ohlcv || ohlcv.length < 30) {
              console.warn(`[cron] Insufficient OHLC data for ${coin.id}`);
              return;
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
              return;
            }

            allIndicators[coin.id] = indicators;

            if (spot?.length > 0) {
              spot.forEach((s) =>
                allSpotSignals.push({ ...s, coinId: coin.id }),
              );
            }

            if (futures?.scalp?.length > 0) {
              futures.scalp.forEach((s) =>
                allFuturesSignals.push({
                  ...s,
                  coinId: coin.id,
                  style: "scalp",
                }),
              );
            }
            if (futures?.swing?.length > 0) {
              futures.swing.forEach((s) =>
                allFuturesSignals.push({
                  ...s,
                  coinId: coin.id,
                  style: "swing",
                }),
              );
            }

            let consensus = "NEUTRAL";
            const { rsi, sma7, sma25 } = indicators;
            if (rsi < 30 && sma7 > sma25) consensus = "STRONG_BUY";
            else if (rsi < 30) consensus = "BUY";
            else if (rsi > 70 && sma7 < sma25) consensus = "STRONG_SELL";
            else if (rsi > 70) consensus = "SELL";
            else if (sma7 > sma25) consensus = "BULLISH";
            else if (sma7 < sma25) consensus = "BEARISH";

            allConsensus[coin.id] = {
              consensus,
              rsi,
              price: indicators.price,
              symbol: indicators.symbol,
            };
          } catch (e) {
            console.error(`[cron] Failed to process ${coin.id}:`, e.message);
          }
        }),
      );

      // 300ms delay between batches
      if (i + BATCH_SIZE < topCoins.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    console.log("[cron] Saving to cache...");
    // Save all cache in parallel
    await Promise.all([
      cache.set("indicators", allIndicators, CACHE_TTL),
      cache.set("spot-signals", allSpotSignals, CACHE_TTL),
      cache.set("futures-signals", allFuturesSignals, CACHE_TTL),
      cache.set("consensus", allConsensus, CACHE_TTL),
    ]);
    console.log("[cron] Cache saved successfully");

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
