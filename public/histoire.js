// ============================================================
// FINANCIA — histoire.js
// Page "Histoire des marchés" : nav partagée + scroll reveal +
// graphiques SVG interactifs des légendes des marchés.
// Autonome — ne dépend pas de script.js (composants absents ici).
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

// ── Menu mobile (identique au comportement de script.js) ──
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
// Coordonnées de courbe illustratives (viewBox 800x320) — les textes
// (titre, période, labels de points, stats, leçon) viennent de i18n.js
// (histoire.legendCards.{key} / histoire.legendDetails.{key}).
const LEGENDS = {
  apple: {
    icon: '🍎',
    path: 'M20,300 L90,296 L160,284 L230,255 L300,205 L370,175 L430,150 L490,132 L555,95 L600,118 L650,72 L700,42 L740,60 L780,32',
    points: [
      { x: 20,  y: 300 },
      { x: 300, y: 205 },
      { x: 430, y: 150 },
      { x: 555, y: 95  },
      { x: 700, y: 42  },
    ],
  },
  amazon: {
    icon: '📦',
    path: 'M20,300 L90,250 L150,180 L200,120 L235,270 L280,262 L340,235 L400,215 L470,225 L540,175 L610,115 L670,75 L715,95 L780,50',
    points: [
      { x: 20,  y: 300 },
      { x: 200, y: 120 },
      { x: 235, y: 270 },
      { x: 470, y: 225 },
      { x: 670, y: 75  },
    ],
  },
  bitcoin: {
    icon: '🪙',
    path: 'M20,315 L70,313 L160,296 L210,255 L250,300 L340,270 L400,90 L440,235 L500,225 L580,60 L630,215 L700,145 L750,42 L780,58',
    points: [
      { x: 20,  y: 315 },
      { x: 70,  y: 313 },
      { x: 400, y: 90  },
      { x: 440, y: 235 },
      { x: 580, y: 60  },
      { x: 630, y: 215 },
    ],
  },
  sp500: {
    icon: '📊',
    path: 'M20,300 L100,290 L140,262 L165,292 L230,268 L320,222 L360,236 L420,182 L460,142 L505,192 L565,132 L585,178 L625,112 L645,152 L685,72 L722,92 L780,32',
    points: [
      { x: 165, y: 292 },
      { x: 460, y: 142 },
      { x: 585, y: 178 },
      { x: 645, y: 152 },
    ],
  },
  nokia: {
    icon: '📉',
    path: 'M20,280 L100,230 L170,150 L220,80 L280,110 L340,145 L400,165 L450,195 L505,230 L560,258 L620,280 L680,292 L730,297 L780,299',
    points: [
      { x: 220, y: 80  },
      { x: 450, y: 195 },
      { x: 730, y: 297 },
    ],
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
  let activeKey = null;
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
    const card = FinanciaI18N.get('histoire.legendCards.' + key);
    const detailData = FinanciaI18N.get('histoire.legendDetails.' + key);
    if (!data || !card || !detailData) return;
    activeKey = key;

    const points = data.points.map((p, i) => ({ ...p, label: detailData.points[i] }));

    iconEl.textContent = data.icon;
    titleEl.textContent = card.title;
    periodEl.textContent = detailData.period;
    lessonEl.innerHTML = detailData.lesson;

    statsEl.innerHTML = detailData.stats.map(s => `
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

    pointsG.innerHTML = points.map((p, i) => `
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
      const point = points[i];
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
    activeKey = null;
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

  FinanciaI18N.onLangChange(() => {
    if (activeKey && !detail.hidden) renderLegend(activeKey);
  });
})();
