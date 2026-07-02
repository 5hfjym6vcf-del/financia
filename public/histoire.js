// ============================================================
// FINANCIA — histoire.js
// Page "Histoire des marchés" : nav partagée + scroll reveal +
// graphiques SVG interactifs des légendes des marchés.
// Autonome — ne dépend pas de script.js (composants absents ici).
// ============================================================

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ── Nav bar : ombre au scroll ──
const navbar = $('#navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── Menu mobile (identique au comportement de script.js) ──
const menuBtn = $('#menuBtn');
const mobileMenu = $('#mobileMenu');
const menuIconOpen = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
const menuIconClose = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

function closeMobileMenu() {
  mobileMenu?.classList.remove('open');
  if (menuBtn) { menuBtn.innerHTML = menuIconOpen; menuBtn.setAttribute('aria-expanded', 'false'); }
}
menuBtn?.addEventListener('click', () => {
  const isOpen = mobileMenu?.classList.toggle('open');
  menuBtn.innerHTML = isOpen ? menuIconClose : menuIconOpen;
  menuBtn.setAttribute('aria-expanded', String(isOpen));
});
$$('#mobileMenu a').forEach(a => a.addEventListener('click', closeMobileMenu));
window.addEventListener('scroll', closeMobileMenu, { passive: true });

// ── Footer : année ──
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── Scroll reveal (timeline, cartes légendes, cartes leçon) ──
(function () {
  const items = $$('.hist-reveal');
  if (!items.length) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || typeof IntersectionObserver === 'undefined') {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('is-visible'), (i % 4) * 60);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  items.forEach(el => obs.observe(el));
})();

// ============================================================
// Données des "Légendes des marchés"
// Faits vérifiables — coordonnées de courbe illustratives
// (viewBox 800x320), à but strictement pédagogique.
// ============================================================
const LEGENDS = {
  apple: {
    icon: '🍎',
    title: 'Apple',
    period: '1997 → 2026',
    path: 'M20,300 L90,296 L160,284 L230,255 L300,205 L370,175 L430,150 L490,132 L555,95 L600,118 L650,72 L700,42 L740,60 L780,32',
    points: [
      { x: 20,  y: 300, label: '1997 — Apple frôle la faillite, à quelques semaines de trésorerie.' },
      { x: 300, y: 205, label: '2001 — Lancement de l’iPod, premier vrai virage.' },
      { x: 430, y: 150, label: '2007 — Lancement de l’iPhone.' },
      { x: 555, y: 95,  label: '2018 — Apple devient la 1ère entreprise à 1 000 milliards $.' },
      { x: 700, y: 42,  label: '2022 — Pic autour de 3 000 milliards $ de valorisation.' },
    ],
    stats: [
      { n: '1997', l: 'Quasi-faillite' },
      { n: '1 000 Md$', l: 'Valorisation en 2018' },
      { n: '~3 000 Md$', l: 'Pic en 2022' },
    ],
    lesson: 'Leçon : une entreprise en grande difficulté peut se réinventer complètement. Mais miser sur un seul titre reste un pari — c’est pour ça qu’on <strong>diversifie</strong>.',
  },
  amazon: {
    icon: '📦',
    title: 'Amazon',
    period: '1997 → 2026',
    path: 'M20,300 L90,250 L150,180 L200,120 L235,270 L280,262 L340,235 L400,215 L470,225 L540,175 L610,115 L670,75 L715,95 L780,50',
    points: [
      { x: 20,  y: 300, label: '1997 — Introduction en bourse à 18$ l’action.' },
      { x: 200, y: 120, label: '1999 — Sommet de la bulle Internet.' },
      { x: 235, y: 270, label: '2001 — Chute de plus de 90% depuis le pic de la bulle Internet.' },
      { x: 470, y: 225, label: '2008 — Nouvelle chute pendant la crise financière mondiale.' },
      { x: 670, y: 75,  label: '2020 — Le e-commerce explose avec la pandémie.' },
    ],
    stats: [
      { n: '-90%', l: 'Chute 1999-2001' },
      { n: '18$', l: 'Prix d’introduction en 1997' },
      { n: '>1 000 Md$', l: 'Valorisation atteinte depuis' },
    ],
    lesson: 'Leçon : même les plus grandes réussites boursières traversent des chutes vertigineuses. Ceux qui ont vendu en panique en 2001 n’ont jamais vu la suite de l’histoire.',
  },
  bitcoin: {
    icon: '🪙',
    title: 'Bitcoin',
    period: '2009 → 2026',
    path: 'M20,315 L70,313 L160,296 L210,255 L250,300 L340,270 L400,90 L440,235 L500,225 L580,60 L630,215 L700,145 L750,42 L780,58',
    points: [
      { x: 20,  y: 315, label: '2009 — Naissance du Bitcoin, valeur quasi nulle.' },
      { x: 70,  y: 313, label: '2010 — "Bitcoin Pizza Day" : 10 000 BTC échangés contre 2 pizzas.' },
      { x: 400, y: 90,  label: 'Déc. 2017 — Sommet proche de 20 000$.' },
      { x: 440, y: 235, label: '2018 — Chute à environ 3 200$.' },
      { x: 580, y: 60,  label: 'Nov. 2021 — Nouveau sommet, environ 69 000$.' },
      { x: 630, y: 215, label: '2022 — Chute à environ 16 000$.' },
    ],
    stats: [
      { n: '2009', l: 'Genèse' },
      { n: '~69 000$', l: 'Record de nov. 2021' },
      { n: '-77%', l: 'Chute 2021 → 2022' },
    ],
    lesson: 'Leçon : le Bitcoin a déjà perdu 70 à 80% de sa valeur plusieurs fois par cycle. Un actif à très haut risque, à ne détenir qu’avec des sommes qu’on peut se permettre de perdre.',
  },
  sp500: {
    icon: '📊',
    title: 'Le S&P 500',
    period: '~1926 → 2026 (100 ans)',
    path: 'M20,300 L100,290 L140,262 L165,292 L230,268 L320,222 L360,236 L420,182 L460,142 L505,192 L565,132 L585,178 L625,112 L645,152 L685,72 L722,92 L780,32',
    points: [
      { x: 165, y: 292, label: '1929 — Krach de Wall Street.' },
      { x: 460, y: 142, label: '2000 — Éclatement de la bulle Internet.' },
      { x: 585, y: 178, label: '2008 — Crise financière mondiale.' },
      { x: 645, y: 152, label: '2020 — Krach Covid.' },
    ],
    stats: [
      { n: '~10%/an', l: 'Rendement nominal moyen*' },
      { n: '100 ans', l: 'D’historique' },
      { n: '0', l: 'Krach dont l’indice ne s’est jamais remis' },
    ],
    lesson: 'Leçon : sur 100 ans, malgré des dizaines de krachs, l’indice a toujours fini par dépasser ses précédents records. *Dividendes réinvestis, rendement nominal moyen historique.',
  },
  nokia: {
    icon: '📉',
    title: 'Nokia',
    period: '1990 → 2014',
    path: 'M20,280 L100,230 L170,150 L220,80 L280,110 L340,145 L400,165 L450,195 L505,230 L560,258 L620,280 L680,292 L730,297 L780,299',
    points: [
      { x: 220, y: 80,  label: '2000 — Numéro 1 mondial du mobile, pic de valorisation (~250 Md€).' },
      { x: 450, y: 195, label: '2007 — L’iPhone est lancé, Nokia sous-estime la menace.' },
      { x: 730, y: 297, label: '2013 — Vente de la division mobile à Microsoft pour 7,2 milliards $.' },
    ],
    stats: [
      { n: '2000', l: 'N°1 mondial du mobile' },
      { n: '~250 Md€', l: 'Valorisation au pic' },
      { n: '7,2 Md$', l: 'Prix de vente à Microsoft' },
    ],
    lesson: 'Leçon : dominer un marché n’immunise pas contre la disruption — Kodak a vécu un sort très similaire face au numérique. <strong>Rien n’est jamais acquis.</strong>',
  },
};

// ============================================================
// Panneau de détail : graphique SVG interactif
// ============================================================
(function () {
  const grid       = $('#histLegendGrid');
  const detail     = $('#histDetail');
  const closeBtn   = $('#histDetailClose');
  const titleEl    = $('#histDetailTitle');
  const periodEl   = $('#histDetailPeriod');
  const iconEl     = $('#histDetailIcon');
  const pathEl     = $('#histChartPath');
  const fillEl     = $('#histChartFill');
  const pointsG    = $('#histChartPoints');
  const statsEl    = $('#histDetailStats');
  const lessonEl   = $('#histDetailLesson');
  const tooltipEl  = $('#histChartTooltip');
  const chartWrap  = $('.hist-chart-wrap');
  if (!grid || !detail) return;

  let activeCard = null;
  let hideTimer = null;

  function buildFillPath(pathD) {
    // Ferme la courbe vers la base du graphique pour le dégradé de fond.
    return `${pathD} L780,320 L20,320 Z`;
  }

  function showTooltip(point, svgEl) {
    const svgRect = svgEl.getBoundingClientRect();
    const wrapRect = chartWrap.getBoundingClientRect();
    const scaleX = svgRect.width / 800;
    const scaleY = svgRect.height / 320;
    const left = (svgRect.left - wrapRect.left) + point.x * scaleX;
    const top  = (svgRect.top - wrapRect.top) + point.y * scaleY;
    // Si le point est trop près du haut du graphique, la bulle bascule
    // en dessous pour ne pas chevaucher l'en-tête du panneau.
    const flipBelow = top < 90;
    tooltipEl.textContent = point.label;
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
    tooltipEl.classList.toggle('flip-below', flipBelow);
    tooltipEl.hidden = false;
  }

  function hideTooltip() {
    tooltipEl.hidden = true;
  }

  function renderLegend(key) {
    const data = LEGENDS[key];
    if (!data) return;

    iconEl.textContent = data.icon;
    titleEl.textContent = data.title;
    periodEl.textContent = data.period;
    lessonEl.innerHTML = data.lesson;

    statsEl.innerHTML = data.stats.map(s => `
      <div class="hist-stat-chip">
        <span class="n">${s.n}</span>
        <span class="l">${s.l}</span>
      </div>
    `).join('');

    pathEl.setAttribute('d', data.path);
    fillEl.setAttribute('d', buildFillPath(data.path));
    pathEl.style.transition = 'none';
    pathEl.style.strokeDasharray = 'none';
    pathEl.style.strokeDashoffset = '0';

    pointsG.innerHTML = data.points.map((p, i) => `
      <circle class="hist-chart-point-hit" data-i="${i}" cx="${p.x}" cy="${p.y}" r="22"></circle>
      <circle class="hist-chart-point" data-i="${i}" cx="${p.x}" cy="${p.y}" r="6"></circle>
    `).join('');

    // Anime le tracé après insertion dans le DOM visible.
    requestAnimationFrame(() => {
      const len = pathEl.getTotalLength();
      pathEl.style.strokeDasharray = `${len}`;
      pathEl.style.strokeDashoffset = `${len}`;
      // force reflow puis anime
      pathEl.getBoundingClientRect();
      pathEl.style.transition = 'stroke-dashoffset 1.3s cubic-bezier(0.4,0,0.2,1)';
      requestAnimationFrame(() => { pathEl.style.strokeDashoffset = '0'; });
    });

    const svgEl = $('#histChartSvg');
    $$('.hist-chart-point-hit', pointsG).concat($$('.hist-chart-point', pointsG)).forEach(circle => {
      const i = Number(circle.dataset.i);
      const point = data.points[i];
      const twin = () => $$('.hist-chart-point', pointsG)[i];

      circle.addEventListener('mouseenter', () => {
        twin().classList.add('is-active');
        showTooltip(point, svgEl);
      });
      circle.addEventListener('mouseleave', () => {
        twin().classList.remove('is-active');
        hideTooltip();
      });
      circle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = twin().classList.contains('is-active');
        $$('.hist-chart-point', pointsG).forEach(c => c.classList.remove('is-active'));
        if (isActive) { hideTooltip(); return; }
        twin().classList.add('is-active');
        showTooltip(point, svgEl);
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hideTooltip, 4000);
      });
    });
  }

  function openLegend(card) {
    const key = card.dataset.target;
    if (activeCard) activeCard.setAttribute('aria-expanded', 'false');
    activeCard = card;
    card.setAttribute('aria-expanded', 'true');
    renderLegend(key);
    detail.hidden = false;
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function closeDetail() {
    if (activeCard) activeCard.setAttribute('aria-expanded', 'false');
    activeCard = null;
    detail.hidden = true;
    hideTooltip();
  }

  $$('.hist-legend-card', grid).forEach(card => {
    card.addEventListener('click', () => {
      if (card === activeCard) { closeDetail(); return; }
      openLegend(card);
    });
  });

  closeBtn?.addEventListener('click', closeDetail);
})();
