// ============================================================
// FINANCIA — favoris.js
// Page « Mes favoris » : les actifs suivis, avec leur cours du jour.
//
// Mêmes données et mêmes cartes que Marchés (voir actifs-ui.js) : cette page
// n'ajoute qu'une chose, la sélection. Retirer un favori d'ici retire la carte
// de la page, ce qui est le geste attendu quand on gère une liste.
// ============================================================

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

FinanciaI18N.initLang();

// ── Nav bar : ombre au scroll ──
const navbar = $('#navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── Menu mobile ──
const menuBtn = $('#menuBtn');
const mobileMenu = $('#mobileMenu');

function closeMobileMenu() {
  mobileMenu?.classList.remove('open');
  menuBtn?.classList.remove('open');
  menuBtn?.setAttribute('aria-expanded', 'false');
}
menuBtn?.addEventListener('click', () => {
  const isOpen = mobileMenu?.classList.toggle('open');
  menuBtn.classList.toggle('open', isOpen);
  menuBtn.setAttribute('aria-expanded', String(isOpen));
});
$$('#mobileMenu a').forEach(a => a.addEventListener('click', closeMobileMenu));
window.addEventListener('scroll', closeMobileMenu, { passive: true });

// ── Footer : année ──
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ============================================================
// Rendu
// ============================================================
let lastData = null;   // dernière réponse /api/marches obtenue avec succès
let chargement = true; // vrai tant que le premier appel n'a pas abouti

function renderUpdatedText() {
  const wrap = $('#mktUpdated');
  const el = $('#mktUpdatedText');
  if (!wrap || !el || !lastData) return;
  const minutes = Math.max(0, Math.round((Date.now() - lastData.updatedAt) / 60000));
  el.textContent = minutes < 1
    ? FinanciaI18N.t('marches.updatedJustNow')
    : FinanciaI18N.t('marches.updatedAgo', { min: minutes });
  wrap.hidden = false;
}

// Les favoris sont réordonnés selon le catalogue plutôt que selon l'ordre des
// clics : deux actifs se présentent ainsi toujours dans le même ordre relatif
// que sur Marchés, ce qui évite une liste qui semble mélangée à chaque visite.
function favorisAffichables() {
  const choisis = new Set(FinanciaFavoris.favoris());
  return FinanciaActifs.ORDRE.filter(a => choisis.has(a.key));
}

function render() {
  const grid = $('#favGrid');
  const vide = $('#favVide');
  const loading = $('#favLoading');
  const erreur = $('#favErreur');
  const titre = $('#favTitre');
  if (!grid) return;

  const choisis = favorisAffichables();

  // L'état vide ne dépend pas du réseau : sans favori, il n'y a rien à
  // charger, et faire patienter devant un écran de chargement serait absurde.
  if (!choisis.length) {
    FinanciaActifs.detruireGraphes();
    grid.hidden = true;
    grid.innerHTML = '';
    loading.hidden = true;
    erreur.hidden = true;
    vide.hidden = false;
    $('#mktUpdated').hidden = true;
    titre.textContent = FinanciaI18N.t('favoris.title');
    renderNoticeStockage();
    return;
  }

  vide.hidden = true;
  titre.textContent = FinanciaI18N.t('favoris.titleCompte', { n: choisis.length });

  if (chargement && !lastData) { loading.hidden = false; grid.hidden = true; return; }
  loading.hidden = true;

  if (!lastData) { erreur.hidden = false; grid.hidden = true; return; }
  erreur.hidden = true;

  // Un actif favori que l'API ne renvoie pas (source momentanément muette) est
  // laissé de côté plutôt qu'affiché en carte vide — mais il reste en favori,
  // et réapparaîtra au prochain chargement réussi.
  const servis = choisis.filter(a => lastData.assets[a.key]);

  FinanciaActifs.detruireGraphes();
  grid.innerHTML = servis.map(FinanciaActifs.carteHtml).join('');
  grid.hidden = false;
  FinanciaActifs.remplirCartes(grid, lastData.assets);

  renderNoticeStockage();
  renderUpdatedText();
}

// ── Avis sur la fragilité du stockage (identique à Marchés) ──
const NOTICE_STOCKAGE = 'stockage-local';

function appInstallee() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function renderNoticeStockage() {
  const hote = $('#mktNotice');
  if (!hote) return;

  const aLieu = FinanciaFavoris.nbFavoris() > 0
    && !FinanciaFavoris.noticeEcartee(NOTICE_STOCKAGE)
    && !appInstallee();

  if (!aLieu) { hote.hidden = true; hote.innerHTML = ''; return; }

  hote.innerHTML = `
    <p class="mkt-notice-txt">${FinanciaI18N.t('marches.favoris.noticeTexte')}
      <a class="mkt-notice-lien" href="/#installer">${FinanciaI18N.t('marches.favoris.noticeLien')}</a>
    </p>
    <button type="button" class="mkt-notice-fermer" aria-label="${FinanciaI18N.t('marches.favoris.noticeFermer')}">&times;</button>`;
  hote.hidden = false;

  hote.querySelector('.mkt-notice-fermer').addEventListener('click', () => {
    FinanciaFavoris.ecarterNotice(NOTICE_STOCKAGE);
    renderNoticeStockage();
  });
}

// Retirer un favori depuis cette page fait disparaître sa carte : on redessine
// la grille entière plutôt que de retirer un nœud, pour que le compteur du
// titre et l'état vide restent cohérents. Le redessin est déclenché par
// l'abonnement au stockage plus bas, pas ici : le passer aussi en rappel
// reconstruirait la grille et ses graphiques deux fois par clic.
FinanciaActifs.brancherFavoris($('#favGrid'));

async function loadMarches() {
  try {
    const res = await fetch('/api/marches');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.assets || !Object.keys(data.assets).length) throw new Error('Réponse vide');
    lastData = data;
  } catch (e) {
    console.error('[favoris] Échec chargement :', e.message);
  } finally {
    chargement = false;
    render();
  }
}

render();      // état vide ou écran de chargement, sans attendre le réseau
loadMarches();
setInterval(loadMarches, 5 * 60 * 1000);
setInterval(renderUpdatedText, 30 * 1000);

// Un autre onglet ouvert sur Marchés peut modifier la liste pendant la visite.
FinanciaFavoris.surChangement(render);
FinanciaI18N.onLangChange(render);
