// ============================================================
// FINANCIA — actifs-ui.js
// Catalogue des actifs suivis, et rendu d'une carte d'actif.
//
// Extrait de marches.js quand la page « Mes favoris » est apparue : les deux
// pages affichent exactement la même carte, à partir de la même réponse
// /api/marches. Dupliquer le gabarit aurait garanti qu'elles divergent à la
// première retouche.
//
// Marchés reste seul responsable de son propre découpage par région, de ses
// classements et de son calendrier : rien de tout ça ne remonte ici.
// ============================================================

(function () {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Le catalogue vit ici parce que les deux pages en ont besoin : Marchés pour
  // grouper par région, Favoris pour retrouver l'icône et l'ordre d'affichage.
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

  // À plat, dans l'ordre d'affichage de Marchés — que la page Favoris reprend
  // telle quelle, pour que deux actifs se présentent toujours dans le même
  // ordre relatif d'une page à l'autre.
  const ORDRE = REGIONS.flatMap(r => r.assets);
  const PAR_CLE = new Map(ORDRE.map(a => [a.key, a]));

  // Un seul registre de graphiques pour la page en cours : les deux pages ne
  // coexistent jamais, et chacune détruit avant de reconstruire.
  let graphes = {};

  function locale() {
    const lang = FinanciaI18N.getLang();
    return lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : lang === 'ru' ? 'ru-RU' : lang === 'de' ? 'de-DE' : 'fr-FR';
  }

  function fmtPrix(value, currency) {
    try {
      return new Intl.NumberFormat(locale(), {
        style: 'currency',
        currency,
        maximumFractionDigits: value >= 1000 ? 0 : 2,
      }).format(value);
    } catch {
      return `${value.toFixed(2)} ${currency}`;
    }
  }

  function detruireGraphes() {
    Object.values(graphes).forEach(c => { try { c?.chart?.remove(); } catch { /* déjà détruit */ } });
    graphes = {};
  }

  function construireGraphe(container, history, positive) {
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
  const COEUR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

  // Le libellé accessible dit l'action à venir, pas l'état courant : c'est ce
  // qu'attend un lecteur d'écran sur un bouton à bascule.
  function syncBouton(btn, actif) {
    btn.classList.toggle('actif', actif);
    btn.setAttribute('aria-pressed', String(actif));
    btn.setAttribute('aria-label', FinanciaI18N.t(actif ? 'marches.favoris.retirer' : 'marches.favoris.ajouter'));
  }

  function syncFavoris(racine = document) {
    $$('.mkt-fav', racine).forEach(btn => syncBouton(btn, FinanciaFavoris.estFavori(btn.dataset.fav)));
  }

  // Délégation sur un conteneur stable : le contenu est remplacé à chaque
  // rendu (changement de langue compris), des écouteurs posés sur les boutons
  // eux-mêmes seraient perdus à la première bascule.
  function brancherFavoris(conteneur, apres) {
    conteneur?.addEventListener('click', e => {
      const btn = e.target.closest('.mkt-fav');
      if (!btn) return;
      syncBouton(btn, FinanciaFavoris.basculerFavori(btn.dataset.fav));
      if (typeof apres === 'function') apres(btn.dataset.fav);
    });
  }

  function carteHtml({ key, icon }) {
    return `<article class="mkt-card" data-asset="${key}">
      <div class="mkt-card-top">
        <div class="mkt-card-name">
          <span class="mkt-icon">${icon}</span>
          <h3>${FinanciaI18N.t('marches.assets.' + key + '.name')}</h3>
        </div>
        <div class="mkt-card-actions">
          <span class="mkt-change" data-field="change">···</span>
          <button type="button" class="mkt-fav" data-fav="${key}">${COEUR_SVG}</button>
        </div>
      </div>
      <div class="mkt-price" data-field="price">···</div>
      <div class="mkt-chart" data-chart="${key}"></div>
      <p class="mkt-blurb">${FinanciaI18N.t('marches.assets.' + key + '.blurb')}</p>
    </article>`;
  }

  /**
   * Remplit toutes les cartes présentes sous `racine` à partir des données
   * de /api/marches, et construit leurs mini-graphiques.
   */
  function remplirCartes(racine, assets) {
    $$('.mkt-card', racine).forEach(card => {
      const key = card.dataset.asset;
      const asset = assets?.[key];
      if (!asset) return;

      const positive = asset.changePct >= 0;
      const changeEl = card.querySelector('[data-field="change"]');
      changeEl.textContent = `${positive ? '+' : ''}${asset.changePct.toFixed(2)}%`;
      changeEl.classList.remove('positive', 'negative');
      changeEl.classList.add(positive ? 'positive' : 'negative');

      card.querySelector('[data-field="price"]').textContent = fmtPrix(asset.price, asset.currency);

      const built = construireGraphe(card.querySelector(`[data-chart="${key}"]`), asset.history, positive);
      if (built) graphes[key] = built;
    });
    syncFavoris(racine);
  }

  // Les cartes passent de 3 → 2 → 1 colonnes selon la largeur : les graphiques
  // doivent suivre, sinon ils débordent ou laissent un blanc.
  let minuteur = null;
  window.addEventListener('resize', () => {
    clearTimeout(minuteur);
    minuteur = setTimeout(() => {
      Object.entries(graphes).forEach(([key, c]) => {
        const container = document.querySelector(`[data-chart="${key}"]`);
        if (c?.chart && container?.clientWidth) c.chart.resize(container.clientWidth, 64);
      });
    }, 150);
  });

  window.FinanciaActifs = {
    REGIONS,
    ORDRE,
    actif: cle => PAR_CLE.get(cle),
    locale,
    fmtPrix,
    carteHtml,
    remplirCartes,
    detruireGraphes,
    syncFavoris,
    brancherFavoris,
  };
})();
