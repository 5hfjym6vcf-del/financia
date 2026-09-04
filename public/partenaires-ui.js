// ============================================================
// FINANCIA — partenaires-ui.js
// Rend les emplacements partenaires à partir de partenaires-config.js.
//
// Deux composants, quatre emplacements :
//   [data-partenaires="<categorie>"]  → cartes (sous le simulateur, encadrés
//                                       dans les contenus pédagogiques)
//   [data-partenaires-tableau]        → comparatif de /ressources
//
// Rien n'est écrit en dur ici : sans données dans la configuration, le
// module s'arrête à la première ligne et les emplacements restent vides.
// C'est ce qui permet de laisser les balises en place dans les pages
// pendant que les conventions se signent.
//
// TROIS RÈGLES NON NÉGOCIABLES, appliquées par le code et non par la
// vigilance de celui qui remplira la configuration :
//
//  1. Toute sortie porte rel="sponsored nofollow noopener". « sponsored »
//     est ce que Google attend d'un lien rémunéré ; sans lui, le site
//     s'expose à une pénalité pour échange de liens, ce qui coûterait plus
//     cher que ne rapporte l'affiliation.
//  2. Tout bloc porte une mention « Lien affilié » visible, jamais repliée
//     ni en survol. C'est l'obligation de transparence de l'article
//     L.121-4 du code de la consommation, et de la loi du 9 juin 2023.
//  3. Aucun classement, aucune note, aucun superlatif. L'ordre est celui du
//     fichier de configuration, et il est annoncé comme tel.
// ============================================================

(function () {
  const P = window.FinanciaPartenaires;
  if (!P || !P.estActif()) return;

  const t = (cle, secours) => {
    const v = window.FinanciaI18N ? window.FinanciaI18N.t(cle) : '';
    // t() renvoie la clé elle-même quand elle est absente : on préfère le
    // texte de secours à un « partenaires.affilie » affiché au visiteur.
    return !v || v === cle ? secours : v;
  };

  const echappe = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // Pastille « Lien affilié », identique partout.
  function mention() {
    return `<span class="part-mention">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      ${echappe(t('partenaires.mention', 'Lien affilié'))}
    </span>`;
  }

  // Ligne d'honnêteté commune : ordre non hiérarchique + date de contrôle.
  function note(fiches) {
    const le = P.verifieLe(fiches);
    const ordre = echappe(t('partenaires.ordre', "Présentés dans un ordre qui ne constitue pas un classement. Financia perçoit une commission si tu ouvres un compte via ces liens, sans surcoût pour toi."));
    if (!le) return `<p class="part-note">${ordre}</p>`;
    const d = new Date(le);
    const jolie = isNaN(d) ? le : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const verif = echappe(t('partenaires.verifie', 'Données vérifiées le {d}.')).replace('{d}', jolie);
    return `<p class="part-note">${ordre} ${verif}</p>`;
  }

  function lien(p, libelle) {
    return `<a class="part-cta" href="${echappe(p.url)}" target="_blank" rel="sponsored nofollow noopener">
      ${echappe(libelle)}<span aria-hidden="true">↗</span>
      <span class="sr-only"> — ${echappe(p.nom)}, ${echappe(t('partenaires.nouvelOnglet', 'nouvel onglet, lien affilié'))}</span>
    </a>`;
  }

  // ── Composant 1 : cartes ──────────────────────────────────────────────

  function carte(p) {
    // Initiales plutôt qu'un logo distant : un logo hébergé chez le
    // partenaire disparaît le jour où la convention s'arrête, et charge une
    // requête vers un tiers sans consentement.
    const ini = p.nom.replace(/[^A-Za-zÀ-ÿ ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(m => m[0]).join('').toUpperCase();
    const bouts = [];
    if (p.fait)     bouts.push(`<p class="part-fait">${echappe(p.fait)}</p>`);
    if (p.prime)    bouts.push(`<p class="part-prime">${echappe(p.prime)}</p>`);
    if (p.depotMin) bouts.push(`<p class="part-detail">${echappe(t('partenaires.depotMin', 'Dépôt minimum'))} : ${echappe(p.depotMin)}</p>`);
    return `<article class="part-carte">
      <div class="part-carte-tete">
        <span class="part-logo" aria-hidden="true">${echappe(ini)}</span>
        <h4 class="part-nom">${echappe(p.nom)}</h4>
      </div>
      ${bouts.join('')}
      ${lien(p, t('partenaires.ouvrir', 'Découvrir'))}
    </article>`;
  }

  document.querySelectorAll('[data-partenaires]').forEach(hote => {
    const categorie = hote.getAttribute('data-partenaires');
    const fiches = P.pour(categorie);
    if (!fiches.length) return;

    const titre = hote.getAttribute('data-partenaires-titre')
      || t('partenaires.titreDefaut', 'Où ouvrir ce type de compte ?');

    hote.classList.add('part-bloc');
    hote.innerHTML = `
      <div class="part-bloc-tete">
        <h3 class="part-bloc-titre">${echappe(titre)}</h3>
        ${mention()}
      </div>
      <div class="part-cartes">${fiches.map(carte).join('')}</div>
      ${note(fiches)}`;
  });

  // ── Composant 2 : tableau comparatif ──────────────────────────────────

  // true → oui, false → non, null/undefined → non vérifié, cellule neutre.
  function cellule(v) {
    if (v === true)  return `<span class="part-oui" role="img" aria-label="${echappe(t('partenaires.oui', 'disponible'))}">●</span>`;
    if (v === false) return `<span class="part-non" role="img" aria-label="${echappe(t('partenaires.non', 'non disponible'))}">–</span>`;
    return `<span class="part-inconnu" role="img" aria-label="${echappe(t('partenaires.inconnu', 'non vérifié'))}">·</span>`;
  }

  document.querySelectorAll('[data-partenaires-tableau]').forEach(hote => {
    const fiches = P.toutes();
    if (!fiches.length) return;

    const th = (cle, secours) => `<th scope="col">${echappe(t(cle, secours))}</th>`;

    hote.classList.add('part-bloc');
    hote.innerHTML = `
      <div class="part-bloc-tete">
        <h3 class="part-bloc-titre">${echappe(t('partenaires.comparatifTitre', 'Comparatif des plateformes & outils'))}</h3>
        ${mention()}
      </div>
      <div class="part-table-boite">
        <table class="part-table">
          <thead><tr>
            ${th('partenaires.colPlateforme', 'Plateforme')}
            ${th('partenaires.colFraisOrdre', 'Frais par ordre')}
            ${th('partenaires.colFraisGestion', 'Frais de gestion')}
            <th scope="col">PEA</th><th scope="col">CTO</th><th scope="col">PER</th>
            ${th('partenaires.colDepot', 'Dépôt min.')}
            ${th('partenaires.colDepositaire', 'Dépositaire')}
            <th scope="col"><span class="sr-only">${echappe(t('partenaires.colLien', 'Accès'))}</span></th>
          </tr></thead>
          <tbody>
            ${fiches.map(p => {
              const c = p.comptes || {};
              return `<tr>
                <th scope="row" class="part-td-nom">${echappe(p.nom)}</th>
                <td>${echappe(p.fraisOrdre || '—')}</td>
                <td>${echappe(p.fraisGestion || '—')}</td>
                <td class="part-td-c">${cellule(c.pea)}</td>
                <td class="part-td-c">${cellule(c.cto)}</td>
                <td class="part-td-c">${cellule(c.per)}</td>
                <td>${echappe(p.depotMin || '—')}</td>
                <td>${echappe(p.depositaire || '—')}</td>
                <td class="part-td-lien">${lien(p, t('partenaires.acceder', 'Accéder'))}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <p class="part-legende">
        ${echappe(t('partenaires.legende', '● disponible · – non disponible · · non vérifié'))}
      </p>
      ${note(fiches)}`;
  });

})();
