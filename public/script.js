const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Traduit tout le HTML statique déjà présent, révèle la page (anti-FOUC),
// et branche le sélecteur de langue — doit s'exécuter avant tout le reste.
FinanciaI18N.initLang();
const langSelect = $('#langSelect');
function currentLocale() {
  const lang = FinanciaI18N.getLang();
  return lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR';
}

const navbar = $('#navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

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
    throw new Error(data.error || FinanciaI18N.t('chat.genericError'));
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
      bubble.textContent = e.message || FinanciaI18N.t('chat.genericError');
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
      overlayContent.textContent = FinanciaI18N.t('modules.overlayError');
    }
  });
});

closeOverlay?.addEventListener('click', () => overlay?.classList.add('hidden'));
overlay?.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.add('hidden'); });

function fmt(n) { return Math.round(n).toLocaleString(currentLocale()) + ' €'; }

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
  if ($('#simMonthlyVal')) $('#simMonthlyVal').textContent = Math.round(monthly).toLocaleString(currentLocale()) + FinanciaI18N.t('simulator.perMonthSuffix');
  if ($('#simYearsVal')) $('#simYearsVal').textContent = years + FinanciaI18N.t('simulator.yearsSuffix');
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
FinanciaI18N.onLangChange(() => calcSimulator());

$('#simAskBtn')?.addEventListener('click', () => {
  const capital = $('#simCapital')?.value || 6000;
  const monthly = $('#simMonthly')?.value || 100;
  const years = $('#simYears')?.value || 20;
  const rate = $('#simRate')?.value || 8;
  const final = $('#simFinal')?.textContent || '';
  const q = FinanciaI18N.t('simulator.chatPrompt', { capital, monthly, years, rate, final });
  if (chatInput) chatInput.value = q;
  document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => chatForm?.dispatchEvent(new Event('submit')), 600);
});

let quizStep = 1;
const totalSteps = 5;
const quizAnswerTexts = {};
const quizAnswerKeys = {};

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
  Object.keys(quizAnswerKeys).forEach(k => delete quizAnswerKeys[k]);
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
  backBtn.textContent = FinanciaI18N.t('quiz.backBtn');
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
    quizAnswerTexts[name] = btn.textContent.trim();
    quizAnswerKeys[name] = btn.dataset.key;
    setTimeout(advanceQuiz, 250);
  });
});

function profileKeyForQuiz() {
  const key = quizAnswerKeys.q4;
  if (key === 'regulier') return 'active';
  if (key === 'peaAv') return 'intermediate';
  if (key === 'livret') return 'saver';
  return 'beginner';
}

function showQuizResult() {
  const profile = FinanciaI18N.get('quiz.profiles.' + profileKeyForQuiz());
  const { niveau, desc, tips } = profile;

  const resultEl = $('#quiz-result');
  if (!resultEl) return;
  resultEl.innerHTML = `
    <div class="quiz-result-level">${niveau}</div>
    <p class="quiz-result-sub">${desc}</p>
    <div class="quiz-profile-summary">
      <div class="quiz-profile-line">👤 <strong>${quizAnswerTexts.q1 ?? '?'}${FinanciaI18N.t('quiz.profileAgeUnit')}</strong> · ${quizAnswerTexts.q2 ?? '?'}</div>
      <div class="quiz-profile-line">💶 ${FinanciaI18N.t('quiz.profileEpargneLabel')}<strong>${quizAnswerTexts.q3 ?? '?'}${FinanciaI18N.t('simulator.perMonthSuffix')}</strong></div>
      <div class="quiz-profile-line">🎯 ${FinanciaI18N.t('quiz.profileObjectifLabel')}<strong>${quizAnswerTexts.q5 ?? '?'}</strong></div>
    </div>
    <div class="quiz-result-tips">
      ${tips.map(t => `<div class="quiz-tip"><span class="quiz-tip-icon">${t.icon}</span><span>${t.text}</span></div>`).join('')}
    </div>
    <button class="btn-primary full" id="quizPlanBtn">${FinanciaI18N.t('quiz.planBtn')}</button>
    <button class="btn-ghost full" id="quizRestartBtn">${FinanciaI18N.t('quiz.restartBtn')}</button>
  `;
  resultEl.classList.remove('hidden');
  const progress = $('#quizProgress');
  if (progress) progress.style.width = '100%';
  $('#quizPlanBtn')?.addEventListener('click', () => {
    const msg = FinanciaI18N.t('quiz.chatPlanPrompt', {
      age: quizAnswerTexts.q1 ?? '?',
      situation: quizAnswerTexts.q2 ?? '?',
      amount: quizAnswerTexts.q3 ?? '?',
      experience: quizAnswerTexts.q4 ?? '?',
      objectif: quizAnswerTexts.q5 ?? '?',
    });
    if (chatInput) chatInput.value = msg;
    document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => chatForm?.dispatchEvent(new Event('submit')), 600);
  });
  $('#quizRestartBtn')?.addEventListener('click', resetQuiz);
  updateQuizBackBtn();
}

FinanciaI18N.onLangChange(() => {
  updateQuizBackBtn();
  const backBtn = $('#quizBack');
  if (backBtn) backBtn.textContent = FinanciaI18N.t('quiz.backBtn');
  if (!$('#quiz-result')?.classList.contains('hidden')) showQuizResult();
});

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

let lastActusItems = null;
let lastActusTitles = null;
let lastActusLang = null;
let actusFailed = false;

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
    lastActusItems = items;
    await translateActusTitles();
    renderActus();
  } catch {
    actusFailed = true;
    grid.innerHTML = `<p class="actus-error">${FinanciaI18N.t('actus.errorMsg')}</p>`;
  }
}

// Traduit les titres (issus d'Alpha Vantage, en anglais) via Groq — best-effort,
// retombe sur les titres originaux en cas d'erreur.
async function translateActusTitles() {
  if (!lastActusItems) return;
  const lang = FinanciaI18N.getLang();
  const titles = lastActusItems.map(item => item.title || '');
  lastActusTitles = titles;
  lastActusLang = lang;
  try {
    const tr = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titles, lang }),
    });
    if (tr.ok) {
      const trData = await tr.json();
      if (Array.isArray(trData.titles) && trData.titles.length === titles.length) {
        lastActusTitles = trData.titles;
      }
    }
  } catch { /* keep originals */ }
}

function renderActus() {
  const grid = $('#actus-grid');
  if (!grid || !lastActusItems) return;
  grid.innerHTML = lastActusItems.map((item, i) => {
    const raw = item.time_published || '';
    let date = '';
    if (raw.length >= 8) {
      const d = new Date(`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}T${raw.slice(9,11)}:${raw.slice(11,13)}:00`);
      if (!isNaN(d)) date = d.toLocaleDateString(currentLocale(), { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return `<a class="actu-card" href="${item.url}" target="_blank" rel="noopener noreferrer">
      <div class="actu-meta">
        <span class="actu-source">${escapeHtml(item.source || '')}</span>
        <span class="actu-date">${date}</span>
      </div>
      <p class="actu-title">${escapeHtml(lastActusTitles[i] || item.title || '')}</p>
      <span class="actu-link">${FinanciaI18N.t('actus.readArticle')}</span>
    </a>`;
  }).join('');
}

loadActus();
FinanciaI18N.onLangChange(async () => {
  if (lastActusItems && lastActusLang !== FinanciaI18N.getLang()) {
    await translateActusTitles();
  }
  if (lastActusItems) {
    renderActus();
  } else if (actusFailed) {
    const grid = $('#actus-grid');
    if (grid) grid.innerHTML = `<p class="actus-error">${FinanciaI18N.t('actus.errorMsg')}</p>`;
  }
});

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
    if (!email) { showMsg(FinanciaI18N.t('newsletter.errEmail'), 'error'); return; }

    btn.disabled = true;
    btn.textContent = FinanciaI18N.t('newsletter.btnLoading');
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
        showMsg(FinanciaI18N.t(data.already ? 'newsletter.alreadySub' : 'newsletter.successSub'), 'success');
        btn.textContent = FinanciaI18N.t('newsletter.btnConfirmed');
        btn.classList.add('confirmed');
      } else {
        showMsg(data.error || FinanciaI18N.t('newsletter.genericErr'), 'error');
        btn.disabled = false;
        btn.textContent = FinanciaI18N.t('newsletter.btn');
      }
    } catch {
      showMsg(FinanciaI18N.t('newsletter.networkErr'), 'error');
      btn.disabled = false;
      btn.textContent = FinanciaI18N.t('newsletter.btn');
    }
  });
})();

// ── FAQ carousel + free question (moved from inline <script> in index.html) ──
// ── FAQ carousel ──
(function () {
  const track  = document.getElementById('faqTrack');
  const dotsEl = document.getElementById('faqDots');
  const prev   = document.getElementById('faqPrev');
  const next   = document.getElementById('faqNext');
  let cur = 0, timer = null, faqLen = 0;

  function buildCards() {
    const FAQ = FinanciaI18N.get('faq.items') || [];
    faqLen = FAQ.length;
    track.innerHTML = '';
    dotsEl.innerHTML = '';
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
    cur = 0;
    goTo(0);
  }

  function goTo(idx) {
    cur = (idx + faqLen) % faqLen;
    track.style.transform = `translateX(-${cur * (track.parentElement.offsetWidth + 20)}px)`;
    dotsEl.querySelectorAll('.faq-dot').forEach((d, i) => d.classList.toggle('active', i === cur));
  }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(() => goTo(cur + 1), 4000);
  }

  prev.addEventListener('click', () => { goTo(cur - 1); startAuto(); });
  next.addEventListener('click', () => { goTo(cur + 1); startAuto(); });
  buildCards();
  startAuto();
  FinanciaI18N.onLangChange(buildCards);
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
    btn.textContent = FinanciaI18N.t('faq.askBtnLoading');
    card.classList.remove('visible');
    powered.style.display = 'none';

    try {
      const r = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q + ' (réponds en maximum 3 phrases simples)', lang: FinanciaI18N.getLang() }),
      });
      const data = await r.json();
      card.textContent = data.text || data.error || FinanciaI18N.t('faq.errAnswer');
    } catch {
      card.textContent = FinanciaI18N.t('faq.errAnswerRetry');
    }

    card.classList.add('visible');
    powered.style.display = 'block';
    btn.disabled = false;
    btn.textContent = FinanciaI18N.t('faq.askBtn');
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
      return new Date(iso).toLocaleDateString(currentLocale(), { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return iso; }
  }

  let lastAvis = [];

  function renderGrid(avis) {
    lastAvis = avis;
    if (!avis.length) {
      grid.innerHTML = `
        <div class="avis-empty">
          <div class="avis-empty-emoji"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
          <div class="avis-empty-title">${FinanciaI18N.t('avis.emptyTitle')}</div>
          <div class="avis-empty-sub">${FinanciaI18N.t('avis.emptySub')}</div>
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
      const labels = FinanciaI18N.get('avis.starLabels');
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
    .catch(() => { grid.innerHTML = `<div class="avis-empty">${FinanciaI18N.t('avis.loadError')}</div>`; });

  // Submit
  form.addEventListener('submit', async e => {
    e.preventDefault();
    msgEl.style.display = 'none';
    const prenom = prenomEl.value.trim();
    const texte  = texteEl.value.trim();

    if (!prenom) return showMsg(FinanciaI18N.t('avis.errPrenom'), 'err');
    if (!selectedNote) return showMsg(FinanciaI18N.t('avis.errNote'), 'err');
    if (!texte) return showMsg(FinanciaI18N.t('avis.errTexte'), 'err');

    submitBtn.disabled = true;
    submitBtn.textContent = FinanciaI18N.t('avis.submitting');

    try {
      const r = await fetch('/api/avis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, note: selectedNote, texte }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || FinanciaI18N.t('avis.errGeneric'));

      showMsg(FinanciaI18N.t('avis.successMsg'), 'ok');
      form.reset();
      selectedNote = 0;
      charCount.textContent = '0';
      starLabel.textContent = FinanciaI18N.t('avis.clickToRate');
      stars.forEach(x => x.classList.remove('on'));

      // Refresh grid
      fetch('/api/avis').then(r => r.json()).then(renderGrid).catch(() => {});
    } catch (err) {
      showMsg(err.message, 'err');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = FinanciaI18N.t('avis.submitBtn');
    }
  });

  FinanciaI18N.onLangChange(() => renderGrid(lastAvis));
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
      return d.toLocaleDateString(currentLocale(), { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ''; }
  }

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  let lastArticles = null;

  function render(articles) {
    if (articles) lastArticles = articles;
    cards = lastArticles.slice(0, 5);
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
          <span class="news-sentiment neu">${FinanciaI18N.t('newsWidget.sentimentTag')}</span>
        </div>
        <div class="news-headline">${headline}</div>
        <div class="news-card-footer">${FinanciaI18N.t('newsWidget.readArticle')}</div>
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

  let newsFailed = false;

  fetch('/api/news')
    .then(r => r.json())
    .then(data => {
      const articles = data.articles;
      if (!articles || !articles.length) throw new Error('empty');
      render(articles);
    })
    .catch((err) => {
      console.error('[news widget]', err);
      newsFailed = true;
      track.innerHTML = `<div class="news-loading">${FinanciaI18N.t('newsWidget.comingSoon')}</div>`;
    });

  FinanciaI18N.onLangChange(() => {
    if (lastArticles) render();
    else if (newsFailed) track.innerHTML = `<div class="news-loading">${FinanciaI18N.t('newsWidget.comingSoon')}</div>`;
  });
})();
