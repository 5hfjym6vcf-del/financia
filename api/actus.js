// In-memory cache — resets on cold start but survives warm instances.
// Keeps the Alpha Vantage key server-side and shields the (very low) free-tier
// rate limit from being shared/burned by every visitor's browser.
let cache = null;
let cacheAt = 0;
const CACHE_MS = 30 * 60 * 1000; // 30 minutes

export default async function handler(req, res) {
  const now = Date.now();

  // Serve from cache if still fresh
  if (cache && now - cacheAt < CACHE_MS) {
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cache);
  }

  const key = process.env.ALPHAVANTAGE_API_KEY;
  if (!key) {
    console.error('[actus] ALPHAVANTAGE_API_KEY manquant');
    if (cache) return res.status(200).json({ ...cache, stale: true });
    return res.status(500).json({ error: 'ALPHAVANTAGE_API_KEY not configured' });
  }

  try {
    const url = new URL('https://www.alphavantage.co/query');
    url.searchParams.set('function', 'NEWS_SENTIMENT');
    url.searchParams.set('topics', 'financial_markets,economy_fiscal');
    url.searchParams.set('sort', 'LATEST');
    url.searchParams.set('limit', '6');
    url.searchParams.set('apikey', key);

    const r = await fetch(url.toString());
    const data = await r.json();

    if (data.Information || data.Note) {
      const errMsg = data.Information || data.Note;
      console.error('[actus] Alpha Vantage limite/erreur :', errMsg);
      if (cache) return res.status(200).json({ ...cache, stale: true });
      return res.status(502).json({ error: errMsg });
    }

    // Update cache
    cache = data;
    cacheAt = now;
    console.log('[actus] Cache mis à jour :', data.feed?.length, 'articles');

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(data);
  } catch (e) {
    console.error('[actus] Fetch failed :', e.message);
    if (cache) return res.status(200).json({ ...cache, stale: true });
    return res.status(500).json({ error: 'Fetch failed' });
  }
}
