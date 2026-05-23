const BASE_URL = "https://api.coingecko.com/api/v3";

function getHeaders() {
  const headers = { Accept: "application/json" };
  if (process.env.COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
  }
  return headers;
}

async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      if (res.status === 429) {
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
          continue;
        }
        throw new Error("HTTP 429: Rate limited");
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res;
    } catch (err) {
      clearTimeout(timeout);
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
}

export async function fetchMarkets(perPage = 250) {
  const url = `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false&price_change_percentage=24h`;
  const res = await fetchWithRetry(url, { headers: getHeaders() });
  return res.json();
}

export async function fetchOHLC(coinId, days = 1) {
  const VALID_DAYS = [1, 7, 14, 30, 90, 180, 365];
  const requested = Math.min(Math.max(Number(days) || 1, 1), 365);
  const safeDays = VALID_DAYS.find((d) => d >= requested) || 365;

  const url = `${BASE_URL}/coins/${encodeURIComponent(coinId)}/ohlc?vs_currency=usd&days=${safeDays}`;
  const res = await fetchWithRetry(url, { headers: getHeaders() });
  return res.json();
}

export async function fetchFearGreed() {
  const url = "https://api.alternative.me/fng/?limit=1";
  const res = await fetchWithRetry(url, {}, 3, 1000);
  return res.json();
}
