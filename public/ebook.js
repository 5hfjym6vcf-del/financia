// ============================================================
// FINANCIA — ebook.js
// Bouton d'achat, case de renonciation, retour de paiement.
//
// LA CASE COMMANDE LE BOUTON, ET NON L'INVERSE
// L'art. L221-28 13° du code de la consommation ne fait perdre le droit de
// rétractation sur un contenu numérique que si l'acheteur a donné son accord
// exprès à l'exécution immédiate ET reconnu qu'il perd ce droit. « Exprès »
// exclut une case pré-cochée : elle part donc décochée, et le bouton reste
// inerte tant qu'elle ne l'est pas.
// ============================================================

(function () {
  const cfg = window.FinanciaEbook;
  if (!cfg) return;

  const bouton = document.getElementById('ebookAcheter');
  const caseR = document.getElementById('ebookRenonciation');
  const etat = document.getElementById('ebookEtat');
  const prixEl = document.getElementById('ebookPrix');

  // ── Prix ────────────────────────────────────────────────────────────
  if (prixEl) {
    const p = cfg.prixFormate();
    prixEl.textContent = p || 'Prix à venir';
    if (!p) prixEl.classList.add('ebook-prix-attente');
  }

  function message(texte, type = 'info') {
    if (!etat) return;
    etat.textContent = texte;
    etat.className = 'ebook-etat ebook-etat-' + type;
    etat.hidden = !texte;
  }

  // ── Cas où la vente n'est pas ouverte ───────────────────────────────
  if (!cfg.estVendable()) {
    if (bouton) {
      bouton.disabled = true;
      bouton.setAttribute('aria-disabled', 'true');
    }
    if (caseR) caseR.disabled = true;
    const raisons = {
      attente: "La version complète n'est pas encore en vente. Le contenu est en cours de relecture.",
      cle: 'Le paiement est en cours de configuration.',
      prix: 'Le prix sera annoncé prochainement.',
    };
    message(raisons[cfg.raisonIndisponible()] || raisons.attente, 'attente');
    // On s'arrête là : aucun écouteur de clic n'est branché, donc aucun
    // appel réseau ne peut partir, même en réactivant le bouton depuis la
    // console du navigateur.
    return;
  }

  // ── Vente ouverte ───────────────────────────────────────────────────
  function majBouton() {
    const ok = caseR && caseR.checked;
    bouton.disabled = !ok;
    bouton.setAttribute('aria-disabled', String(!ok));
    if (ok) message('');
  }

  if (caseR) {
    caseR.checked = false;   // jamais pré-cochée, y compris après un retour arrière
    caseR.addEventListener('change', majBouton);
  }
  majBouton();

  bouton.addEventListener('click', async () => {
    if (!caseR || !caseR.checked) {
      message('Merci de confirmer la renonciation au droit de rétractation avant de payer.', 'erreur');
      return;
    }
    bouton.disabled = true;
    message('Redirection vers le paiement sécurisé…');
    try {
      const r = await fetch('/api/ebook-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renonciation: true }),
      });
      const d = await r.json();
      if (!r.ok || !d.url) throw new Error(d.error || 'Réponse inattendue');
      window.location.href = d.url;
    } catch (e) {
      bouton.disabled = false;
      message("Le paiement n'a pas pu démarrer. Réessaie dans un instant.", 'erreur');
      console.error('[ebook]', e.message);
    }
  });

  // ── Retour depuis Stripe ────────────────────────────────────────────
  // Le lien de téléchargement n'est PAS construit ici : la page se contente
  // de transmettre l'identifiant de session, et c'est le serveur qui vérifie
  // auprès de Stripe que la commande est payée avant de servir le fichier.
  const params = new URLSearchParams(location.search);
  const zone = document.getElementById('ebookRetour');
  if (!zone) return;

  if (params.get('paiement') === 'ok' && params.get('session_id')) {
    const id = params.get('session_id');
    zone.hidden = false;
    zone.innerHTML =
      '<p class="ebook-retour-titre">Paiement confirmé, merci.</p>' +
      '<p class="ebook-retour-texte">Ton guide est prêt. Le lien reste valable, ' +
      'garde cette page en favori si tu veux le retélécharger.</p>' +
      '<a class="btn-primary" href="/api/ebook-telechargement?session_id=' +
      encodeURIComponent(id) + '">Télécharger le PDF</a>';
    zone.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else if (params.get('paiement') === 'annule') {
    zone.hidden = false;
    zone.innerHTML =
      '<p class="ebook-retour-titre">Paiement annulé.</p>' +
      '<p class="ebook-retour-texte">Rien n\'a été débité. La version gratuite ' +
      'reste accessible juste au-dessus.</p>';
  }
})();
