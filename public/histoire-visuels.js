// ============================================================
// FINANCIA — histoire-visuels.js
// Une illustration par événement de la chronologie.
//
// Dessinées plutôt que photographiées : les images d'époque disponibles en
// ligne sont presque toutes sous droits, et les publier exposerait le site.
// Le trait est donc abstrait, dans la charte noir/violet, et chaque visuel
// raconte le mécanisme de l'événement — une courbe qui s'effondre en 1929, une
// bulle qui éclate en 2000 — plutôt qu'une scène.
//
// Tout est en SVG en ligne : aucun fichier à charger, aucune requête réseau,
// et les couleurs suivent la charte sans dépendre d'un rendu externe.
// ============================================================

(function () {
  // Repères communs, pour que les douze vignettes forment une série et non une
  // collection. Le violet porte le sujet, le rouge la chute, le vert la reprise.
  const V = '#7C3AED';   // violet de marque
  const VC = '#c4b5fd';  // violet clair, pour les détails
  const R = '#f87171';   // baisse
  const G = '#4ade80';   // hausse

  // Le motif seul, à sa taille naturelle. Le dégradé de fond et le quadrillage
  // sont posés en CSS sur le conteneur : les cartes sont bien plus larges que
  // ces 320 px, et faire remplir le SVG recadrait le dessin — la mention
  // « -89 % » de 1929 disparaissait purement et simplement.
  const cadre = (annee, contenu) =>
    `<svg viewBox="0 0 320 110" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">${contenu}</svg>`;

  // Conservé vide : les douze dessins l'appellent, et le quadrillage est
  // désormais dessiné par le CSS du conteneur, à la largeur réelle de la carte.
  const grille = '';

  const VISUELS = {
    // Amsterdam 1602 : les pignons à redents de la ville, et le premier titre échangé.
    1602: cadre(1602, `${grille}
      <g fill="none" stroke="${VC}" stroke-width="2" stroke-linejoin="round">
        <path d="M40 88V52l10-9 10 9v36"/><path d="M70 88V44l11-10 11 10v44"/>
        <path d="M104 88V56l9-8 9 8v32"/>
      </g>
      <g transform="translate(196 30) rotate(-8)">
        <rect width="86" height="56" rx="4" fill="#0e0b16" stroke="${V}" stroke-width="2"/>
        <line x1="12" y1="16" x2="74" y2="16" stroke="${VC}" stroke-width="2" stroke-opacity="0.7"/>
        <line x1="12" y1="28" x2="60" y2="28" stroke="${VC}" stroke-width="2" stroke-opacity="0.45"/>
        <line x1="12" y1="40" x2="68" y2="40" stroke="${VC}" stroke-width="2" stroke-opacity="0.45"/>
      </g>
      <line x1="0" y1="88" x2="320" y2="88" stroke="${V}" stroke-width="2"/>`),

    // 1907 : une file devant un guichet, et la main qui retient la chute.
    1907: cadre(1907, `${grille}
      <path d="M0 76 L60 70 L110 82 L150 58 L190 84 L240 66 L320 74" fill="none" stroke="${R}" stroke-width="2.5"/>
      <g fill="${VC}" fill-opacity="0.75">
        ${[0, 1, 2, 3, 4].map(i => `<circle cx="${58 + i * 26}" cy="34" r="7"/><rect x="${51 + i * 26}" y="43" width="14" height="18" rx="6"/>`).join('')}
      </g>
      <rect x="196" y="22" width="96" height="52" rx="5" fill="#0e0b16" stroke="${V}" stroke-width="2"/>
      <line x1="212" y1="48" x2="276" y2="48" stroke="${V}" stroke-width="3"/>`),

    // 1929 : la chute la plus brutale, en un seul trait.
    1929: cadre(1929, `${grille}
      <path d="M18 26 L70 38 L104 30 L150 62 L196 78 L250 92 L302 98" fill="none" stroke="${R}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M18 26 L70 38 L104 30 L150 62 L196 78 L250 92 L302 98 L302 110 L18 110 Z" fill="${R}" fill-opacity="0.12"/>
      <circle cx="302" cy="98" r="5" fill="${R}"/>
      <text x="292" y="26" text-anchor="end" fill="${R}" font-family="Montserrat,sans-serif" font-size="19" font-weight="800">-89%</text>`),

    // 1971 : le lingot se détache du billet, l'ancrage est rompu.
    1971: cadre(1971, `${grille}
      <g transform="translate(48 34)">
        <path d="M6 0h64l10 34H-4Z" fill="${V}" fill-opacity="0.35" stroke="${VC}" stroke-width="2"/>
      </g>
      <g transform="translate(184 30)">
        <rect width="92" height="52" rx="4" fill="#0e0b16" stroke="${V}" stroke-width="2"/>
        <circle cx="46" cy="26" r="14" fill="none" stroke="${VC}" stroke-width="2"/>
      </g>
      <path d="M138 56 L176 56" stroke="${R}" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="round"/>
      <path d="M150 42 L164 70" stroke="${R}" stroke-width="3" stroke-linecap="round"/>`),

    // 1987 : une seule bougie, verticale, qui dit la journée.
    1987: cadre(1987, `${grille}
      <g stroke="${VC}" stroke-width="2" stroke-opacity="0.5">
        ${[0, 1, 2, 3].map(i => `<line x1="${34 + i * 24}" y1="${38 + i * 3}" x2="${34 + i * 24}" y2="${62 + i * 2}"/>`).join('')}
      </g>
      <line x1="150" y1="14" x2="150" y2="100" stroke="${R}" stroke-width="3"/>
      <rect x="140" y="24" width="20" height="66" fill="${R}" fill-opacity="0.85"/>
      <g stroke="${VC}" stroke-width="2" stroke-opacity="0.3">
        ${[0, 1, 2, 3].map(i => `<line x1="${196 + i * 24}" y1="${72 + i * 2}" x2="${196 + i * 24}" y2="${92}"/>`).join('')}
      </g>`),

    // 1988 : la mise en commun, plusieurs apports vers un même fonds.
    1988: cadre(1988, `${grille}
      <g fill="${VC}" fill-opacity="0.8">
        ${[0, 1, 2, 3, 4].map(i => `<circle cx="${34 + i * 18}" cy="26" r="6"/>`).join('')}
      </g>
      <g fill="none" stroke="${V}" stroke-width="2" stroke-opacity="0.75">
        ${[0, 1, 2, 3, 4].map(i => `<path d="M${34 + i * 18} 34 Q${34 + i * 18} 56 160 62"/>`).join('')}
      </g>
      <rect x="160" y="42" width="118" height="42" rx="8" fill="${V}" fill-opacity="0.28" stroke="${V}" stroke-width="2"/>
      <path d="M176 70 L200 58 L222 64 L244 46 L262 52" fill="none" stroke="${G}" stroke-width="2.5"/>`),

    // 2000 : la bulle éclate, les éclats partent.
    2000: cadre(2000, `${grille}
      <circle cx="132" cy="54" r="34" fill="${V}" fill-opacity="0.2" stroke="${VC}" stroke-width="2" stroke-dasharray="5 7"/>
      <circle cx="122" cy="42" r="7" fill="#fff" fill-opacity="0.22"/>
      <g stroke="${R}" stroke-width="2.5" stroke-linecap="round">
        ${[[176, 30], [186, 54], [176, 78], [92, 18], [70, 54], [92, 92]].map(([x, y]) =>
          `<line x1="${132 + (x - 132) * 0.55}" y1="${54 + (y - 54) * 0.55}" x2="${x}" y2="${y}"/>`).join('')}
      </g>
      <path d="M212 24 L242 46 L268 40 L300 88" fill="none" stroke="${R}" stroke-width="2.5"/>`),

    // 2008 : l'édifice se fissure, les briques cèdent.
    2008: cadre(2008, `${grille}
      <g fill="${V}" fill-opacity="0.22" stroke="${V}" stroke-width="1.5">
        ${[0, 1, 2].map(r => [0, 1, 2, 3].map(c =>
          `<rect x="${52 + c * 42}" y="${34 + r * 20}" width="38" height="17" rx="2"/>`).join('')).join('')}
      </g>
      <path d="M148 30 L134 50 L152 60 L136 82 L150 94" fill="none" stroke="${R}" stroke-width="3" stroke-linecap="round"/>
      <g transform="translate(214 74) rotate(18)"><rect width="38" height="17" rx="2" fill="${R}" fill-opacity="0.5"/></g>
      <line x1="0" y1="96" x2="320" y2="96" stroke="${V}" stroke-width="2"/>`),

    // 2009 : le bloc zéro, et la chaîne qui démarre.
    2009: cadre(2009, `${grille}
      <g fill="none" stroke="${V}" stroke-width="2">
        ${[0, 1, 2, 3].map(i => `<rect x="${44 + i * 62}" y="38" width="44" height="36" rx="5" fill="${V}" fill-opacity="${0.3 - i * 0.06}"/>`).join('')}
        ${[0, 1, 2].map(i => `<line x1="${88 + i * 62}" y1="56" x2="${106 + i * 62}" y2="56" stroke="${VC}"/>`).join('')}
      </g>
      <text x="66" y="62" text-anchor="middle" fill="${VC}" font-family="Montserrat,sans-serif" font-size="17" font-weight="800">0</text>
      <circle cx="270" cy="30" r="12" fill="none" stroke="${G}" stroke-width="2"/>
      <path d="M270 24v12M266 27h8" stroke="${G}" stroke-width="2" stroke-linecap="round"/>`),

    // 2020 : la chute verticale puis le rebond, en V.
    2020: cadre(2020, `${grille}
      <path d="M20 28 L54 34 L92 90 L128 96 L172 62 L228 38 L302 22" fill="none" stroke="${R}" stroke-width="3" stroke-linecap="round"/>
      <path d="M128 96 L172 62 L228 38 L302 22" fill="none" stroke="${G}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="128" cy="96" r="5.5" fill="${R}"/>
      <circle cx="302" cy="22" r="5.5" fill="${G}"/>
      <g stroke="${VC}" stroke-opacity="0.4" stroke-width="1.5" fill="none">
        <circle cx="60" cy="66" r="9"/><circle cx="252" cy="76" r="7"/>
      </g>`),

    // 2021 : la foule pousse une seule valeur, verticalement.
    2021: cadre(2021, `${grille}
      <g fill="${VC}" fill-opacity="0.55">
        ${[0, 1, 2, 3, 4, 5, 6].map(i => `<circle cx="${28 + i * 17}" cy="${92 - (i % 2) * 7}" r="5.5"/>`).join('')}
      </g>
      <path d="M150 98 C176 96 186 60 196 20" fill="none" stroke="${G}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M196 20 l-9 13 h18 z" fill="${G}"/>
      <text x="286" y="42" text-anchor="end" fill="${G}" font-family="Montserrat,sans-serif" font-size="17" font-weight="800">+1600%</text>`),

    // 2022 : la puce et le réseau qui en irradie.
    2022: cadre(2022, `${grille}
      <g transform="translate(118 30)">
        <rect width="60" height="52" rx="8" fill="${V}" fill-opacity="0.3" stroke="${V}" stroke-width="2"/>
        <rect x="16" y="15" width="28" height="22" rx="3" fill="none" stroke="${VC}" stroke-width="2"/>
        <g stroke="${VC}" stroke-width="2" stroke-linecap="round">
          ${[0, 1, 2].map(i => `<line x1="${14 + i * 16}" y1="0" x2="${14 + i * 16}" y2="-9"/><line x1="${14 + i * 16}" y1="52" x2="${14 + i * 16}" y2="61"/>`).join('')}
          ${[0, 1].map(i => `<line x1="0" y1="${17 + i * 18}" x2="-9" y2="${17 + i * 18}"/><line x1="60" y1="${17 + i * 18}" x2="69" y2="${17 + i * 18}"/>`).join('')}
        </g>
      </g>
      <path d="M18 92 L58 84 L96 88 L214 46 L262 34 L302 22" fill="none" stroke="${G}" stroke-width="2.5"/>
      <circle cx="302" cy="22" r="5" fill="${G}"/>`),
  };

  window.FinanciaHistoireVisuels = VISUELS;
})();
