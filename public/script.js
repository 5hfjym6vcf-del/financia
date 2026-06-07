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

function addMsg(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  if (role === 'bot') {
    div.innerHTML = `<div class="bot-avatar">F</div><div class="bubble">${text}</div>`;
  } else {
    div.innerHTML = `<div class="bubble">${text}</div>`;
  }
  chatWin?.appendChild(div);
  if (chatWin) chatWin.scrollTop = chatWin.scrollHeight;
  return div;
}

async function askFinancia(message) {
  const lang = langSelect?.value || 'fr';
  const r = await fetch('/ask', {
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
      bubble.innerHTML = text.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
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
      overlayContent.innerHTML = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
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
  if ($('#simMonthlyVal')) $('#simMonthlyVal').textContent = monthly + ' €/mois';
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

$$('.quiz-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.name;
    const val = Number(btn.dataset.val);
    $$(`[data-name="${name}"]`).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    quizAnswers[name] = val;
    setTimeout(() => {
      $(`#step-${quizStep}`)?.classList.remove('active');
      quizStep++;
      const progress = $('#quizProgress');
      if (progress) progress.style.width = `${(quizStep - 1) / totalSteps * 100}%`;
      if (quizStep <= totalSteps) {
        $(`#step-${quizStep}`)?.classList.add('active');
      } else {
        showQuizResult();
      }
    }, 250);
  });
});

function showQuizResult() {
  const score = Object.values(quizAnswers).reduce((a, b) => a + b, 0);
  const pct = score / (totalSteps * 2);
  let niveau, desc, tips;
  if (pct >= 0.7) {
    niveau = '🎯 Niveau Avancé';
    desc = 'Tu maîtrises les bases, passe à la pratique !';
    tips = [
      { icon: '📊', text: 'Explore les ETF sectoriels et les marchés émergents' },
      { icon: '🔄', text: 'Mets en place un DCA automatique mensuel' },
      { icon: '💎', text: 'Optimise ta fiscalité PEA + assurance-vie' },
    ];
  } else if (pct >= 0.4) {
    niveau = '📚 Niveau Intermédiaire';
    desc = 'Bonnes bases, continue à apprendre !';
    tips = [
      { icon: '🌍', text: 'Commence par un ETF World pour te diversifier' },
      { icon: '🏦', text: 'Ouvre un PEA si ce n\'est pas encore fait' },
      { icon: '📅', text: 'Vise un horizon d\'au moins 5 ans' },
    ];
  } else {
    niveau = '🌱 Niveau Débutant';
    desc = 'Parfait, tout le monde commence quelque part !';
    tips = [
      { icon: '📖', text: 'Commence par comprendre ce qu\'est un ETF World' },
      { icon: '💰', text: 'Épargne d\'abord 3 mois de dépenses sur un Livret A' },
      { icon: '💬', text: 'Pose tes questions à Financia, sans jugement !' },
    ];
  }
  const resultEl = $('#quiz-result');
  if (!resultEl) return;
  resultEl.innerHTML = `
    <div class="quiz-result-level">${niveau}</div>
    <p class="quiz-result-sub">${desc}</p>
    <div class="quiz-result-tips">
      ${tips.map(t => `<div class="quiz-tip"><span class="quiz-tip-icon">${t.icon}</span><span>${t.text}</span></div>`).join('')}
    </div>
    <button class="btn-primary full" onclick="document.getElementById('chat').scrollIntoView({behavior:'smooth'})">💬 Parler à Financia sur mon niveau →</button>
  `;
  resultEl.classList.remove('hidden');
  const progress = $('#quizProgress');
  if (progress) progress.style.width = '100%';
}

const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();