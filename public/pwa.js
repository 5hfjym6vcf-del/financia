// ============================================================
// FINANCIA — pwa.js
// Enregistre le service worker (voir sw.js). Chargé en defer par les
// 4 pages du site. Volontairement silencieux : si le navigateur ne
// supporte pas les service workers, ou si l'enregistrement échoue,
// le site continue de fonctionner exactement comme avant.
// ============================================================
(function () {
  if (!('serviceWorker' in navigator)) return;

  // En développement (file://, localhost sans HTTPS…), un SW mis en cache
  // peut masquer les modifications en cours ; on ne l'active qu'en prod.
  const host = location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '' || host.endsWith('.local');
  if (isLocal) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('[pwa] Service worker non enregistré :', err.message);
    });
  });
})();
