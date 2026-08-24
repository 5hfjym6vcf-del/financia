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

    actus: () => checkEndpoint(origin, '/api/actus', d => {
      if (!Array.isArray(d?.feed) || !d.feed.length) throw new Error('flux vide');
      return { articles: d.feed.length, stale: !!d.stale };
    }),

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
