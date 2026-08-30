// ============================================================
// FINANCIA — communaute.js
// Aperçu de la future page Communauté. Démonstration entièrement locale :
// aucun compte, aucun serveur, aucun message. Le pseudo choisi ne quitte pas
// l'appareil, et les membres affichés sont fabriqués à l'affichage.
//
// Le bandeau d'avertissement en tête de page n'est pas décoratif : sans lui,
// des effectifs et des pseudos crédibles laisseraient croire à une communauté
// réelle. Il ne doit pas être retiré tant que la fonctionnalité n'existe pas.
// ============================================================

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

FinanciaI18N.initLang();

// ── Socle commun aux pages secondaires ─────────────────────
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

const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── Stockage local ─────────────────────────────────────────
// Même principe que les favoris : versionné, et toute lecture ou écriture
// protégée, sessionStorage et localStorage levant en navigation privée sur
// certains navigateurs. Un aperçu ne doit jamais faire tomber la page.
const CLE = 'financia.communaute';

function lireEtat() {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return { v: 1, pseudo: '', groupe: '' };
    const o = JSON.parse(brut);
    return { v: 1, pseudo: String(o.pseudo || ''), groupe: String(o.groupe || '') };
  } catch { return { v: 1, pseudo: '', groupe: '' }; }
}
function ecrireEtat(etat) {
  try { localStorage.setItem(CLE, JSON.stringify({ ...etat, v: 1, maj: new Date().toISOString() })); } catch {}
}

let etat = lireEtat();

// ── Groupes ────────────────────────────────────────────────
// Effectifs figés et non tirés au sort : un nombre qui change à chaque
// rechargement se remarque immédiatement et décrédibilise la démonstration.
// Les intitulés ne décrivent que des thèmes, jamais une orientation.
const GROUPES = [
  { cle: 'bourse',  icone: '📈', membres: 127 },
  { cle: 'crypto',  icone: '🪙', membres: 84  },
  { cle: 'matieres', icone: '🥇', membres: 56 },
];

// Pseudos fabriqués par assemblage : deux listes neutres et un nombre. Aucun
// prénom ni patronyme, pour qu'aucun membre affiché ne puisse être confondu
// avec une personne réelle.
const ADJECTIFS = ['Curieux', 'Tranquille', 'Patient', 'Discret', 'Malin', 'Serein', 'Rapide', 'Calme', 'Futé', 'Zen'];
const ANIMAUX   = ['Panda', 'Renard', 'Hibou', 'Loutre', 'Castor', 'Faucon', 'Lynx', 'Koala', 'Héron', 'Blaireau', 'Marmotte', 'Écureuil'];

// Générateur déterministe : à partir de la clé du groupe, la liste reste la
// même d'une visite à l'autre. Une liste qui se réécrit à chaque rechargement
// trahirait la simulation aussi sûrement qu'un effectif changeant.
function graine(texte) {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) { h ^= texte.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function suite(depart) {
  let x = depart || 1;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}

function pseudosFictifs(cleGroupe, combien) {
  const alea = suite(graine(cleGroupe));
  const vus = new Set();
  const out = [];
  // Garde-fou : sans plafond d'essais, une combinaison épuisée boucherait la
  // page indéfiniment.
  for (let essais = 0; out.length < combien && essais < 200; essais++) {
    const nom = ANIMAUX[Math.floor(alea() * ANIMAUX.length)]
              + ADJECTIFS[Math.floor(alea() * ADJECTIFS.length)]
              + (10 + Math.floor(alea() * 89));
    if (!vus.has(nom)) { vus.add(nom); out.push(nom); }
  }
  return out;
}


// Le compteur porte sa propre mention « exemple ». Le bandeau de chantier en
// tête de page ne suffit pas ici : un effectif est une métrique d'adoption,
// c'est le chiffre qu'un lecteur retient et cite. Il doit se démentir
// lui-même, à l'endroit où on le lit.
function compteurHtml(n, grand) {
  const taille = grand ? ' com-membres-grand' : '';
  return `<span class="com-membres${taille}">${FinanciaI18N.t('communaute.membres').replace('{n}', n)}`
       + `<span class="com-membres-ex">${FinanciaI18N.t('communaute.exemple')}</span></span>`;
}

// ── Rendu ──────────────────────────────────────────────────
const ecranPseudo = $('#comPseudo');
const ecranGroupes = $('#comGroupes');
const ecranGroupe = $('#comGroupe');
const grilleGroupes = $('#comGrilleGroupes');
const champPseudo = $('#comChampPseudo');
const erreurPseudo = $('#comErreurPseudo');

function montrer(etape) {
  if (ecranPseudo)  ecranPseudo.hidden  = etape !== 'pseudo';
  if (ecranGroupes) ecranGroupes.hidden = etape !== 'groupes';
  if (ecranGroupe)  ecranGroupe.hidden  = etape !== 'groupe';
}

function rendreGroupes() {
  if (!grilleGroupes) return;
  grilleGroupes.innerHTML = GROUPES.map(g => `
    <article class="com-carte" data-groupe="${g.cle}">
      <div class="com-carte-haut">
        <span class="com-icone" aria-hidden="true">${g.icone}</span>
        ${compteurHtml(g.membres)}
      </div>
      <h3 class="com-carte-titre">${FinanciaI18N.t('communaute.groupes.' + g.cle + '.nom')}</h3>
      <p class="com-carte-sujets">${FinanciaI18N.t('communaute.groupes.' + g.cle + '.sujets')}</p>
      <button type="button" class="btn-primary com-rejoindre" data-rejoindre="${g.cle}">
        ${FinanciaI18N.t('communaute.rejoindre')}
      </button>
    </article>`).join('');

  $$('[data-rejoindre]', grilleGroupes).forEach(b => {
    b.addEventListener('click', () => {
      etat.groupe = b.dataset.rejoindre;
      ecrireEtat(etat);
      rendreGroupe();
      montrer('groupe');
      ecranGroupe?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function rendreGroupe() {
  const g = GROUPES.find(x => x.cle === etat.groupe);
  if (!g || !ecranGroupe) return;

  $('#comGroupeIcone').textContent = g.icone;
  $('#comGroupeNom').textContent = FinanciaI18N.t('communaute.groupes.' + g.cle + '.nom');
  $('#comGroupeSujets').textContent = FinanciaI18N.t('communaute.groupes.' + g.cle + '.sujets');
  $('#comGroupeMembres').innerHTML = compteurHtml(g.membres, true);

  const liste = $('#comListeMembres');
  // Le pseudo choisi apparaît en tête et marqué, pour que la démonstration
  // montre l'utilisateur dans le groupe plutôt qu'une liste anonyme.
  const moi = `<li class="com-membre com-membre-moi">
      <span class="com-avatar" aria-hidden="true">${(etat.pseudo[0] || '?').toUpperCase()}</span>
      <span class="com-membre-nom">${echapper(etat.pseudo)}</span>
      <span class="com-badge-moi">${FinanciaI18N.t('communaute.cestToi')}</span>
    </li>`;
  const autres = pseudosFictifs(g.cle, 8).map(n => `
    <li class="com-membre">
      <span class="com-avatar" aria-hidden="true">${n[0]}</span>
      <span class="com-membre-nom">${n}</span>
    </li>`).join('');
  liste.innerHTML = moi + autres;
}

// Échappement : le pseudo vient d'un champ libre et se retrouve dans du HTML.
// Sans cela, une saisie contenant des chevrons s'exécuterait.
function echapper(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function validerPseudo(valeur) {
  const v = valeur.trim();
  if (v.length < 2 || v.length > 20) return 'communaute.erreurLongueur';
  return null;
}

$('#comFormPseudo')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const cle = validerPseudo(champPseudo.value);
  if (cle) {
    erreurPseudo.textContent = FinanciaI18N.t(cle);
    erreurPseudo.hidden = false;
    champPseudo.focus();
    return;
  }
  erreurPseudo.hidden = true;
  etat.pseudo = champPseudo.value.trim();
  ecrireEtat(etat);
  rendreGroupes();
  montrer('groupes');
});

// Repartir de zéro : utile en démonstration pour rejouer le parcours devant
// quelqu'un sans vider le stockage à la main.
// Deux boutons mènent au même point de départ : « Changer de pseudo » depuis
// l'écran des groupes, « Recommencer » depuis l'aperçu d'un groupe.
['#comRecommencer', '#comChangerPseudo'].forEach(sel => $(sel)?.addEventListener('click', () => {
  etat = { v: 1, pseudo: '', groupe: '' };
  ecrireEtat(etat);
  if (champPseudo) champPseudo.value = '';
  montrer('pseudo');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}));

$('#comChangerGroupe')?.addEventListener('click', () => {
  rendreGroupes();
  montrer('groupes');
});

// ── Liste d'attente ────────────────────────────────────────
// Branchée sur /api/newsletter, l'endpoint qui alimente déjà la liste Mailjet :
// pas de second point d'entrée à maintenir, et une seule liste de diffusion
// donc un seul consentement. Le texte au-dessus du champ le dit explicitement,
// sinon on collecterait une adresse pour un usage et on s'en servirait pour un
// autre.
(function () {
  const form = $('#comFormAttente');
  if (!form) return;
  const champ = $('#comEmail');
  const btn = $('#comBtnAttente');
  const msg = $('#comMsgAttente');

  function afficher(texte, type) {
    msg.textContent = texte;
    msg.className = 'com-msg com-msg-' + type;
    msg.hidden = false;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = champ.value.trim();
    // Validation minimale côté client : l'endpoint revalide de toute façon,
    // mais un aller-retour réseau pour une adresse vide est inutile.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      afficher(FinanciaI18N.t('newsletter.errEmail'), 'erreur');
      champ.focus();
      return;
    }
    btn.disabled = true;
    btn.textContent = FinanciaI18N.t('newsletter.btnLoading');
    try {
      const r = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (r.ok) {
        champ.value = '';
        afficher(FinanciaI18N.t(data.already ? 'communaute.attenteDeja' : 'communaute.attenteSucces'), 'succes');
        btn.textContent = FinanciaI18N.t('newsletter.btnConfirmed');
      } else {
        afficher(data.error || FinanciaI18N.t('newsletter.genericErr'), 'erreur');
        btn.disabled = false;
        btn.textContent = FinanciaI18N.t('communaute.attenteBtn');
      }
    } catch {
      afficher(FinanciaI18N.t('newsletter.networkErr'), 'erreur');
      btn.disabled = false;
      btn.textContent = FinanciaI18N.t('communaute.attenteBtn');
    }
  });
})();

function demarrer() {
  if (etat.pseudo && etat.groupe && GROUPES.some(g => g.cle === etat.groupe)) {
    rendreGroupe();
    montrer('groupe');
  } else if (etat.pseudo) {
    rendreGroupes();
    montrer('groupes');
  } else {
    montrer('pseudo');
  }
}

demarrer();

// Au changement de langue, seul l'écran affiché a besoin d'être réécrit : les
// deux autres le seront à leur prochaine ouverture.
FinanciaI18N.onLangChange(() => {
  if (ecranGroupes && !ecranGroupes.hidden) rendreGroupes();
  if (ecranGroupe && !ecranGroupe.hidden) rendreGroupe();
});
