#!/usr/bin/env python3
"""Assemble /blog (listing) et les pages des articles d'actualité.

RÉPARTITION AVEC build_article_blog.py
Ce script produit les articles d'actualité, de structure uniforme : chapô,
paragraphes, encadré de fin. Le guide « Placements et épargne pour étudiants »
garde son propre script parce qu'il a une structure propre (tableau
comparatif, liste numérotée d'étapes) qu'un gabarit commun rendrait rigide.
Le listing ci-dessous référence les deux familles.

POURQUOI UN MANIFESTE
Chaque article existe à deux endroits : sa page et sa carte sur le listing.
Les écrire séparément garantit qu'un jour le résumé ne correspondra plus au
contenu. ARTICLES est la source unique des deux.

FRANÇAIS SEUL, comme les autres ajouts récents. Aucun data-i18n sur le
contenu rédactionnel, aucune clé ajoutée dans i18n.js.
"""
import io, os
# CHEMINS ABSOLUS, ET NON RELATIFS
# Les routes du blog sont imbriquées : /blog/<slug>. Un src="./x.js" y résout
# vers /blog/x.js, qui n'existe pas. Toutes les feuilles et tous les scripts
# partaient donc en 404, i18n compris, la classe i18n-ready n'était jamais
# posée et le voile anti-FOUC laissait la page entièrement blanche, sans une
# seule erreur en console. Les autres pages du site vivent sur une route à un
# seul segment, où "./" tombe juste par accident.
def absolus(html):
    return html.replace('src="./', 'src="/').replace('href="./', 'href="/')


RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(RACINE, 'ressources.html')

DISCLAIMER_BOURSE = ("Financia rappelle que la performance passée d'une action ne préjuge pas "
                     "de son évolution future. Cet article est informatif, il ne constitue ni "
                     "un conseil ni une recommandation d'investissement.")

ARTICLES = [
    {
        'slug': 'nvidia-premiere-capitalisation-mondiale',
        'date_iso': '2026-09-10', 'date': '10 septembre 2026', 'duree': '4 min',
        'categorie': 'Actualité', 'icone': '📈',
        'titre': "Nvidia, l'entreprise la plus valorisée au monde",
        'h1': "Nvidia, l'entreprise <em>la plus valorisée</em> au monde",
        'meta_titre': "Nvidia, première capitalisation mondiale : ce qu'il faut comprendre",
        'meta_desc': ("Nvidia dépasse Apple et Microsoft avec 5 590 milliards de dollars de "
                      "capitalisation. Résultats, records boursiers et demande en puces IA, "
                      "expliqués simplement."),
        'lead': ("Le concepteur de puces graphiques passe devant Apple et Microsoft, porté par "
                 "la demande autour de l'intelligence artificielle."),
        'corps': '''
      <p class="art-chapo">Avec une capitalisation boursière d'environ <strong>5 590 milliards de dollars</strong> début septembre 2026, Nvidia est devenue l'entreprise la plus valorisée de la planète, devant des géants comme Apple ou Microsoft.</p>

      <p>Le concepteur de puces graphiques doit cette ascension à la demande massive autour de l'intelligence artificielle. Ses résultats du deuxième trimestre 2026 ont largement dépassé les attentes : un chiffre d'affaires de <strong>96,2 milliards de dollars</strong>, plus du double par rapport à l'année précédente, porté par les ventes de puces destinées aux centres de données IA.</p>

      <h2>Un effet spectaculaire en bourse</h2>

      <p>Le jour de la publication des résultats, l'action a bondi de <strong>8,7 %</strong>, ajoutant 442 milliards de dollars à la valorisation de l'entreprise en une seule séance. C'est le deuxième gain journalier le plus important de l'histoire boursière, juste derrière Microsoft le mois précédent.</p>

      <h2>Des records dans les deux sens</h2>

      <p>Nvidia n'en est pas à son premier record de ce genre : l'entreprise avait déjà ajouté 440 milliards de dollars en une séance en avril 2025.</p>

      <p>Mais elle détient aussi <strong>le record inverse</strong>, celui de la plus forte perte de valeur en une journée, environ 600 milliards de dollars. C'était début 2025, après l'annonce du modèle chinois DeepSeek, qui avait fait craindre une remise en question de la demande en puces IA. Les deux records appartiennent à la même entreprise, à dix mois d'intervalle : c'est une bonne illustration de ce que veut dire « volatilité ».</p>

      <h2>Ce que l'entreprise fait de cet argent</h2>

      <p>Nvidia a reversé <strong>26 milliards de dollars</strong> à ses actionnaires ce trimestre, entre rachats d'actions et dividendes, tout en augmentant ses stocks en prévision du lancement de sa prochaine génération de puces, Vera Rubin.</p>
''',
        'disclaimer': DISCLAIMER_BOURSE,
        'resume': ("5 590 milliards de dollars de capitalisation, un bond de 8,7 % en une séance, "
                   "et le record inverse dix mois plus tôt. Ce que dit ce parcours de la volatilité."),
    },
    {
        'slug': 'apple-nouvelle-ere',
        'date_iso': '2026-09-09', 'date': '9 septembre 2026', 'duree': '4 min',
        'categorie': 'Actualité', 'icone': '📱',
        'titre': "Apple change d'ère : nouveau patron, premier pliable, prix en hausse",
        'h1': "Apple change d'ère : nouveau patron, <em>premier pliable</em>, prix en hausse",
        'meta_titre': "Apple : John Ternus succède à Tim Cook et lance l'iPhone Duo pliable",
        'meta_desc': ("John Ternus remplace Tim Cook à la direction d'Apple, l'iPhone Duo pliable "
                      "arrive à 2 000 dollars et les modèles Pro augmentent de 100 dollars. "
                      "Ce que change l'événement du 9 septembre 2026."),
        'lead': ("Changement de direction, premier smartphone pliable et hausse des tarifs Pro : "
                 "l'événement de rentrée d'Apple a été chargé."),
        'corps': '''
      <p class="art-chapo">Le 9 septembre, Apple a tenu son événement de rentrée à Cupertino. Mais pour la première fois depuis des années, ce n'est pas Tim Cook qui tenait le clavier de la présentation.</p>

      <h2>Un nouveau directeur général</h2>

      <p><strong>John Ternus</strong>, jusqu'alors vice-président senior de l'ingénierie matérielle, est devenu le nouveau directeur général du groupe. Tim Cook, lui, prend le rôle de président exécutif.</p>

      <h2>Le premier iPhone pliable</h2>

      <p>Sur le plan produit, Apple a dévoilé son tout premier smartphone pliable, l'<strong>iPhone Duo</strong>, commercialisé à partir du 23 octobre autour de 2 000 dollars, soit environ 1 718 euros.</p>

      <p>Sept ans après Samsung, Apple arrive tard sur ce segment, qui représente encore <strong>moins de 2 % des ventes mondiales</strong> de smartphones. Le cabinet IDC anticipe pourtant qu'Apple pourrait déjà en capter près d'un tiers cette année.</p>

      <h2>Ce que changent les iPhone 18 Pro</h2>

      <p>Les nouveaux iPhone 18 Pro inaugurent une puce gravée en 2 nanomètres et un appareil photo à ouverture variable, avec une nouveauté notable : <strong>chaque image est désormais signée au niveau du capteur</strong>, pour prouver l'absence de retouche par IA.</p>

      <p>Côté prix, Apple a relevé de 100 dollars le tarif de ses modèles Pro.</p>

      <h2>La réaction des marchés</h2>

      <p>L'action Apple a réagi positivement à l'annonce, portée par l'enthousiasme autour du pliable. Le titre reste proche de son record historique établi en juillet, avec une progression de <strong>16 % depuis le début de l'année 2026</strong>.</p>
''',
        'disclaimer': DISCLAIMER_BOURSE,
        'resume': ("John Ternus prend la direction, l'iPhone Duo pliable arrive à 2 000 dollars, "
                   "et les modèles Pro augmentent de 100 dollars."),
    },
    {
        'slug': 'education-financiere-college',
        'date_iso': '2026-09-03', 'date': '3 septembre 2026', 'duree': '3 min',
        'categorie': 'Éducation financière', 'icone': '🎓',
        'titre': "L'éducation financière devient obligatoire au collège",
        'h1': "L'éducation financière devient <em>obligatoire</em> au collège",
        'meta_titre': "Passeport Educfi : l'éducation financière obligatoire en 4e",
        'meta_desc': ("Depuis septembre 2026, tous les élèves de 4e suivent le Passeport Educfi de "
                      "la Banque de France. Budget, crédit, épargne, arnaques : ce que couvre le "
                      "programme et pourquoi il arrive."),
        'lead': ("Tous les élèves de 4e suivent désormais le Passeport Educfi, piloté par la "
                 "Banque de France."),
        'corps': '''
      <p class="art-chapo">Depuis la rentrée de septembre 2026, tous les élèves de 4e en France suivent le <strong>Passeport Educfi</strong>, un dispositif piloté par la Banque de France et généralisé après plusieurs années d'expérimentation dans certains établissements.</p>

      <h2>Ce que les collégiens apprennent</h2>

      <p>Concrètement, les élèves abordent en classe :</p>

      <ul class="art-liste">
        <li>la gestion d'un budget</li>
        <li>le fonctionnement du crédit et de l'épargne</li>
        <li>la lecture d'un relevé de compte</li>
        <li>la protection contre les arnaques financières</li>
      </ul>

      <p>Le programme se conclut par une évaluation en mars, donnant lieu à une attestation officielle.</p>

      <h2>Pourquoi maintenant</h2>

      <p>Cette généralisation répond à un constat chiffré : selon l'OCDE, seuls <strong>52 % des jeunes Français</strong> maîtrisent les bases financières, contre une moyenne de <strong>71 %</strong> au niveau européen.</p>

      <p>Une extension du dispositif au lycée est déjà annoncée pour 2027.</p>

      <h2>Et après le collège ?</h2>

      <p>Chez Financia, on suit cette évolution avec attention. C'est exactement le vide qu'on essaie de combler après le collège, gratuitement, pour les 18-30 ans.</p>
''',
        # Pas de disclaimer boursier ici : l'article ne parle d'aucun titre ni
        # d'aucun placement, en coller un serait du bruit. On garde le même
        # traitement visuel avec une note de sources, qui elle est utile.
        'disclaimer': ("Sources : Banque de France pour le dispositif Passeport Educfi, OCDE pour "
                       "les chiffres de littératie financière. Cet article est informatif et ne "
                       "constitue pas un conseil en investissement."),
        'resume': ("Budget, crédit, épargne, arnaques : le Passeport Educfi est généralisé en 4e. "
                   "Seuls 52 % des jeunes Français maîtrisent les bases, contre 71 % en Europe."),
    },
]

# Le guide long, produit par build_article_blog.py, apparaît aussi au listing.
GUIDE = {
    'slug': 'placements-jeunes-actifs', 'date_iso': '2026-09-10',
    'date': '10 septembre 2026', 'duree': '5 min',
    'categorie': 'Épargne sans risque', 'icone': '🏦',
    'titre': 'Placements et épargne pour étudiants',
    'resume': ("Livret A, LDDS, LEP et Livret Jeune : ce que chacun permet, ses plafonds, "
               "sa fiscalité, et où s'arrête un livret quand on veut aller plus loin."),
}

# ── Coquille commune ──────────────────────────────────────────────────────
lignes = io.open(SOURCE, encoding='utf-8').read().split('\n')
i_body = next(i for i, l in enumerate(lignes) if l.startswith('<body'))
i_head = next(i for i, l in enumerate(lignes) if l.strip() == '</head>')
i_nav_fin = next(i for i, l in enumerate(lignes) if l.startswith('<!-- ═══ HERO'))
i_pied = next(i for i, l in enumerate(lignes) if l.startswith('<footer'))
GTAG = '\n'.join(lignes[46:i_head])
NAV_BRUT = '\n'.join(lignes[i_body:i_nav_fin])
# page-socle.js REMPLACE ressources.js, il ne le supprime pas : c'est lui
# qui appelle FinanciaI18N.initLang(). Sans cet appel, la classe
# i18n-ready n'est jamais posée et le voile anti-FOUC laisse la page
# en visibility:hidden, donc entièrement blanche. Il branche aussi le
# menu mobile et l'année du pied de page.
PIED = '\n'.join(lignes[i_pied:]).replace(
    '<script src="./ressources.js"></script>',
    '<script src="./page-socle.js"></script>')


def nav(classe_body, courant=False):
    n = NAV_BRUT.replace('<body class="ressources-page">', f'<body class="{classe_body}">')
    n = n.replace('<a href="/ressources" aria-current="page"', '<a href="/ressources"')
    if courant:
        n = n.replace('<a href="/blog" role="menuitem">Blog</a>',
                      '<a href="/blog" role="menuitem" aria-current="page">Blog</a>')
    return n


def tete(titre, desc, url, og_type, ld=''):
    return f'''<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{titre}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="./style.css" />

  <!-- i18n : chargé de façon bloquante pour éviter tout flash de contenu FR -->
  <style>html:not(.i18n-ready) body {{ visibility: hidden; }}</style>
  <script src="./i18n.js"></script>
  <script src="./i18n-core.js"></script>

  <meta name="description" content="{desc}" />
  <link rel="canonical" href="{url}" />
  <meta name="theme-color" content="#000000" />
  <link rel="icon" href="/images/icons/icon.svg" type="image/svg+xml" />
  <link rel="icon" href="/images/icons/icon-32.png" sizes="32x32" type="image/png" />

  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/images/icons/apple-touch-icon-180.png" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Financia" />

  <meta property="og:type" content="{og_type}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:title" content="{titre}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:image" content="https://financia.cloud/images/og-financia.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Financia, apprendre à investir sans jargon et sans conseil personnalisé" />
  <meta property="og:locale" content="fr_FR" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta property="twitter:title" content="{titre}" />
  <meta property="twitter:description" content="{desc}" />
  <meta name="twitter:image" content="https://financia.cloud/images/og-financia.png" />
{ld}
'''


def ld_article(a, url):
    return f'''
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org", "@type": "NewsArticle",
    "headline": "{a['titre']}",
    "description": "{a['meta_desc']}",
    "datePublished": "{a['date_iso']}", "dateModified": "{a['date_iso']}",
    "inLanguage": "fr-FR",
    "author": {{ "@type": "Organization", "name": "Financia", "url": "https://financia.cloud" }},
    "publisher": {{ "@type": "Organization", "name": "Financia",
      "logo": {{ "@type": "ImageObject", "url": "https://financia.cloud/images/icons/icon-512.png" }} }},
    "mainEntityOfPage": {{ "@type": "WebPage", "@id": "{url}" }}
  }}
  </script>
'''


def page_article(a):
    url = f"https://financia.cloud/blog/{a['slug']}"
    corps = f'''
<section class="page-hero">
  <div class="page-hero-bg-grid"></div>
  <div class="page-hero-glow page-hero-glow-1"></div>
  <div class="page-hero-glow page-hero-glow-2"></div>
  <div class="wrap page-hero-inner">
    <div class="hero-badge page-hero-badge">{a['categorie']}</div>
    <h1 class="page-hero-h1">{a['h1']}</h1>
    <p class="page-hero-lead">{a['lead']}</p>
    <p class="art-meta">Publié le {a['date']} &middot; Lecture {a['duree']}</p>
  </div>
</section>

<section class="section section-dark">
  <div class="wrap art-wrap">
    <article class="art-corps">
{a['corps']}
      <!-- Encadré de fin, volontairement dans le même traitement visuel que
           les avertissements des outils du site : fond distinct, bordure,
           pictogramme. Il doit se lire comme une rupture avec le corps de
           l'article, pas comme un paragraphe de plus. -->
      <div class="risque" role="note">
        <span class="risque-icone" aria-hidden="true">⚠️</span>
        <p>{a['disclaimer']}</p>
      </div>
    </article>

    <div class="art-suite">
      <h2 class="art-suite-titre">Continuer à comprendre</h2>
      <p>Le comparateur et le simulateur mettent ces notions en chiffres, sans engagement et sans compte.</p>
      <div class="art-suite-liens">
        <a class="btn-primary" href="/blog">Voir tous les articles</a>
        <a class="btn-secondaire" href="/comparateur">Ouvrir le comparateur</a>
      </div>
    </div>
  </div>
</section>
'''
    html = (tete(a['meta_titre'], a['meta_desc'], url, 'article', ld_article(a, url))
            + GTAG + '\n</head>\n' + nav('article-page') + '\n' + corps + '\n' + PIED)
    chemin = os.path.join(RACINE, f"blog-{a['slug']}.html")
    io.open(chemin, 'w', encoding='utf-8').write(absolus(html))
    return chemin


def carte(a):
    return f'''
        <article class="blog-carte">
          <a class="blog-carte-lien" href="/blog/{a['slug']}">
            <div class="blog-carte-haut">
              <span class="blog-icone" aria-hidden="true">{a['icone']}</span>
              <span class="res-cat">{a['categorie']}</span>
            </div>
            <h2 class="blog-carte-titre">{a['titre']}</h2>
            <p class="blog-carte-meta">{a['date']} &middot; {a['duree']}</p>
            <p class="blog-carte-resume">{a['resume']}</p>
            <span class="blog-carte-cta">Lire l'article <span aria-hidden="true">&rarr;</span></span>
          </a>
        </article>'''


def page_listing(tous):
    url = 'https://financia.cloud/blog'
    titre = "Blog Financia | Guides et actualités sur l'argent des jeunes"
    desc = ("Guides et actualités pour comprendre l'épargne, les placements et l'argent quand on a "
            "entre 18 et 30 ans. Gratuit, sans jargon, sans conseil personnalisé.")
    corps = f'''
<section class="page-hero">
  <div class="page-hero-bg-grid"></div>
  <div class="page-hero-glow page-hero-glow-1"></div>
  <div class="page-hero-glow page-hero-glow-2"></div>
  <div class="wrap page-hero-inner">
    <div class="hero-badge page-hero-badge">Blog</div>
    <h1 class="page-hero-h1">Comprendre l'argent, <em>un sujet à la fois</em></h1>
    <p class="page-hero-lead">Des guides et des actualités pour les 18-30 ans. Gratuit, sans jargon, et sans jamais te dire quoi faire de ton argent.</p>
  </div>
</section>

<section class="section section-dark">
  <div class="wrap">
    <div class="blog-grille">{''.join(carte(a) for a in tous)}
    </div>

    <div class="risque" role="note" style="margin-top:40px;">
      <span class="risque-icone" aria-hidden="true">⚠️</span>
      <p>Les articles publiés ici sont généraux et pédagogiques. Ils ne constituent ni un conseil en investissement, ni une recommandation de produit ou d'établissement. Investir comporte un risque de perte en capital.</p>
    </div>
  </div>
</section>
'''
    html = (tete(titre, desc, url, 'website') + GTAG + '\n</head>\n'
            + nav('blog-page', courant=True) + '\n' + corps + '\n' + PIED)
    io.open(os.path.join(RACINE, 'blog.html'), 'w', encoding='utf-8').write(absolus(html))


if __name__ == '__main__':
    for a in ARTICLES:
        print('  ', os.path.basename(page_article(a)))
    # Tri par date décroissante. À date égale, l'ordre du fichier tranche.
    tous = sorted(ARTICLES + [GUIDE], key=lambda a: a['date_iso'], reverse=True)
    page_listing(tous)
    print('   blog.html —', len(tous), 'articles :',
          ', '.join(a['date_iso'] for a in tous))
