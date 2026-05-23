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
    let data = await cache.get("futures-signals");
    let usedFallback = false;

    // Fallback: generate on-the-fly for top 5 coins if cache empty
    if (!data || data.length === 0) {
      console.log("[api/futures-signals] Cache empty, generating fallback...");
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

          const { futures } = generateSignals(coin.id, formatted);
          if (futures?.scalp) {
            data.push(
              ...futures.scalp.map((s) => ({
                ...s,
                coinId: coin.id,
                style: "scalp",
              })),
            );
          }
          if (futures?.swing) {
            data.push(
              ...futures.swing.map((s) => ({
                ...s,
                coinId: coin.id,
                style: "swing",
              })),
            );
          }
        } catch (e) {
          console.error(`[fallback futures] ${coin.id}:`, e.message);
        }
      }
    }

    const scalp = data.filter((s) => s.style === "scalp");
    const swing = data.filter((s) => s.style === "swing");

    if (!data || data.length === 0) {
      return res.status(503).json({
        error: "Futures signals not yet available",
        retryAfter: 60,
        data: [],
      });
    }

    return res.status(200).json({
      data,
      scalp,
      swing,
      cached: !usedFallback,
      fallback: usedFallback,
      count: data.length,
    });
  } catch (error) {
    console.error("[api/futures-signals] Error:", error);
    return res.status(500).json({
      error: "Failed to fetch futures signals",
      details: error.message,
    });
  }
}
