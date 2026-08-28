// ============================================================
// FINANCIA — api/health.js
// Point de contrôle unique pour la supervision externe.
//   200 → tout va bien
//   503 → au moins un service critique est tombé
// Un service de monitoring (UptimeRobot ou équivalent) l'interroge
// régulièrement et alerte sur un code d'erreur : pas de clé d'envoi
// d'e-mail à gérer ici, l'alerte est déléguée à un outil éprouvé.
// ============================================================

// Doit rester aligné sur api/ask.js et api/translate.js. C'est précisément
// ce que cette supervision surveille : le 22 août, Groq a retiré le modèle
// utilisé et la panne n'a été découverte que par hasard.
const GROQ_MODEL = 'openai/gpt-oss-120b';

const TIMEOUT_MS = 12000;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} : délai dépassé`)), ms)),
  ]);
}

// Vérifie que la clé Groq fonctionne ET que le modèle existe toujours, sans
// lancer de génération : interroger /models ne consomme aucun quota de
// complétion, alors qu'un appel à /api/ask en brûlerait un à chaque contrôle.
async function checkGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY absente');

  const r = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!r.ok) throw new Error(`Groq HTTP ${r.status}`);

  const data = await r.json();
  const ids = (data?.data || []).map(m => m.id);
  if (!ids.includes(GROQ_MODEL)) {
    throw new Error(`modèle ${GROQ_MODEL} absent de la liste Groq (retiré ?)`);
  }
  return { model: GROQ_MODEL, modelesDisponibles: ids.length };
}

// ── Contrôle profond de la traduction ──
// Vérifier que le modèle figure dans la liste Groq ne suffit pas : le 27 août,
// le modèle était bien présent et la traduction renvoyait pourtant les titres
// anglais tels quels, son budget de tokens étant englouti par le raisonnement.
// Le seul test qui l'aurait vu est celui-ci : traduire et regarder le résultat.
//
// Il consomme une génération, donc son résultat est gardé une heure. Un
// superviseur qui sonde toutes les 5 minutes ne déclenche ainsi qu'une
// vingtaine d'appels par jour, sur un quota de mille.
const DUREE_CACHE_PROFOND_MS = 60 * 60 * 1000;
let cacheTraduction = null;

async function checkTraduction(origin) {
  const now = Date.now();
  if (cacheTraduction && now - cacheTraduction.a < DUREE_CACHE_PROFOND_MS) {
    if (cacheTraduction.erreur) throw new Error(cacheTraduction.erreur + ' (en cache)');
    return { ...cacheTraduction.valeur, enCache: true };
  }

  const memoriser = (erreur, valeur) => { cacheTraduction = { a: now, erreur, valeur }; };

  try {
    const titres = ['Stocks rise as inflation cools', 'Oil prices fall after OPEC meeting'];
    const r = await fetch(`${origin}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'financia-health' },
      body: JSON.stringify({ titles: titres, lang: 'fr' }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();

    if (!Array.isArray(data?.titles) || data.titles.length !== titres.length) {
      throw new Error('réponse de forme inattendue');
    }
    // Le repli renvoie les titres d'origine à l'identique : c'est exactement
    // la signature de la panne, et elle est silencieuse côté HTTP.
    const inchanges = data.titles.filter((t, i) => t === titres[i]).length;
    if (inchanges) throw new Error(`${inchanges} titre(s) non traduit(s) : repli silencieux`);
    if (data.degrade) throw new Error('le service signale une traduction dégradée');

    const valeur = { exemple: data.titles[0].slice(0, 40) };
    memoriser(null, valeur);
    return valeur;
  } catch (e) {
    memoriser(e.message, null);
    throw e;
  }
}

// Les endpoints de données sont interrogés par leur URL publique : la réponse
// vient du cache CDN, donc le contrôle ne consomme pas les quotas des sources
// externes (Alpha Vantage n'autorise que 25 requêtes par jour).
async function checkEndpoint(origin, path, valider) {
  const r = await fetch(`${origin}${path}`, { headers: { 'User-Agent': 'financia-health' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  return valider(data);
}

export default async function handler(req, res) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `${proto}://${host}`;

  const controles = {
    groq: () => checkGroq(),

    marches: () => checkEndpoint(origin, '/api/marches', d => {
      const n = Object.keys(d?.assets || {}).length;
      if (!n) throw new Error('aucun actif renvoyé');
      const sansPrix = Object.values(d.assets).filter(a => typeof a?.price !== 'number').length;
      if (sansPrix) throw new Error(`${sansPrix} actif(s) sans prix`);
      return { actifs: n, stale: !!d.stale };
    }),

    // Un flux non vide ne suffit pas : le 27 août, la source renvoyait douze
    // articles dont le plus récent datait de quatre mois, et ce contrôle les
    // acceptait. On vérifie donc aussi leur âge.
    actus: () => checkEndpoint(origin, '/api/actus', d => {
      if (!Array.isArray(d?.feed) || !d.feed.length) throw new Error('flux vide');

      const ages = d.feed
        .map(a => a.time_published)
        .filter(t => typeof t === 'string' && t.length >= 13)
        .map(t => Date.UTC(+t.slice(0, 4), +t.slice(4, 6) - 1, +t.slice(6, 8), +t.slice(9, 11), +t.slice(11, 13)))
        .filter(ms => !Number.isNaN(ms));
      if (!ages.length) throw new Error('aucune date exploitable');

      const heures = (Date.now() - Math.max(...ages)) / 3600000;
      // Une marge au-delà de la fenêtre annoncée par l'API : le cache peut
      // vieillir de trente minutes sans que ce soit une panne.
      if (heures > 96) throw new Error(`article le plus récent vieux de ${Math.round(heures)} h`);

      return { articles: d.feed.length, plusRecentHeures: Math.round(heures), stale: !!d.stale };
    }),

    traduction: () => checkTraduction(origin),

    avis: () => checkEndpoint(origin, '/api/avis', d => {
      // Une liste vide est un état légitime (aucun avis modéré) : seule
      // l'impossibilité de lire la source est une panne.
      if (!Array.isArray(d)) throw new Error('réponse inattendue');
      return { avisPublies: d.length };
    }),
  };

  const noms = Object.keys(controles);
  const resultats = await Promise.allSettled(
    noms.map(n => withTimeout(controles[n](), TIMEOUT_MS, n))
  );

  const services = {};
  const enPanne = [];
  resultats.forEach((r, i) => {
    const nom = noms[i];
    if (r.status === 'fulfilled') {
      services[nom] = { ok: true, ...r.value };
    } else {
      services[nom] = { ok: false, erreur: r.reason?.message || String(r.reason) };
      enPanne.push(nom);
    }
  });

  const ok = enPanne.length === 0;
  if (!ok) console.error('[health] Services en panne :', enPanne.join(', '));

  // Jamais de cache : un contrôle de santé doit refléter l'instant présent.
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(ok ? 200 : 503).json({
    ok,
    verifieLe: new Date().toISOString(),
    enPanne,
    services,
  });
}
