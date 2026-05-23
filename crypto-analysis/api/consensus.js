import { cache } from "../lib/cache.js";

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

  const { coin } = req.query;

  try {
    const allConsensus = (await cache.get("consensus")) || {};

    if (coin) {
      const consensus = allConsensus[coin];
      if (!consensus) {
        return res.status(404).json({ error: `No consensus for ${coin}` });
      }
      return res.status(200).json({ data: consensus, cached: true });
    }

    if (Object.keys(allConsensus).length === 0) {
      return res.status(503).json({
        error: "Consensus data not yet available",
        retryAfter: 60,
      });
    }

    return res.status(200).json({
      data: allConsensus,
      cached: true,
      count: Object.keys(allConsensus).length,
    });
  } catch (error) {
    console.error("[api/consensus] Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch consensus", details: error.message });
  }
}
