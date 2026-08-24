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

function cardHtml({ key, icon }) {
  return `<article class="mkt-card" data-asset="${key}">
    <div class="mkt-card-top">
      <div class="mkt-card-name">
        <span class="mkt-icon">${icon}</span>
        <h3>${FinanciaI18N.t('marches.assets.' + key + '.name')}</h3>
      </div>
      <span class="mkt-change" data-field="change">···</span>
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

  renderUpdatedText();
}

async function loadMarches() {
  try {
    const res = await fetch('/api/marches');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.assets || !Object.keys(data.assets).length) throw new Error('Réponse vide');
    lastData = data;
    renderGrid();
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
setInterval(loadMarches, 5 * 60 * 1000);   // repasse voir le cache serveur, sans jamais le solliciter en direct
setInterval(renderUpdatedText, 30 * 1000); // rafraîchit juste le texte "il y a X min"

FinanciaI18N.onLangChange(() => {
  if (lastData) renderGrid();
});
