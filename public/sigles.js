// ============================================================
// FINANCIA — sigles.js
// Explique les sigles financiers à leur première apparition dans la page.
//
// POURQUOI SEULEMENT LA PREMIÈRE
// « PEA » revient quinze fois sur l'accueil. Poser une infobulle sur
// chacune transformerait le texte en champ de mines pointillées, et
// n'apprendrait rien de plus : une définition se lit une fois. Le module
// n'habille donc que la première occurrence de chaque sigle, dans l'ordre
// de lecture.
//
// POURQUOI UN <button> ET PAS UN <abbr title>
// L'attribut title n'apparaît qu'au survol de la souris. Sur téléphone,
// d'où vient l'essentiel du trafic, il est purement et simplement
// invisible. Un bouton reçoit le focus à la tape, ce qui permet un
// affichage en CSS pur sur :hover ET :focus, sans une ligne de JavaScript
// d'ouverture, et laisse le lecteur d'écran annoncer la définition via
// aria-describedby.
// ============================================================

(function () {
  const SIGLES = ['PEA', 'CTO', 'AMF', 'ORIAS'];

  const t = (cle, secours) => {
    const v = window.FinanciaI18N ? window.FinanciaI18N.t(cle) : '';
    return !v || v === cle ? secours : v;
  };

  // Zones où un remplacement casserait quelque chose : le contenu d'un
  // bouton ou d'un lien (on imbriquerait un bouton dans un bouton), les
  // titres (l'infobulle y déséquilibre la ligne), et tout ce qui est déjà
  // traité.
  const INTERDITS = new Set(['SCRIPT', 'STYLE', 'BUTTON', 'A', 'H1', 'H2', 'H3', 'H4',
                             'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'ABBR']);

  function definir(sigle) {
    const cle = 'sigles.' + sigle.toLowerCase();
    const secours = {
      PEA: "Plan d'épargne en actions. Un compte pour investir en Bourse européenne, dont la fiscalité s'allège après cinq ans de détention.",
      CTO: "Compte-titres ordinaire. Un compte pour investir sans limite géographique, dont les gains sont imposés à 30 %.",
      AMF: "Autorité des marchés financiers. Le régulateur français de la Bourse et de l'épargne.",
      ORIAS: "Le registre français des intermédiaires en assurance, banque et finance.",
    }[sigle];
    return t(cle, secours);
  }

  function habiller() {
    // On repart d'un état propre à chaque changement de langue.
    document.querySelectorAll('.sigle').forEach(el => {
      el.replaceWith(document.createTextNode(el.dataset.sigle));
    });

    const filtre = {
      acceptNode(n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        for (let p = n.parentElement; p && p !== document.body; p = p.parentElement) {
          if (INTERDITS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
          if (p.classList.contains('sigle')) return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    };

    // Un parcours par sigle, et non un seul parcours cherchant les quatre.
    // « ni à l'AMF ni à l'ORIAS » tient dans un seul nœud de texte : une
    // boucle qui s'arrête au premier sigle trouvé y laisserait ORIAS de côté.
    const aTraiter = [];
    for (const s of SIGLES) {
      // \b ne suffit pas : il accepterait le « PEA » de « PEAs ». On exige
      // une frontière non alphabétique des deux côtés.
      const rx = new RegExp(`(^|[^A-Za-zÀ-ÿ])(${s})(?![A-Za-zÀ-ÿ])`);
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, filtre);
      let n;
      while ((n = walker.nextNode())) {
        if (rx.test(n.nodeValue)) { aTraiter.push({ noeud: n, sigle: s, rx }); break; }
      }
    }

    // Du dernier au premier : découper un nœud invalide les positions
    // relevées après lui dans ce même nœud.
    aTraiter.sort((x, y) => y.rx.exec(y.noeud.nodeValue).index - x.rx.exec(x.noeud.nodeValue).index);

    for (const { noeud, sigle, rx } of aTraiter) {
      const m = rx.exec(noeud.nodeValue);
      if (!m) continue;
      const debut = m.index + m[1].length;
      const apres = noeud.splitText(debut);
      apres.splitText(sigle.length);

      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sigle';
      b.dataset.sigle = sigle;
      b.textContent = sigle;
      const id = 'sigle-' + sigle.toLowerCase();
      b.setAttribute('aria-describedby', id);

      const bulle = document.createElement('span');
      bulle.className = 'sigle-bulle';
      bulle.id = id;
      bulle.setAttribute('role', 'tooltip');
      bulle.textContent = definir(sigle);
      b.appendChild(bulle);

      apres.replaceWith(b);
    }
  }

  // Échap referme, quand l'infobulle a été ouverte au clavier ou à la tape.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.activeElement?.classList.contains('sigle')) {
      document.activeElement.blur();
    }
  });

  habiller();
  if (window.FinanciaI18N) FinanciaI18N.onLangChange(habiller);
})();
