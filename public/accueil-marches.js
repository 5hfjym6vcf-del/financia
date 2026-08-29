// ============================================================
// FINANCIA — accueil-marches.js
// Widget « Actions & cryptos du jour » de la page d'accueil.
//
// Réutilise /api/marches plutôt que d'ouvrir un endpoint : la page Marchés
// interroge déjà ces vingt actifs, la réponse est mise en cache côté serveur,
// et un second endpoint aurait doublé les appels vers Yahoo et CoinGecko sans
// rien apporter.
//
// La sélection ne retient que des valeurs individuelles et des cryptos : les
// indices (CAC 40, S&P 500…) ont déjà leur place sur Marchés, et un widget qui
// les répéterait n'ajouterait rien à l'accueil.
// ============================================================

(function () {
  const hote = document.getElementById('accueilMarches');
  if (!hote) return;

  const grille = document.getElementById('accueilMarchesGrille');
  const majEl = document.getElementById('accueilMarchesMaj');

  // Quatre actions de zones différentes et deux cryptos : le mélange doit se
  // lire d'un coup d'œil, sans que l'une des deux familles écrase l'autre.
  const SELECTION = [
    { cle: 'lvmh',     icone: '👜' },
    { cle: 'jpmorgan', icone: '🏦' },
    { cle: 'sap',      icone: '💻' },
    { cle: 'toyota',   icone: '🚗' },
    { cle: 'bitcoin',  icone: '🪙' },
    { cle: 'ethereum', icone: '🔷' },
  ];

  let donnees = null;

  function locale() {
    const lang = FinanciaI18N.getLang();
    return lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES'
         : lang === 'ru' ? 'ru-RU' : lang === 'de' ? 'de-DE' : 'fr-FR';
  }

  function fmtPrix(v, devise) {
    try {
      return new Intl.NumberFormat(locale(), {
        style: 'currency', currency: devise,
        maximumFractionDigits: v >= 1000 ? 0 : 2,
      }).format(v);
    } catch { return `${v.toFixed(2)} ${devise}`; }
  }

  function fmtVar(v) {
    try {
      return new Intl.NumberFormat(locale(), {
        minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'always',
      }).format(v) + ' %';
    } catch { return `${v >= 0 ? '+' : ''}${v.toFixed(2)} %`; }
  }

  function carteHtml({ cle, icone }, actif) {
    const hausse = actif.changePct >= 0;
    return `<article class="am-carte">
      <div class="am-haut">
        <span class="am-icone" aria-hidden="true">${icone}</span>
        <div class="am-ident">
          <h3 class="am-nom">${actif.name}</h3>
          <span class="am-ticker">${actif.ticker || ''}</span>
        </div>
      </div>
      <div class="am-bas">
        <span class="am-prix">${fmtPrix(actif.price, actif.currency)}</span>
        <span class="am-var ${hausse ? 'positive' : 'negative'}">${fmtVar(actif.changePct)}</span>
      </div>
    </article>`;
  }

  function rendre() {
    if (!donnees || !grille) return;
    const cartes = SELECTION
      .map(s => { const a = donnees.assets?.[s.cle]; return a ? carteHtml(s, a) : ''; })
      .filter(Boolean);

    // Sous le seuil de la moitié, mieux vaut ne rien montrer qu'une grille
    // trouée qui donnerait l'impression d'un site à moitié cassé.
    if (cartes.length < 3) { hote.hidden = true; return; }

    grille.innerHTML = cartes.join('');

    if (majEl && donnees.updatedAt) {
      const d = new Date(donnees.updatedAt);
      if (!Number.isNaN(d.getTime())) {
        majEl.textContent = FinanciaI18N.t('accueilMarches.maj')
          .replace('{h}', d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }));
        majEl.hidden = false;
      }
    }
    hote.hidden = false;
  }

  async function charger() {
    try {
      const r = await fetch('/api/marches');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      donnees = await r.json();
      if (!donnees?.assets) throw new Error('réponse vide');
      rendre();
    } catch (e) {
      // Section d'appoint : son absence ne doit rien casser sur l'accueil.
      console.error('[accueil-marches] Échec chargement :', e.message);
      hote.hidden = true;
    }
  }

  charger();
  FinanciaI18N.onLangChange(rendre);
})();
