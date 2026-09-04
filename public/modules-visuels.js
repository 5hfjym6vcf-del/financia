// ============================================================
// FINANCIA — modules-visuels.js
// Une illustration par module pédagogique.
//
// Même langage que les visuels de la chronologie : motif dessiné, palette de
// la charte, fond et quadrillage portés par le CSS du conteneur. Chaque dessin
// montre le mécanisme du concept — un seul panier contenant des dizaines de
// titres pour l'ETF, les mêmes titres éclatés en plusieurs paniers pour la
// diversification — plutôt qu'un pictogramme de plus.
//
// Les cartes portaient déjà une icône de 20 px ; il ne s'agit donc pas
// d'ajouter des icônes, mais de donner du corps à des cartes autrement
// purement textuelles.
// ============================================================

(function () {
  const V = '#7C3AED';   // violet de marque
  const VC = '#A78BFA';  // violet clair
  const R = '#f87171';   // baisse, risque
  const G = '#4ade80';   // hausse

  const cadre = contenu =>
    `<svg viewBox="0 0 320 110" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">${contenu}</svg>`;

  // Petit titre répété : sert d'unité visuelle commune à l'ETF, à la
  // diversification et à la gestion d'actifs, pour qu'on lise que c'est la même
  // chose qu'on range différemment.
  const titre = (x, y, c = VC, o = 0.75) =>
    `<rect x="${x}" y="${y}" width="11" height="11" rx="2.5" fill="${c}" fill-opacity="${o}"/>`;

  const panier = (x, y, w, h) =>
    `<path d="M${x} ${y} h${w} l-6 ${h} h-${w - 12} Z" fill="${V}" fill-opacity="0.16" stroke="${V}" stroke-width="2" stroke-linejoin="round"/>`;

  const VISUELS = {
    // Une enveloppe, et l'avantage qui s'ouvre au bout de cinq ans.
    pea: cadre(`
      <g transform="translate(74 26)">
        <rect width="104" height="66" rx="6" fill="${V}" fill-opacity="0.18" stroke="${V}" stroke-width="2"/>
        <path d="M0 6 L52 40 L104 6" fill="none" stroke="${VC}" stroke-width="2"/>
      </g>
      <g transform="translate(198 0)">
        <line x1="0" y1="80" x2="96" y2="80" stroke="${V}" stroke-opacity="0.5" stroke-width="2"/>
        ${[0, 1, 2, 3, 4].map(i => `<line x1="${i * 24}" y1="74" x2="${i * 24}" y2="86" stroke="${V}" stroke-opacity="0.5" stroke-width="2"/>`).join('')}
        <circle cx="96" cy="80" r="7" fill="${G}"/>
        <text x="96" y="60" text-anchor="middle" fill="${G}" font-family="Montserrat,sans-serif" font-size="15" font-weight="800">5 ans</text>
      </g>`),

    // Un seul panier, des dizaines de titres dedans.
    etf: cadre(`
      ${panier(96, 40, 128, 54)}
      <g>${[0, 1, 2, 3, 4, 5].map(i => titre(110 + (i % 3) * 20, 50 + Math.floor(i / 3) * 18)).join('')}
         ${[0, 1, 2, 3, 4, 5].map(i => titre(176 + (i % 3) * 20, 50 + Math.floor(i / 3) * 18)).join('')}</g>
      <g stroke="${VC}" stroke-width="2" stroke-opacity="0.6" stroke-linecap="round">
        ${[0, 1, 2, 3].map(i => `<line x1="${112 + i * 32}" y1="30" x2="${112 + i * 32}" y2="16"/>`).join('')}
      </g>`),

    // Deux compartiments : le socle garanti, la poche qui bouge.
    av: cadre(`
      <g transform="translate(72 34)">
        <rect width="86" height="52" rx="6" fill="${V}" fill-opacity="0.3" stroke="${V}" stroke-width="2"/>
        <line x1="16" y1="34" x2="70" y2="34" stroke="${VC}" stroke-width="3"/>
        <text x="43" y="24" text-anchor="middle" fill="${VC}" font-family="Montserrat,sans-serif" font-size="12" font-weight="700">€</text>
      </g>
      <g transform="translate(180 34)">
        <rect width="68" height="52" rx="6" fill="${V}" fill-opacity="0.1" stroke="${V}" stroke-width="2" stroke-dasharray="5 5"/>
        <path d="M10 40 L22 26 L32 34 L44 16 L58 24" fill="none" stroke="${R}" stroke-width="2.5" stroke-linecap="round"/>
      </g>`),

    // Un bloc dans une chaîne, et une courbe qui part dans tous les sens.
    crypto: cadre(`
      <g fill="none" stroke="${V}" stroke-width="2">
        ${[0, 1, 2].map(i => `<rect x="${74 + i * 50}" y="30" width="38" height="32" rx="5" fill="${V}" fill-opacity="${0.28 - i * 0.07}"/>`).join('')}
        ${[0, 1].map(i => `<line x1="${112 + i * 50}" y1="46" x2="${124 + i * 50}" y2="46" stroke="${VC}"/>`).join('')}
      </g>
      <path d="M68 96 L96 74 L112 92 L138 58 L158 86 L182 62 L210 90 L236 52 L258 70"
            fill="none" stroke="${R}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`),

    // Les mêmes titres, répartis dans plusieurs paniers.
    diversif: cadre(`
      ${[0, 1, 2].map(i => panier(74 + i * 62, 46, 52, 44)).join('')}
      ${[0, 1, 2].map(i => `${titre(86 + i * 62, 56)}${titre(102 + i * 62, 56)}${titre(94 + i * 62, 72)}`).join('')}
      <g stroke="${VC}" stroke-width="2" stroke-opacity="0.55" fill="none">
        ${[0, 1, 2].map(i => `<path d="M160 20 Q${100 + i * 62} 30 ${100 + i * 62} 42"/>`).join('')}
      </g>
      <circle cx="160" cy="18" r="7" fill="${VC}" fill-opacity="0.8"/>`),

    // Plate longtemps, puis elle décolle. Les couches montrent l'accumulation.
    interets: cadre(`
      <path d="M60 92 C130 90 190 80 250 20" fill="none" stroke="${G}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M60 92 C130 90 190 80 250 20 L250 96 L60 96 Z" fill="${G}" fill-opacity="0.1"/>
      <g stroke="${V}" stroke-opacity="0.5" stroke-width="2">
        ${[0, 1, 2, 3, 4].map(i => `<line x1="${76 + i * 40}" y1="96" x2="${76 + i * 40}" y2="${92 - i * i * 3.2}"/>`).join('')}
      </g>
      <line x1="52" y1="96" x2="264" y2="96" stroke="${V}" stroke-width="2"/>
      <circle cx="250" cy="20" r="5.5" fill="${G}"/>`),

    // Un départ très à gauche : c'est la longueur qui compte, pas le montant.
    jeunes: cadre(`
      <line x1="56" y1="70" x2="268" y2="70" stroke="${V}" stroke-opacity="0.5" stroke-width="2"/>
      <circle cx="62" cy="70" r="9" fill="${V}"/>
      <text x="62" y="46" text-anchor="middle" fill="${VC}" font-family="Montserrat,sans-serif" font-size="13" font-weight="800">18</text>
      <g stroke="${V}" stroke-opacity="0.4" stroke-width="2">
        ${[1, 2, 3, 4, 5].map(i => `<line x1="${62 + i * 40}" y1="64" x2="${62 + i * 40}" y2="76"/>`).join('')}
      </g>
      <path d="M62 70 C150 68 210 56 262 26" fill="none" stroke="${G}" stroke-width="3" stroke-linecap="round"/>
      <path d="M262 26 l-12 3 l5 10 z" fill="${G}"/>`),

    // Un glossaire ouvert, quelques entrées mises en avant.
    vocabulaire: cadre(`
      <g transform="translate(80 26)">
        <rect width="160" height="60" rx="6" fill="${V}" fill-opacity="0.14" stroke="${V}" stroke-width="2"/>
        <line x1="80" y1="0" x2="80" y2="60" stroke="${V}" stroke-width="2" stroke-opacity="0.6"/>
        ${[0, 1, 2].map(i => `
          <rect x="12" y="${12 + i * 16}" width="22" height="6" rx="3" fill="${VC}" fill-opacity="0.9"/>
          <rect x="40" y="${12 + i * 16}" width="28" height="6" rx="3" fill="${VC}" fill-opacity="0.35"/>
          <rect x="92" y="${12 + i * 16}" width="20" height="6" rx="3" fill="${VC}" fill-opacity="0.9"/>
          <rect x="118" y="${12 + i * 16}" width="30" height="6" rx="3" fill="${VC}" fill-opacity="0.35"/>`).join('')}
      </g>`),

    // Un fronton, et les deux entreprises qu'il met en relation.
    banqueInvest: cadre(`
      <g transform="translate(126 26)">
        <path d="M34 0 L68 18 H0 Z" fill="${V}" fill-opacity="0.35" stroke="${V}" stroke-width="2" stroke-linejoin="round"/>
        ${[0, 1, 2, 3].map(i => `<rect x="${6 + i * 16}" y="22" width="8" height="34" fill="${V}" fill-opacity="0.25" stroke="${V}" stroke-width="1.5"/>`).join('')}
        <line x1="-4" y1="60" x2="72" y2="60" stroke="${V}" stroke-width="2.5"/>
      </g>
      <g fill="none" stroke="${VC}" stroke-width="2" stroke-opacity="0.7">
        <path d="M118 56 Q92 56 88 44"/><path d="M202 56 Q228 56 232 44"/>
      </g>
      <rect x="66" y="24" width="42" height="26" rx="4" fill="${V}" fill-opacity="0.2" stroke="${V}" stroke-width="2"/>
      <rect x="212" y="24" width="42" height="26" rx="4" fill="${V}" fill-opacity="0.2" stroke="${V}" stroke-width="2"/>`),

    // Beaucoup d'apports, un seul fonds qui les fait travailler.
    gestionActifs: cadre(`
      <g fill="${VC}" fill-opacity="0.8">
        ${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${64 + i * 15}" cy="24" r="5.5"/>`).join('')}
      </g>
      <g fill="none" stroke="${V}" stroke-width="2" stroke-opacity="0.65">
        ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${64 + i * 15} 32 Q${64 + i * 15} 50 168 56"/>`).join('')}
      </g>
      <rect x="168" y="38" width="94" height="40" rx="8" fill="${V}" fill-opacity="0.3" stroke="${V}" stroke-width="2"/>
      <path d="M182 66 L202 56 L220 62 L240 46 L252 52" fill="none" stroke="${G}" stroke-width="2.5" stroke-linecap="round"/>`),
  };

  window.FinanciaModulesVisuels = VISUELS;
})();
