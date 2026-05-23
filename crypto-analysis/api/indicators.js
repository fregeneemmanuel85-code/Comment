import { cache } from "../lib/cache.js";
import { fetchMarkets, fetchOHLC } from "../lib/coingecko.js";
import { calculateIndicators } from "../lib/indicators.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, max-age=60");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    let data = await cache.get("indicators");
    let usedFallback = false;

    // Fallback: generate on-the-fly for top 10 coins if cache empty
    if (!data || Object.keys(data).length === 0) {
      console.log("[api/indicators] Cache empty, generating fallback...");
      usedFallback = true;

      const markets = await fetchMarkets(50);
      data = {};

      for (const coin of markets) {
        try {
          const ohlcv = await fetchOHLC(coin.id, 30);
          if (!ohlcv || ohlcv.length < 30) continue;

          const formatted = ohlcv.map((c) => ({
            timestamp: c[0],
            open: c[1],
            high: c[2],
            low: c[3],
            close: c[4],
          }));

          const indicators = calculateIndicators(coin.id, formatted);
          if (indicators) {
            data[coin.id] = indicators;
          }
        } catch (e) {
          console.error(`[fallback indicators] ${coin.id}:`, e.message);
        }
      }
    }

    if (!data || Object.keys(data).length === 0) {
      return res.status(503).json({
        error: "Indicators not yet available",
        retryAfter: 60,
      });
    }

    return res.status(200).json({
      data,
      cached: !usedFallback,
      fallback: usedFallback,
      count: Object.keys(data).length,
    });
  } catch (error) {
    console.error("[api/indicators] Error:", error);
    return res.status(500).json({
      error: "Failed to fetch indicators",
      details: error.message,
    });
  }
}
