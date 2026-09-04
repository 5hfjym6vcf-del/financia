// ============================================================
// FINANCIA — comparateur.js
// Comparateur d'intérêts composés : livret, compte espèces, ETF.
//
// Les taux et régimes fiscaux viennent de taux-config.js. Rien n'est écrit
// en dur ici, pour que la mise à jour d'un taux réglementé reste un
// changement d'une ligne dans un fichier de configuration.
//
// PARTI PRIS D'AFFICHAGE
// Les trois supports sont présentés dans l'ordre du fichier, jamais triés
// par rendement. Le plus rémunérateur sur le papier n'est pas « le
// meilleur » : il est aussi le seul dont le capital n'est pas garanti.
// Trier par montant reviendrait à recommander, ce que le site ne fait pas.
// D'où aussi la mention « capital garanti » ou non à côté de chaque total.
// ============================================================

(function () {
  const hote = document.getElementById('comparateur');
  if (!hote || !window.FinanciaTaux) return;

  const $ = (s, r = hote) => r.querySelector(s);
  const grille = $('#compResultats');
  const champs = {
    capital: $('#compCapital'),
    mensuel: $('#compMensuel'),
    duree: $('#compDuree'),
  };
  if (!grille || !champs.capital) return;

  const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  const euros = (n) => nf.format(Math.round(n)) + ' €';

  const t = (cle, secours) => {
    const v = window.FinanciaI18N ? window.FinanciaI18N.t(cle) : '';
    return !v || v === cle ? secours : v;
  };

  // Intérêts composés avec versements mensuels, capitalisation annuelle.
  //
  // Le plafond ne bloque pas les versements : il plafonne la part du capital
  // qui produit des intérêts. Verser 500 €/mois sur un Livret A reste
  // possible jusqu'au plafond, au-delà l'argent dort. Modéliser l'inverse
  // (interdire le versement) surestimerait le rendement du livret.
  function projeter(support, capital, mensuel, annees) {
    const taux = support.taux / 100;
    const plafond = support.plafond ?? Infinity;
    let solde = capital;
    let verse = capital;
    let interetsBruts = 0;

    for (let an = 0; an < annees; an++) {
      for (let mois = 0; mois < 12; mois++) {
        solde += mensuel;
        verse += mensuel;
      }
      const assiette = Math.min(solde, plafond);
      const interets = assiette * taux;
      interetsBruts += interets;
      solde += interets;
    }

    const impot = interetsBruts * (support.fiscalite / 100);
    return {
      verse,
      interetsBruts,
      impot,
      interetsNets: interetsBruts - impot,
      final: solde - impot,
      plafondAtteint: plafond !== Infinity && solde > plafond,
    };
  }

  function ligne(support, r, maxFinal) {
    const part = maxFinal > 0 ? Math.max(4, (r.final / maxFinal) * 100) : 0;
    const badge = support.garanti
      ? `<span class="comp-badge comp-badge-sur">${t('comparateur.garanti', 'Capital garanti')}</span>`
      : `<span class="comp-badge comp-badge-risque">${t('comparateur.nonGaranti', 'Capital non garanti')}</span>`;
    const plafond = r.plafondAtteint
      ? `<p class="comp-alerte">${t('comparateur.plafond', 'Plafond de {p} atteint : au-delà, les sommes ne produisent plus d\'intérêts.').replace('{p}', euros(support.plafond))}</p>`
      : '';
    const fisc = support.fiscalite > 0
      ? t('comparateur.apresImpot', 'après {f} % de prélèvements').replace('{f}', String(support.fiscalite).replace('.', ','))
      : t('comparateur.exonere', 'exonéré d\'impôt');

    return `
      <article class="comp-ligne">
        <div class="comp-tete">
          <h4 class="comp-nom">${support.nom}</h4>
          ${badge}
        </div>
        <div class="comp-taux">${String(support.taux).replace('.', ',')} % ${t('comparateur.parAn', 'par an')} · ${fisc}</div>
        <div class="comp-jauge"><i class="${support.garanti ? '' : 'comp-jauge-risque'}" style="width:${part}%"></i></div>
        <div class="comp-final">${euros(r.final)}</div>
        <div class="comp-detail">
          ${t('comparateur.verse', 'Versé')} ${euros(r.verse)} ·
          ${t('comparateur.gains', 'gains nets')} ${euros(r.interetsNets)}
        </div>
        <p class="comp-note">${support.note}</p>
        ${plafond}
        ${cta(support)}
      </article>`;
  }

  // Bouton « Découvrir l'offre ».
  //
  // Deux régimes, et un seul détail les sépare aux yeux de la loi : la
  // mention. Tant que ctaUrl est vide, le bouton mène à une page interne,
  // Financia ne touche rien, et afficher « Lien partenaire » serait faux.
  // Dès que ctaUrl est renseigné, la mention apparaît et le lien porte
  // rel="sponsored", que Google exige sur tout lien rémunéré.
  function cta(support) {
    const affilie = !!(support.ctaUrl && support.ctaUrl.trim());
    const url = affilie ? support.ctaUrl : (support.ctaRepli || '');
    if (!url) return '';

    const libelle = t('comparateur.decouvrir', "Découvrir l'offre");
    const attrs = affilie
      ? ` target="_blank" rel="sponsored nofollow noopener"`
      : '';
    const mention = affilie
      ? `<span class="comp-partenaire">${t('comparateur.lienPartenaire', 'Lien partenaire')}</span>`
      : '';

    return `
      <div class="comp-cta-zone">
        <a class="comp-cta" href="${url}"${attrs}>${libelle}</a>
        ${mention}
      </div>`;
  }

  function calculer() {
    const capital = Math.max(0, Number(champs.capital.value) || 0);
    const mensuel = Math.max(0, Number(champs.mensuel.value) || 0);
    const annees = Math.max(1, Number(champs.duree.value) || 1);

    // Les valeurs courantes s'affichent à côté de chaque curseur.
    $('#compCapitalVal').textContent = euros(capital);
    $('#compMensuelVal').textContent = euros(mensuel) + '/mois';
    $('#compDureeVal').textContent = annees + ' ' + (annees > 1 ? t('comparateur.ans', 'ans') : t('comparateur.an', 'an'));

    const supports = window.FinanciaTaux.supports();
    const resultats = supports.map(s => ({ s, r: projeter(s, capital, mensuel, annees) }));
    const maxFinal = Math.max(...resultats.map(x => x.r.final));

    grille.innerHTML = resultats.map(({ s, r }) => ligne(s, r, maxFinal)).join('');
  }

  Object.values(champs).forEach(c => c.addEventListener('input', calculer));
  if (window.FinanciaI18N) window.FinanciaI18N.onLangChange(calculer);

  // Calcul au chargement : un tiret en guise de résultat ressemble à une
  // panne, en démonstration comme ailleurs.
  calculer();
})();
