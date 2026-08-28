// ============================================================
// FINANCIA — actus-ui.js
// Flux d'actualités : chargement, sélection par thème, traduction des titres
// et rendu des cartes.
//
// Extrait de script.js quand la page « Mes favoris » a eu besoin du même flux.
// Les deux pages partent du même appel à /api/actus et affichent la même carte.
//
// Un seul appel couvre tous les thèmes : chaque article d'Alpha Vantage porte un
// tableau "topics" avec un score de pertinence par sujet, et l'on filtre côté
// client. Le quota gratuit étant de 25 requêtes par jour, multiplier les appels
// par thème n'était pas envisageable.
// ============================================================

(function () {
  // Les quatre sujets demandés à l'API dans api/actus.js. Les clés sont celles
  // employées par les sélecteurs de l'interface.
  const TOPICS = {
    cryptos: 'blockchain',
    bourse: 'financial_markets',
    matieres: 'energy_transportation',
  };

  // En dessous, l'article ne parle du sujet qu'en passant.
  const PERTINENCE_MIN = 0.1;

  // Le flux est mémorisé pour la durée de la page : deux blocs d'actualités sur
  // un même écran ne doivent pas provoquer deux requêtes.
  let flux = null;
  let promesse = null;

  function locale() {
    const lang = FinanciaI18N.getLang();
    return lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : lang === 'ru' ? 'ru-RU' : lang === 'de' ? 'de-DE' : 'fr-FR';
  }

  function echapper(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** Charge le flux une seule fois par page. Lève si la source est muette. */
  function charger() {
    if (flux) return Promise.resolve(flux);
    if (promesse) return promesse;

    promesse = (async () => {
      const res = await fetch('/api/actus');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Alpha Vantage répond parfois 200 avec un message d'erreur dans le corps.
      if (data.Information || data.Note) throw new Error('Source indisponible');
      if (!data.feed?.length) throw new Error('Flux vide');
      flux = data.feed;
      return flux;
    })();

    // Un échec ne doit pas figer la page : la tentative suivante repart de zéro.
    promesse.catch(() => { promesse = null; });
    return promesse;
  }

  /**
   * Articles correspondant à un ou plusieurs sujets, du plus pertinent au moins
   * pertinent. Sans sujet, on renvoie les plus récents.
   *
   * `langue` restreint à la langue d'origine de l'article ; les deux filtres se
   * combinent, un article devant satisfaire les deux pour être retenu.
   */
  function selection(sujets, { langue = null, limite = 6 } = {}) {
    if (!flux) return [];
    // Un article sans langue déclarée vient d'avant l'ouverture aux sources
    // anglophones : on le considère français plutôt que de le faire disparaître
    // d'un flux servi depuis le cache.
    const base = langue ? flux.filter(a => (a.langue || 'fr') === langue) : flux;

    const vises = [...new Set(sujets)].filter(Boolean);
    if (!vises.length) return base.slice(0, limite);

    return base
      .map(item => {
        // Un article peut relever de plusieurs sujets retenus : on garde son
        // meilleur score, sinon un article générique remonterait devant un
        // article précis simplement parce qu'il coche plusieurs cases.
        const scores = (item.topics || [])
          .filter(t => vises.includes(t.topic))
          .map(t => parseFloat(t.relevance_score) || 0);
        const pertinence = scores.length ? Math.max(...scores) : 0;
        return { item, pertinence };
      })
      .filter(e => e.pertinence >= PERTINENCE_MIN)
      .sort((a, b) => b.pertinence - a.pertinence)
      .slice(0, limite)
      .map(e => e.item);
  }

  /**
   * Traduit les titres (anglais chez Alpha Vantage) via /api/translate.
   * Au mieux : en cas d'échec, les titres d'origine sont renvoyés tels quels.
   */
  async function traduire(items) {
    const titres = items.map(i => i.title || '');
    if (!titres.length) return titres;
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titles: titres, lang: FinanciaI18N.getLang() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.titles) && data.titles.length === titres.length) return data.titles;
      }
    } catch { /* titres d'origine */ }
    return titres;
  }

  function dateLisible(brut) {
    if (!brut || brut.length < 8) return '';
    const d = new Date(`${brut.slice(0, 4)}-${brut.slice(4, 6)}-${brut.slice(6, 8)}T${brut.slice(9, 11)}:${brut.slice(11, 13)}:00`);
    return isNaN(d) ? '' : d.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function carteHtml(item, titre) {
    return `<a class="actu-card" href="${echapper(item.url)}" target="_blank" rel="noopener noreferrer">
      <div class="actu-meta">
        <span class="actu-source">${echapper(item.source || '')}</span>
        <span class="actu-date">${dateLisible(item.time_published)}</span>
      </div>
      <p class="actu-title">${echapper(titre || item.title || '')}</p>
      <span class="actu-link">${FinanciaI18N.t('actus.readArticle')}</span>
    </a>`;
  }

  function rendre(conteneur, items, titres) {
    if (!conteneur) return;
    conteneur.innerHTML = items.map((item, i) => carteHtml(item, titres?.[i])).join('');
  }

  window.FinanciaActus = { TOPICS, charger, selection, traduire, carteHtml, rendre, echapper };
})();
