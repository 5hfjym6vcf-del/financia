// In-memory cache — resets on cold start but survives warm instances.
// Combines two free, keyless data sources (no account/API key to manage,
// no quota to burn per visitor):
//  - Yahoo Finance's public chart endpoint for indices/gold/ETF
//  - CoinGecko's public API for BTC/ETH
//
// Cache TTL is 25 minutes: comfortably inside the 20-30 min window asked
// for, and — combined with the CDN Cache-Control below — means visitors
// never trigger a live fetch; only this function's own periodic refresh
// does, regardless of traffic.
let cache = null;
let cacheAt = 0;
const CACHE_MS = 25 * 60 * 1000;
const CACHE_CONTROL = 's-maxage=1500, stale-while-revalidate=3600';

const YAHOO_ASSETS = [
  { key: 'cac40', symbol: '^FCHI', name: 'CAC 40' },
  { key: 'sp500', symbol: '^GSPC', name: 'S&P 500' },
  { key: 'nasdaq', symbol: '^IXIC', name: 'Nasdaq' },
  { key: 'dowjones', symbol: '^DJI', name: 'Dow Jones' },
  { key: 'dax', symbol: '^GDAXI', name: 'DAX' },
  { key: 'ftse100', symbol: '^FTSE', name: 'FTSE 100' },
  { key: 'smi', symbol: '^SSMI', name: 'SMI' },
  { key: 'nikkei225', symbol: '^N225', name: 'Nikkei 225' },
  { key: 'hangseng', symbol: '^HSI', name: 'Hang Seng' },
  { key: 'gold', symbol: 'GC=F', name: 'Or (once)' },
  { key: 'msciWorld', symbol: 'CW8.PA', name: 'MSCI World (ETF)' },
  { key: 'jpmorgan', symbol: 'JPM', name: 'JPMorgan Chase' },
  { key: 'lvmh', symbol: 'MC.PA', name: 'LVMH' },
  { key: 'sap', symbol: 'SAP.DE', name: 'SAP' },
  { key: 'shell', symbol: 'SHEL.L', name: 'Shell' },
  { key: 'nestle', symbol: 'NESN.SW', name: 'Nestlé' },
  { key: 'toyota', symbol: '7203.T', name: 'Toyota' },
  { key: 'alibaba', symbol: '9988.HK', name: 'Alibaba' },
];
const COINGECKO_ASSETS = [
  { key: 'bitcoin', id: 'bitcoin', name: 'Bitcoin' },
  { key: 'ethereum', id: 'ethereum', name: 'Ethereum' },
];

async function fetchYahoo({ key, symbol, name }) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`Yahoo HTTP ${r.status} pour ${symbol}`);
  const data = await r.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo : pas de résultat pour ${symbol}`);

  const meta = result.meta || {};
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];

  // Yahoo quotes some LSE-listed equities (e.g. Shell) in pence (GBp/GBX)
  // rather than pounds. Left uncorrected, prices would show 100x too high.
  const rawCurrency = meta.currency || 'USD';
  const isPence = rawCurrency === 'GBp' || rawCurrency === 'GBX';
  const divisor = isPence ? 100 : 1;
  const currency = isPence ? 'GBP' : rawCurrency;

  const history = timestamps
    .map((t, i) => ({ time: t, value: typeof closes[i] === 'number' ? closes[i] / divisor : closes[i] }))
    .filter(p => typeof p.value === 'number');

  const price = typeof meta.regularMarketPrice === 'number' ? meta.regularMarketPrice / divisor : meta.regularMarketPrice;
  if (typeof price !== 'number' || !history.length) {
    throw new Error(`Yahoo : données incomplètes pour ${symbol}`);
  }
  // Prefer the last two daily closes over meta.chartPreviousClose: for
  // futures (e.g. gold) that field can reflect a contract rollover
  // reference rather than yesterday's actual close, producing a wildly
  // wrong "variation". The daily bars themselves don't have that issue.
  const prevCloseRaw = meta.chartPreviousClose ?? meta.previousClose;
  const prevClose = history.length > 1
    ? history[history.length - 2].value
    : (typeof prevCloseRaw === 'number' ? prevCloseRaw / divisor : price);
  const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

  return { key, name, price, changePct, currency, history };
}

async function fetchCoinGecko() {
  const ids = COINGECKO_ASSETS.map(a => a.id).join(',');
  const marketsUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`;
  const marketsRes = await fetch(marketsUrl);
  if (!marketsRes.ok) throw new Error(`CoinGecko markets HTTP ${marketsRes.status}`);
  const markets = await marketsRes.json();
  const byId = {};
  markets.forEach(c => { byId[c.id] = c; });

  const results = await Promise.all(COINGECKO_ASSETS.map(async ({ key, id, name }) => {
    const m = byId[id];
    if (!m || typeof m.current_price !== 'number') {
      throw new Error(`CoinGecko : pas de données markets pour ${id}`);
    }
    const chartUrl = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=30&interval=daily`;
    const chartRes = await fetch(chartUrl);
    if (!chartRes.ok) throw new Error(`CoinGecko chart HTTP ${chartRes.status} pour ${id}`);
    const chartData = await chartRes.json();
    const history = (chartData.prices || [])
      .map(([t, v]) => ({ time: Math.floor(t / 1000), value: v }))
      .filter(p => typeof p.value === 'number');
    if (!history.length) throw new Error(`CoinGecko : historique vide pour ${id}`);

    return {
      key, name,
      price: m.current_price,
      changePct: m.price_change_percentage_24h ?? 0,
      currency: 'USD',
      history,
    };
  }));

  return results;
}

async function refresh() {
  const prevAssets = cache?.assets || {};
  const jobs = [
    ...YAHOO_ASSETS.map(a => fetchYahoo(a)),
    fetchCoinGecko().then(arr => arr), // resolves to an array, flattened below
  ];
  const settled = await Promise.allSettled(jobs);

  const assets = { ...prevAssets };
  let anySuccess = false;

  settled.slice(0, YAHOO_ASSETS.length).forEach((res, i) => {
    const { key } = YAHOO_ASSETS[i];
    if (res.status === 'fulfilled') {
      assets[key] = res.value;
      anySuccess = true;
    } else {
      console.error(`[marches] Échec ${key} :`, res.reason?.message || res.reason);
    }
  });

  const cgResult = settled[YAHOO_ASSETS.length];
  if (cgResult.status === 'fulfilled') {
    cgResult.value.forEach(a => { assets[a.key] = a; });
    anySuccess = true;
  } else {
    console.error('[marches] Échec CoinGecko :', cgResult.reason?.message || cgResult.reason);
  }

  if (!anySuccess && !cache) {
    throw new Error('Toutes les sources ont échoué et aucun cache disponible');
  }

  cache = { assets, updatedAt: Date.now() };
  cacheAt = Date.now();
  console.log('[marches] Cache mis à jour :', Object.keys(assets).join(', '));
}

export default async function handler(req, res) {
  const now = Date.now();

  if (!cache || now - cacheAt >= CACHE_MS) {
    try {
      await refresh();
    } catch (e) {
      console.error('[marches] Refresh échoué :', e.message);
      if (cache) {
        res.setHeader('Cache-Control', CACHE_CONTROL);
        return res.status(200).json({ ...cache, stale: true });
      }
      return res.status(502).json({ error: e.message });
    }
  }

  res.setHeader('Cache-Control', CACHE_CONTROL);
  return res.status(200).json(cache);
}
