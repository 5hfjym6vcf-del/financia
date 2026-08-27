// ============================================================
// FINANCIA — marches.js
// Page "Analyse de marché" : nav partagée + cartes d'actifs avec
// mini-graphiques (Lightweight Charts). Autonome — ne dépend pas
// de script.js (composants absents ici).
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

// ── Menu mobile (identique au comportement de script.js / histoire.js) ──
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

// ============================================================
// Marchés : chargement des données + rendu des cartes
//
// Catalogue, gabarit de carte, graphiques et cœurs viennent de actifs-ui.js,
// partagé avec la page « Mes favoris » qui affiche exactement les mêmes cartes.
// Ne reste ici que ce qui est propre à cette page : le découpage par région,
// les classements et le calendrier des résultats.
// ============================================================
const { REGIONS, ORDRE: ASSET_ORDER } = FinanciaActifs;

let lastData = null; // dernière réponse /api/marches obtenue avec succès

function renderUpdatedText() {
  const wrap = $('#mktUpdated');
  const el = $('#mktUpdatedText');
  if (!wrap || !el || !lastData) return;
  const minutes = Math.max(0, Math.round((Date.now() - lastData.updatedAt) / 60000));
  el.textContent = minutes < 1
    ? FinanciaI18N.t('marches.updatedJustNow')
    : FinanciaI18N.t('marches.updatedAgo', { min: minutes });
  wrap.hidden = false;
}

function regionHtml(region, assets) {
  return `<div class="mkt-region">
    <h3 class="mkt-region-title"><span class="mkt-region-flag">${region.flag}</span>${FinanciaI18N.t('marches.regions.' + region.key)}</h3>
    <div class="mkt-grid">${assets.map(FinanciaActifs.carteHtml).join('')}</div>
  </div>`;
}

// ── Zones affichées ──
// Puces multi-sélection, sur le modèle du sélecteur « L'actu qu'il te faut »
// de la page d'accueil. Aucune zone retenue signifie « toutes ».
//
// Le filtre s'applique au rendu, jamais en masquant des régions déjà tracées :
// un mini-graphique construit dans un conteneur masqué naît avec une largeur
// nulle et le reste, puisqu'il ne serait plus redimensionné qu'au prochain
// changement de fenêtre.
const NOTICE_ZONES = 'zones-astuce';

function zonesRetenues() {
  const choisies = FinanciaFavoris.zones();
  return choisies.length ? REGIONS.filter(r => choisies.includes(r.key)) : REGIONS;
}

function renderZones() {
  const hote = $('#mktZones');
  if (!hote) return;
  const choisies = FinanciaFavoris.zones();
  const tout = choisies.length === 0;

  const puce = (cle, libelle, actif, drapeau) => `
    <button type="button" class="mkt-zone-btn${actif ? ' active' : ''}" data-zone="${cle}" aria-pressed="${actif}">
      ${drapeau ? `<span aria-hidden="true">${drapeau}</span>` : ''}${libelle}
    </button>`;

  // Les zones retenues sont rappelées dans le libellé : sur mobile la rangée
  // de puces défile horizontalement, et une puce active peut se trouver hors
  // de l'écran. Le résumé garde l'état lisible sans avoir à faire défiler.
  const resume = choisies.length
    ? ` · ${zonesRetenues().map(r => FinanciaI18N.t('marches.regions.' + r.key)).join(', ')}`
    : '';

  // Une phrase pour dire à quoi servent les puces, retirée définitivement dès
  // le premier clic : passé ce geste, le fonctionnement est acquis et la
  // répéter à chaque visite encombrerait la page pour rien.
  const astuce = FinanciaFavoris.noticeEcartee(NOTICE_ZONES)
    ? ''
    : `<p class="mkt-zones-astuce">${FinanciaI18N.t('marches.zones.astuce')}</p>`;

  hote.innerHTML = `
    <div class="mkt-zones-tete">
      <span class="mkt-zones-label">${FinanciaI18N.t('marches.zones.label')}<span class="mkt-zones-resume">${resume}</span></span>
      ${astuce}
    </div>
    <div class="mkt-zones-btns">
      ${puce('', FinanciaI18N.t('marches.zones.tout'), tout, '')}
      ${REGIONS.map(r => puce(r.key, FinanciaI18N.t('marches.regions.' + r.key), choisies.includes(r.key), r.flag)).join('')}
    </div>`;
}

$('#mktZones')?.addEventListener('click', e => {
  const btn = e.target.closest('.mkt-zone-btn');
  if (!btn) return;
  // « Tout » compte autant qu'une région : dans les deux cas le visiteur vient
  // de manipuler le filtre, donc l'astuce a fait son office.
  FinanciaFavoris.ecarterNotice(NOTICE_ZONES);
  if (btn.dataset.zone === '') FinanciaFavoris.reinitialiserZones();
  else FinanciaFavoris.basculerZone(btn.dataset.zone);
  renderZones();
  renderGrid();
});

function renderGrid() {
  const grid = $('#mktGrid');
  if (!grid || !lastData) return;

  const available = ASSET_ORDER.filter(a => lastData.assets[a.key]);
  if (!available.length) {
    grid.innerHTML = `<p class="mkt-error">${FinanciaI18N.t('marches.errorMsg')}</p>`;
    return;
  }

  FinanciaActifs.detruireGraphes();

  const populatedRegions = zonesRetenues()
    .map(region => ({ region, assets: region.assets.filter(a => lastData.assets[a.key]) }))
    .filter(r => r.assets.length);

  // Cas rare mais possible : les zones retenues sont justement celles dont la
  // source n'a rien renvoyé. Mieux vaut le dire que d'afficher une page nue.
  if (!populatedRegions.length) {
    grid.innerHTML = `<p class="mkt-error">${FinanciaI18N.t('marches.zones.vide')}</p>`;
    renderNoticeStockage();
    renderLienFavoris();
    renderUpdatedText();
    return;
  }

  grid.innerHTML = populatedRegions.map(({ region, assets }) => regionHtml(region, assets)).join('');
  FinanciaActifs.remplirCartes(grid, lastData.assets);
  renderNoticeStockage();
  renderLienFavoris();
  renderUpdatedText();
}

// ── Avis sur la fragilité du stockage ──
// Les favoris vivent dans le navigateur, et certains navigateurs les effacent
// après quelques jours sans visite. Le dire est une question de loyauté : sans
// ça, l'utilisateur constate la perte sans jamais comprendre pourquoi.
// Affiché seulement une fois le premier favori posé (avant, l'avertissement ne
// parlerait de rien), et jamais dans l'app installée, qui n'est pas concernée.
const NOTICE_STOCKAGE = 'stockage-local';

function appInstallee() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

// Raccourci vers la page des favoris. Il n'apparaît qu'une fois un actif
// suivi : y envoyer quelqu'un dont la liste est vide n'aurait pas de sens.
function renderLienFavoris() {
  const lien = $('#mktFavLien');
  const txt = $('#mktFavLienTxt');
  if (!lien || !txt) return;
  const n = FinanciaFavoris.nbFavoris();
  lien.hidden = n === 0;
  if (n > 0) txt.textContent = FinanciaI18N.t('favoris.lien', { n });
}

function renderNoticeStockage() {
  const hote = $('#mktNotice');
  if (!hote) return;

  const aLieu = FinanciaFavoris.nbFavoris() > 0
    && !FinanciaFavoris.noticeEcartee(NOTICE_STOCKAGE)
    && !appInstallee();

  if (!aLieu) { hote.hidden = true; hote.innerHTML = ''; return; }

  hote.innerHTML = `
    <p class="mkt-notice-txt">${FinanciaI18N.t('marches.favoris.noticeTexte')}
      <a class="mkt-notice-lien" href="/#installer">${FinanciaI18N.t('marches.favoris.noticeLien')}</a>
    </p>
    <button type="button" class="mkt-notice-fermer" aria-label="${FinanciaI18N.t('marches.favoris.noticeFermer')}">&times;</button>`;
  hote.hidden = false;

  hote.querySelector('.mkt-notice-fermer').addEventListener('click', () => {
    FinanciaFavoris.ecarterNotice(NOTICE_STOCKAGE);
    renderNoticeStockage();
  });
}

FinanciaActifs.brancherFavoris($('#mktGrid'), () => {
  renderNoticeStockage();
  renderLienFavoris();
});

// Garde les cœurs justes si la liste change ailleurs : autre onglet ouvert sur
// cette page, ou favori retiré depuis la page « Mes favoris ».
FinanciaFavoris.surChangement(() => {
  FinanciaActifs.syncFavoris();
  renderLienFavoris();
  // Les zones aussi peuvent changer dans un autre onglet : sans ce rendu, les
  // puces resteraient sur un état que le stockage a déjà quitté.
  renderZones();
});

// Ni le raccourci ni les puces ne dépendent des données de marché : ils
// s'affichent sans attendre que /api/marches ait répondu.
renderLienFavoris();
renderZones();

function fmtCap(value, currency) {
  // Les capitalisations se comptent en centaines de milliards : on abrège
  // plutôt que d'aligner douze chiffres illisibles.
  const unite = FinanciaI18N.t('marches.tops.milliards');
  try {
    const n = new Intl.NumberFormat(FinanciaActifs.locale(), { maximumFractionDigits: 0 }).format(value / 1e9);
    return `${n} ${unite} ${currency === 'USD' ? '$' : currency}`;
  } catch {
    return `${Math.round(value / 1e9)} ${unite}`;
  }
}

function renderTops() {
  const wrap = $('#mktTops');
  const cls = lastData?.classements;
  if (!wrap) return;
  // Les classements sont un complément : en leur absence, la page reste
  // parfaitement utilisable sans bloc vide ni message d'erreur.
  if (!cls?.capitalisation?.length && !cls?.dividendes?.length) { wrap.hidden = true; return; }

  const ligne = (item, valeur) => {
    const positive = (item.changePct ?? 0) >= 0;
    return `<li class="mkt-top-row">
      <span class="mkt-top-name">${item.name}</span>
      <span class="mkt-top-val">${valeur}</span>
      <span class="mkt-top-chg ${positive ? 'positive' : 'negative'}">${positive ? '+' : ''}${(item.changePct ?? 0).toFixed(2)}%</span>
    </li>`;
  };

  const cap = $('#mktTopCap');
  if (cap) cap.innerHTML = (cls.capitalisation || []).map(i => ligne(i, fmtCap(i.marketCap, i.currency))).join('');

  const div = $('#mktTopDiv');
  if (div) div.innerHTML = (cls.dividendes || []).map(i => ligne(i, `${i.dividendYield.toFixed(2)} %`)).join('');

  wrap.hidden = false;
}

// ── Calendrier des résultats ──
let lastResultats = null;
let moisCourant = 0; // index dans lastResultats.mois

// Info-bulle sur « attendu » : le sigle BPA ne parle pas à un débutant, et
// l'intérêt du chiffre (l'écart avec le réel fait bouger le cours) n'est pas
// évident. Déclenchée au clic autant qu'au survol, sinon elle serait
// inaccessible au tactile.
function infobulleHtml() {
  return `<button type="button" class="mkt-info" aria-label="${FinanciaI18N.t('marches.resultats.infoAria')}">
    <span aria-hidden="true">i</span>
    <span class="mkt-info-bulle" role="tooltip">${FinanciaI18N.t('marches.resultats.infoTexte')}</span>
  </button>`;
}

function renderResultats() {
  const wrap = $('#mktEarnings');
  const cont = $('#mktEarnDays');
  const vide = $('#mktEarnEmpty');
  if (!wrap || !cont) return;
  if (!lastResultats?.mois?.length) { wrap.hidden = true; return; }

  const mois = lastResultats.mois;
  moisCourant = Math.max(0, Math.min(moisCourant, mois.length - 1));
  const courant = mois[moisCourant];

  // Libellé du mois, construit en UTC pour ne pas reculer d'un jour selon le
  // fuseau du visiteur.
  const [an, mo] = courant.mois.split('-').map(Number);
  const libelleMois = new Date(Date.UTC(an, mo - 1, 1)).toLocaleDateString(FinanciaActifs.locale(), {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  });
  const label = $('#mktEarnMonth');
  if (label) label.textContent = libelleMois;

  // Les flèches ne mènent nulle part au-delà de la période couverte : on les
  // désactive plutôt que d'afficher des mois vides.
  const prev = $('#mktEarnPrev');
  const next = $('#mktEarnNext');
  if (prev) prev.disabled = moisCourant === 0;
  if (next) next.disabled = moisCourant === mois.length - 1;

  cont.innerHTML = courant.jours.map(j => {
    const [a, m, d] = j.date.split('-').map(Number);
    const libelle = new Date(Date.UTC(a, m - 1, d)).toLocaleDateString(FinanciaActifs.locale(), {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
    });
    const lignes = j.evenements.map(e => {
      const cle = e.moment === 'pre-market' ? 'avantOuverture'
                : e.moment === 'post-market' ? 'apresCloture' : null;
      const moment = cle ? FinanciaI18N.t('marches.resultats.' + cle) : '';
      const est = e.estimation !== null && !Number.isNaN(e.estimation)
        ? `<span class="mkt-earn-est">${FinanciaI18N.t('marches.resultats.estimation')} ${e.estimation}${infobulleHtml()}</span>`
        : '';
      return `<li class="mkt-earn-row">
        <span class="mkt-earn-tick">${e.symbole}</span>
        <span class="mkt-earn-name">${e.nom}</span>
        ${moment ? `<span class="mkt-earn-when">${moment}</span>` : '<span></span>'}
        ${est || '<span></span>'}
      </li>`;
    }).join('');
    return `<div class="mkt-earn-day">
      <h4 class="mkt-earn-date">${libelle}</h4>
      <ul class="mkt-earn-list">${lignes}</ul>
    </div>`;
  }).join('');

  if (vide) vide.hidden = courant.jours.length > 0;
  wrap.hidden = false;
}

function brancherNavMois() {
  $('#mktEarnPrev')?.addEventListener('click', () => { moisCourant--; renderResultats(); });
  $('#mktEarnNext')?.addEventListener('click', () => { moisCourant++; renderResultats(); });

  // Une info-bulle au survol seul serait inatteignable au doigt : le clic la
  // bascule, et un clic ailleurs la referme.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.mkt-info');
    $$('.mkt-info.ouverte').forEach(b => { if (b !== btn) b.classList.remove('ouverte'); });
    if (btn) { e.preventDefault(); btn.classList.toggle('ouverte'); }
  });
}

async function loadResultats() {
  try {
    const res = await fetch('/api/resultats');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    lastResultats = data;
    moisCourant = 0;
    renderResultats();
  } catch (e) {
    // Le calendrier est un complément : son absence ne doit rien casser.
    console.error('[resultats] Échec chargement :', e.message);
  }
}

brancherNavMois();

async function loadMarches() {
  try {
    const res = await fetch('/api/marches');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.assets || !Object.keys(data.assets).length) throw new Error('Réponse vide');
    lastData = data;
    renderGrid();
    renderTops();
  } catch (e) {
    console.error('[marches] Échec chargement :', e.message);
    // Le fallback "dernière valeur en cache" est géré côté serveur ; ici on
    // protège seulement le tout premier chargement (si même ça échoue, on
    // n'a rien d'autre à afficher que le message d'erreur).
    if (!lastData) {
      const grid = $('#mktGrid');
      if (grid) grid.innerHTML = `<p class="mkt-error">${FinanciaI18N.t('marches.errorMsg')}</p>`;
    }
  }
}

loadMarches();
loadResultats();
setInterval(loadMarches, 5 * 60 * 1000);   // repasse voir le cache serveur, sans jamais le solliciter en direct
setInterval(renderUpdatedText, 30 * 1000); // rafraîchit juste le texte "il y a X min"

FinanciaI18N.onLangChange(() => {
  renderZones();
  if (lastData) { renderGrid(); renderTops(); }
  if (lastResultats) renderResultats();
});
