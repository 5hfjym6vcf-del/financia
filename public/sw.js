// ============================================================
// FINANCIA — service worker
// Deux stratégies, choisies selon la nature de la ressource :
//  - cache-first  : assets statiques (CSS/JS/images/polices) — ils ne
//                   changent qu'au déploiement, où le bump de CACHE_VERSION
//                   purge l'ancien cache.
//  - network-first : pages HTML et données d'API (marchés, actus, avis) —
//                   toujours frais si le réseau répond, sinon on ressert la
//                   dernière version connue, sinon la page hors-ligne.
// Aucune requête POST n'est mise en cache (chat IA, newsletter, traduction).
// ============================================================

// Bumper cette version à chaque déploiement qui change un asset statique :
// l'activation supprime alors tous les caches d'une version antérieure.
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `financia-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `financia-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Pré-cachées à l'installation : les 4 pages du site + le socle nécessaire
// pour les afficher correctement hors ligne.
const PRECACHE_URLS = [
  '/',
  '/marches',
  '/histoire',
  '/contact',
  OFFLINE_URL,
  '/style.css',
  '/marches.css',
  '/histoire.css',
  '/contact.css',
  '/i18n.js',
  '/i18n-core.js',
  '/script.js',
  '/marches.js',
  '/histoire.js',
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

// Cache d'abord, réseau en secours (et mise en cache au passage).
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
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

  // Assets statiques : cache d'abord.
  if (isStaticAsset(url)) {
    event.respondWith(
      cacheFirst(request, STATIC_CACHE).catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});
