// ============================================================
// FINANCIA — secteurs-ui.js
// Sociétés emblématiques regroupées par secteur, sur la page Marchés.
//
// Placé ici et non dans Apprendre : ce sont des cours de Bourse, la page porte
// déjà l'avertissement sur la nature des données, et l'ajouter à l'accueil
// aurait allongé une page qui compte déjà onze sections.
//
// Présentation strictement classificatoire. Aucun classement, aucune sélection,
// aucune notation : les sociétés sont citées parce qu'elles représentent leur
// secteur. Le texte de chaque secteur décrit une activité, jamais une
// perspective — le site affiche « 0 % conseils perso » et cela l'engage ici.
// ============================================================

(function () {
  const hote = document.getElementById('mktSecteurs');
  if (!hote) return;

  const grille = document.getElementById('mktSecteursGrille');
  let donnees = null;

  function locale() {
    const lang = FinanciaI18N.getLang();
    return lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : lang === 'ru' ? 'ru-RU' : lang === 'de' ? 'de-DE' : 'fr-FR';
  }

  function fmtPrix(v, devise) {
    try {
      return new Intl.NumberFormat(locale(), {
        style: 'currency', currency: devise, maximumFractionDigits: v >= 1000 ? 0 : 2,
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

  function ligneHtml(s) {
    // Une société non cotée est affichée avec la mention plutôt que masquée :
    // l'omettre laisserait croire qu'elle s'échange en Bourse comme les autres.
    if (!s.cotee) {
      return `<li class="sect-ligne sect-ligne-hors">
        <span class="sect-nom">${s.nom}</span>
        <span class="sect-ticker">${FinanciaI18N.t('marches.secteurs.nonCote')}</span>
        <span class="sect-cours"></span>
      </li>`;
    }

    const prix = typeof s.price === 'number' ? fmtPrix(s.price, s.currency) : '···';
    const aVar = typeof s.changePct === 'number';
    const hausse = aVar && s.changePct >= 0;

    return `<li class="sect-ligne">
      <span class="sect-nom">${s.nom}</span>
      <span class="sect-ticker">${s.ticker}</span>
      <span class="sect-cours">${prix}</span>
      ${aVar ? `<span class="sect-var ${hausse ? 'positive' : 'negative'}">${fmtVar(s.changePct)}</span>` : '<span class="sect-var"></span>'}
    </li>`;
  }

  function rendre() {
    if (!donnees || !grille) return;
    grille.innerHTML = donnees.secteurs.map(sec => `
      <article class="sect-carte">
        <h3 class="sect-titre">${FinanciaI18N.t(`marches.secteurs.${sec.cle}.nom`)}</h3>
        <p class="sect-desc">${FinanciaI18N.t(`marches.secteurs.${sec.cle}.desc`)}</p>
        <ul class="sect-liste">${sec.societes.map(ligneHtml).join('')}</ul>
      </article>`).join('');
    hote.hidden = false;
  }

  async function charger() {
    try {
      const r = await fetch('/api/secteurs');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      donnees = await r.json();
      if (!donnees?.secteurs?.length) throw new Error('réponse vide');
      rendre();
    } catch (e) {
      // Section d'appoint : son absence ne doit rien casser sur la page.
      console.error('[secteurs] Échec chargement :', e.message);
      hote.hidden = true;
    }
  }

  charger();
  FinanciaI18N.onLangChange(rendre);
})();
