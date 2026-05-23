import { cache } from "../lib/cache.js";
import { fetchMarkets } from "../lib/coingecko.js";

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
    let data = await cache.get("markets");

    // Fallback: fetch live if cache is empty
    if (!data || data.length === 0) {
      console.log("[api/markets] Cache empty, fetching live...");
      const liveData = await fetchMarkets(250);
      data = liveData.map((coin) => ({
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
      await cache.set("markets", data, 120);
    }

    return res.status(200).json({
      data,
      cached: true,
      count: data.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[api/markets] Error:", error);
    return res.status(500).json({
      error: "Failed to fetch market data",
      details: error.message,
    });
  }
}
