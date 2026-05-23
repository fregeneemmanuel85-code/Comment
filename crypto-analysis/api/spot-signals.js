import { cache } from "../lib/cache.js";
import { fetchMarkets, fetchOHLC } from "../lib/coingecko.js";
import { generateSignals } from "../lib/signals.js";

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
    let data = await cache.get("spot-signals");
    let usedFallback = false;

    // Fallback: generate on-the-fly for top 5 coins if cache empty
    if (!data || data.length === 0) {
      console.log("[api/spot-signals] Cache empty, generating fallback...");
      usedFallback = true;

      const markets = await fetchMarkets(5);
      data = [];

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

          const { spot } = generateSignals(coin.id, formatted);
          if (spot) {
            data.push(...spot.map((s) => ({ ...s, coinId: coin.id })));
          }
        } catch (e) {
          console.error(`[fallback spot] ${coin.id}:`, e.message);
        }
      }
    }

    if (!data || data.length === 0) {
      return res.status(503).json({
        error: "Spot signals not yet available",
        retryAfter: 60,
        data: [],
      });
    }

    return res.status(200).json({
      data,
      cached: !usedFallback,
      fallback: usedFallback,
      count: data.length,
    });
  } catch (error) {
    console.error("[api/spot-signals] Error:", error);
    return res.status(500).json({
      error: "Failed to fetch spot signals",
      details: error.message,
    });
  }
}
