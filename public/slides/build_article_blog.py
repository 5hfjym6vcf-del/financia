#!/usr/bin/env python3
"""Assemble public/blog-placements-jeunes-actifs.html.

La coquille (navbar, menu mobile, pied de page, bloc Consent Mode, scripts)
est reprise TELLE QUELLE de ressources.html plutôt que recopiée à la main :
douze pages partagent déjà cette structure, et une divergence introduite ici
se paierait au prochain changement de navigation.

Seuls le <head> et le corps de page sont propres à l'article.

FRANÇAIS SEUL, comme « Comprendre le crédit » et « Les classiques ». Aucun
attribut data-i18n n'est posé sur le contenu rédactionnel : un visiteur en
EN/ES/RU/DE verra la navigation traduite et l'article en français.
"""
import io, os, re
# CHEMINS ABSOLUS, ET NON RELATIFS
# Les routes du blog sont imbriquées : /blog/<slug>. Un src="./x.js" y résout
# vers /blog/x.js, qui n'existe pas. Toutes les feuilles et tous les scripts
# partaient donc en 404, i18n compris, la classe i18n-ready n'était jamais
# posée et le voile anti-FOUC laissait la page entièrement blanche, sans une
# seule erreur en console. Les autres pages du site vivent sur une route à un
# seul segment, où "./" tombe juste par accident.
def absolus(html):
    return html.replace('src="./', 'src="/').replace('href="./', 'href="/')

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # public/
SOURCE = os.path.join(RACINE, 'ressources.html')
CIBLE  = os.path.join(RACINE, 'blog-placements-jeunes-actifs.html')

URL   = 'https://financia.cloud/blog/placements-jeunes-actifs'
TITRE = "Placements jeunes et épargne étudiants : par où commencer ?"
DESC  = ("Livret A, LDDS, LEP, Livret Jeune : comparatif des placements sans risque "
         "pour étudiants et jeunes actifs, taux et plafonds 2026 expliqués simplement.")

lignes = io.open(SOURCE, encoding='utf-8').read().split('\n')
# Repères de contenu, et NON des numéros de ligne : l'ajout d'une entrée de
# navigation dans ressources.html décalait tout le découpage et produisait un
# fichier au balisage cassé, sans que rien ne le signale.
i_body    = next(i for i, l in enumerate(lignes) if l.startswith('<body'))
i_head    = next(i for i, l in enumerate(lignes) if l.strip() == '</head>')
i_nav_fin = next(i for i, l in enumerate(lignes) if l.startswith('<!-- ═══ HERO'))
i_pied    = next(i for i, l in enumerate(lignes) if l.startswith('<footer'))
NAV  = '\n'.join(lignes[i_body:i_nav_fin])
PIED = '\n'.join(lignes[i_pied:])

# Le <body> de ressources porte sa propre classe de page.
NAV = NAV.replace('<body class="ressources-page">', '<body class="article-page">')
# La page courante dans la navigation n'est plus Ressources.
NAV = NAV.replace('<a href="/ressources" aria-current="page"', '<a href="/ressources"')
# ressources.js n'a rien à faire ici, il pilote les filtres de /ressources.
# Voir build_blog.py : sans page-socle.js, initLang() n'est jamais appelé
# et le voile anti-FOUC laisse la page invisible.
PIED = PIED.replace('<script src="./ressources.js"></script>',
                    '<script src="./page-socle.js"></script>')

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

  <!-- PWA : installable sur mobile (voir manifest.json + sw.js) -->
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/images/icons/apple-touch-icon-180.png" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Financia" />

  <!-- Open Graph / social sharing -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="{URL}" />
  <meta property="og:title" content="{TITRE}" />
  <meta property="og:description" content="{DESC}" />
  <meta property="og:image" content="https://financia.cloud/images/og-financia.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Financia, apprendre à investir sans jargon et sans conseil personnalisé" />
  <meta property="og:locale" content="fr_FR" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta property="twitter:title" content="{TITRE}" />
  <meta property="twitter:description" content="{DESC}" />
  <meta name="twitter:image" content="https://financia.cloud/images/og-financia.png" />

  <!-- Données structurées : le type Article permet à Google de rattacher la
       page à un auteur et à une date, ce qu'une page de contenu isolée sans
       balisage n'obtient pas. Les dates sont en dur : il n'y a pas de CMS
       derrière, les inventer dynamiquement les rendrait fausses au premier
       rechargement. -->
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Placements et épargne pour étudiants : par où commencer sans prendre de risque ?",
    "description": "{DESC}",
    "datePublished": "2026-09-10",
    "dateModified": "2026-09-10",
    "inLanguage": "fr-FR",
    "author": {{ "@type": "Organization", "name": "Financia", "url": "https://financia.cloud" }},
    "publisher": {{
      "@type": "Organization", "name": "Financia",
      "logo": {{ "@type": "ImageObject", "url": "https://financia.cloud/images/icons/icon-512.png" }}
    }},
    "mainEntityOfPage": {{ "@type": "WebPage", "@id": "{URL}" }}
  }}
  </script>
'''

# Le bloc gtag/Consent Mode est repris à l'identique des autres pages.
gtag = '\n'.join(lignes[46:i_head])
TETE = TETE + gtag + '\n'

CORPS = '''
<!-- ═══ HERO ═══ -->
<section class="page-hero">
  <div class="page-hero-bg-grid"></div>
  <div class="page-hero-glow page-hero-glow-1"></div>
  <div class="page-hero-glow page-hero-glow-2"></div>
  <div class="wrap page-hero-inner">
    <div class="hero-badge page-hero-badge">Guide</div>
    <h1 class="page-hero-h1">Placements et épargne pour étudiants : <em>par où commencer</em> sans prendre de risque ?</h1>
    <p class="page-hero-lead">À 20 ans, placer son argent n'est pas réservé à ceux qui ont un gros salaire. Voici ce que permettent les livrets réglementés, et où ils s'arrêtent.</p>
    <p class="art-meta">Publié le 10 septembre 2026 &middot; Lecture 5 min</p>
  </div>
</section>

<section class="section section-dark">
  <div class="wrap art-wrap">

    <article class="art-corps">

      <p class="art-chapo">À 20 ans, l'idée de <strong>placer son argent</strong> peut sembler réservée à ceux qui ont déjà un gros salaire ou des connaissances pointues en finance. C'est faux. Que tu aies 50 € ou 500 € de côté, il existe des solutions accessibles, sans risque de perte, pour commencer à faire fructifier ton épargne dès aujourd'hui.</p>

      <p>Cet article fait le point sur les options d'<strong>épargne sans risque pour étudiants et jeunes actifs</strong>, comment elles fonctionnent, et où elles s'arrêtent. Il est tout aussi important de savoir ce qu'un livret ne peut pas t'apporter.</p>

      <h2>Pourquoi optimiser son épargne dès maintenant ?</h2>

      <p>Le réflexe classique, c'est de laisser son argent dormir sur un compte courant. Le problème : un compte courant ne rapporte rien, et avec l'inflation, chaque euro non placé perd un peu de sa valeur chaque année.</p>

      <p><strong>Optimiser son épargne</strong>, ce n'est pas forcément « investir en bourse » ou prendre des risques. C'est d'abord choisir le bon support pour l'argent que tu n'utilises pas immédiatement, et ça commence par les produits réglementés, garantis par l'État.</p>

      <h2>Les livrets réglementés : la base sans aucun risque</h2>

      <h3>Le Livret A, le plus connu</h3>

      <p>Le Livret A est le placement le plus répandu en France, avec plus de 58 millions de détenteurs. Son fonctionnement est simple :</p>

      <ul class="art-liste">
        <li><strong>Aucun risque de perte</strong> : le capital est garanti par l'État</li>
        <li><strong>Disponibilité immédiate</strong> : tu peux retirer ton argent à tout moment</li>
        <li><strong>Intérêts exonérés d'impôt</strong> : pas de prélèvement sur les gains</li>
        <li><strong>Taux actuel : 1,70 %</strong> (depuis le 1<sup>er</sup> août 2026)</li>
        <li><strong>Plafond de versement : 22 950 €</strong></li>
      </ul>

      <p>À titre d'exemple, 1 000 € placés sur un Livret A rapportent environ 17 € par an au taux actuel. Ce n'est pas énorme, mais c'est <strong>garanti</strong>, et bien mieux qu'un compte courant qui ne rapporte rien.</p>

      <h3>Le LDDS, le jumeau écologique du Livret A</h3>

      <p>Le <strong>Livret de développement durable et solidaire (LDDS)</strong> fonctionne exactement comme le Livret A, avec le même taux (1,70 %) et les mêmes avantages fiscaux. Seule différence : son plafond est plus bas (12 000 €), et les fonds collectés financent prioritairement des projets liés à la transition écologique et à l'économie solidaire.</p>

      <p><strong>Bon à savoir</strong> : le Livret A et le LDDS se cumulent. Ce sont deux enveloppes distinctes, donc deux plafonds séparés.</p>

      <h3>Le LEP, réservé sous conditions de revenus</h3>

      <p>Le <strong>Livret d'épargne populaire (LEP)</strong> affiche le taux le plus élevé des trois, à <strong>2,50 %</strong>, mais il est soumis à des conditions de ressources. Beaucoup d'étudiants et de jeunes actifs aux revenus modestes y sont éligibles sans le savoir : cela se vérifie auprès de sa banque, à partir de l'avis d'imposition.</p>

      <h2>Comparatif des livrets réglementés</h2>

      <div class="part-table-boite">
        <table class="part-table art-table">
          <caption class="sr-only">Comparatif des taux, plafonds et fiscalité des livrets réglementés en 2026</caption>
          <thead>
            <tr>
              <th scope="col">Produit</th>
              <th scope="col">Taux (2026)</th>
              <th scope="col">Plafond</th>
              <th scope="col">Fiscalité</th>
            </tr>
          </thead>
          <tbody>
            <tr><th scope="row" class="part-td-nom">Livret A</th><td>1,70 %</td><td>22 950 €</td><td>Exonéré</td></tr>
            <tr><th scope="row" class="part-td-nom">LDDS</th><td>1,70 %</td><td>12 000 €</td><td>Exonéré</td></tr>
            <tr><th scope="row" class="part-td-nom">LEP <span class="art-cond">(sous conditions)</span></th><td>2,50 %</td><td>10 000 €</td><td>Exonéré</td></tr>
            <tr><th scope="row" class="part-td-nom">Livret Jeune <span class="art-cond">(12-24 ans)</span></th><td>Au moins 1,70 %</td><td>1 600 €</td><td>Exonéré</td></tr>
          </tbody>
        </table>
      </div>
      <p class="art-note-table">Taux et plafonds en vigueur au 10 septembre 2026. Les taux réglementés sont révisés par arrêté, en principe au 1<sup>er</sup> février et au 1<sup>er</sup> août.</p>

      <p>Entre 12 et 24 ans, il existe aussi le <strong>Livret Jeune</strong>. Chaque banque fixe son propre taux, qui ne peut jamais être inférieur à celui du Livret A. Les écarts d'un établissement à l'autre sont donc à regarder.</p>

      <h2>Et après les livrets, que faire ?</h2>

      <p>Une fois une épargne de précaution constituée sur des livrets sans risque, la question d'aller plus loin peut se poser, avec des enveloppes comme le <strong>PEA</strong> (Plan d'épargne en actions) ou des <strong>ETF</strong>. Ces supports offrent un potentiel de rendement supérieur sur le long terme, avec une nuance essentielle : <strong>contrairement aux livrets, ils comportent un risque de perte en capital</strong>.</p>

      <p>Ce n'est ni bien ni mal. C'est simplement une autre nature de placement, avec un horizon différent, long terme plutôt que disponibilité immédiate, et un fonctionnement à comprendre avant de s'y lancer.</p>

      <h3>Ce qu'il faut retenir avant de sortir des livrets</h3>

      <ul class="art-liste">
        <li>Le rendement plus élevé d'un placement en actions ou en ETF <strong>s'accompagne toujours d'un risque de perte</strong>, qui n'existe pas sur un Livret A</li>
        <li>Ces placements sont pensés pour du <strong>long terme</strong>, sur plusieurs années, pas pour de l'épargne de précaution</li>
        <li>Comprendre les bases, ce qu'est un ETF, comment fonctionne le PEA, la notion de diversification, change tout. C'est exactement ce que propose Financia, gratuitement</li>
      </ul>

      <h2>Une progression possible pour un étudiant ou un jeune actif</h2>

      <p>Voici l'ordre de progression que présentent généralement les acteurs de l'éducation financière, comme la Banque de France ou les associations de consommateurs. Ce n'est <strong>pas une recommandation personnalisée</strong>, mais une logique générale, à confronter à sa propre situation :</p>

      <ol class="art-etapes">
        <li><strong>Constituer une épargne de précaution</strong> disponible à tout moment, souvent présentée comme l'équivalent de trois à six mois de dépenses</li>
        <li><strong>Vérifier son éligibilité au LEP</strong>, dont le taux est le plus élevé des livrets réglementés</li>
        <li><strong>Se former</strong> avant d'aller plus loin : PEA, ETF, et les notions de risque et de rendement</li>
        <li><strong>Envisager le long terme</strong> une fois ces bases comprises</li>
      </ol>

      <div class="risque" role="note">
        <span class="risque-icone" aria-hidden="true">⚠️</span>
        <p>Cet article est général et pédagogique. Il ne constitue ni un conseil en investissement, ni une recommandation de produit ou d'établissement. Les taux cités sont ceux en vigueur à la date de publication et évoluent par arrêté. Financia ne gère aucun fonds et ne perçoit aucune rémunération sur les livrets réglementés.</p>
      </div>

      <h2>Le rôle de Financia dans cette démarche</h2>

      <p>Financia a été pensé pour accompagner chaque étape de cette progression, <strong>gratuitement, sans jargon, et sans jamais te dire quoi faire de ton argent</strong>.</p>

      <ul class="art-liste">
        <li>Un <a href="/simulateur">simulateur</a> pour visualiser l'évolution de ton épargne selon différents scénarios</li>
        <li>Un <a href="/comparateur">comparateur</a> pour mettre en perspective plusieurs types de placements</li>
        <li>Des modules pédagogiques sur le PEA, les ETF et les bases de l'investissement</li>
        <li>Un <a href="/#quiz">quiz</a> pour situer tes connaissances au fur et à mesure</li>
      </ul>

      <p>Financia ne gère aucun fonds et ne perçoit aucune rémunération sur les décisions que tu prends. L'objectif est uniquement de t'aider à comprendre, pour que tu puisses ensuite décider en autonomie.</p>

      <h2>En résumé</h2>

      <p>Optimiser son épargne quand on est étudiant ou jeune actif ne demande ni gros capital ni expertise financière. Cela commence par des solutions simples et sans risque, Livret A, LDDS, LEP en cas d'éligibilité, avant d'envisager, une fois les bases comprises, des placements avec un horizon plus long.</p>

    </article>

    <!-- Sortie vers les outils du site, plutôt qu'un lien vers l'accueil :
         l'article se termine sur l'épargne, le comparateur la met en chiffres. -->
    <div class="art-suite">
      <h2 class="art-suite-titre">Mettre ces chiffres en perspective</h2>
      <p>Le comparateur projette les mêmes versements sur un Livret A, un compte espèces rémunéré et un ETF, nets de fiscalité.</p>
      <div class="art-suite-liens">
        <a class="btn-primary" href="/comparateur">Ouvrir le comparateur</a>
        <a class="btn-secondaire" href="/ressources">Voir toutes les ressources</a>
      </div>
    </div>

  </div>
</section>
'''

io.open(CIBLE, 'w', encoding='utf-8').write(absolus(
    TETE + '</head>\n' + NAV + '\n' + CORPS + '\n' + PIED))
print('écrit :', os.path.relpath(CIBLE, os.path.dirname(RACINE)))
