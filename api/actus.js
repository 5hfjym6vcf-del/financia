// In-memory cache — resets on cold start but survives warm instances.
// Keeps the Alpha Vantage key server-side and shields the (very low) free-tier
// rate limit from being shared/burned by every visitor's browser.
//
// Free tier is 25 requests/day. At the old 30 min TTL, sustained traffic could
// trigger a refetch every 30 min = up to 48 calls/day — already over quota on
// its own, before counting the extra fetches caused by serverless cold starts
// (each cold instance starts with an empty cache, so it fetches again even if
// another instance refreshed seconds earlier). A 3h TTL caps it at 8 calls/day
// (24h / 3h), a comfortable margin under the limit. News doesn't move fast
// enough for 3h freshness to matter for this widget.
let cache = null;
let cacheAt = 0;
const CACHE_MS = 3 * 60 * 60 * 1000; // 3 hours
// Matches CACHE_MS so the CDN edge serves the same response without hitting
// this function at all during that window. stale-while-revalidate is set
// much longer (24h) so that if Alpha Vantage errors out on revalidation, the
// edge keeps serving the last good response instead of surfacing the error.
const CACHE_CONTROL = 's-maxage=10800, stale-while-revalidate=86400';

export default async function handler(req, res) {
  const now = Date.now();

  // Serve from cache if still fresh
  if (cache && now - cacheAt < CACHE_MS) {
    res.setHeader('Cache-Control', CACHE_CONTROL);
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cache);
  }

  const key = process.env.ALPHAVANTAGE_API_KEY;
  if (!key) {
    console.error('[actus] ALPHAVANTAGE_API_KEY manquant (variable non lue par ce déploiement)');
    if (cache) return res.status(200).json({ ...cache, stale: true });
    return res.status(500).json({ error: 'ALPHAVANTAGE_API_KEY not configured' });
  }
  console.log(`[actus] Clé chargée (longueur ${key.length}, préfixe ${key.slice(0, 3)}***)`);

  try {
    const url = new URL('https://www.alphavantage.co/query');
    url.searchParams.set('function', 'NEWS_SENTIMENT');
    url.searchParams.set('topics', 'financial_markets,economy_fiscal');
    url.searchParams.set('sort', 'LATEST');
    url.searchParams.set('limit', '6');
    url.searchParams.set('apikey', key);

    const r = await fetch(url.toString());

    // Alpha Vantage renvoie parfois un corps non-JSON (texte brut, HTML) sur
    // certaines erreurs — on l'isole pour ne pas retomber sur un message vague.
    const raw = await r.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error(`[actus] Réponse non-JSON d'Alpha Vantage (HTTP ${r.status}) :`, raw.slice(0, 200));
      if (cache) return res.status(200).json({ ...cache, stale: true });
      return res.status(502).json({ error: `Réponse invalide d'Alpha Vantage (HTTP ${r.status})` });
    }

    if (!r.ok) {
      console.error(`[actus] Alpha Vantage HTTP ${r.status} :`, JSON.stringify(data).slice(0, 300));
      if (cache) return res.status(200).json({ ...cache, stale: true });
      return res.status(502).json({ error: `Alpha Vantage HTTP ${r.status}` });
    }

    // Cas fréquent : Alpha Vantage répond 200 avec un message d'erreur dans le
    // corps (clé invalide, quota atteint) au lieu d'un vrai flux d'articles.
    // Confirmé en prod : le quota dépassé sur cet endpoint renvoie "Invalid
    // inputs. Please refer to the API documentation [...] and try again." —
    // un message trompeur (il ne s'agit pas de paramètres invalides ; les
    // mêmes paramètres avec une clé bidon renvoient de vraies données) mais
    // qui correspond bien à la limite du plan gratuit, pas à un bug de requête.
    if (data.Information || data.Note || data['Error Message']) {
      const errMsg = data.Information || data.Note || data['Error Message'];
      console.error('[actus] Alpha Vantage a renvoyé une erreur (clé invalide ou quota) :', errMsg);
      if (cache) return res.status(200).json({ ...cache, stale: true });
      return res.status(502).json({ error: errMsg });
    }

    if (!Array.isArray(data.feed)) {
      console.error('[actus] Réponse Alpha Vantage inattendue (pas de champ "feed") :', JSON.stringify(data).slice(0, 300));
      if (cache) return res.status(200).json({ ...cache, stale: true });
      return res.status(502).json({ error: 'Réponse Alpha Vantage inattendue' });
    }

    // Update cache
    cache = data;
    cacheAt = now;
    console.log('[actus] Cache mis à jour :', data.feed.length, 'articles');

    res.setHeader('Cache-Control', CACHE_CONTROL);
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(data);
  } catch (e) {
    console.error('[actus] Fetch failed :', e.message);
    if (cache) return res.status(200).json({ ...cache, stale: true });
    return res.status(500).json({ error: 'Fetch failed' });
  }
}
