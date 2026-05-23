const CONFIG = {
  API_BASE: "/api",
  REFRESH_INTERVAL: 300000,
  TV_SYMBOLS: {
    bitcoin: "BITSTAMP:BTCUSD",
    ethereum: "BITSTAMP:ETHUSD",
    binancecoin: "BINANCE:BNBUSDT",
    solana: "COINBASE:SOLUSD",
    ripple: "BITSTAMP:XRPUSD",
    cardano: "BINANCE:ADAUSDT",
    polkadot: "BINANCE:DOTUSDT",
    chainlink: "COINBASE:LINKUSD",
  },
};

const state = {
  marketData: [],
  indicators: {},
  signals: { spot: [], futures: [] },
  consensus: {},
  fearGreed: null,
  selectedSymbol: "BITSTAMP:BTCUSD",
  theme: localStorage.getItem("theme") || "dark",
  watchlist: JSON.parse(localStorage.getItem("watchlist")) || [],
  isLoading: false,
  signalFilter: "all",
  searchDebounce: null,
};

const elements = {
  statsGrid: document.getElementById("statsGrid"),
  marketTableBody: document.getElementById("marketTableBody"),
  spotSignals: document.getElementById("spotSignals"),
  futuresSignals: document.getElementById("futuresSignals"),
  volatilityIndex: document.getElementById("volatilityIndex"),
  volatilityStatus: document.getElementById("volatilityStatus"),
  liqRisk: document.getElementById("liqRisk"),
  liqStatus: document.getElementById("liqStatus"),
  leverageSuggestion: document.getElementById("leverageSuggestion"),
  signalSummary: document.getElementById("signalSummary"),
  indicatorsGrid: document.getElementById("indicatorsGrid"),
  dataSourceBadge: document.getElementById("dataSourceBadge"),
  watchlistCount: document.getElementById("watchlistCount"),
  watchlistSection: document.getElementById("watchlistSection"),
  fearGreedWidget: document.getElementById("fearGreedWidget"),
  searchInput: document.getElementById("searchInput"),
  refreshMarket: document.getElementById("refreshMarket"),
  chartSymbol: document.getElementById("chartSymbol"),
  themeToggle: document.getElementById("themeToggle"),
  sidebar: document.getElementById("sidebar"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  mobileMenuBtn: document.getElementById("mobileMenuBtn"),
  signalsTableBody: document.getElementById("signalsTableBody"),
};

async function apiGet(endpoint) {
  const res = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    console.error(`API ${endpoint}: HTTP ${res.status}`, errText);
    throw new Error(`API ${endpoint}: HTTP ${res.status}`);
  }
  return res.json();
}

async function loadMarkets() {
  try {
    const { data, cached } = await apiGet("/markets");
    state.marketData = data || [];
    return cached;
  } catch (e) {
    console.error("[app] Failed to load markets:", e.message);
    state.marketData = [];
    return false;
  }
}

async function loadSignals() {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/signals`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn("[app] Signals API error:", response.status, errData.error);
      state.signals = { spot: [], futures: [] };
      state.consensus = {};
      return;
    }

    const data = await response.json();
    console.log("[app] Signals loaded:", {
      spot: data.spot?.length,
      futuresScalp: data.futures?.scalp?.length,
      futuresSwing: data.futures?.swing?.length,
      fallback: data.fallback,
    });

    state.signals = {
      spot: data.spot || [],
      futures: data.futures || { scalp: [], swing: [] },
    };
    state.consensus = data.consensus || {};
  } catch (e) {
    console.error("[app] Failed to load signals:", e.message);
    state.signals = { spot: [], futures: [] };
    state.consensus = {};
  }
}

async function loadIndicators() {
  try {
    const { data } = await apiGet("/indicators");
    state.indicators = data || {};
  } catch (e) {
    console.error("[app] Failed to load indicators:", e.message);
    state.indicators = {};
  }
}

async function loadFearGreed() {
  try {
    const { data } = await apiGet("/fear-greed");
    state.fearGreed = data;
  } catch (e) {
    console.error("[app] Failed to load fear & greed:", e.message);
    state.fearGreed = null;
  }
}

async function loadAllData() {
  if (state.isLoading) return;
  state.isLoading = true;
  elements.refreshMarket?.classList.add("spinning");

  try {
    await loadMarkets();
    renderStats();
    renderMarketTable();
    renderWatchlist();

    await Promise.all([loadSignals(), loadIndicators(), loadFearGreed()]);

    renderSpotSignals();
    renderFuturesSignals();
    renderSignalsTable();
    renderSignalSummary();
    renderIndicators();
    renderFearGreed();

    if (elements.dataSourceBadge) {
      elements.dataSourceBadge.textContent = `Live • ${state.marketData.length} coins`;
      elements.dataSourceBadge.className = "source-badge live";
    }
  } catch (e) {
    console.error("[app] Load failed:", e);
    if (elements.dataSourceBadge) {
      elements.dataSourceBadge.textContent = "Data not yet available";
      elements.dataSourceBadge.className = "source-badge warning";
    }
  } finally {
    state.isLoading = false;
    elements.refreshMarket?.classList.remove("spinning");
  }
}

const formatCache = new Map();
function formatCurrency(value) {
  const key = `c-${value}`;
  if (formatCache.has(key)) return formatCache.get(key);

  if (value === null || value === undefined || isNaN(value)) return "--";
  const abs = Math.abs(value);
  let result;
  if (abs >= 1e12) result = `$${(value / 1e12).toFixed(2)}T`;
  else if (abs >= 1e9) result = `$${(value / 1e9).toFixed(2)}B`;
  else if (abs >= 1e6) result = `$${(value / 1e6).toFixed(2)}M`;
  else if (abs >= 1e3) result = `$${(value / 1e3).toFixed(2)}K`;
  else if (abs >= 1) result = `$${value.toFixed(2)}`;
  else if (abs >= 0.01) result = `$${value.toFixed(4)}`;
  else if (abs >= 0.0001) result = `$${value.toFixed(6)}`;
  else result = `$${value.toFixed(8)}`;

  formatCache.set(key, result);
  return result;
}

function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: value > 100 ? 2 : 6,
  }).format(value);
}

function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return "--";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function getCoinColor(symbol) {
  const colors = {
    BTC: "#f7931a",
    ETH: "#627eea",
    BNB: "#f3ba2f",
    SOL: "#14f195",
    XRP: "#23292f",
    ADA: "#0033ad",
    DOT: "#e6007a",
    LINK: "#2a5ada",
  };
  return colors[symbol?.toUpperCase()] || "#6366f1";
}

function getChangeClass(value) {
  if (value === null || value === undefined) return "neutral";
  return value >= 0 ? "up" : "down";
}

function renderStats() {
  if (!elements.statsGrid) return;
  const top4 = state.marketData.slice(0, 4);
  if (top4.length === 0) {
    elements.statsGrid.innerHTML = '<div class="empty-state">No data</div>';
    return;
  }

  const fragment = document.createDocumentFragment();
  const icons = ["btc", "eth", "bnb", "sol"];

  top4.forEach((coin, i) => {
    const changeClass = getChangeClass(coin.change24h);
    const div = document.createElement("div");
    div.className = "stat-card";
    div.innerHTML = `
      <div class="stat-header">
        <div class="stat-icon ${icons[i] || "btc"}">
          ${coin.image ? `<img src="${coin.image}" width="24" height="24" alt="${coin.symbol}" loading="lazy" style="border-radius:50%">` : coin.symbol?.[0] || "?"}
        </div>
        <span class="stat-badge ${changeClass}">${formatPercent(coin.change24h)}</span>
      </div>
      <div class="stat-price">${formatCurrency(coin.price)}</div>
      <div class="stat-change ${changeClass}">
        ${coin.change24h >= 0 ? "▲" : "▼"} ${Math.abs(coin.change24h || 0).toFixed(2)}%
      </div>
      <div class="stat-volume">Vol: ${formatCurrency(coin.volume)}</div>
    `;
    fragment.appendChild(div);
  });

  elements.statsGrid.innerHTML = "";
  elements.statsGrid.appendChild(fragment);
}

function renderMarketTable() {
  if (!elements.marketTableBody) return;

  const data = state.marketData;

  if (data.length === 0) {
    elements.marketTableBody.innerHTML =
      '<tr><td colspan="9" class="empty-state">No data available</td></tr>';
    return;
  }

  const fragment = document.createDocumentFragment();

  data.forEach((coin) => {
    const consensus = state.consensus[coin.id];
    const changeClass = getChangeClass(coin.change24h);
    let signalHtml = '<span class="signal-badge neutral">--</span>';
    let mtfHtml = "";

    if (consensus) {
      const cons = consensus.consensus?.toLowerCase();
      if (cons === "buy" || cons === "strong_buy")
        signalHtml =
          '<span class="signal-badge buy"><i class="fas fa-arrow-up"></i> <strong>BUY</strong></span>';
      else if (cons === "sell" || cons === "strong_sell")
        signalHtml =
          '<span class="signal-badge sell"><i class="fas fa-arrow-down"></i> <strong>SELL</strong></span>';
      else
        signalHtml = `<span class="signal-badge neutral">${consensus.consensus}</span>`;

      const mtfColor =
        cons === "buy" || cons === "bullish" || cons === "strong_buy"
          ? "var(--secondary)"
          : cons === "sell" || cons === "bearish" || cons === "strong_sell"
            ? "var(--danger)"
            : "var(--text-muted)";
      mtfHtml = `<span class="mtf-badge" style="color: ${mtfColor}; font-size: 0.7rem; font-weight: 600;">${consensus.consensus}</span>`;
    }

    const tvSymbol = CONFIG.TV_SYMBOLS[coin.id] || `BINANCE:${coin.symbol}USDT`;
    const isWatched = state.watchlist.includes(coin.id);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${coin.rank || "--"}</td>
      <td>
        <div class="asset-cell">
          <div class="asset-icon" style="background: ${getCoinColor(coin.symbol)}">${coin.symbol?.[0] || "?"}</div>
          <div class="asset-info">
            <span class="asset-symbol">${coin.symbol || "--"}</span>
            <span class="asset-name">${coin.name || "--"}</span>
          </div>
        </div>
      </td>
      <td class="price-cell">${formatCurrency(coin.price)}</td>
      <td class="change-cell ${changeClass}">${formatPercent(coin.change24h)}</td>
      <td class="volume-cell">${formatCurrency(coin.volume)}</td>
      <td class="cap-cell">${formatCurrency(coin.marketCap)}</td>
      <td>${signalHtml} ${mtfHtml}</td>
      <td><button class="action-btn" data-symbol="${tvSymbol}">Analyze</button></td>
      <td>
        <button class="watchlist-btn ${isWatched ? "watched" : ""}" data-coin="${coin.id}" title="${isWatched ? "Remove from" : "Add to"} watchlist">
          <i class="fas ${isWatched ? "fa-star" : "fa-regular fa-star"}"></i>
        </button>
      </td>
    `;
    fragment.appendChild(tr);
  });

  elements.marketTableBody.innerHTML = "";
  elements.marketTableBody.appendChild(fragment);
}

function handleTableClick(e) {
  const btn = e.target.closest("button");
  if (!btn) return;

  if (btn.classList.contains("action-btn")) {
    selectSymbol(btn.dataset.symbol);
  } else if (btn.classList.contains("watchlist-btn")) {
    toggleWatchlist(btn.dataset.coin);
  }
}

function renderWatchlist() {
  if (!elements.watchlistSection) return;
  const watchedCoins = state.marketData.filter((c) =>
    state.watchlist.includes(c.id),
  );

  if (watchedCoins.length === 0) {
    elements.watchlistSection.innerHTML = `
      <div class="watchlist-empty">
        <i class="fas fa-star"></i>
        <p>No assets in watchlist. Click the star icon on any asset to add it here.</p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  watchedCoins.forEach((coin) => {
    const consensus = state.consensus[coin.id];
    const tvSymbol = CONFIG.TV_SYMBOLS[coin.id] || `BINANCE:${coin.symbol}USDT`;
    const changeClass = getChangeClass(coin.change24h);

    const div = document.createElement("div");
    div.className = "watchlist-item";
    div.innerHTML = `
      <div class="watchlist-asset">
        <div class="asset-icon" style="background: ${getCoinColor(coin.symbol)}">${coin.symbol?.[0] || "?"}</div>
        <div class="asset-info">
          <span class="asset-symbol">${coin.symbol}</span>
          <span class="asset-price">${formatCurrency(coin.price)}</span>
        </div>
      </div>
      <span class="change-cell ${changeClass}">${formatPercent(coin.change24h)}</span>
      ${consensus ? `<span class="signal-badge ${consensus.consensus?.toLowerCase()}">${consensus.consensus}</span>` : ""}
      <button class="action-btn" data-symbol="${tvSymbol}">Analyze</button>
      <button class="watchlist-btn watched" data-coin="${coin.id}" title="Remove from watchlist"><i class="fas fa-star"></i></button>
    `;
    fragment.appendChild(div);
  });

  elements.watchlistSection.innerHTML = "";
  elements.watchlistSection.appendChild(fragment);
}

function renderSpotSignals() {
  if (!elements.spotSignals) return;
  const signals = state.signals.spot || [];

  if (signals.length === 0) {
    elements.spotSignals.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>No active spot signals</p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  signals.forEach((s) => {
    const div = document.createElement("div");
    div.className = `signal-item ${s.type}-signal`;
    div.innerHTML = `
      <div class="signal-icon"><i class="fas fa-chart-line"></i></div>
      <div class="signal-details">
        <h4>${s.asset} — ${s.title}</h4>
        <p>${s.desc}</p>
        <div class="tp-sl-levels">
          <span class="level entry"><i class="fas fa-crosshairs"></i> Entry: ${formatCurrency(s.entry)}</span>
          <span class="level tp"><i class="fas fa-bullseye"></i> TP: ${formatCurrency(s.takeProfit)}</span>
          <span class="level sl"><i class="fas fa-shield-alt"></i> SL: ${formatCurrency(s.stopLoss)}</span>
          <span class="level rr"><i class="fas fa-balance-scale"></i> R:R ${s.riskReward || "N/A"}</span>
        </div>
      </div>
      <div class="signal-meta">
        <span class="signal-confidence confidence-${(s.confidence || "Medium").toLowerCase()}">${s.confidence || "Medium"}</span>
      </div>
    `;
    fragment.appendChild(div);
  });

  elements.spotSignals.innerHTML = "";
  elements.spotSignals.appendChild(fragment);
}

function renderSignalCard(s) {
  const iconClass = s.style === "swing" ? "fa-chart-line" : "fa-bolt";
  const confidence = (s.confidence || "Medium").toLowerCase();
  return `
    <div class="signal-item ${s.type}-signal ${s.style || ""}">
      <div class="signal-icon"><i class="fas ${iconClass}"></i></div>
      <div class="signal-details">
        <h4>${s.asset} — ${s.title}</h4>
        <p>${s.desc}</p>
        ${s.holdTime ? `<span class="hold-time"><i class="fas fa-clock"></i> Hold: ${s.holdTime}</span>` : ""}
        ${
          s.entry
            ? `
        <div class="tp-sl-levels">
          <span class="level entry"><i class="fas fa-crosshairs"></i> Entry: ${formatCurrency(s.entry)}</span>
          <span class="level tp"><i class="fas fa-bullseye"></i> TP: ${formatCurrency(s.takeProfit)}</span>
          <span class="level sl"><i class="fas fa-shield-alt"></i> SL: ${formatCurrency(s.stopLoss)}</span>
          <span class="level rr"><i class="fas fa-balance-scale"></i> R:R ${s.riskReward || "N/A"}</span>
        </div>`
            : ""
        }
      </div>
      <div class="signal-meta">
        <span class="signal-confidence confidence-${confidence}">${s.confidence || "Medium"}</span>
        ${s.leverage ? `<div class="signal-time">Leverage: ${s.leverage}</div>` : ""}
        ${s.style ? `<div class="signal-style style-${s.style}">${s.style.toUpperCase()}</div>` : ""}
      </div>
    </div>
  `;
}

function renderFuturesSignals() {
  if (!elements.futuresSignals) return;

  let allFutures = [];
  const rawFutures = state.signals.futures;

  if (Array.isArray(rawFutures)) {
    allFutures = rawFutures;
  } else if (rawFutures && typeof rawFutures === "object") {
    if (Array.isArray(rawFutures.scalp)) {
      allFutures.push(
        ...rawFutures.scalp.map((s) => ({ ...s, style: s.style || "scalp" })),
      );
    }
    if (Array.isArray(rawFutures.swing)) {
      allFutures.push(
        ...rawFutures.swing.map((s) => ({ ...s, style: s.style || "swing" })),
      );
    }
  }

  const scalpSignals = allFutures.filter((s) => s.style === "scalp");
  const swingSignals = allFutures.filter((s) => s.style === "swing");

  let totalVol = 0,
    count = 0;
  Object.values(state.indicators).forEach((ind) => {
    if (
      ind.volatility !== undefined &&
      !isNaN(ind.volatility) &&
      ind.volatility > 0
    ) {
      totalVol += ind.volatility;
      count++;
    }
  });
  const avgVol = count > 0 ? totalVol / count : 0;

  let html = `
    <div class="futures-tabs">
      <button class="futures-tab active" data-tab="scalp">
        <i class="fas fa-bolt"></i> Scalping (${scalpSignals.length})
      </button>
      <button class="futures-tab" data-tab="swing">
        <i class="fas fa-chart-line"></i> Swing (${swingSignals.length})
      </button>
    </div>
    <div class="futures-content">
  `;

  html += `<div class="futures-section" id="scalp-section" style="display:block;">`;
  if (scalpSignals.length === 0) {
    html += `<div class="empty-state"><i class="fas fa-search"></i><p>No active scalp signals</p></div>`;
  } else {
    html += scalpSignals.map((s) => renderSignalCard(s)).join("");
  }
  html += `</div>`;

  html += `<div class="futures-section" id="swing-section" style="display:none;">`;
  if (swingSignals.length === 0) {
    html += `<div class="empty-state"><i class="fas fa-search"></i><p>No active swing signals</p></div>`;
  } else {
    html += swingSignals.map((s) => renderSignalCard(s)).join("");
  }
  html += `</div></div>`;

  elements.futuresSignals.innerHTML = html;

  if (elements.volatilityIndex)
    elements.volatilityIndex.textContent = avgVol.toFixed(2) + "%";
  if (elements.volatilityStatus) {
    const volStatus = avgVol > 3 ? "HIGH" : avgVol > 1.5 ? "MODERATE" : "LOW";
    const volClass = avgVol > 3 ? "sell" : avgVol > 1.5 ? "neutral" : "buy";
    elements.volatilityStatus.textContent = volStatus;
    elements.volatilityStatus.className = `metric-status signal-badge ${volClass}`;
  }
  if (elements.liqRisk)
    elements.liqRisk.textContent =
      avgVol > 3 ? "HIGH" : avgVol > 2 ? "MEDIUM" : "LOW";
  if (elements.liqStatus) {
    elements.liqStatus.textContent = avgVol > 3 ? "Use 1x-2x" : "Use 1x-5x";
    elements.liqStatus.className = `metric-status signal-badge ${avgVol > 3 ? "sell" : "buy"}`;
  }
  if (elements.leverageSuggestion)
    elements.leverageSuggestion.textContent =
      avgVol > 3 ? "1x-2x" : avgVol > 1.5 ? "2x-5x" : "5x-10x";
}

function renderSignalsTable() {
  if (!elements.signalsTableBody) return;

  let futuresForTable = [];
  const rawFutures = state.signals.futures;
  if (Array.isArray(rawFutures)) {
    futuresForTable = rawFutures;
  } else if (rawFutures && typeof rawFutures === "object") {
    if (Array.isArray(rawFutures.scalp))
      futuresForTable.push(...rawFutures.scalp);
    if (Array.isArray(rawFutures.swing))
      futuresForTable.push(...rawFutures.swing);
  }

  const allSignals = [
    ...(state.signals.spot || []).map((s) => ({ ...s, category: "Spot" })),
    ...futuresForTable.map((s) => ({ ...s, category: "Futures" })),
  ];

  const filtered =
    state.signalFilter === "all"
      ? allSignals
      : allSignals.filter((s) => s.type === state.signalFilter);

  if (filtered.length === 0) {
    elements.signalsTableBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">No signals match current filter</td></tr>';
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach((s) => {
    const typeClass =
      s.type === "buy" ? "buy" : s.type === "sell" ? "sell" : "neutral";
    const directionIcon =
      s.type === "buy"
        ? "fa-arrow-up"
        : s.type === "sell"
          ? "fa-arrow-down"
          : "fa-minus";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="asset-cell">
          <div class="asset-icon" style="background: ${getCoinColor(s.asset)}">${s.asset?.[0] || "?"}</div>
          <span class="asset-symbol">${s.asset}</span>
        </div>
      </td>
      <td><span class="signal-badge ${typeClass}"><i class="fas ${directionIcon}"></i> ${s.title}</span></td>
      <td class="${typeClass}">${s.type?.toUpperCase()}</td>
      <td><span class="signal-confidence confidence-${(s.confidence || "Medium").toLowerCase()}">${s.confidence || "Medium"}</span></td>
      <td>${s.indicators?.join(", ") || "--"}</td>
      <td>${s.category}${s.style ? ` (${s.style})` : ""}</td>
    `;
    fragment.appendChild(tr);
  });

  elements.signalsTableBody.innerHTML = "";
  elements.signalsTableBody.appendChild(fragment);
}

function renderSignalSummary() {
  if (!elements.signalSummary) return;
  let buy = 0,
    sell = 0,
    neutral = 0;

  let allFutures = [];
  const rawFutures = state.signals.futures;
  if (Array.isArray(rawFutures)) {
    allFutures = rawFutures;
  } else if (rawFutures && typeof rawFutures === "object") {
    if (Array.isArray(rawFutures.scalp)) allFutures.push(...rawFutures.scalp);
    if (Array.isArray(rawFutures.swing)) allFutures.push(...rawFutures.swing);
  }

  const allSignals = [...(state.signals.spot || []), ...allFutures];
  allSignals.forEach((s) => {
    if (s.type === "buy") buy++;
    else if (s.type === "sell") sell++;
    else neutral++;
  });

  elements.signalSummary.innerHTML = `
    <div class="summary-card buy-summary"><h4><i class="fas fa-arrow-up"></i> Buy</h4><div class="summary-value">${buy}</div></div>
    <div class="summary-card sell-summary"><h4><i class="fas fa-arrow-down"></i> Sell</h4><div class="summary-value">${sell}</div></div>
    <div class="summary-card neutral-summary"><h4><i class="fas fa-minus"></i> Neutral</h4><div class="summary-value">${neutral}</div></div>
    <div class="summary-card total-summary"><h4><i class="fas fa-layer-group"></i> Total</h4><div class="summary-value">${allSignals.length}</div></div>
  `;
}

function renderIndicators() {
  if (!elements.indicatorsGrid) return;

  const indicators = Object.values(state.indicators)
    .filter((ind) => ind.symbol && ind.price !== undefined)
    .map((ind) => ({
      symbol: ind.symbol,
      price: ind.price,
      rsi: ind.rsi,
    }));

  if (indicators.length === 0) {
    elements.indicatorsGrid.innerHTML =
      '<div class="empty-state">No indicator data</div>';
    return;
  }

  const fragment = document.createDocumentFragment();

  indicators.forEach((ind) => {
    const rsiValue = ind.rsi !== null && !isNaN(ind.rsi) ? ind.rsi : 50;
    const rsiColor =
      rsiValue < 30
        ? "var(--secondary)"
        : rsiValue > 70
          ? "var(--danger)"
          : "var(--info)";

    const div = document.createElement("div");
    div.className = "indicator-card";
    div.innerHTML = `
      <div class="indicator-header">
        <h3>${ind.symbol}/USD</h3>
        <span class="indicator-value">${formatCurrency(ind.price)}</span>
      </div>
      <div class="indicator-body">
        <div class="indicator-row">
          <span class="indicator-label">RSI (14)</span>
          <span class="indicator-number" style="color: ${rsiColor}">${rsiValue.toFixed(1)}</span>
        </div>
        <div class="indicator-bar-container">
          <div class="indicator-bar" style="width: ${Math.min(Math.max(rsiValue, 0), 100)}%; background: ${rsiColor}"></div>
        </div>
      </div>
    `;
    fragment.appendChild(div);
  });

  elements.indicatorsGrid.innerHTML = "";
  elements.indicatorsGrid.appendChild(fragment);
}

function renderFearGreed() {
  const container = elements.fearGreedWidget;
  if (!container) return;

  const fg = state.fearGreed;
  if (!fg || fg.value === undefined) {
    container.innerHTML =
      '<div class="fear-greed-empty"><i class="fas fa-chart-pie"></i><span>Loading...</span></div>';
    return;
  }

  const value = parseInt(fg.value, 10);
  let color = "#fbbf24",
    label = "Neutral",
    icon = "fa-minus";

  if (value <= 20) {
    color = "#ef4444";
    label = "Extreme Fear";
    icon = "fa-arrow-down";
  } else if (value <= 40) {
    color = "#f97316";
    label = "Fear";
    icon = "fa-arrow-down";
  } else if (value <= 60) {
    color = "#fbbf24";
    label = "Neutral";
    icon = "fa-minus";
  } else if (value <= 80) {
    color = "#22c55e";
    label = "Greed";
    icon = "fa-arrow-up";
  } else {
    color = "#10b981";
    label = "Extreme Greed";
    icon = "fa-arrow-up";
  }

  container.innerHTML = `
    <div class="fear-greed-content">
      <div class="fear-greed-gauge" style="border-color: ${color}">
        <span class="fear-greed-value" style="color: ${color}">${value}</span>
      </div>
      <div class="fear-greed-info">
        <span class="fear-greed-label" style="color: ${color}"><i class="fas ${icon}"></i> ${label}</span>
        <span class="fear-greed-classification">${fg.classification || label}</span>
      </div>
    </div>
  `;
}

function renderAll() {
  renderStats();
  renderMarketTable();
  renderWatchlist();
  renderSpotSignals();
  renderFuturesSignals();
  renderSignalsTable();
  renderSignalSummary();
  renderIndicators();
  renderFearGreed();
}

window.toggleWatchlist = function (coinId) {
  if (!coinId) return;
  const idx = state.watchlist.indexOf(coinId);
  if (idx > -1) state.watchlist.splice(idx, 1);
  else state.watchlist.push(coinId);

  localStorage.setItem("watchlist", JSON.stringify(state.watchlist));
  renderMarketTable();
  renderWatchlist();
  updateWatchlistCount();
};

window.selectSymbol = function (symbol) {
  if (!symbol) return;
  state.selectedSymbol = symbol;
  if (elements.chartSymbol) elements.chartSymbol.value = symbol;

  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  document.querySelector('[data-section="charts"]')?.classList.add("active");
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("charts-section")?.classList.add("active");

  loadTradingViewWidget(symbol);
};

function updateWatchlistCount() {
  if (elements.watchlistCount) {
    const count = state.watchlist.length;
    elements.watchlistCount.textContent = `${count} asset${count !== 1 ? "s" : ""}`;
  }
}

function loadTradingViewWidget(symbol) {
  const container = document.getElementById("tradingview-widget");
  if (!container) return;

  container.innerHTML = "";
  container.style.width = "100%";
  container.style.height = "600px";

  const isDark = state.theme === "dark";

  const config = {
    autosize: true,
    symbol: symbol,
    interval: "60",
    timezone: "Etc/UTC",
    theme: isDark ? "dark" : "light",
    style: "1",
    locale: "en",
    toolbar_bg: isDark ? "#1e293b" : "#f1f5f9",
    enable_publishing: false,
    allow_symbol_change: true,
    hide_top_toolbar: false,
    hide_side_toolbar: false,
    hide_legend: false,
    withdateranges: true,
    range: "1D",
    save_image: true,
    details: true,
    hotlist: false,
    calendar: false,
    show_popup_button: true,
    popup_width: "1000",
    popup_height: "650",
    studies: [
      "RSI@tv-basicstudies",
      "MACD@tv-basicstudies",
      "MASimple@tv-basicstudies",
    ],
    backgroundColor: isDark ? "#1e293b" : "#ffffff",
    watchlist: Object.values(CONFIG.TV_SYMBOLS),
  };

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src =
    "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;
  script.innerHTML = JSON.stringify(config);

  const innerDiv = document.createElement("div");
  innerDiv.className = "tradingview-widget-container__widget";
  innerDiv.style.width = "100%";
  innerDiv.style.height = "100%";

  const widgetDiv = document.createElement("div");
  widgetDiv.className = "tradingview-widget-container";
  widgetDiv.style.width = "100%";
  widgetDiv.style.height = "100%";

  widgetDiv.appendChild(innerDiv);
  widgetDiv.appendChild(script);
  container.appendChild(widgetDiv);
}

function openSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  sidebar.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  sidebar.classList.remove("open");
  document.body.style.overflow = "";
}

function init() {
  document.documentElement.setAttribute("data-theme", state.theme);

  elements.refreshMarket?.addEventListener("click", () => loadAllData());

  elements.searchInput?.addEventListener("input", (e) => {
    clearTimeout(state.searchDebounce);
    state.searchDebounce = setTimeout(() => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll("#marketTableBody tr").forEach((row) => {
        row.style.display = row.textContent.toLowerCase().includes(term)
          ? ""
          : "none";
      });
    }, 150);
  });

  elements.themeToggle?.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", state.theme);
    document.documentElement.setAttribute("data-theme", state.theme);
    loadTradingViewWidget(state.selectedSymbol);
  });

  elements.sidebarToggle?.addEventListener("click", () => {
    elements.sidebar?.classList.toggle("collapsed");
  });

  const mobileBtn = document.getElementById("mobileMenuBtn");
  if (mobileBtn) {
    mobileBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const sidebar = document.getElementById("sidebar");
      if (!sidebar) return;
      if (sidebar.classList.contains("open")) closeSidebar();
      else openSidebar();
    });
  }

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      if (!section) return;

      document
        .querySelectorAll(".nav-item")
        .forEach((n) => n.classList.remove("active"));
      item.classList.add("active");

      document
        .querySelectorAll(".section")
        .forEach((s) => s.classList.remove("active"));
      document.getElementById(`${section}-section`)?.classList.add("active");

      closeSidebar();
    });
  });

  document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("sidebar");
    const btn = document.getElementById("mobileMenuBtn");
    if (!sidebar || !sidebar.classList.contains("open")) return;

    const clickedInside = sidebar.contains(e.target);
    const clickedBtn = btn && btn.contains(e.target);

    if (!clickedInside && !clickedBtn) closeSidebar();
  });

  document.addEventListener("click", (e) => {
    const tabBtn = e.target.closest(".futures-tab");
    if (!tabBtn) return;

    const tab = tabBtn.dataset.tab;
    if (!tab) return;

    document
      .querySelectorAll(".futures-tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".futures-section")
      .forEach((s) => (s.style.display = "none"));

    tabBtn.classList.add("active");
    const section = document.getElementById(`${tab}-section`);
    if (section) section.style.display = "block";
  });

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.signalFilter = btn.dataset.filter || "all";
      renderSignalsTable();
    });
  });

  elements.chartSymbol?.addEventListener("change", (e) => {
    state.selectedSymbol = e.target.value;
    loadTradingViewWidget(state.selectedSymbol);
  });

  elements.marketTableBody?.addEventListener("click", handleTableClick);

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeSidebar();
  });

  loadAllData();
  loadTradingViewWidget(state.selectedSymbol);
  setInterval(() => loadAllData(), CONFIG.REFRESH_INTERVAL);
}

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", init)
  : init();
