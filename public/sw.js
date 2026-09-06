// ============================================================
// FINANCIA — service worker
// Deux stratégies, choisies selon la nature de la ressource :
//  - stale-while-revalidate : assets statiques (CSS/JS/images/polices) —
//                   servis depuis le cache pour la rapidité, puis rafraîchis
//                   en arrière-plan pour la visite suivante.
//  - network-first : pages HTML et données d'API (marchés, actus, avis) —
//                   toujours frais si le réseau répond, sinon on ressert la
//                   dernière version connue, sinon la page hors-ligne.
// Aucune requête POST n'est mise en cache (chat IA, newsletter, traduction).
// ============================================================

// Bumper cette version à chaque déploiement qui change un asset statique :
// l'activation supprime alors tous les caches d'une version antérieure.
const CACHE_VERSION = 'v52';
const STATIC_CACHE = `financia-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `financia-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Pré-cachées à l'installation : les 5 pages du site + le socle nécessaire
// pour les afficher correctement hors ligne.
const PRECACHE_URLS = [
  '/',
  '/marches',
  '/favoris',
  '/ressources',
  '/communaute',
  '/mentions-legales',
  '/confidentialite',
  '/histoire',
  '/contact',
  '/avis',
  '/comparateur',
  '/simulateur',
  OFFLINE_URL,
  '/style.css',
  '/marches.css',
  '/histoire.css',
  '/contact.css',
  '/i18n.js',
  '/i18n-core.js',
  '/nav-plus.js',
  '/page-socle.js',
  '/pwa.js',
  '/conversion.js',
  '/taux-config.js',
  '/comparateur.js',
  '/partenaires-config.js',
  '/partenaires-ui.js',
  '/avis.js',
  '/favoris-store.js',
  '/actifs-ui.js',
  '/ui-erreur.js',
  '/analytics.js',
  '/actus-ui.js',
  '/favoris.js',
  '/script.js',
  '/marches.js',
  '/histoire.js',
  '/histoire-visuels.js',
  '/modules-visuels.js',
  '/reveal.js',
  '/hero-courbe.js',
  '/accueil-marches.js',
  '/communaute.js',
  '/legal.js',
  '/consentement.js',
  '/secteurs-ui.js',
  '/ressources.js',
  '/contact.js',
  '/images/icons/icon-192.png',
  '/images/icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      // addAll() est atomique : un seul 404 ferait échouer toute l'installation
      // et le SW ne s'activerait jamais. On tolère donc les échecs unitaires.
      .then(cache => Promise.allSettled(PRECACHE_URLS.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Permet à la page de demander l'activation immédiate d'un SW en attente.
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isStaticAsset(url) {
  return /\.(css|js|png|jpe?g|svg|webp|gif|ico|woff2?|mp4)$/i.test(url.pathname);
}

// Réseau d'abord, cache en secours. Utilisé pour tout ce qui peut changer
// entre deux visites : pages HTML et réponses d'API.
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    // caches.match() (et non cache.match()) : cherche dans TOUS les caches,
    // sinon les pages pré-cachées au démarrage (cache statique) seraient
    // ignorées ici et l'utilisateur verrait la page hors-ligne à leur place.
    const cached = await caches.match(request);
    if (cached) return cached;
    // Une navigation qui échoue sans rien en cache doit afficher une vraie
    // page, pas l'erreur brute du navigateur.
    if (request.mode === 'navigate') {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    throw err;
  }
}

// Sert le cache immédiatement (donc instantané et disponible hors ligne) tout
// en rafraîchissant l'entrée en arrière-plan pour le prochain chargement.
//
// Remplace un "cache d'abord" strict, qui était un piège ici : les assets ne
// sont pas versionnés dans leur nom (style.css, script.js…), donc une fois en
// cache ils n'étaient JAMAIS repris tant que CACHE_VERSION ne changeait pas.
// Un correctif CSS déployé restait ainsi invisible pour tous les visiteurs
// déjà venus une fois.
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const network = fetch(request).then(response => {
    if (response && response.ok) {
      caches.open(cacheName).then(cache => cache.put(request, response.clone()));
    }
    return response;
  });

  if (cached) {
    // On laisse la mise à jour se faire sans bloquer la réponse, mais sans
    // laisser filer une erreur réseau non gérée.
    network.catch(() => {});
    return cached;
  }
  return network;
}

self.addEventListener('fetch', event => {
  const { request } = event;

  // Le SW ne gère que les GET : les POST (chat IA, newsletter, traduction)
  // doivent toujours partir sur le réseau, sans interception.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Requêtes cross-origin (Google Fonts, Analytics, CDN de graphiques) :
  // laissées au navigateur, pour ne pas gonfler le cache ni risquer de
  // servir des réponses opaques périmées.
  if (url.origin !== self.location.origin) return;

  // Données d'API : réseau d'abord, dernière réponse connue en secours.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // Navigations (pages) : réseau d'abord, puis cache, puis page hors-ligne.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // Assets statiques : cache immédiat + rafraîchissement en arrière-plan.
  if (isStaticAsset(url)) {
    event.respondWith(
      staleWhileRevalidate(request, STATIC_CACHE).catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});
