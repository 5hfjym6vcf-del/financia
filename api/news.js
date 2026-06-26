// In-memory cache — resets on cold start but survives warm instances.
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

  const key = process.env.NEWS_API_KEY;
  if (!key) {
    console.error('[news] NEWS_API_KEY manquant');
    if (cache) return res.status(200).json({ ...cache, stale: true });
    return res.status(500).json({ error: 'NEWS_API_KEY not configured' });
  }

  try {
    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', 'bourse investissement finance');
    url.searchParams.set('language', 'fr');
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('pageSize', '5');

    const r = await fetch(url.toString(), { headers: { 'X-Api-Key': key } });
    const data = await r.json();

    if (!r.ok || data.status !== 'ok') {
      const errMsg = data.message || `NewsAPI status ${r.status}`;
      console.error('[news] Erreur NewsAPI :', errMsg);
      // Return stale cache if available
      if (cache) {
        console.log('[news] Serving stale cache after API error');
        return res.status(200).json({ ...cache, stale: true });
      }
      return res.status(502).json({ error: errMsg });
    }

    // Update cache
    cache = data;
    cacheAt = now;
    console.log('[news] Cache mis à jour :', data.articles?.length, 'articles');

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(data);
  } catch (e) {
    console.error('[news] Fetch failed :', e.message);
    if (cache) return res.status(200).json({ ...cache, stale: true });
    return res.status(500).json({ error: 'Fetch failed' });
  }
}
