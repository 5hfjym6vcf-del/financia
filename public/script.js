const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Traduit tout le HTML statique déjà présent, révèle la page (anti-FOUC),
// et branche le sélecteur de langue — doit s'exécuter avant tout le reste.
FinanciaI18N.initLang();
const langSelect = $('#langSelect');
function currentLocale() {
  const lang = FinanciaI18N.getLang();
  return lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : lang === 'ru' ? 'ru-RU' : lang === 'de' ? 'de-DE' : 'fr-FR';
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

function mdInline(str) {
  return str
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
}

// Rendu volontairement partiel : la réponse s'affiche dans une petite fenêtre,
// pas dans un document. Les titres deviennent des lignes en gras et les
// tableaux sont aplatis en lignes lisibles, plutôt que de laisser passer du
// Markdown brut ("##", "|---|") comme c'était le cas.
function renderMarkdown(text) {
  // Le modèle glisse parfois de vraies balises HTML dans sa réponse ; une fois
  // échappées elles s'affichaient littéralement ("<br>"). On les neutralise via
  // un séparateur temporaire : dans une ligne de tableau il devient un simple
  // séparateur de cellule, ailleurs il coupe bien la ligne en deux.
  const BR = '';
  const lines = [];
  for (const rawLine of escapeHtml(text).replace(/&lt;br\s*\/?&gt;/gi, BR).split('\n')) {
    if (/^\s*\|.*\|\s*$/.test(rawLine)) lines.push(rawLine.split(BR).join(' · '));
    else lines.push(...rawLine.split(BR));
  }

  const out = [];
  let inList = false;
  const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Traits de séparation et lignes de séparation de tableau : sans objet ici.
    if (/^-{3,}$/.test(line) || /^\|[\s|:-]+\|$/.test(line)) continue;

    if (!line) { closeList(); continue; }

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      closeList();
      out.push(`<p class="md-h">${mdInline(heading[1])}</p>`);
      continue;
    }

    // Ligne de tableau : on conserve le contenu des cellules, séparées par « · ».
    if (/^\|.*\|$/.test(line)) {
      const cells = line.slice(1, -1).split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length) {
        closeList();
        out.push(`<p>${cells.map(mdInline).join(' · ')}</p>`);
      }
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      if (!inList) { out.push('<ul class="md-ul">'); inList = true; }
      out.push(`<li>${mdInline(bullet[1])}</li>`);
      continue;
    }

    closeList();
    out.push(`<p>${mdInline(line)}</p>`);
  }
  closeList();
  return out.join('');
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
    // Codes de langue attendus par l'API de reconnaissance vocale. Sans
    // rec.lang, la dictée retombe sur la locale du navigateur : un visiteur
    // dont le système est en anglais parlait français dans le vide.
    const SPEECH_LANGS = { fr: 'fr-FR', en: 'en-US', es: 'es-ES', ru: 'ru-RU', de: 'de-DE' };

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    let listening = false;
    const setListening = (on) => {
      listening = on;
      micBtn.classList.toggle('listening', on);
      micBtn.setAttribute('aria-pressed', String(on));
    };

    // Les erreurs étaient toutes avalées en silence : micro refusé, rien
    // entendu, réseau indisponible… l'utilisateur cliquait, parlait, et rien
    // ne se passait sans la moindre explication.
    const MSG = {
      'not-allowed': 'chat.micDenied',
      'service-not-allowed': 'chat.micDenied',
      'no-speech': 'chat.micNoSpeech',
      'audio-capture': 'chat.micNoDevice',
    };

    rec.onresult = (e) => {
      const transcript = (e.results?.[0]?.[0]?.transcript || '').trim();
      if (!transcript) return;
      if (chatInput) chatInput.value = transcript;
      chatForm?.dispatchEvent(new Event('submit'));
    };

    rec.onerror = (e) => {
      setListening(false);
      // "aborted" survient quand on arrête volontairement : rien à signaler.
      if (e.error === 'aborted') return;
      addMsg('bot', escapeHtml(FinanciaI18N.t(MSG[e.error] || 'chat.micError')));
    };

    rec.onend = () => setListening(false);

    micBtn.addEventListener('click', () => {
      // Un second appui sur start() lève une InvalidStateError et laissait le
      // bouton apparemment mort : on bascule plutôt en arrêt.
      if (listening) { rec.stop(); return; }
      rec.lang = SPEECH_LANGS[FinanciaI18N.getLang()] || SPEECH_LANGS.fr;
      try {
        rec.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    });
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
        x: { grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: 'rgba(255,255,255,0.45)', font: { size: 11 }, maxTicksLimit: 6 } },
        y: { grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: 'rgba(255,255,255,0.45)', font: { size: 11 }, callback: (v) => Math.round(v / 1000) + 'k€' } }
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

// Icônes SVG du résultat de quiz — mêmes tracé/style que le menu mobile et /histoire.
// QUIZ_TIP_ICONS mappe l'emoji stocké dans i18n.js (utilisé comme simple clé) vers son SVG.
function svg(inner, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
const QUIZ_ICONS = {
  user: svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  coin: svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v12M15 9.5c0-1.5-1.5-2.5-3-2.5s-3 1-3 2.5 1.5 2 3 2.5 3 1 3 2.5-1.5 2.5-3 2.5-3-1-3-2.5"/>'),
  target: svg('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  book: svg('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
  refresh: svg('<path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'),
  chat: svg('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
  globe: svg('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  pieChart: svg('<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>'),
  award: svg('<circle cx="12" cy="8" r="6"/><polyline points="8.21 13.89 7 22 12 19 17 22 15.79 13.88"/>'),
  calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
  bank: svg('<line x1="3" y1="21" x2="21" y2="21"/><line x1="5" y1="21" x2="5" y2="10"/><line x1="9" y1="21" x2="9" y2="10"/><line x1="15" y1="21" x2="15" y2="10"/><line x1="19" y1="21" x2="19" y2="10"/><polygon points="12 3 21 9 3 9"/>'),
  barChart: svg('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'),
  clipboard: svg('<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>'),
  home: svg('<path d="M3 9.5 12 3l9 6.5"/><path d="M5 9v11a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9"/>'),
  hex: svg('<polygon points="12 2 20 7 20 17 12 22 4 17 4 7"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="9" y1="10" x2="15" y2="14"/><line x1="15" y1="10" x2="9" y2="14"/>'),
  share: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'),
};
// Les réponses q2/q4/q5 gardent leur emoji éditorial sur les boutons du quiz ;
// on le retire juste à l'affichage dans le récapitulatif du résultat.
function stripLeadingEmoji(str) {
  // Couvre aussi les séquences ZWJ (ex: 🧑‍💻) et le sélecteur de variation emoji (ex: 🛡️).
  return (str || '').replace(/^(?:\p{Extended_Pictographic}(?:‍\p{Extended_Pictographic})*️?)\s*/u, '');
}

function profileKeyForQuiz() {
  const key = quizAnswerKeys.q4;
  if (key === 'regulier') return 'active';
  if (key === 'peaAv') return 'intermediate';
  if (key === 'livret') return 'saver';
  return 'beginner';
}

// Niveau de pertinence (1=à limiter, 2=à considérer, 3=à privilégier) par profil × type de
// placement. Reste qualitatif (pas d'allocation chiffrée), pédagogique, jamais un conseil précis.
const RECO_LEVELS = {
  beginner: { epargne: 3, bourse: 2, crypto: 1, immobilier: 1 },
  saver: { epargne: 2, bourse: 3, crypto: 1, immobilier: 2 },
  intermediate: { epargne: 2, bourse: 3, crypto: 2, immobilier: 2 },
  active: { epargne: 2, bourse: 3, crypto: 2, immobilier: 3 },
};
// Si l'objectif déclaré (q5) correspond directement à un type, on relève sa pertinence d'un cran.
const RECO_OBJECTIF_BOOST = { securite: 'epargne', retraite: 'bourse', fructifier: 'bourse', immobilier: 'immobilier' };
const RECO_LEVEL_KEYS = { 1: 'limiter', 2: 'considerer', 3: 'privilegier' };

function levelDots(n) {
  return [1, 2, 3].map(i => `<i class="${i <= n ? 'filled' : ''}"></i>`).join('');
}

function buildRecommendations(profileKey) {
  const types = ['epargne', 'bourse', 'crypto', 'immobilier'];
  const icons = { epargne: QUIZ_ICONS.bank, bourse: QUIZ_ICONS.barChart, crypto: QUIZ_ICONS.hex, immobilier: QUIZ_ICONS.home };
  const typeLabels = FinanciaI18N.get('quiz.recoTypes');
  const levelLabels = FinanciaI18N.get('quiz.recoLevels');
  const texts = FinanciaI18N.get('quiz.recoTexts')[profileKey];
  const boostType = RECO_OBJECTIF_BOOST[quizAnswerKeys.q5];
  const objectifDisplay = stripLeadingEmoji(quizAnswerTexts.q5) || '?';

  return types.map(type => {
    let level = RECO_LEVELS[profileKey][type];
    let boosted = false;
    if (type === boostType && level < 3) { level += 1; boosted = true; }
    const levelKey = RECO_LEVEL_KEYS[level];
    let text = texts[type];
    if (boosted) text += FinanciaI18N.t('quiz.recoObjectifBoost', { objectif: objectifDisplay });
    return `
      <div class="reco-card">
        <div class="reco-card-top">
          <span class="reco-icon">${icons[type]}</span>
          <h4 class="reco-type">${typeLabels[type]}</h4>
        </div>
        <div class="reco-level">
          <span class="reco-dots">${levelDots(level)}</span>
          <span class="reco-level-label">${levelLabels[levelKey]}</span>
        </div>
        <p class="reco-text">${text}</p>
      </div>`;
  }).join('');
}

// Diagramme radial : cercle central = profil obtenu, 4 bulles satellites = les 4 dimensions
// du quiz (âge+situation, épargne mensuelle, expérience, objectif), en positions % fixes
// (haut/droite/bas/gauche) pour rester stable quel que soit le texte affiché dans chaque bulle.
function buildProfileDiagram(niveauLabel) {
  const dims = FinanciaI18N.get('quiz.dims');
  const q4ShortMap = FinanciaI18N.get('quiz.q4Short');
  const q5ShortMap = FinanciaI18N.get('quiz.q5Short');
  const nodes = [
    { icon: QUIZ_ICONS.user, label: dims.ageSituation, value: `${quizAnswerTexts.q1 ?? '?'}${FinanciaI18N.t('quiz.profileAgeUnit')} · ${stripLeadingEmoji(quizAnswerTexts.q2) || '?'}` },
    { icon: QUIZ_ICONS.coin, label: dims.epargne, value: `${quizAnswerTexts.q3 ?? '?'}€` },
    { icon: QUIZ_ICONS.award, label: dims.experience, value: q4ShortMap[quizAnswerKeys.q4] || stripLeadingEmoji(quizAnswerTexts.q4) || '?' },
    { icon: QUIZ_ICONS.target, label: dims.objectif, value: q5ShortMap[quizAnswerKeys.q5] || stripLeadingEmoji(quizAnswerTexts.q5) || '?' },
  ];
  const coords = [{ x: 50, y: 12 }, { x: 88, y: 50 }, { x: 50, y: 88 }, { x: 12, y: 50 }];
  const lines = coords.map(c => `<line x1="50" y1="50" x2="${c.x}" y2="${c.y}"/>`).join('');
  const nodesHtml = nodes.map((n, i) => `
    <div class="qpd-node" style="left:${coords[i].x}%;top:${coords[i].y}%;animation-delay:${0.15 + i * 0.08}s">
      <span class="qpd-node-icon">${n.icon}</span>
      <span class="qpd-node-label">${n.label}</span>
      <span class="qpd-node-value">${n.value}</span>
    </div>`).join('');

  return `
    <div class="qpd-wrap">
      <div class="qpd">
        <svg class="qpd-lines" viewBox="0 0 100 100">${lines}</svg>
        <div class="qpd-center"><span class="qpd-center-label">${niveauLabel}</span></div>
        ${nodesHtml}
      </div>
    </div>`;
}

function showQuizResult() {
  const profileKey = profileKeyForQuiz();
  const profile = FinanciaI18N.get('quiz.profiles.' + profileKey);
  const { niveau, desc } = profile;

  const resultEl = $('#quiz-result');
  if (!resultEl) return;
  resultEl.innerHTML = `
    ${buildProfileDiagram(niveau)}
    <p class="quiz-result-sub">${desc}</p>
    <h4 class="reco-title">${FinanciaI18N.t('quiz.recoTitle')}</h4>
    <div class="reco-grid">${buildRecommendations(profileKey)}</div>
    <p class="reco-disclaimer">${FinanciaI18N.t('quiz.recoDisclaimer')}</p>
    <button class="btn-ghost full quiz-share-btn" id="quizShareBtn"><span class="quiz-btn-icon">${QUIZ_ICONS.share}</span><span id="quizShareBtnLabel">${FinanciaI18N.t('quiz.shareBtn')}</span></button>
    <button class="btn-primary full" id="quizPlanBtn"><span class="quiz-btn-icon">${QUIZ_ICONS.clipboard}</span>${FinanciaI18N.t('quiz.planBtn')}</button>
    <button class="btn-ghost full" id="quizRestartBtn"><span class="quiz-btn-icon">${QUIZ_ICONS.refresh}</span>${FinanciaI18N.t('quiz.restartBtn')}</button>
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
  $('#quizShareBtn')?.addEventListener('click', async () => {
    const shareText = FinanciaI18N.t('quiz.shareText', { niveau: stripLeadingEmoji(niveau) });
    const shareUrl = `${window.location.origin}${window.location.pathname}#quiz`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Financia', text: shareText, url: shareUrl }); } catch (e) { /* partage annulé par l'utilisateur */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      const label = $('#quizShareBtnLabel');
      if (label) {
        const original = label.textContent;
        label.textContent = FinanciaI18N.t('quiz.shareCopied');
        setTimeout(() => { label.textContent = original; }, 2000);
      }
    } catch (e) { /* clipboard indisponible */ }
  });
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

// ── Test de connaissances — mode alternatif au quiz de profil ci-dessus.
// Questions tirées au hasard dans public/i18n.js (quiz.knowledge.questions.<niveau>),
// même index de question réutilisé dans les 3 langues pour rester cohérent si
// l'utilisateur change de langue en cours de test.
let quizMode = 'profile';
let knowledgeLevel = null;
let knowledgeQuestionIndices = [];
let knowledgeIndex = 0;
let knowledgeScore = 0;
let knowledgeAnswered = false;
let knowledgeOptionOrder = [];
const KNOWLEDGE_TEST_LENGTH = 6;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getKnowledgePool(level) {
  return FinanciaI18N.get('quiz.knowledge.questions.' + level) || [];
}

function renderKnowledgeLevels() {
  knowledgeLevel = null;
  const body = $('#knowledge-body');
  if (!body) return;
  const levels = ['beginner', 'amateur', 'pro'];
  body.innerHTML = `
    <p class="knowledge-intro-title">${FinanciaI18N.t('quiz.knowledge.introTitle')}</p>
    <p class="knowledge-intro-sub">${FinanciaI18N.t('quiz.knowledge.introSub')}</p>
    <div class="knowledge-level-cards">
      ${levels.map(l => `
        <button class="knowledge-level-card" data-level="${l}">
          <span class="knowledge-level-name">${FinanciaI18N.t('quiz.knowledge.levels.' + l + '.label')}</span>
          <span class="knowledge-level-desc">${FinanciaI18N.t('quiz.knowledge.levels.' + l + '.desc')}</span>
        </button>
      `).join('')}
    </div>
  `;
  $$('.knowledge-level-card', body).forEach(btn => {
    btn.addEventListener('click', () => startKnowledgeTest(btn.dataset.level));
  });
}

function startKnowledgeTest(level) {
  knowledgeLevel = level;
  const pool = getKnowledgePool(level);
  const allIndices = pool.map((_, i) => i);
  knowledgeQuestionIndices = shuffleArray(allIndices).slice(0, Math.min(KNOWLEDGE_TEST_LENGTH, pool.length));
  knowledgeIndex = 0;
  knowledgeScore = 0;
  renderKnowledgeQuestion();
}

function renderKnowledgeQuestion() {
  knowledgeAnswered = false;
  const body = $('#knowledge-body');
  if (!body) return;
  const pool = getKnowledgePool(knowledgeLevel);
  const q = pool[knowledgeQuestionIndices[knowledgeIndex]];
  if (!q) return;
  knowledgeOptionOrder = shuffleArray(q.options.map((_, i) => i));
  const total = knowledgeQuestionIndices.length;
  const pct = (knowledgeIndex / total) * 100;
  body.innerHTML = `
    <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
    <div class="knowledge-q-counter">${FinanciaI18N.t('quiz.knowledge.questionCounter', { current: knowledgeIndex + 1, total })}</div>
    <div class="quiz-q">${q.q}</div>
    <div class="quiz-options">
      ${knowledgeOptionOrder.map(origIdx => `<button class="quiz-opt" data-idx="${origIdx}">${q.options[origIdx]}</button>`).join('')}
    </div>
  `;
  $$('.quiz-opt', body).forEach(btn => {
    btn.addEventListener('click', () => selectKnowledgeAnswer(btn, Number(btn.dataset.idx), q.correct, body));
  });
}

function selectKnowledgeAnswer(btn, chosenIdx, correctIdx, body) {
  if (knowledgeAnswered) return;
  knowledgeAnswered = true;
  $$('.quiz-opt', body).forEach(b => {
    b.disabled = true;
    if (Number(b.dataset.idx) === correctIdx) b.classList.add('correct');
  });
  if (chosenIdx === correctIdx) {
    knowledgeScore++;
  } else {
    btn.classList.add('wrong');
  }
  setTimeout(() => {
    knowledgeIndex++;
    if (knowledgeIndex < knowledgeQuestionIndices.length) {
      renderKnowledgeQuestion();
    } else {
      renderKnowledgeResult();
    }
  }, 900);
}

function renderKnowledgeResult() {
  const body = $('#knowledge-body');
  if (!body) return;
  const total = knowledgeQuestionIndices.length;
  const pct = knowledgeScore / total;
  let feedbackKey = 'encourage';
  if (pct === 1) feedbackKey = 'perfect';
  else if (pct >= 0.7) feedbackKey = 'great';
  else if (pct >= 0.5) feedbackKey = 'good';
  body.innerHTML = `
    <div class="knowledge-result">
      <div class="knowledge-result-score">${knowledgeScore}/${total}</div>
      <p class="quiz-result-sub">${FinanciaI18N.t('quiz.knowledge.feedback.' + feedbackKey)}</p>
      <button class="btn-primary full" id="knowledgeRestartBtn">${FinanciaI18N.t('quiz.knowledge.restartBtn')}</button>
    </div>
  `;
  $('#knowledgeRestartBtn')?.addEventListener('click', renderKnowledgeLevels);
}

// Ré-affiche l'écran courant (niveaux / question / résultat) après un changement
// de langue, sans perdre la progression du test en cours.
function renderKnowledgeCurrent() {
  const body = $('#knowledge-body');
  if (body?.querySelector('.knowledge-result')) { renderKnowledgeResult(); return; }
  if (knowledgeLevel && knowledgeQuestionIndices.length) { renderKnowledgeQuestion(); return; }
  renderKnowledgeLevels();
}

function switchQuizMode(mode) {
  quizMode = mode;
  $('#modeProfileBtn')?.classList.toggle('active', mode === 'profile');
  $('#modeProfileBtn')?.setAttribute('aria-selected', String(mode === 'profile'));
  $('#modeKnowledgeBtn')?.classList.toggle('active', mode === 'knowledge');
  $('#modeKnowledgeBtn')?.setAttribute('aria-selected', String(mode === 'knowledge'));
  $('#profileQuizContainer')?.classList.toggle('hidden', mode !== 'profile');
  $('#knowledgeContainer')?.classList.toggle('hidden', mode !== 'knowledge');
  const titleEl = $('#quizSectionTitle');
  if (titleEl) titleEl.innerHTML = FinanciaI18N.t(mode === 'knowledge' ? 'quiz.knowledge.sectionTitleHtml' : 'quiz.titleHtml');
  if (mode === 'knowledge' && !knowledgeLevel) renderKnowledgeLevels();
}

$('#modeProfileBtn')?.addEventListener('click', () => switchQuizMode('profile'));
$('#modeKnowledgeBtn')?.addEventListener('click', () => switchQuizMode('knowledge'));

FinanciaI18N.onLangChange(() => {
  if (quizMode !== 'knowledge') return;
  const titleEl = $('#quizSectionTitle');
  if (titleEl) titleEl.innerHTML = FinanciaI18N.t('quiz.knowledge.sectionTitleHtml');
  renderKnowledgeCurrent();
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

let lastActusFeed = null;   // flux complet renvoyé par /api/actus (jusqu'à 20 articles)
let lastActusItems = null;  // sous-ensemble actuellement affiché (thème choisi ou "tout")
let lastActusTitles = null;
let lastActusLang = null;
let actusFailed = false;
let currentActusTheme = 'all';

// Un seul appel API couvre tous les thèmes : chaque article Alpha Vantage porte
// un tableau "topics" avec un score de pertinence par sujet. On filtre côté
// client plutôt que de multiplier les requêtes (le quota gratuit est de 25/jour).
const ACTUS_THEME_TOPICS = {
  cryptos: 'blockchain',
  bourse: 'financial_markets',
  matieres: 'energy_transportation',
};
const ACTUS_RELEVANCE_MIN = 0.1;

function pickActusItems(theme) {
  if (!lastActusFeed) return [];
  if (theme === 'all') return lastActusFeed.slice(0, 6);
  const topic = ACTUS_THEME_TOPICS[theme];
  return lastActusFeed
    .map(item => {
      const match = item.topics?.find(t => t.topic === topic);
      return match ? { item, relevance: parseFloat(match.relevance_score) || 0 } : null;
    })
    .filter(entry => entry && entry.relevance >= ACTUS_RELEVANCE_MIN)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 6)
    .map(entry => entry.item);
}

async function applyActusTheme(theme) {
  currentActusTheme = theme;
  $$('.actus-picker-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === theme));

  const grid = $('#actus-grid');
  lastActusItems = pickActusItems(theme);
  if (!lastActusItems.length) {
    if (grid) grid.innerHTML = `<p class="actus-empty">${FinanciaI18N.t('actus.picker.empty')}</p>`;
    return;
  }
  await translateActusTitles();
  renderActus();
}

$$('.actus-picker-btn').forEach(btn => {
  btn.addEventListener('click', () => applyActusTheme(btn.dataset.theme));
});

async function loadActus() {
  const grid = $('#actus-grid');
  if (!grid) return;
  try {
    const res = await fetch('/api/actus');
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (data.Information || data.Note) throw new Error();
    if (!data.feed?.length) throw new Error();
    lastActusFeed = data.feed;
    await applyActusTheme(currentActusTheme);
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
  if (lastActusFeed) {
    await applyActusTheme(currentActusTheme);
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

// ── Avis communauté (lecture seule, alimenté par Google Sheet) ──
(function () {
  const grid = document.getElementById('avisGrid');
  if (!grid) return;

  function starsHtml(n) {
    if (!n) return '';
    return `<span class="avis-stars">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    try {
      return d.toLocaleDateString(currentLocale(), { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ''; }
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
          ${starsHtml(a.note)}
        </div>
        <p class="avis-texte">${a.texte}</p>
        <span class="avis-date">${fmtDate(a.created_at)}</span>
      </div>
    `).join('');
  }

  fetch('/api/avis')
    .then(r => r.json())
    .then(data => renderGrid(Array.isArray(data) ? data : []))
    .catch(() => { grid.innerHTML = `<div class="avis-empty"><div class="avis-empty-sub">${FinanciaI18N.t('avis.loadError')}</div></div>`; });

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

// ── Video showcase (vitrine reels) : swipe/drag + lecture au tap ──
(function () {
  const player = $('#vsPlayer');
  if (!player) return;

  const track    = $('#vsTrack');
  const slides   = $$('.vs-slide', track);
  const videos   = $$('.vs-video', track);
  const playBtns = $$('.vs-play-btn', track);
  const muteBtns = $$('.vs-mute-btn', track);
  const fills    = $$('.vs-bar-fill', player);
  const bars     = $$('.vs-bar', player);
  const prevBtn  = $('#vsPrev');
  const nextBtn  = $('#vsNext');

  const total = slides.length;
  let current = 0;
  let playerWidth = player.offsetWidth;
  let muted = false;

  const playIconSVG  = '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  const pauseIconSVG = '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
  const soundOnIconSVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M18.36 5.64a9 9 0 0 1 0 12.73"/></svg>';
  const soundOffIconSVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';

  function applyMuted() {
    videos.forEach(v => { v.muted = muted; });
    muteBtns.forEach(btn => {
      btn.classList.toggle('muted', muted);
      btn.innerHTML = muted ? soundOffIconSVG : soundOnIconSVG;
      btn.setAttribute('aria-label', FinanciaI18N.t(muted ? 'videoShowcase.unmuteAria' : 'videoShowcase.muteAria'));
    });
  }
  applyMuted();

  muteBtns.forEach(btn => {
    btn.addEventListener('click', () => { muted = !muted; applyMuted(); });
  });

  function pauseVideo(i) {
    videos[i].pause();
    playBtns[i].classList.remove('playing');
    playBtns[i].innerHTML = playIconSVG;
    playBtns[i].setAttribute('aria-label', FinanciaI18N.t('videoShowcase.playAria'));
  }

  function playVideo(i) {
    videos[i].play().then(() => {
      playBtns[i].classList.add('playing');
      playBtns[i].innerHTML = pauseIconSVG;
      playBtns[i].setAttribute('aria-label', FinanciaI18N.t('videoShowcase.pauseAria'));
    }).catch(() => {});
  }

  function pauseAllExcept(idx) {
    videos.forEach((v, i) => { if (i !== idx && !v.paused) pauseVideo(i); });
  }

  function setInstant(el, on) { el.classList.toggle('instant', on); }

  function updateBars() {
    bars.forEach((bar, i) => bar.classList.toggle('active', i === current));
    fills.forEach((fill, i) => {
      if (i < current) { setInstant(fill, true); fill.style.width = '100%'; }
      else if (i > current) { setInstant(fill, true); fill.style.width = '0%'; }
      else { setInstant(fill, false); }
    });
  }

  function updateArrows() {
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
  }

  function goTo(idx) {
    idx = Math.max(0, Math.min(total - 1, idx));
    if (idx !== current) {
      pauseAllExcept(-1);
      current = idx;
    }
    track.style.transform = `translateX(-${current * (100 / total)}%)`;
    updateBars();
    updateArrows();
  }

  videos.forEach((video, i) => {
    video.addEventListener('timeupdate', () => {
      if (i !== current || !video.duration) return;
      fills[i].style.width = (video.currentTime / video.duration * 100) + '%';
    });
    video.addEventListener('ended', () => {
      pauseVideo(i);
      if (i < total - 1) {
        goTo(i + 1);
        pauseAllExcept(i + 1);
        playVideo(i + 1);
      }
    });
    playBtns[i].addEventListener('click', () => {
      if (videos[i].paused) { pauseAllExcept(i); playVideo(i); }
      else pauseVideo(i);
    });
  });

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));

  // Swipe / drag unifié (tactile mobile + souris desktop) via Pointer Events.
  // Le geste n'est classé horizontal (swipe carrousel) vs vertical (scroll de
  // page) qu'après quelques pixels de mouvement, pour ne jamais interrompre
  // un simple scroll de page démarré sur le lecteur.
  let dragging = false;
  let gestureDecided = false;
  let activePointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragDeltaX = 0;
  const DECIDE_THRESHOLD = 8;

  function baseOffsetPercent() { return -(current * (100 / total)); }

  player.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.vs-play-btn') || e.target.closest('.vs-arrow') || e.target.closest('.vs-mute-btn')) return;
    activePointerId = e.pointerId;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragDeltaX = 0;
    gestureDecided = false;
    dragging = false;
    playerWidth = player.offsetWidth;
  });

  player.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activePointerId) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    if (!gestureDecided) {
      if (Math.abs(dx) < DECIDE_THRESHOLD && Math.abs(dy) < DECIDE_THRESHOLD) return;
      gestureDecided = true;
      if (Math.abs(dy) > Math.abs(dx)) {
        // Scroll vertical de la page : on laisse le navigateur gérer, on ne touche à rien.
        return;
      }
      dragging = true;
      track.classList.add('dragging');
      player.classList.add('dragging');
      try { player.setPointerCapture(activePointerId); } catch {}
    }

    if (!dragging) return;
    dragDeltaX = dx;
    const deltaPercent = (dragDeltaX / playerWidth) * (100 / total);
    track.style.transform = `translateX(${baseOffsetPercent() + deltaPercent}%)`;
  });

  function endDrag(e) {
    if (e && e.pointerId !== activePointerId) return;
    const wasDragging = dragging;
    dragging = false;
    gestureDecided = false;
    activePointerId = null;
    track.classList.remove('dragging');
    player.classList.remove('dragging');

    if (!wasDragging) return; // simple tap ou scroll vertical : aucune navigation, on ne coupe rien

    const threshold = playerWidth * 0.18;
    if (Math.abs(dragDeltaX) > threshold) {
      if (dragDeltaX < 0) goTo(current + 1);
      else goTo(current - 1);
    } else {
      goTo(current);
    }
  }

  player.addEventListener('pointerup', endDrag);
  player.addEventListener('pointercancel', endDrag);

  window.addEventListener('resize', () => {
    playerWidth = player.offsetWidth;
    track.style.transform = `translateX(${baseOffsetPercent()}%)`;
  }, { passive: true });

  goTo(0);
})();
