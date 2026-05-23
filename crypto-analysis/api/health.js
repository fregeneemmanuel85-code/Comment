import { cache } from "../lib/cache.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, max-age=10");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const markets = await cache.get("markets");
    const indicators = await cache.get("indicators");
    const spotSignals = await cache.get("spot-signals");
    const futuresSignals = await cache.get("futures-signals");
    const fearGreed = await cache.get("fear-greed");

    const checks = {
      markets: !!markets,
      indicators: !!indicators,
      spotSignals: !!spotSignals,
      futuresSignals: !!futuresSignals,
      fearGreed: !!fearGreed,
    };

    const allHealthy = Object.values(checks).every(Boolean);

    // Get cache metadata
    const cacheInfo = {
      marketsCount: markets?.length || 0,
      indicatorsCount: indicators ? Object.keys(indicators).length : 0,
      spotSignalsCount: spotSignals?.length || 0,
      futuresSignalsCount: futuresSignals?.length || 0,
      fearGreedValue: fearGreed?.value || null,
    };

    return res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? "ok" : "degraded",
      checks,
      cacheInfo,
      cacheSource: process.env.UPSTASH_REDIS_REST_URL ? "redis" : "file",
      timestamp: Date.now(),
    });
  } catch (e) {
    return res.status(500).json({ status: "error", error: e.message });
  }
}
