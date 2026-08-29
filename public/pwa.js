// ============================================================
// FINANCIA — pwa.js
// Deux responsabilités :
//  1. Enregistrer le service worker (voir sw.js).
//  2. Capter l'événement d'installation et piloter la modale « Installer
//     l'app » (sélecteur de plateforme + instructions).
// Chargé en defer par les 4 pages du site.
// ============================================================
(function () {
  // ── 1. Capture de l'invite d'installation ──────────────────
  // beforeinstallprompt ne se déclenche qu'UNE fois, très tôt dans le
  // chargement. Sans preventDefault + mémorisation ici, il est définitivement
  // perdu et plus aucun bouton ne pourra déclencher l'installation native.
  // Ce bloc doit donc rester en tête de fichier, avant tout le reste.
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.documentElement.classList.add('can-install');
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    document.documentElement.classList.add('is-installed');
    closeModal();
  });

  // ── 2. Service worker ──────────────────────────────────────
  const host = location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '' || host.endsWith('.local');

  if ('serviceWorker' in navigator && !isLocal) {
    // En développement, un SW en cache masquerait les modifications en cours.
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('[pwa] Service worker non enregistré :', err.message);
      });
    });
  }

  // ── 3. Détection de la plateforme ──────────────────────────
  const ua = navigator.userAgent;

  // iPadOS 13+ se présente comme un Mac : seul le nombre de points de contact
  // permet de le distinguer d'un vrai ordinateur.
  const isIpadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || isIpadOS;
  const isAndroid = /Android/.test(ua);
  const isMac = !isIpadOS && /Macintosh|Mac OS X/.test(ua);
  const isWindows = /Windows/.test(ua);

  // Chrome et Edge embarquent "Safari" dans leur UA : on les écarte d'abord.
  const isEdge = /Edg\//.test(ua);
  const isChrome = /Chrome|CriOS|Chromium/.test(ua) && !isEdge;
  const isSafari = /Safari/.test(ua) && !isChrome && !isEdge;

  function detectPlatform() {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    if (isMac) return 'mac';
    if (isWindows) return 'windows';
    return 'android';
  }

  // Déjà installée : ni le bouton ni la modale n'ont de raison d'exister.
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  }

  // ── 4. Modale ──────────────────────────────────────────────
  const modal = document.getElementById('installModal');
  if (!modal) return;

  const openers = document.querySelectorAll('[data-install-open]');
  const closers = modal.querySelectorAll('[data-install-close]');
  const tabs = [...modal.querySelectorAll('.im-tab')];
  const panels = [...modal.querySelectorAll('.im-panel')];
  const nativeBtns = [...modal.querySelectorAll('[data-install-native]')];
  let lastFocused = null;

  if (isStandalone()) {
    document.documentElement.classList.add('is-installed');
    return;
  }

  function selectPlatform(key) {
    tabs.forEach(t => {
      const on = t.dataset.platform === key;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });
    panels.forEach(p => { p.hidden = p.dataset.platform !== key; });

    // Le bouton d'installation directe n'a de sens que si le navigateur nous a
    // effectivement remis une invite, et seulement sur la plateforme courante :
    // afficher « Installer » à quelqu'un qui consulte l'onglet Android depuis
    // un iPhone ne mènerait nulle part.
    const usable = !!deferredPrompt && key === detectPlatform();
    const panel = panels.find(p => p.dataset.platform === key);
    if (panel) {
      const native = panel.querySelector('[data-install-native]');
      const manual = panel.querySelector('[data-install-manual]');
      if (native) native.hidden = !usable;
      if (manual) manual.hidden = usable;
    }
  }

  function openModal() {
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    selectPlatform(detectPlatform());
    const first = modal.querySelector('.im-tab.active') || modal.querySelector('[data-install-close]');
    first?.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
    lastFocused?.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;
    // Piège le focus dans la modale tant qu'elle est ouverte.
    const focusables = modal.querySelectorAll('button:not([hidden]), [href], [tabindex]:not([tabindex="-1"])');
    const visible = [...focusables].filter(el => el.offsetParent !== null);
    if (!visible.length) return;
    const first = visible[0], last = visible[visible.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  openers.forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); openModal(); }));
  closers.forEach(b => b.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  tabs.forEach(t => t.addEventListener('click', () => selectPlatform(t.dataset.platform)));

  nativeBtns.forEach(btn => btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt;
    // L'invite n'est utilisable qu'une seule fois : on la libère aussitôt pour
    // ne pas rappeler prompt() sur un objet déjà consommé.
    deferredPrompt = null;
    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') closeModal();
      else selectPlatform(detectPlatform()); // bascule sur les instructions manuelles
    } catch {
      selectPlatform(detectPlatform());
    }
  }));
})();
