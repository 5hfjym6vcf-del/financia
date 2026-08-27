// ============================================================
// FINANCIA — marches.js
// Page "Analyse de marché" : nav partagée + cartes d'actifs avec
// mini-graphiques (Lightweight Charts). Autonome — ne dépend pas
// de script.js (composants absents ici).
// ============================================================

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Traduit tout le HTML statique déjà présent, révèle la page (anti-FOUC),
// et branche le sélecteur de langue — doit s'exécuter avant tout le reste.
FinanciaI18N.initLang();

// ── Nav bar : ombre au scroll ──
const navbar = $('#navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── Menu mobile (identique au comportement de script.js / histoire.js) ──
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
// Marchés : chargement des données + rendu des cartes
// ============================================================
const REGIONS = [
  { key: 'us', flag: '🇺🇸', assets: [
    { key: 'sp500', icon: '🇺🇸' },
    { key: 'nasdaq', icon: '💻' },
    { key: 'dowjones', icon: '🏛️' },
    { key: 'jpmorgan', icon: '🏦' },
  ] },
  { key: 'france', flag: '🇫🇷', assets: [
    { key: 'cac40', icon: '🇫🇷' },
    { key: 'lvmh', icon: '👜' },
  ] },
  { key: 'allemagne', flag: '🇩🇪', assets: [
    { key: 'dax', icon: '🇩🇪' },
    { key: 'sap', icon: '💻' },
  ] },
  { key: 'royaumeUni', flag: '🇬🇧', assets: [
    { key: 'ftse100', icon: '🇬🇧' },
    { key: 'shell', icon: '⛽' },
  ] },
  { key: 'suisse', flag: '🇨🇭', assets: [
    { key: 'smi', icon: '🇨🇭' },
    { key: 'nestle', icon: '🍫' },
  ] },
  { key: 'japon', flag: '🇯🇵', assets: [
    { key: 'nikkei225', icon: '🇯🇵' },
    { key: 'toyota', icon: '🚗' },
  ] },
  { key: 'chineAsie', flag: '🇭🇰', assets: [
    { key: 'hangseng', icon: '🇭🇰' },
    { key: 'alibaba', icon: '🛒' },
  ] },
  { key: 'mondial', flag: '🌍', assets: [
    { key: 'gold', icon: '🥇' },
    { key: 'msciWorld', icon: '🌍' },
  ] },
  { key: 'cryptos', flag: '🪙', assets: [
    { key: 'bitcoin', icon: '🪙' },
    { key: 'ethereum', icon: '🔷' },
  ] },
];
// À plat, pour le filtrage de disponibilité et les helpers existants qui
// itèrent sur "tous les actifs" sans se soucier des régions.
const ASSET_ORDER = REGIONS.flatMap(r => r.assets);

let lastData = null; // dernière réponse /api/marches obtenue avec succès
let charts = {};     // key -> { chart, series }, pour le resize et le cleanup

function currentLocale() {
  const lang = FinanciaI18N.getLang();
  return lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : lang === 'ru' ? 'ru-RU' : lang === 'de' ? 'de-DE' : 'fr-FR';
}

function fmtPrice(value, currency) {
  try {
    return new Intl.NumberFormat(currentLocale(), {
      style: 'currency',
      currency,
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

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

function destroyCharts() {
  Object.values(charts).forEach(c => { try { c?.chart?.remove(); } catch { /* déjà détruit */ } });
  charts = {};
}

function buildChart(container, history, positive) {
  if (!window.LightweightCharts || !container || !history?.length) return null;
  const chart = LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: 64,
    layout: {
      background: { type: LightweightCharts.ColorType.Solid, color: 'transparent' },
      textColor: 'rgba(255,255,255,0.4)',
      attributionLogo: false,
    },
    grid: { vertLines: { visible: false }, horzLines: { visible: false } },
    rightPriceScale: { visible: false },
    leftPriceScale: { visible: false },
    timeScale: { visible: false },
    crosshair: {
      vertLine: { visible: false, labelVisible: false },
      horzLine: { visible: false, labelVisible: false },
    },
    handleScroll: false,
    handleScale: false,
  });
  const series = chart.addSeries(LightweightCharts.LineSeries, {
    color: positive ? '#4ade80' : '#f87171',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerVisible: false,
  });
  series.setData(history);
  chart.timeScale().fitContent();
  return { chart, series };
}

// ── Favoris ──
// Le cœur se superpose aux cartes sans rien retirer : la page reste
// exactement la même pour qui ne s'en sert pas.
const COEUR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

function favBtnHtml(key) {
  return `<button type="button" class="mkt-fav" data-fav="${key}">${COEUR_SVG}</button>`;
}

// Le libellé accessible dit l'action à venir, pas l'état courant : c'est ce
// qu'attend un lecteur d'écran sur un bouton à bascule.
function syncFavBtn(btn, actif) {
  btn.classList.toggle('actif', actif);
  btn.setAttribute('aria-pressed', String(actif));
  btn.setAttribute('aria-label', FinanciaI18N.t(actif ? 'marches.favoris.retirer' : 'marches.favoris.ajouter'));
}

function syncTousFavoris() {
  $$('.mkt-fav').forEach(btn => syncFavBtn(btn, FinanciaProfil.estFavori(btn.dataset.fav)));
}

function cardHtml({ key, icon }) {
  return `<article class="mkt-card" data-asset="${key}">
    <div class="mkt-card-top">
      <div class="mkt-card-name">
        <span class="mkt-icon">${icon}</span>
        <h3>${FinanciaI18N.t('marches.assets.' + key + '.name')}</h3>
      </div>
      <div class="mkt-card-actions">
        <span class="mkt-change" data-field="change">···</span>
        ${favBtnHtml(key)}
      </div>
    </div>
    <div class="mkt-price" data-field="price">···</div>
    <div class="mkt-chart" data-chart="${key}"></div>
    <p class="mkt-blurb">${FinanciaI18N.t('marches.assets.' + key + '.blurb')}</p>
  </article>`;
}

function regionHtml(region, assets) {
  return `<div class="mkt-region">
    <h3 class="mkt-region-title"><span class="mkt-region-flag">${region.flag}</span>${FinanciaI18N.t('marches.regions.' + region.key)}</h3>
    <div class="mkt-grid">${assets.map(cardHtml).join('')}</div>
  </div>`;
}

function renderGrid() {
  const grid = $('#mktGrid');
  if (!grid || !lastData) return;

  const available = ASSET_ORDER.filter(a => lastData.assets[a.key]);
  if (!available.length) {
    grid.innerHTML = `<p class="mkt-error">${FinanciaI18N.t('marches.errorMsg')}</p>`;
    return;
  }

  destroyCharts();

  const populatedRegions = REGIONS
    .map(region => ({ region, assets: region.assets.filter(a => lastData.assets[a.key]) }))
    .filter(r => r.assets.length);

  grid.innerHTML = populatedRegions.map(({ region, assets }) => regionHtml(region, assets)).join('');

  available.forEach(({ key }) => {
    const asset = lastData.assets[key];
    const card = grid.querySelector(`.mkt-card[data-asset="${key}"]`);
    if (!card || !asset) return;

    const positive = asset.changePct >= 0;
    const changeEl = card.querySelector('[data-field="change"]');
    changeEl.textContent = `${positive ? '+' : ''}${asset.changePct.toFixed(2)}%`;
    changeEl.classList.add(positive ? 'positive' : 'negative');

    card.querySelector('[data-field="price"]').textContent = fmtPrice(asset.price, asset.currency);

    const chartContainer = card.querySelector(`[data-chart="${key}"]`);
    const built = buildChart(chartContainer, asset.history, positive);
    if (built) charts[key] = built;
  });

  syncTousFavoris();
  renderNoticeStockage();
  renderUpdatedText();
}

// ── Avis sur la fragilité du stockage ──
// Les favoris vivent dans le navigateur, et certains navigateurs les effacent
// après quelques jours sans visite. Le dire est une question de loyauté : sans
// ça, l'utilisateur constate la perte sans jamais comprendre pourquoi.
// Affiché seulement une fois le premier favori posé (avant, l'avertissement ne
// parlerait de rien), et jamais dans l'app installée, qui n'est pas concernée.
const NOTICE_STOCKAGE = 'stockage-local';

function appInstallee() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function renderNoticeStockage() {
  const hote = $('#mktNotice');
  if (!hote) return;

  const aLieu = FinanciaProfil.nbFavoris() > 0
    && !FinanciaProfil.noticeEcartee(NOTICE_STOCKAGE)
    && !appInstallee();

  if (!aLieu) { hote.hidden = true; hote.innerHTML = ''; return; }

  hote.innerHTML = `
    <p class="mkt-notice-txt">${FinanciaI18N.t('marches.favoris.noticeTexte')}
      <a class="mkt-notice-lien" href="/#installer">${FinanciaI18N.t('marches.favoris.noticeLien')}</a>
    </p>
    <button type="button" class="mkt-notice-fermer" aria-label="${FinanciaI18N.t('marches.favoris.noticeFermer')}">&times;</button>`;
  hote.hidden = false;

  hote.querySelector('.mkt-notice-fermer').addEventListener('click', () => {
    FinanciaProfil.ecarterNotice(NOTICE_STOCKAGE);
    renderNoticeStockage();
  });
}

// Délégation sur le conteneur, qui survit aux rendus : renderGrid() remplace
// tout son contenu à chaque changement de langue, des écouteurs posés sur les
// boutons eux-mêmes seraient perdus à la première bascule.
$('#mktGrid')?.addEventListener('click', e => {
  const btn = e.target.closest('.mkt-fav');
  if (!btn) return;
  syncFavBtn(btn, FinanciaProfil.basculerFavori(btn.dataset.fav));
  renderNoticeStockage();
});

// Garde les cœurs justes si le profil change ailleurs (autre onglet ouvert
// sur la même page, ou page profil à venir).
FinanciaProfil.surChangement(syncTousFavoris);

function fmtCap(value, currency) {
  // Les capitalisations se comptent en centaines de milliards : on abrège
  // plutôt que d'aligner douze chiffres illisibles.
  const unite = FinanciaI18N.t('marches.tops.milliards');
  try {
    const n = new Intl.NumberFormat(currentLocale(), { maximumFractionDigits: 0 }).format(value / 1e9);
    return `${n} ${unite} ${currency === 'USD' ? '$' : currency}`;
  } catch {
    return `${Math.round(value / 1e9)} ${unite}`;
  }
}

function renderTops() {
  const wrap = $('#mktTops');
  const cls = lastData?.classements;
  if (!wrap) return;
  // Les classements sont un complément : en leur absence, la page reste
  // parfaitement utilisable sans bloc vide ni message d'erreur.
  if (!cls?.capitalisation?.length && !cls?.dividendes?.length) { wrap.hidden = true; return; }

  const ligne = (item, valeur) => {
    const positive = (item.changePct ?? 0) >= 0;
    return `<li class="mkt-top-row">
      <span class="mkt-top-name">${item.name}</span>
      <span class="mkt-top-val">${valeur}</span>
      <span class="mkt-top-chg ${positive ? 'positive' : 'negative'}">${positive ? '+' : ''}${(item.changePct ?? 0).toFixed(2)}%</span>
    </li>`;
  };

  const cap = $('#mktTopCap');
  if (cap) cap.innerHTML = (cls.capitalisation || []).map(i => ligne(i, fmtCap(i.marketCap, i.currency))).join('');

  const div = $('#mktTopDiv');
  if (div) div.innerHTML = (cls.dividendes || []).map(i => ligne(i, `${i.dividendYield.toFixed(2)} %`)).join('');

  wrap.hidden = false;
}

// ── Calendrier des résultats ──
let lastResultats = null;
let moisCourant = 0; // index dans lastResultats.mois

// Info-bulle sur « attendu » : le sigle BPA ne parle pas à un débutant, et
// l'intérêt du chiffre (l'écart avec le réel fait bouger le cours) n'est pas
// évident. Déclenchée au clic autant qu'au survol, sinon elle serait
// inaccessible au tactile.
function infobulleHtml() {
  return `<button type="button" class="mkt-info" aria-label="${FinanciaI18N.t('marches.resultats.infoAria')}">
    <span aria-hidden="true">i</span>
    <span class="mkt-info-bulle" role="tooltip">${FinanciaI18N.t('marches.resultats.infoTexte')}</span>
  </button>`;
}

function renderResultats() {
  const wrap = $('#mktEarnings');
  const cont = $('#mktEarnDays');
  const vide = $('#mktEarnEmpty');
  if (!wrap || !cont) return;
  if (!lastResultats?.mois?.length) { wrap.hidden = true; return; }

  const mois = lastResultats.mois;
  moisCourant = Math.max(0, Math.min(moisCourant, mois.length - 1));
  const courant = mois[moisCourant];

  // Libellé du mois, construit en UTC pour ne pas reculer d'un jour selon le
  // fuseau du visiteur.
  const [an, mo] = courant.mois.split('-').map(Number);
  const libelleMois = new Date(Date.UTC(an, mo - 1, 1)).toLocaleDateString(currentLocale(), {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  });
  const label = $('#mktEarnMonth');
  if (label) label.textContent = libelleMois;

  // Les flèches ne mènent nulle part au-delà de la période couverte : on les
  // désactive plutôt que d'afficher des mois vides.
  const prev = $('#mktEarnPrev');
  const next = $('#mktEarnNext');
  if (prev) prev.disabled = moisCourant === 0;
  if (next) next.disabled = moisCourant === mois.length - 1;

  cont.innerHTML = courant.jours.map(j => {
    const [a, m, d] = j.date.split('-').map(Number);
    const libelle = new Date(Date.UTC(a, m - 1, d)).toLocaleDateString(currentLocale(), {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
    });
    const lignes = j.evenements.map(e => {
      const cle = e.moment === 'pre-market' ? 'avantOuverture'
                : e.moment === 'post-market' ? 'apresCloture' : null;
      const moment = cle ? FinanciaI18N.t('marches.resultats.' + cle) : '';
      const est = e.estimation !== null && !Number.isNaN(e.estimation)
        ? `<span class="mkt-earn-est">${FinanciaI18N.t('marches.resultats.estimation')} ${e.estimation}${infobulleHtml()}</span>`
        : '';
      return `<li class="mkt-earn-row">
        <span class="mkt-earn-tick">${e.symbole}</span>
        <span class="mkt-earn-name">${e.nom}</span>
        ${moment ? `<span class="mkt-earn-when">${moment}</span>` : '<span></span>'}
        ${est || '<span></span>'}
      </li>`;
    }).join('');
    return `<div class="mkt-earn-day">
      <h4 class="mkt-earn-date">${libelle}</h4>
      <ul class="mkt-earn-list">${lignes}</ul>
    </div>`;
  }).join('');

  if (vide) vide.hidden = courant.jours.length > 0;
  wrap.hidden = false;
}

function brancherNavMois() {
  $('#mktEarnPrev')?.addEventListener('click', () => { moisCourant--; renderResultats(); });
  $('#mktEarnNext')?.addEventListener('click', () => { moisCourant++; renderResultats(); });

  // Une info-bulle au survol seul serait inatteignable au doigt : le clic la
  // bascule, et un clic ailleurs la referme.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.mkt-info');
    $$('.mkt-info.ouverte').forEach(b => { if (b !== btn) b.classList.remove('ouverte'); });
    if (btn) { e.preventDefault(); btn.classList.toggle('ouverte'); }
  });
}

async function loadResultats() {
  try {
    const res = await fetch('/api/resultats');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    lastResultats = data;
    moisCourant = 0;
    renderResultats();
  } catch (e) {
    // Le calendrier est un complément : son absence ne doit rien casser.
    console.error('[resultats] Échec chargement :', e.message);
  }
}

brancherNavMois();

async function loadMarches() {
  try {
    const res = await fetch('/api/marches');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.assets || !Object.keys(data.assets).length) throw new Error('Réponse vide');
    lastData = data;
    renderGrid();
    renderTops();
  } catch (e) {
    console.error('[marches] Échec chargement :', e.message);
    // Le fallback "dernière valeur en cache" est géré côté serveur ; ici on
    // protège seulement le tout premier chargement (si même ça échoue, on
    // n'a rien d'autre à afficher que le message d'erreur).
    if (!lastData) {
      const grid = $('#mktGrid');
      if (grid) grid.innerHTML = `<p class="mkt-error">${FinanciaI18N.t('marches.errorMsg')}</p>`;
    }
  }
}

// Redimensionne les mini-graphiques avec la fenêtre (les cartes passent
// de 3 → 2 → 1 colonnes selon la largeur).
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    Object.entries(charts).forEach(([key, c]) => {
      const container = $(`[data-chart="${key}"]`);
      if (c?.chart && container?.clientWidth) c.chart.resize(container.clientWidth, 64);
    });
  }, 150);
});

loadMarches();
loadResultats();
setInterval(loadMarches, 5 * 60 * 1000);   // repasse voir le cache serveur, sans jamais le solliciter en direct
setInterval(renderUpdatedText, 30 * 1000); // rafraîchit juste le texte "il y a X min"

FinanciaI18N.onLangChange(() => {
  if (lastData) { renderGrid(); renderTops(); }
  if (lastResultats) renderResultats();
});
