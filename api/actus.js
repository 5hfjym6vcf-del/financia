// ============================================================
// FINANCIA — api/actus.js
// Flux d'actualités de la page d'accueil et du bloc « L'actu de tes favoris ».
//
// Source : NewsAPI, en remplacement d'Alpha Vantage.
//
// Alpha Vantage honorait bien sort=LATEST — les articles revenaient en ordre
// strictement décroissant — mais n'avait tout simplement plus rien de récent
// pour ces sujets : le plus frais des douze datait de quatre mois et demi, le
// plus ancien de janvier 2021, et aucun n'avait moins de trois jours. Filtrer
// par date sur cette source n'aurait pas rafraîchi la section, elle l'aurait
// vidée. NewsAPI publie en continu et en français, ce qui épargne au passage
// une traduction pour la majorité des visiteurs.
//
// La forme renvoyée reste celle d'Alpha Vantage (feed[] avec time_published et
// topics[]) : tout le code d'affichage, partagé entre l'accueil et la page des
// favoris, fonctionne sans modification.
// ============================================================

let cache = null;
let cacheAt = 0;
const CACHE_MS = 30 * 60 * 1000;
const CACHE_CONTROL = 's-maxage=1800, stale-while-revalidate=3600';

// Au-delà, ce n'est plus de l'actualité. Le seuil est volontairement lisible :
// c'est le réglage qu'il faudra desserrer si la source ne fournit pas assez.
const FRAICHEUR_HEURES = 72;

// Uniquement des termes sans ambiguïté en français courant. Une première
// version incluait « actions », « marché » et « investissement » : ces mots
// existent hors de la finance, et la section s'est remplie de pédagogie et de
// cyberattaques. Les expressions à plusieurs mots sont entre guillemets pour
// être cherchées telles quelles.
const REQUETE = [
  'bourse', '"CAC 40"', 'Nasdaq', '"Wall Street"', '"marchés financiers"',
  'crypto', 'bitcoin', 'ethereum', 'stablecoin',
  'pétrole', 'OPEP', '"cours de l\'or"', '"matières premières"',
  'BCE', 'Fed', '"taux directeurs"', 'inflation', 'dividende', 'ETF',
].join(' OR ');

// Les thèmes du sélecteur « L'actu qu'il te faut ». NewsAPI ne classe pas les
// articles, contrairement à Alpha Vantage : on retrouve le sujet par mots-clés,
// dans le titre et le chapô.
//
// Les termes sont séparés en forts et faibles. Un terme fort ne s'emploie
// guère hors de la finance ; un terme faible est ambigu en français courant —
// « bourse » désigne aussi une bourse d'études ou une bourse aux minéraux, et
// c'est exactement ce qui remontait. Il faut donc un terme fort, ou deux
// faibles qui se confortent l'un l'autre.
const THEMES = {
  blockchain: {
    forts: ['bitcoin', 'btc', 'ethereum', 'crypto', 'cryptomonnaie', 'blockchain',
            'stablecoin', 'binance', 'coinbase', 'nft'],
    faibles: ['token', 'monnaie numérique', 'minage'],
  },
  energy_transportation: {
    forts: ['pétrole', 'petrole', 'brent', 'baril', 'opep', 'matières premières',
            'lithium', 'uranium', 'cuivre'],
    faibles: ['gaz', 'énergie', 'energie', 'électricité', 'or', 'carburant', 'diesel'],
  },
  financial_markets: {
    forts: ['cac 40', 'nasdaq', 's&p', 'dow jones', 'wall street', 'etf', 'bce',
            'fed', 'taux directeurs', 'inflation', 'dividende', 'banque centrale',
            'introduction en bourse', 'investisseur', 'pib'],
    faibles: ['bourse', 'action', 'marché', 'indice', 'cotation', 'obligation',
              'capitalisation', 'croissance', 'récession', "taux d'intérêt", 'titre'],
  },
};

export function horodatage(iso) {
  // Alpha Vantage émettait AAAAMMJJTHHMMSS, et tout l'affichage lit ce format.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T` +
         `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

// Une simple recherche de sous-chaîne serait piégeuse : « or » se trouve dans
// trésor, record, majoration. On borne donc chaque terme par des positions qui
// ne sont pas des lettres, ce qui laisse passer « l'or » et « or, » sans
// attraper les mots qui le contiennent. Le « s » final facultatif rattrape les
// pluriels français, sans quoi « actions » ou « marchés » passeraient au
// travers de leurs propres mots-clés.
const bornes = new Map();
function contient(texte, motCle) {
  if (!bornes.has(motCle)) {
    const echappe = motCle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    bornes.set(motCle, new RegExp(`(?<!\\p{L})${echappe}s?(?!\\p{L})`, 'iu'));
  }
  return bornes.get(motCle).test(texte);
}

export function sujets(article) {
  const texte = `${article.title || ''} ${article.description || ''}`.toLowerCase();
  const trouves = [];

  for (const [sujet, { forts, faibles }] of Object.entries(THEMES)) {
    const nbForts = forts.filter(m => contient(texte, m)).length;
    const nbFaibles = faibles.filter(m => contient(texte, m)).length;
    // Un terme fort suffit ; sinon il en faut deux faibles. Un seul terme
    // ambigu ne fait pas d'un article une actualité financière.
    if (!nbForts && nbFaibles < 2) continue;
    // Le score classe les articles au sein d'un thème : un terme fort pèse plus
    // qu'un faible. Plafonné à 1, plancher au-dessus du seuil d'affichage.
    const score = Math.min(1, 0.4 + nbForts * 0.25 + nbFaibles * 0.1);
    trouves.push({ topic: sujet, relevance_score: String(score.toFixed(2)) });
  }

  // Renvoyer un tableau vide plutôt que de reverser l'article dans les marchés
  // par défaut : ce filet de sécurité laissait justement passer tout ce que la
  // requête avait ramené par erreur. Sans vocabulaire financier reconnu,
  // l'article est écarté.
  return trouves;
}

async function fetchActus(key) {
  const depuis = new Date(Date.now() - FRAICHEUR_HEURES * 3600 * 1000);

  const url = new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q', REQUETE);
  url.searchParams.set('language', 'fr');
  url.searchParams.set('sortBy', 'publishedAt');
  // Sans cela, NewsAPI cherche aussi dans le corps de l'article : un papier sur
  // la rentrée scolaire citant « la Fed » au détour d'un paragraphe remontait.
  url.searchParams.set('searchIn', 'title,description');
  url.searchParams.set('pageSize', '50');
  // NewsAPI indexe des dépôts de paquets comme s'il s'agissait de presse : les
  // pages PyPI de « binance » ou « bitget » remontaient en tête d'actualité.
  url.searchParams.set('excludeDomains', 'pypi.org,npmjs.com,github.com,gitlab.com');
  // La fenêtre est demandée à la source plutôt que filtrée après coup : inutile
  // de faire transiter des articles qu'on jetterait.
  url.searchParams.set('from', depuis.toISOString().slice(0, 19));

  const r = await fetch(url.toString(), { headers: { 'X-Api-Key': key } });
  const data = await r.json();

  if (!r.ok || data.status !== 'ok') {
    throw new Error(data.message || `NewsAPI HTTP ${r.status}`);
  }

  const limite = depuis.getTime();
  const vus = new Set();

  const feed = (data.articles || [])
    .filter(a => a.title && a.url && a.publishedAt)
    // Filet pour les autres dépôts de paquets : « binance 0.3.137 » n'est pas
    // un titre de presse.
    .filter(a => !/\s\d+\.\d+\.\d+\s*$/.test(a.title))
    // Le même sujet ressort souvent chez plusieurs reprises de dépêche.
    .filter(a => { const c = a.title.toLowerCase(); if (vus.has(c)) return false; vus.add(c); return true; })
    // Deuxième garde après le paramètre from : une source qui l'ignorerait ne
    // doit pas pouvoir réintroduire de vieux articles.
    .filter(a => new Date(a.publishedAt).getTime() >= limite)
    .slice(0, 20)
    .map(a => ({
      title: a.title,
      url: a.url,
      source: a.source?.name || '',
      time_published: horodatage(a.publishedAt),
      topics: sujets(a),
    }))
    .filter(a => a.time_published && a.topics.length);

  return { feed, items: String(feed.length), fraicheurHeures: FRAICHEUR_HEURES };
}

export default async function handler(req, res) {
  const now = Date.now();

  if (cache && now - cacheAt < CACHE_MS) {
    res.setHeader('Cache-Control', CACHE_CONTROL);
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cache);
  }

  const key = process.env.NEWS_API_KEY;
  if (!key) {
    console.error('[actus] NEWS_API_KEY manquante');
    if (cache) return res.status(200).json({ ...cache, stale: true });
    return res.status(500).json({ error: 'NEWS_API_KEY not configured' });
  }

  try {
    const frais = await fetchActus(key);
    console.log(`[actus] ${frais.feed.length} articles de moins de ${FRAICHEUR_HEURES} h`);
    cache = frais;
    cacheAt = now;
    res.setHeader('Cache-Control', CACHE_CONTROL);
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(cache);
  } catch (e) {
    console.error('[actus] Échec NewsAPI :', e.message);
    // Le dernier flux connu vaut mieux qu'une section en erreur, à condition
    // qu'il soit signalé comme tel. Sans cache, c'est une vraie panne.
    if (cache) return res.status(200).json({ ...cache, stale: true });
    return res.status(502).json({ error: e.message });
  }
}
