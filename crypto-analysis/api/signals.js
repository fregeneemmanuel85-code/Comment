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
    let spotRaw = await cache.get("spot-signals");
    let futuresRaw = await cache.get("futures-signals");
    let consensusRaw = await cache.get("consensus");
    let usedFallback = false;

    // Fallback: generate on-the-fly if ANY cache is empty
    const hasSpot = Array.isArray(spotRaw) && spotRaw.length > 0;
    const hasFutures = Array.isArray(futuresRaw) && futuresRaw.length > 0;
    const hasConsensus = consensusRaw && Object.keys(consensusRaw).length > 0;

    if (!hasSpot || !hasFutures || !hasConsensus) {
      console.log("[api/signals] Cache incomplete, generating fallback...");
      usedFallback = true;

      const markets = await fetchMarkets(50);

      spotRaw = spotRaw || [];
      futuresRaw = futuresRaw || [];
      consensusRaw = consensusRaw || {};

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

          const { spot, futures, indicators } = generateSignals(
            coin.id,
            formatted,
          );

          if (spot && spot.length > 0) {
            spotRaw.push(...spot.map((s) => ({ ...s, coinId: coin.id })));
          }

          if (futures?.scalp && futures.scalp.length > 0) {
            futuresRaw.push(
              ...futures.scalp.map((s) => ({
                ...s,
                coinId: coin.id,
                style: "scalp",
              })),
            );
          }

          if (futures?.swing && futures.swing.length > 0) {
            futuresRaw.push(
              ...futures.swing.map((s) => ({
                ...s,
                coinId: coin.id,
                style: "swing",
              })),
            );
          }

          if (indicators && !consensusRaw[coin.id]) {
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

            consensusRaw[coin.id] = {
              consensus,
              rsi: indicators.rsi,
              price: indicators.price,
              symbol: indicators.symbol,
            };
          }
        } catch (e) {
          console.error(`[fallback] ${coin.id}:`, e.message);
        }
      }
    }

    // Normalize futures format: always return { scalp: [], swing: [] }
    const futures = { scalp: [], swing: [] };

    if (Array.isArray(futuresRaw)) {
      futuresRaw.forEach((s) => {
        if (s.style === "scalp") futures.scalp.push(s);
        else if (s.style === "swing") futures.swing.push(s);
      });
    } else if (futuresRaw && typeof futuresRaw === "object") {
      if (Array.isArray(futuresRaw.scalp))
        futures.scalp.push(...futuresRaw.scalp);
      if (Array.isArray(futuresRaw.swing))
        futures.swing.push(...futuresRaw.swing);
    }

    // Ensure spot is always an array
    const spot = Array.isArray(spotRaw) ? spotRaw : [];

    return res.status(200).json({
      spot,
      futures,
      consensus: consensusRaw || {},
      cached: !usedFallback,
      fallback: usedFallback,
      counts: {
        spot: spot.length,
        futuresScalp: futures.scalp.length,
        futuresSwing: futures.swing.length,
        consensus: Object.keys(consensusRaw || {}).length,
      },
    });
  } catch (error) {
    console.error("[api/signals] Error:", error);
    return res.status(500).json({
      error: "Failed to fetch signals",
      details: error.message,
    });
  }
}
