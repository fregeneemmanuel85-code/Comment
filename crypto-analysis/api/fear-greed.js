import { cache } from "../lib/cache.js";
import { fetchFearGreed } from "../lib/coingecko.js";

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
    let data = await cache.get("fear-greed");
    let usedFallback = false;

    // Fallback: fetch live if cache empty
    if (!data) {
      console.log("[api/fear-greed] Cache empty, fetching live...");
      usedFallback = true;

      try {
        const raw = await fetchFearGreed();
        data = raw.data?.[0]
          ? {
              value: parseInt(raw.data[0].value, 10),
              classification: raw.data[0].value_classification,
              timestamp: raw.data[0].timestamp,
            }
          : null;
      } catch (e) {
        console.error("[api/fear-greed] Live fetch failed:", e.message);
      }
    }

    if (!data) {
      return res.status(503).json({
        error: "Fear & Greed data not yet available",
        retryAfter: 60,
      });
    }

    return res.status(200).json({
      data,
      cached: !usedFallback,
      fallback: usedFallback,
    });
  } catch (error) {
    console.error("[api/fear-greed] Error:", error);
    return res.status(500).json({
      error: "Failed to fetch fear & greed",
      details: error.message,
    });
  }
}
