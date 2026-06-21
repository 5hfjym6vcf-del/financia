export default async function handler(req, res) {
  const key = process.env.NEWS_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'NEWS_API_KEY not configured' });
  }

  const url = new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q', 'bourse investissement finance');
  url.searchParams.set('language', 'fr');
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('pageSize', '5');

  try {
    const r = await fetch(url.toString(), {
      headers: { 'X-Api-Key': key },
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data.message || 'NewsAPI error' });
    }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Fetch failed' });
  }
}
