const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const langSelect = $('#langSelect');

const navbar = $('#navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

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
  if (!r.ok) throw new Error('Server error');
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
    } catch {
      bubble.textContent = 'Désolé, une erreur est survenue.';
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
const quizAnswers = {};

function updateQuizBackBtn() {
  const btn = $('#quizBack');
  if (!btn) return;
  const resultVisible = !$('#quiz-result')?.classList.contains('hidden');
  btn.style.display = (quizStep > 1 && !resultVisible) ? '' : 'none';
}

function resetQuiz() {
  quizStep = 1;
  Object.keys(quizAnswers).forEach(k => delete quizAnswers[k]);
  $$('.quiz-opt').forEach(b => b.classList.remove('selected'));
  $$('.quiz-step').forEach(s => s.classList.remove('active'));
  $('#step-1')?.classList.add('active');
  $('#quiz-result')?.classList.add('hidden');
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

const quizAnswerTexts = {};

$$('.quiz-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.name;
    const val = Number(btn.dataset.val);
    $$(`[data-name="${name}"]`).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    quizAnswers[name] = val;
    quizAnswerTexts[name] = btn.dataset.text || btn.textContent.trim();
    setTimeout(() => {
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
    }, 250);
  });
});

function showQuizResult() {
  const exp = quizAnswers.q4 ?? 0;
  const objectif = quizAnswers.q5 ?? 0;
  let niveau, desc, tips;

  if (exp >= 3) {
    niveau = '🎯 Profil Investisseur Actif';
    desc = 'Tu investis déjà régulièrement — passons à l\'optimisation !';
    tips = [
      { icon: '📊', text: 'Explore les ETF sectoriels et les marchés émergents' },
      { icon: '🔄', text: 'Automatise ton DCA pour lisser les points d\'entrée' },
      { icon: '💎', text: 'Optimise ta fiscalité PEA + assurance-vie' },
    ];
  } else if (exp >= 2) {
    niveau = '📚 Profil Intermédiaire';
    desc = 'Tu as déjà une enveloppe — il faut maintenant l\'alimenter efficacement.';
    tips = [
      { icon: '🌍', text: 'Diversifie avec un ETF World en DCA mensuel' },
      { icon: '⚖️', text: 'Équilibre fonds euros et unités de compte' },
      { icon: '📅', text: 'Vise un horizon d\'au moins 5 ans pour profiter des intérêts composés' },
    ];
  } else if (exp >= 1) {
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
      { icon: '💰', text: 'Commence par constituer une épargne de sécurité sur Livret A' },
      { icon: '📖', text: 'Apprends ce qu\'est un ETF World avant tout' },
      { icon: '💬', text: 'Pose tes questions à Financia, sans jugement !' },
    ];
  }

  const objectifTips = {
    0: { icon: '🛡️', text: 'Priorité : 3–6 mois de dépenses sur Livret A ou LDDS avant d\'investir' },
    1: { icon: '🏖️', text: 'Pour la retraite, l\'assurance-vie et le PEA sont tes meilleurs alliés fiscaux' },
    2: { icon: '⚡', text: 'Pour maximiser, mise sur les ETF actions long terme et le DCA régulier' },
    3: { icon: '🏠', text: 'Pour l\'immobilier, définis ton horizon et calibre ton épargne mensuelle' },
  };
  if (objectifTips[objectif]) tips.push(objectifTips[objectif]);
  const resultEl = $('#quiz-result');
  if (!resultEl) return;
  resultEl.innerHTML = `
    <div class="quiz-result-level">${niveau}</div>
    <p class="quiz-result-sub">${desc}</p>
    <div class="quiz-result-tips">
      ${tips.map(t => `<div class="quiz-tip"><span class="quiz-tip-icon">${t.icon}</span><span>${t.text}</span></div>`).join('')}
    </div>
    <button class="btn-primary full" id="quizBilanBtn">📋 Obtenir mon bilan personnalisé →</button>
    <button class="btn-ghost full" id="quizChatBtn">💬 Parler à Financia sur mon niveau →</button>
    <button class="btn-ghost full" id="quizRestartBtn">↩ Recommencer le quiz</button>
  `;
  resultEl.classList.remove('hidden');
  const progress = $('#quizProgress');
  if (progress) progress.style.width = '100%';
  $('#quizBilanBtn')?.addEventListener('click', () => {
    const niveauClean = niveau.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
    const msg = `Voici mon profil complet issu du quiz Financia :
- Âge : ${quizAnswerTexts.q1 ?? '?'}
- Situation professionnelle : ${quizAnswerTexts.q2 ?? '?'}
- Capacité d'épargne mensuelle : ${quizAnswerTexts.q3 ?? '?'}
- Expérience en investissement : ${quizAnswerTexts.q4 ?? '?'}
- Objectif principal : ${quizAnswerTexts.q5 ?? '?'}
- Profil obtenu : ${niveauClean}

Sur la base de ce profil, fais-moi un bilan personnalisé complet et un plan d'action concret étape par étape adapté à ma situation.`;
    if (chatInput) chatInput.value = msg;
    document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => chatForm?.dispatchEvent(new Event('submit')), 600);
  });
  $('#quizChatBtn')?.addEventListener('click', () => {
    document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' });
  });
  $('#quizRestartBtn')?.addEventListener('click', resetQuiz);
  updateQuizBackBtn();
}

window.addEventListener('hashchange', () => {
  if (window.location.hash === '#quiz') resetQuiz();
});

const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

async function loadActus() {
  const grid = $('#actus-grid');
  if (!grid) return;
  try {
    const res = await fetch(
      'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=financial_markets,economy_fiscal&sort=LATEST&limit=6&apikey=N2V6TQUYHXMM4OM0'
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (data.Information || data.Note) throw new Error();
    const items = data.feed?.slice(0, 6);
    if (!items?.length) throw new Error();
    grid.innerHTML = items.map(item => {
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
        <p class="actu-title">${escapeHtml(item.title || '')}</p>
        <span class="actu-link">Lire l'article →</span>
      </a>`;
    }).join('');
  } catch {
    grid.innerHTML = '<p class="actus-error">Actus temporairement indisponibles.</p>';
  }
}

loadActus();