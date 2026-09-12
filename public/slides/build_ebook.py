#!/usr/bin/env python3
"""Assemble public/guide.html, la page produit de l'ebook.

Coquille reprise de ressources.html par repères de contenu, comme les pages
du blog, pour que navbar, pied de page et bloc Consent Mode restent
identiques au reste du site.

CE FICHIER EST DANS slides/ PAR COHÉRENCE, PAS PAR LOGIQUE
build_blog.py et build_article_blog.py y sont déjà. Les regrouper ailleurs
serait plus propre, mais disperser les générateurs entre deux dossiers le
serait moins.

CONTENU EN ATTENTE
Les modules gratuits et les arguments de vente n'ont pas été fournis. Les
emplacements sont posés et signalés en clair sur la page plutôt que remplis
d'un texte inventé : un guide financier écrit au jugé, sur un site qui
affiche « 0 % conseils perso », serait le pire endroit pour improviser.
"""
import io, os

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(RACINE, 'ressources.html')
CIBLE = os.path.join(RACINE, 'guide.html')

URL = 'https://financia.cloud/guide'
TITRE = "La Recette Financière | Le guide Financia pour s'organiser avec son argent"
DESC = ("Un guide en quatre modules pour comprendre l'administratif, la fiscalité et "
        "l'investissement quand on débute. Les deux premiers modules sont en accès libre.")


def absolus(html):
    return html.replace('src="./', 'src="/').replace('href="./', 'href="/')


lignes = io.open(SOURCE, encoding='utf-8').read().split('\n')
i_body = next(i for i, l in enumerate(lignes) if l.startswith('<body'))
i_head = next(i for i, l in enumerate(lignes) if l.strip() == '</head>')
i_nav_fin = next(i for i, l in enumerate(lignes) if l.startswith('<!-- ═══ HERO'))
i_pied = next(i for i, l in enumerate(lignes) if l.startswith('<footer'))

GTAG = '\n'.join(lignes[46:i_head])
NAV = '\n'.join(lignes[i_body:i_nav_fin]) \
    .replace('<body class="ressources-page">', '<body class="guide-page">') \
    .replace('<a href="/ressources" aria-current="page"', '<a href="/ressources"')
PIED = '\n'.join(lignes[i_pied:]) \
    .replace('<script src="./ressources.js"></script>',
             '<script src="./page-socle.js"></script>\n'
             '<script src="./ebook-config.js"></script>\n'
             '<script src="./ebook.js" defer></script>')

TETE = f'''<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{TITRE}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="./style.css" />

  <!-- i18n : chargé de façon bloquante pour éviter tout flash de contenu FR -->
  <style>html:not(.i18n-ready) body {{ visibility: hidden; }}</style>
  <script src="./i18n.js"></script>
  <script src="./i18n-core.js"></script>

  <meta name="description" content="{DESC}" />
  <link rel="canonical" href="{URL}" />
  <meta name="theme-color" content="#000000" />
  <link rel="icon" href="/images/icons/icon.svg" type="image/svg+xml" />
  <link rel="icon" href="/images/icons/icon-32.png" sizes="32x32" type="image/png" />

  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/images/icons/apple-touch-icon-180.png" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Financia" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="{URL}" />
  <meta property="og:title" content="{TITRE}" />
  <meta property="og:description" content="{DESC}" />
  <meta property="og:image" content="https://financia.cloud/images/og-financia.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="fr_FR" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta property="twitter:title" content="{TITRE}" />
  <meta property="twitter:description" content="{DESC}" />
  <meta name="twitter:image" content="https://financia.cloud/images/og-financia.png" />

  <!-- PAS DE DONNÉES STRUCTURÉES Product/Offer POUR L'INSTANT.
       Un balisage Product sans prix ni disponibilité réels est une donnée
       fausse envoyée à Google, et un prix annoncé dans le balisage mais pas
       à l'écran est une pratique commerciale trompeuse. À ajouter le jour où
       le prix est arrêté et la vente ouverte. -->
'''

CORPS = '''
<!-- ═══ HERO ═══ -->
<section class="page-hero">
  <div class="page-hero-bg-grid"></div>
  <div class="page-hero-glow page-hero-glow-1"></div>
  <div class="page-hero-glow page-hero-glow-2"></div>
  <div class="wrap page-hero-inner">
    <div class="hero-badge page-hero-badge">Guide</div>
    <h1 class="page-hero-h1">La Recette <em>Financière</em></h1>
    <p class="page-hero-lead">Quatre modules pour s'y retrouver dans l'administratif, la fiscalité et l'investissement quand on débute. Les deux premiers sont en accès libre, ici même.</p>
  </div>
</section>

<section class="section section-dark">
  <div class="wrap art-wrap">

    <!-- Retour de paiement, rempli par ebook.js. Masqué par défaut. -->
    <div id="ebookRetour" class="ebook-retour" hidden></div>

    <!-- ═══ VERSION GRATUITE ═══
         EMPLACEMENT EN ATTENTE DE CONTENU.
         Les deux modules gratuits doivent être collés ici, dans la même
         structure rédactionnelle que les articles du blog : h2, paragraphes,
         listes .art-liste, tableaux .part-table si besoin. -->
    <div class="ebook-libre">
      <div class="ebook-libre-tete">
        <span class="ebook-pastille">Accès libre</span>
        <h2 class="ebook-h2">Les deux premiers modules</h2>
        <p class="ebook-sous">À lire directement, sans compte et sans paiement.</p>
      </div>

      <article class="art-corps">

        <h2>Module 1 &middot; Administratif et fiscal</h2>
        <div class="ebook-attente" role="note">
          <p><strong>Contenu à intégrer.</strong> Le texte de ce module n'a pas encore été fourni. L'emplacement est prêt : il accepte la même structure que les articles du blog.</p>
        </div>

        <h2>Module 2 &middot; Investissement</h2>
        <div class="ebook-attente" role="note">
          <p><strong>Contenu à intégrer.</strong> Même remarque que pour le module 1.</p>
        </div>

      </article>
    </div>

    <!-- ═══ BLOC DE VENTE ═══ -->
    <div class="ebook-offre">
      <div class="ebook-offre-tete">
        <span class="ebook-pastille ebook-pastille-premium">Version complète</span>
        <h2 class="ebook-h2">Les quatre modules, plus les bonus</h2>
      </div>

      <p class="ebook-offre-sous">La version complète reprend les deux modules ci-dessus et ajoute les deux suivants, au format PDF téléchargeable.</p>

      <!-- EMPLACEMENT EN ATTENTE : les bénéfices de la fiche produit.
           Rédigés au futur ou au conditionnel côté résultat, jamais en
           promesse de gain : ce site affiche « 0 % conseils perso » sur sa
           page d'accueil, une accroche du type « gagnez X » le contredirait
           frontalement et relèverait de la pratique commerciale trompeuse. -->
      <div class="ebook-attente" role="note">
        <p><strong>Arguments de vente à intégrer.</strong> La fiche produit n'a pas été fournie. Formulations à tenir : ce que le lecteur apprend, pas ce qu'il gagnera.</p>
      </div>

      <div class="ebook-prix-zone">
        <span id="ebookPrix" class="ebook-prix">Prix à venir</span>
        <span class="ebook-tva"></span>
      </div>

      <!-- ═══ RENONCIATION AU DROIT DE RÉTRACTATION ═══
           Obligatoire pour un contenu numérique fourni immédiatement :
           art. L221-28 13° du code de la consommation. L'accord doit être
           EXPRÈS, donc la case part décochée et le bouton reste inerte tant
           qu'elle ne l'est pas. La formulation reprend les deux éléments
           exigés : accord à l'exécution immédiate, et reconnaissance de la
           perte du droit de rétractation. -->
      <div class="ebook-legal">
        <label class="ebook-check">
          <input type="checkbox" id="ebookRenonciation" />
          <span>Je demande que le guide me soit fourni immédiatement après le paiement, et je reconnais qu'en conséquence je perds mon droit de rétractation de quatorze jours, conformément à l'article L221-28 13° du code de la consommation.</span>
        </label>
      </div>

      <button type="button" id="ebookAcheter" class="btn-primary ebook-cta" disabled aria-disabled="true">
        Obtenir la version complète
      </button>
      <p id="ebookEtat" class="ebook-etat" hidden></p>

      <p class="ebook-mentions">
        Paiement par carte, traité par Stripe. Financia ne voit ni ne conserve tes coordonnées bancaires.
        Une question&nbsp;: <a href="mailto:financiacloud@gmail.com">financiacloud@gmail.com</a>.
      </p>
    </div>

    <!-- ═══ AVERTISSEMENT ═══
         Même traitement que les outils et les articles du site. -->
    <div class="risque" role="note">
      <span class="risque-icone" aria-hidden="true">⚠️</span>
      <p>Ce guide est un contenu pédagogique. Il ne constitue ni un conseil en investissement, ni une recommandation personnalisée, ni une promesse de résultat. Financia ne gère aucun fonds et n'est pas intermédiaire en opérations de banque. Investir comporte un risque de perte en capital.</p>
    </div>

  </div>
</section>
'''

io.open(CIBLE, 'w', encoding='utf-8').write(absolus(
    TETE + GTAG + '\n</head>\n' + NAV + '\n' + CORPS + '\n' + PIED))
print('écrit : public/guide.html')
