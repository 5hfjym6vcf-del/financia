#!/usr/bin/env python3
"""Assemble public/guide.html, la page produit de l'ebook « La Recette Financière ».

Coquille reprise de ressources.html par repères de contenu, comme les pages
du blog, pour que navbar, pied de page et bloc Consent Mode restent
identiques au reste du site.

RÉPARTITION DU CONTENU
  Avertissement légal   en tête de page, avant tout le reste
  Introduction + M1 + M2 accès libre, lisibles sans compte ni paiement
  M3 + M4               titre et accroche visibles, corps verrouillé
  Fiche produit         bloc de vente

REFONTE DU 12 SEPTEMBRE 2026 : LE MODULE ADMINISTRATIF A ÉTÉ PURGÉ
La première version ouvrait sur les seuils de la micro-entreprise, l'ACRE et
la déclaration de chiffre d'affaires. Hors sujet : Financia est une plateforme
d'éducation financière PERSONNELLE pour les 18-30 ans, pas un guide de
création d'entreprise. Le retirer laissait le guide commencer par « investir »,
ce qui est l'ordre inverse du bon sens pour un lecteur qui n'a ni budget tenu
ni épargne de précaution. D'où la nouvelle progression :

  M1 Budget                  libre    (nouveau)
  M2 Épargne et aides        libre    (nouveau, absorbe les remises étudiantes)
  M3 Premiers investissements premium (ex-M2, passé en payant)
  M4 Ne pas se faire avoir    premium (ex-M4 fusionné avec le reste de l'ex-M3)

TOUS LES CHIFFRES SONT VÉRIFIÉS À LA SOURCE, PAS ÉCRITS DE MÉMOIRE
Les taux des livrets sont révisés deux fois par an, et deux aides au permis
ont été supprimées en 2026 : les citer de mémoire aurait publié des montants
faux dans un produit payant. Chaque chiffre du module 2 vient de
service-public.gouv.fr, consulté le 12 septembre 2026. Voir SOURCES en bas de
fichier pour la correspondance chiffre / fiche.

UNE CORRECTION APPORTÉE AU TEXTE FOURNI
Le tableau des enveloppes annonçait « Flat tax 30 % » pour le CTO, alors que
la ligne PEA du même tableau portait déjà 18,6 %. Le site entier est passé à
31,4 % (12,8 % d'impôt + 18,6 % de prélèvements sociaux, hausse de CSG du
PLFSS 2026). Ce tableau vit désormais dans le module 3, donc hors de la page.
"""
import io, os

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(RACINE, 'ressources.html')
CIBLE = os.path.join(RACINE, 'guide.html')

URL = 'https://financia.cloud/guide'
TITRE = "La Recette Financière | Le guide Financia pour reprendre le contrôle de son argent"
DESC = ("Budget, livrets réglementés, aides étudiantes, premiers investissements et "
        "arnaques : un guide en quatre modules pour les 18-30 ans. Les deux premiers "
        "modules sont en accès libre.")


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

  <!-- Le contenu du guide est en cours de refonte : le module administratif
       et fiscal, hors sujet pour une plateforme d'éducation financière
       personnelle, est remplacé par un socle budget puis épargne. La page
       reste accessible et liée depuis /ressources, mais n'a rien à faire dans
       les résultats de recherche tant que la version en ligne n'est pas celle
       qui restera. À RETIRER une fois la réécriture terminée, en même temps
       que l'ajout au sitemap et l'ouverture de la vente. -->
  <meta name="robots" content="noindex, follow" />

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

# Le corps de la page vit dans son propre fichier HTML et non dans une
# chaîne Python : le contenu contient des apostrophes et des guillemets en
# quantité, et une collision de délimiteurs a déjà cassé ce script deux
# fois. Un .html se relit et se corrige aussi directement dans un éditeur.
CORPS = io.open(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                             'guide_corps.html'), encoding='utf-8').read()

io.open(CIBLE, 'w', encoding='utf-8').write(absolus(
    TETE + GTAG + '\n</head>\n' + NAV + '\n' + CORPS + '\n' + PIED))
print('écrit : public/guide.html')
