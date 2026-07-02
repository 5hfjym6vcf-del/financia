const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const langSelect = $('#langSelect');

const navbar = $('#navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

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

const chatForm = $('#chat-form');
const chatInput = $('#chat-input');
const chatWin = $('#chat-window');

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function addMsg(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  if (role === 'bot') {
    div.innerHTML = `<div class="bot-avatar">F</div><div class="bubble">${text}</div>`;
  } else {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    div.appendChild(bubble);
  }
  chatWin?.appendChild(div);
  if (chatWin) chatWin.scrollTop = chatWin.scrollHeight;
  return div;
}

async function askFinancia(message) {
  const lang = langSelect?.value || 'fr';
  const r = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, lang })
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || 'Désolé, une erreur est survenue.');
  }
  return r.json();
}

if (chatForm) {
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    addMsg('user', msg);
    chatInput.value = '';
    const botDiv = addMsg('bot', '<span class="loading-dots"><span></span><span></span><span></span></span>');
    const bubble = botDiv.querySelector('.bubble');
    try {
      const { text } = await askFinancia(msg);
      bubble.innerHTML = renderMarkdown(text);
    } catch (e) {
      bubble.textContent = e.message || 'Désolé, une erreur est survenue.';
    }
  });
}

$$('.chat-tag').forEach(btn => {
  btn.addEventListener('click', () => {
    if (chatInput) chatInput.value = btn.dataset.q;
    chatForm?.dispatchEvent(new Event('submit'));
    document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' });
  });
});

const micBtn = $('#micBtn');
if (micBtn) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    const rec = new SR();
    rec.onresult = (e) => {
      if (chatInput) chatInput.value = e.results[0][0].transcript;
      chatForm?.dispatchEvent(new Event('submit'));
    };
    rec.onerror = () => {};
    micBtn.addEventListener('click', () => rec.start());
  } else {
    micBtn.style.display = 'none';
  }
}

const overlay = $('#module-answer-overlay');
const overlayContent = $('#module-answer-content');
const closeOverlay = $('#close-overlay');

$$('.ask-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    if (!overlay || !overlayContent) return;
    overlay.classList.remove('hidden');
    overlayContent.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
    try {
      const { text } = await askFinancia(btn.dataset.q);
      overlayContent.innerHTML = renderMarkdown(text);
    } catch {
      overlayContent.textContent = 'Erreur lors du chargement.';
    }
  });
});

closeOverlay?.addEventListener('click', () => overlay?.classList.add('hidden'));
overlay?.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.add('hidden'); });

function fmt(n) { return Math.round(n).toLocaleString('fr-FR') + ' €'; }

function calcSimulator() {
  const capital = Number($('#simCapital')?.value || 0);
  const monthly = Number($('#simMonthly')?.value || 0);
  const years = Number($('#simYears')?.value || 20);
  const rate = Number($('#simRate')?.value || 8) / 100;
  const monthlyRate = rate / 12;
  const months = years * 12;
  let value = capital;
  const data = [capital];
  for (let i = 0; i < months; i++) {
    value = value * (1 + monthlyRate) + monthly;
    if ((i + 1) % 12 === 0) data.push(value);
  }
  const totalInvested = capital + monthly * months;
  const gains = value - totalInvested;
  if ($('#simCapitalVal')) $('#simCapitalVal').textContent = fmt(capital);
  if ($('#simMonthlyVal')) $('#simMonthlyVal').textContent = Math.round(monthly).toLocaleString('fr-FR') + ' €/mois';
  if ($('#simYearsVal')) $('#simYearsVal').textContent = years + ' ans';
  if ($('#simRateVal')) $('#simRateVal').textContent = ($('#simRate')?.value || 8) + '%';
  if ($('#simTotalInvested')) $('#simTotalInvested').textContent = fmt(totalInvested);
  if ($('#simGains')) $('#simGains').textContent = fmt(gains);
  if ($('#simFinal')) $('#simFinal').textContent = fmt(value);
  return { data, years, capital, monthly, rate };
}

let simChart = null;

function renderSimChart({ data }) {
  const canvas = $('#simChart');
  if (!canvas || typeof Chart === 'undefined') return;
  const labels = Array.from({ length: data.length }, (_, i) => `Année ${i}`);
  if (simChart) {
    simChart.data.labels = labels;
    simChart.data.datasets[0].data = data;
    simChart.update();
    return;
  }
  simChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Patrimoine',
        data,
        borderColor: '#7C4DFF',
        backgroundColor: 'rgba(124,77,255,0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#7C4DFF',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9090b0', font: { size: 11 }, maxTicksLimit: 6 } },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9090b0', font: { size: 11 }, callback: (v) => Math.round(v / 1000) + 'k€' } }
      }
    }
  });
}

['#simCapital','#simMonthly','#simYears','#simRate'].forEach(sel => {
  $(sel)?.addEventListener('input', () => { const res = calcSimulator(); renderSimChart(res); });
});

window.addEventListener('DOMContentLoaded', () => { const res = calcSimulator(); renderSimChart(res); });

$('#simAskBtn')?.addEventListener('click', () => {
  const capital = $('#simCapital')?.value || 6000;
  const monthly = $('#simMonthly')?.value || 100;
  const years = $('#simYears')?.value || 20;
  const rate = $('#simRate')?.value || 8;
  const final = $('#simFinal')?.textContent || '';
  const q = `J'ai ${capital}€ de capital, je verse ${monthly}€/mois sur ${years} ans à ${rate}% de rendement. Mon simulateur donne ${final}. Est-ce réaliste et comment optimiser ?`;
  if (chatInput) chatInput.value = q;
  document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => chatForm?.dispatchEvent(new Event('submit')), 600);
});

let quizStep = 1;
const totalSteps = 5;
const quizAnswerTexts = {};

function updateQuizBackBtn() {
  const btn = $('#quizBack');
  if (!btn) return;
  const resultVisible = !$('#quiz-result')?.classList.contains('hidden');
  btn.style.display = (quizStep > 1 && !resultVisible) ? '' : 'none';
}

function advanceQuiz() {
  $(`#step-${quizStep}`)?.classList.remove('active');
  quizStep++;
  const progress = $('#quizProgress');
  if (progress) progress.style.width = `${(quizStep - 1) / totalSteps * 100}%`;
  if (quizStep <= totalSteps) {
    $(`#step-${quizStep}`)?.classList.add('active');
    updateQuizBackBtn();
  } else {
    showQuizResult();
  }
}

function resetQuiz() {
  quizStep = 1;
  Object.keys(quizAnswerTexts).forEach(k => delete quizAnswerTexts[k]);
  $$('.quiz-opt').forEach(b => b.classList.remove('selected'));
  $$('.quiz-step').forEach(s => s.classList.remove('active'));
  $('#step-1')?.classList.add('active');
  $('#quiz-result')?.classList.add('hidden');
  const ageInput = $('#quiz-age');
  if (ageInput) ageInput.value = '';
  const amountInput = $('#quiz-amount');
  if (amountInput) amountInput.value = '';
  const progress = $('#quizProgress');
  if (progress) progress.style.width = '0%';
  updateQuizBackBtn();
}

const quizBody = $('#quiz-body');
if (quizBody) {
  const backBtn = document.createElement('button');
  backBtn.id = 'quizBack';
  backBtn.className = 'quiz-back-btn';
  backBtn.textContent = '← Retour';
  backBtn.style.display = 'none';
  backBtn.addEventListener('click', () => {
    if (quizStep <= 1) return;
    $(`#step-${quizStep}`)?.classList.remove('active');
    quizStep--;
    $(`#step-${quizStep}`)?.classList.add('active');
    const progress = $('#quizProgress');
    if (progress) progress.style.width = `${(quizStep - 1) / totalSteps * 100}%`;
    updateQuizBackBtn();
  });
  quizBody.insertBefore(backBtn, quizBody.firstChild);
}

function shakeInput(input) {
  input?.classList.add('quiz-input-error');
  input?.focus();
  setTimeout(() => input?.classList.remove('quiz-input-error'), 400);
}

$$('.quiz-next').forEach(btn => {
  btn.addEventListener('click', () => {
    const step = Number(btn.dataset.step);
    if (step === 1) {
      const input = $('#quiz-age');
      const v = input?.value?.trim();
      if (!v || isNaN(v) || Number(v) < 1 || Number(v) > 120) { shakeInput(input); return; }
      quizAnswerTexts.q1 = v;
    } else if (step === 3) {
      const input = $('#quiz-amount');
      const v = input?.value?.trim();
      if (v === '' || isNaN(v) || Number(v) < 0) { shakeInput(input); return; }
      quizAnswerTexts.q3 = v;
    }
    advanceQuiz();
  });
});

['#quiz-age', '#quiz-amount'].forEach(sel => {
  $(sel)?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $(`[data-step="${sel === '#quiz-age' ? 1 : 3}"]`)?.click();
  });
});

$$('.quiz-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.name;
    $$(`[data-name="${name}"]`).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    quizAnswerTexts[name] = btn.dataset.text || btn.textContent.trim();
    setTimeout(advanceQuiz, 250);
  });
});

function showQuizResult() {
  const expText = quizAnswerTexts.q4 ?? '';
  let niveau, desc, tips;

  if (expText.includes('régulièrement')) {
    niveau = '🎯 Investisseur Actif';
    desc = 'Tu investis déjà régulièrement — passons à l\'optimisation !';
    tips = [
      { icon: '📊', text: 'Explore les ETF sectoriels et les marchés émergents' },
      { icon: '🔄', text: 'Automatise ton DCA pour lisser les points d\'entrée' },
      { icon: '💎', text: 'Optimise ta fiscalité PEA + assurance-vie' },
    ];
  } else if (expText.includes('PEA') || expText.includes('assurance')) {
    niveau = '📚 Profil Intermédiaire';
    desc = 'Tu as déjà une enveloppe — il faut maintenant l\'alimenter efficacement.';
    tips = [
      { icon: '🌍', text: 'Diversifie avec un ETF World en DCA mensuel' },
      { icon: '⚖️', text: 'Équilibre fonds euros et unités de compte' },
      { icon: '📅', text: 'Vise un horizon d\'au moins 5 ans pour les intérêts composés' },
    ];
  } else if (expText.includes('livret') || expText.includes('Livret') || expText.includes('LDDS')) {
    niveau = '🌱 Profil Épargnant';
    desc = 'Tu épargnes déjà, super ! L\'étape suivante : faire travailler cet argent.';
    tips = [
      { icon: '🏦', text: 'Ouvre un PEA pour investir avec avantages fiscaux' },
      { icon: '📖', text: 'Commence avec un ETF World : simple et diversifié' },
      { icon: '💶', text: 'Garde 3 mois de dépenses sur Livret A, investis le reste' },
    ];
  } else {
    niveau = '🚀 Profil Débutant';
    desc = 'Parfait point de départ — tout le monde commence quelque part !';
    tips = [
      { icon: '💰', text: 'Commence par 3 mois de dépenses sur Livret A' },
      { icon: '📖', text: 'Apprends ce qu\'est un ETF World avant tout' },
      { icon: '💬', text: 'Pose tes questions à Financia, sans jugement !' },
    ];
  }

  const resultEl = $('#quiz-result');
  if (!resultEl) return;
  resultEl.innerHTML = `
    <div class="quiz-result-level">${niveau}</div>
    <p class="quiz-result-sub">${desc}</p>
    <div class="quiz-profile-summary">
      <div class="quiz-profile-line">👤 <strong>${quizAnswerTexts.q1 ?? '?'} ans</strong> · ${quizAnswerTexts.q2 ?? '?'}</div>
      <div class="quiz-profile-line">💶 Épargne mensuelle : <strong>${quizAnswerTexts.q3 ?? '?'} €/mois</strong></div>
      <div class="quiz-profile-line">🎯 Objectif : <strong>${quizAnswerTexts.q5 ?? '?'}</strong></div>
    </div>
    <div class="quiz-result-tips">
      ${tips.map(t => `<div class="quiz-tip"><span class="quiz-tip-icon">${t.icon}</span><span>${t.text}</span></div>`).join('')}
    </div>
    <button class="btn-primary full" id="quizPlanBtn">📋 Obtenir mon plan personnalisé →</button>
    <button class="btn-ghost full" id="quizRestartBtn">↩ Recommencer le quiz</button>
  `;
  resultEl.classList.remove('hidden');
  const progress = $('#quizProgress');
  if (progress) progress.style.width = '100%';
  $('#quizPlanBtn')?.addEventListener('click', () => {
    const msg = `Voici mon profil : j'ai ${quizAnswerTexts.q1 ?? '?'} ans, je suis ${quizAnswerTexts.q2 ?? '?'}, je peux épargner ${quizAnswerTexts.q3 ?? '?'}€/mois, ${quizAnswerTexts.q4 ?? '?'}, mon objectif est ${quizAnswerTexts.q5 ?? '?'}. Fais-moi un plan d'investissement personnalisé et concret.`;
    if (chatInput) chatInput.value = msg;
    document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => chatForm?.dispatchEvent(new Event('submit')), 600);
  });
  $('#quizRestartBtn')?.addEventListener('click', resetQuiz);
  updateQuizBackBtn();
}

window.addEventListener('hashchange', () => {
  if (window.location.hash === '#quiz') resetQuiz();
});

const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();


// ── Hero: SVG chart draw animation ──
(function () {
  const path = document.getElementById('heroChartPath');
  if (!path) return;
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;
  path.getBoundingClientRect();
})();

// ── Hero: stats count-up on scroll ──
(function () {
  const statsEl = document.querySelector('.hero-stats');
  if (!statsEl) return;
  let done = false;

  function animateCount(el, target, suffix, duration) {
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !done) {
      done = true;
      document.querySelectorAll('.hstat-n[data-count]').forEach(el => {
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        animateCount(el, target, suffix, 1500);
      });
    }
  }, { threshold: 0.6 });

  obs.observe(statsEl);
})();

async function loadActus() {
  const grid = $('#actus-grid');
  if (!grid) return;
  try {
    const res = await fetch('/api/actus');
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (data.Information || data.Note) throw new Error();
    const items = data.feed?.slice(0, 6);
    if (!items?.length) throw new Error();

    // Translate titles via Groq (best-effort — fallback to originals on error)
    let titles = items.map(item => item.title || '');
    try {
      const tr = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titles }),
      });
      if (tr.ok) {
        const trData = await tr.json();
        if (Array.isArray(trData.titles) && trData.titles.length === titles.length) {
          titles = trData.titles;
        }
      }
    } catch { /* keep originals */ }

    grid.innerHTML = items.map((item, i) => {
      const raw = item.time_published || '';
      let date = '';
      if (raw.length >= 8) {
        const d = new Date(`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}T${raw.slice(9,11)}:${raw.slice(11,13)}:00`);
        if (!isNaN(d)) date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      return `<a class="actu-card" href="${item.url}" target="_blank" rel="noopener noreferrer">
        <div class="actu-meta">
          <span class="actu-source">${escapeHtml(item.source || '')}</span>
          <span class="actu-date">${date}</span>
        </div>
        <p class="actu-title">${escapeHtml(titles[i] || item.title || '')}</p>
        <span class="actu-link">Lire l'article →</span>
      </a>`;
    }).join('');
  } catch {
    grid.innerHTML = '<p class="actus-error">Actus temporairement indisponibles.</p>';
  }
}

loadActus();

// ── Newsletter ──
(function () {
  const form  = document.getElementById('newsletterForm');
  const input = document.getElementById('newsletterEmail');
  const msg   = document.getElementById('newsletterMsg');
  const btn   = form?.querySelector('.newsletter-btn');
  if (!form) return;

  function showMsg(text, type) {
    msg.textContent = text;
    msg.className = 'newsletter-msg ' + type;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!email) { showMsg('Merci de renseigner ton email.', 'error'); return; }

    btn.disabled = true;
    btn.textContent = 'Inscription…';
    msg.className = 'newsletter-msg hidden';

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        input.value = '';
        if (data.already) {
          showMsg('Tu es déjà inscrit à la newsletter !', 'success');
        } else {
          showMsg('✅ Tu es inscrit ! Rendez-vous vendredi dans ta boîte mail.', 'success');
        }
        btn.textContent = 'Inscrit ✓';
        btn.classList.add('confirmed');
      } else {
        showMsg(data.error || 'Une erreur est survenue.', 'error');
        btn.disabled = false;
        btn.textContent = 'Je m\'inscris';
      }
    } catch {
      showMsg('Erreur réseau. Réessaie dans un instant.', 'error');
      btn.disabled = false;
      btn.textContent = 'Je m\'inscris';
    }
  });
})();

// ── FAQ carousel + free question (moved from inline <script> in index.html) ──
// ── FAQ carousel ──
(function () {
  const FAQ = [
    { q: "Financia est-il vraiment gratuit ?", a: "Oui, 100% gratuit. Pas de frais cachés, pas de pub, pas d'abonnement." },
    { q: "C'est quoi un ETF ?", a: "Un ETF est un panier d'actions que tu achètes en une seule fois. Il te permet d'investir dans des centaines d'entreprises avec un seul produit." },
    { q: "À partir de quel âge peut-on investir ?", a: "Dès 18 ans tu peux ouvrir un PEA ou un CTO seul. Avant 18 ans, avec l'accord de tes parents." },
    { q: "Combien faut-il pour commencer ?", a: "Certaines plateformes permettent d'investir dès 1€. L'important c'est la régularité, pas le montant." },
    { q: "Est-ce que Financia gère mon argent ?", a: "Non. Financia est un site éducatif. Nous t'expliquons comment investir, mais nous ne gérons aucun fonds." },
    { q: "C'est quoi un PEA ?", a: "Le Plan d'Épargne en Actions est un compte qui te permet d'investir en bourse avec une fiscalité avantageuse après 5 ans." },
    { q: "Le chatbot IA est-il fiable ?", a: "Notre IA est conçue pour l'éducation financière. Elle te donne des informations pédagogiques, pas des conseils d'investissement personnalisés." },
    { q: "Quelle différence entre PEA et CTO ?", a: "Le PEA est plafonné à 150 000€ mais moins taxé après 5 ans. Le CTO est illimité mais taxé à 30% (flat tax)." },
  ];

  const track  = document.getElementById('faqTrack');
  const dotsEl = document.getElementById('faqDots');
  const prev   = document.getElementById('faqPrev');
  const next   = document.getElementById('faqNext');
  let cur = 0, timer = null;

  FAQ.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'faq-card';
    card.innerHTML = `<div class="faq-q">${item.q}</div><div class="faq-a">${item.a}</div>`;
    track.appendChild(card);

    const dot = document.createElement('div');
    dot.className = 'faq-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  });

  function goTo(idx) {
    cur = (idx + FAQ.length) % FAQ.length;
    track.style.transform = `translateX(-${cur * (track.parentElement.offsetWidth + 20)}px)`;
    dotsEl.querySelectorAll('.faq-dot').forEach((d, i) => d.classList.toggle('active', i === cur));
  }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(() => goTo(cur + 1), 4000);
  }

  prev.addEventListener('click', () => { goTo(cur - 1); startAuto(); });
  next.addEventListener('click', () => { goTo(cur + 1); startAuto(); });
  startAuto();
})();

// ── FAQ free question ──
(function () {
  const input   = document.getElementById('faqInput');
  const btn     = document.getElementById('faqAskBtn');
  const card    = document.getElementById('faqAnswerCard');
  const powered = document.getElementById('faqPowered');

  async function ask() {
    const q = input.value.trim();
    if (!q) return;
    btn.disabled = true;
    btn.textContent = 'Chargement…';
    card.classList.remove('visible');
    powered.style.display = 'none';

    try {
      const r = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q + ' (réponds en maximum 3 phrases simples)', lang: 'fr' }),
      });
      const data = await r.json();
      card.textContent = data.text || data.error || 'Désolé, une erreur est survenue.';
    } catch {
      card.textContent = 'Désolé, une erreur est survenue. Réessaie dans un instant.';
    }

    card.classList.add('visible');
    powered.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Poser ma question';
  }

  btn.addEventListener('click', ask);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') ask(); });
})();

// ── Avis communauté (moved from inline <script> in index.html) ──
// ── Avis communauté ──
(function () {
  const grid      = document.getElementById('avisGrid');
  const form      = document.getElementById('avisForm');
  const prenomEl  = document.getElementById('avisPrenom');
  const texteEl   = document.getElementById('avisTexte');
  const charCount = document.getElementById('avisCharCount');
  const msgEl     = document.getElementById('avisMsg');
  const submitBtn = document.getElementById('avisSubmit');
  const starPick  = document.getElementById('avisStarPick');
  const starLabel = document.getElementById('avisStarLabel');
  const stars     = starPick.querySelectorAll('span');
  let selectedNote = 0;

  function starsHtml(n) {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return iso; }
  }

  function renderGrid(avis) {
    if (!avis.length) {
      grid.innerHTML = `
        <div class="avis-empty">
          <div class="avis-empty-emoji">💬</div>
          <div class="avis-empty-title">Sois le premier à laisser un avis !</div>
          <div class="avis-empty-sub">Dis-nous ce que tu penses de Financia.</div>
        </div>`;
      return;
    }

    grid.innerHTML = avis.map(a => `
      <div class="avis-card">
        <div class="avis-card-top">
          <span class="avis-prenom">${a.prenom}</span>
          <span class="avis-stars">${starsHtml(a.note)}</span>
        </div>
        <p class="avis-texte">${a.texte}</p>
        <span class="avis-date">${fmtDate(a.created_at)}</span>
      </div>
    `).join('');
  }

  function showMsg(text, type) {
    msgEl.textContent = text;
    msgEl.className = 'avis-msg ' + type;
    msgEl.style.display = 'block';
  }

  // Star picker
  stars.forEach(s => {
    s.addEventListener('mouseenter', () => {
      stars.forEach(x => x.classList.toggle('on', parseInt(x.dataset.v) <= parseInt(s.dataset.v)));
    });
    s.addEventListener('mouseleave', () => {
      stars.forEach(x => x.classList.toggle('on', parseInt(x.dataset.v) <= selectedNote));
    });
    s.addEventListener('click', () => {
      selectedNote = parseInt(s.dataset.v);
      const labels = ['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent'];
      starLabel.textContent = labels[selectedNote];
      stars.forEach(x => x.classList.toggle('on', parseInt(x.dataset.v) <= selectedNote));
    });
  });

  // Char counter
  texteEl.addEventListener('input', () => { charCount.textContent = texteEl.value.length; });

  // Load avis
  fetch('/api/avis')
    .then(r => r.json())
    .then(renderGrid)
    .catch(() => { grid.innerHTML = '<div class="avis-empty">Impossible de charger les avis.</div>'; });

  // Submit
  form.addEventListener('submit', async e => {
    e.preventDefault();
    msgEl.style.display = 'none';
    const prenom = prenomEl.value.trim();
    const texte  = texteEl.value.trim();

    if (!prenom) return showMsg('Veuillez entrer votre prénom.', 'err');
    if (!selectedNote) return showMsg('Veuillez sélectionner une note.', 'err');
    if (!texte) return showMsg('Veuillez écrire un avis.', 'err');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Publication…';

    try {
      const r = await fetch('/api/avis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, note: selectedNote, texte }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erreur serveur');

      showMsg('✅ Merci pour votre avis !', 'ok');
      form.reset();
      selectedNote = 0;
      charCount.textContent = '0';
      starLabel.textContent = 'Cliquez pour noter';
      stars.forEach(x => x.classList.remove('on'));

      // Refresh grid
      fetch('/api/avis').then(r => r.json()).then(renderGrid).catch(() => {});
    } catch (err) {
      showMsg(err.message, 'err');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Publier mon avis';
    }
  });
})();

// ── News widget carousel (moved from inline <script> in index.html) ──
(function () {
  const track   = document.getElementById('newsTrack');
  const dotsEl  = document.getElementById('newsDots');
  const prevBtn = document.getElementById('newsPrev');
  const nextBtn = document.getElementById('newsNext');
  let cards = [];
  let current = 0;
  let autoTimer = null;

  function truncate(str, n) {
    return str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ''; }
  }

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function render(articles) {
    cards = articles.slice(0, 5);
    track.innerHTML = '';
    dotsEl.innerHTML = '';

    cards.forEach((article, i) => {
      const source   = esc(article.source?.name ?? '');
      const date     = esc(formatDate(article.publishedAt ?? ''));
      const headline = esc(truncate(article.title ?? '', 80));
      const url      = article.url ?? '#';

      const card = document.createElement('a');
      card.className = 'news-card';
      card.href = url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.innerHTML = `
        <div class="news-card-meta">
          <span class="news-source">${source}</span>
          <span class="news-date">${date}</span>
          <span class="news-sentiment neu">Finance</span>
        </div>
        <div class="news-headline">${headline}</div>
        <div class="news-card-footer">Lire l'article →</div>
      `;
      track.appendChild(card);

      const dot = document.createElement('div');
      dot.className = 'news-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    });

    goTo(0);
    startAuto();
  }

  function goTo(idx) {
    current = (idx + cards.length) % cards.length;
    const cardWidth = track.parentElement.offsetWidth;
    track.style.transform = `translateX(-${current * (cardWidth + 20)}px)`;
    dotsEl.querySelectorAll('.news-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }

  prevBtn.addEventListener('click', () => { goTo(current - 1); startAuto(); });
  nextBtn.addEventListener('click', () => { goTo(current + 1); startAuto(); });

  fetch('/api/news')
    .then(r => r.json())
    .then(data => {
      const articles = data.articles;
      if (!articles || !articles.length) throw new Error('empty');
      render(articles);
    })
    .catch((err) => {
      console.error('[news widget]', err);
      track.innerHTML = '<div class="news-loading">📊 Actus bientôt disponibles — reviens dans quelques minutes</div>';
    });
})();
