#!/usr/bin/env python3
"""Assemble public/cgv.html, les conditions générales de vente.

Coquille reprise de ressources.html par repères de contenu (même procédé que
build_ebook.py et build_blog.py) : navbar, pied de page et bloc Consent Mode
restent strictement identiques au reste du site.

Mise en page calquée sur mentions-legales.html : .legal-section, .legal-bloc,
.legal-vf, .legal-note. Aucune classe nouvelle hormis les marqueurs de champ
manquant, .legal-vide et .legal-vide-bloc.

CHAMPS ENCORE VIDES
Le document de travail comporte des crochets [à compléter]. Ils sont rendus
comme des marqueurs visibles et sobres plutôt que comme du texte inventé ou
un blanc : un visiteur voit qu'une information manque, la mise en page tient,
et aucune mention fausse n'est publiée. Liste tenue à jour dans CHAMPS_VIDES
ci-dessous, reprise telle quelle dans l'encadré de tête.

ARTICLE 6, COHÉRENCE AVEC /guide
Le texte de la case de renonciation est repris MOT POUR MOT de public/guide.html
(constante CASE_RENONCIATION). Deux formulations différentes du même engagement
légal seraient une faille : c'est ce texte précis que l'acheteur valide, et
c'est celui que les CGV doivent reproduire. Toute retouche sur l'une des deux
pages doit être reportée sur l'autre.

PAS D'ENTRÉE AU SITEMAP
Même règle que /guide : la page n'y entre qu'une fois complète. Comme elle est
liée depuis le pied de page des 22 pages du site, l'absence du sitemap ne
suffirait pas à la tenir hors index : le noindex ci-dessous s'en charge, et
part le jour où les champs sont remplis.
"""
import io, os

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(RACINE, 'ressources.html')
CIBLE = os.path.join(RACINE, 'cgv.html')

URL = 'https://financia.cloud/cgv'
TITRE = "Financia | Conditions générales de vente"
DESC = ("Conditions générales de vente des contenus numériques proposés par Financia : "
        "prix, paiement, livraison, absence de droit de rétractation et médiation.")

# Repris mot pour mot de public/guide.html (#ebookRenonciation).
CASE_RENONCIATION = (
    "Je demande que le guide me soit fourni immédiatement après le paiement, "
    "et je reconnais qu'en conséquence je perds mon droit de rétractation de "
    "quatorze jours, conformément à l'article L221-28 13° du code de la "
    "consommation."
)

CHAMPS_VIDES = [
    "l'identité de l'éditeur (nom, SIRET, adresse du siège), article 1",
    "la mention de TVA applicable, article 3",
    "le nom et les coordonnées du médiateur de la consommation, article 11",
    "la date de dernière mise à jour",
]


def absolus(html):
    return html.replace('src="./', 'src="/').replace('href="./', 'href="/')


def vide(libelle):
    """Marqueur inline pour un champ non renseigné."""
    return (f'<span class="legal-vide" role="note" '
            f'aria-label="Information à compléter : {libelle}">à compléter</span>')


lignes = io.open(SOURCE, encoding='utf-8').read().split('\n')
i_body = next(i for i, l in enumerate(lignes) if l.startswith('<body'))
i_head = next(i for i, l in enumerate(lignes) if l.strip() == '</head>')
i_nav_fin = next(i for i, l in enumerate(lignes) if l.startswith('<!-- ═══ HERO'))
i_pied = next(i for i, l in enumerate(lignes) if l.startswith('<footer'))

GTAG = '\n'.join(lignes[46:i_head])
NAV = '\n'.join(lignes[i_body:i_nav_fin]) \
    .replace('<body class="ressources-page">', '<body class="legal-page">') \
    .replace('<a href="/ressources" aria-current="page"', '<a href="/ressources"')
PIED = '\n'.join(lignes[i_pied:]) \
    .replace('<script src="./ressources.js"></script>',
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

  <!-- Page liée depuis le pied de page des 22 pages du site : sans noindex,
       les moteurs l'indexeraient malgré son absence du sitemap. Des CGV
       incomplètes n'ont rien à faire dans les résultats de recherche.
       À RETIRER en même temps que l'ajout au sitemap, le jour où les champs
       [à compléter] sont renseignés. « follow » est conservé pour que les
       liens sortants de la page gardent leur valeur. -->
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
'''

liste_vides = '\n'.join(f'        <li>{c}</li>' for c in CHAMPS_VIDES)


CORPS = f'''
<!-- ═══ HERO ═══ -->
<section class="page-hero">
  <div class="page-hero-bg-grid"></div>
  <div class="page-hero-glow page-hero-glow-1"></div>
  <div class="page-hero-glow page-hero-glow-2"></div>
  <div class="wrap page-hero-inner">
    <div class="hero-badge page-hero-badge">⚖️ Légal</div>
    <h1 class="page-hero-h1">Conditions générales <em>de vente</em></h1>
    <p class="page-hero-lead">Ce qui s'applique aux contenus numériques vendus sur Financia : prix, paiement, livraison, rétractation et médiation.</p>
  </div>
</section>

<section class="legal-section">
  <div class="wrap">

    <p class="legal-vf">Cette page est rédigée en français, seule version faisant foi. Dernière mise à jour : {vide("date de publication")}</p>

    <!-- Avertissement en tête, et non en note de bas de page : un visiteur doit
         savoir avant de lire que ce texte n'est pas encore opposable.
         Structure strictement identique aux autres .risque du site, icône puis
         un seul paragraphe : y imbriquer une liste casserait l'alignement et
         ferait hériter la couleur ambre au reste. -->
    <div class="risque risque-large" role="note">
      <span class="risque-icone" aria-hidden="true">⚠️</span>
      <p><strong>Document en cours de finalisation.</strong> Aucune vente n'est ouverte à ce jour sur Financia : ces conditions ne s'appliquent à aucune commande et ne sont opposables à personne. Elles sont publiées par transparence, avant l'ouverture de la vente.</p>
    </div>

    <div class="legal-vide-bloc" role="note">
      <p><strong>Informations encore manquantes</strong>, signalées dans le texte par la mention « à compléter » :</p>
      <ul class="legal-liste">
{liste_vides}
      </ul>
    </div>

    <div class="legal-bloc">
      <h2>Article 1 &middot; Objet et champ d'application</h2>
      <p>Les présentes Conditions Générales de Vente (CGV) régissent les ventes de produits numériques (e-books, guides) proposés sur le site Financia.cloud. Le vendeur est&nbsp;:</p>
      <!-- Identité présentée en liste plutôt qu'en phrase : les marqueurs
           terminent chacun leur ligne, aucune virgule ne vient se détacher
           du contour en pointillés. -->
      <ul class="legal-liste">
        <li>Nom ou raison sociale &middot; {vide("nom ou raison sociale")}</li>
        <li>Numéro SIRET &middot; {vide("numéro SIRET")}</li>
        <li>Siège social &middot; {vide("adresse du siège")}</li>
      </ul>
      <p>Toute commande passée sur le site implique l'acceptation sans réserve des présentes CGV.</p>
      <p class="legal-note">L'identité de l'éditeur du site, distincte de celle du vendeur tant que le statut n'est pas créé, figure dans les <a href="/mentions-legales" class="legal-lien">mentions légales</a>.</p>
    </div>

    <div class="legal-bloc">
      <h2>Article 2 &middot; Produits proposés</h2>
      <p>Financia.cloud propose des contenus numériques à visée pédagogique et informative (guides, e-books) relatifs à l'éducation financière et à la gestion budgétaire personnelle.</p>
      <p><strong>Ces contenus ne constituent en aucun cas un conseil en investissement personnalisé, un conseil fiscal ou juridique individualisé.</strong> Ils sont fournis à titre pédagogique et général. Pour toute décision engageant votre situation personnelle, il vous est recommandé de consulter un professionnel agréé (conseiller en gestion de patrimoine, expert-comptable, conseiller en investissements financiers).</p>
    </div>

    <div class="legal-bloc">
      <h2>Article 3 &middot; Prix</h2>
      <p>Les prix sont indiqués en euros, toutes taxes comprises. Mention de TVA applicable &middot; {vide("régime de TVA")}</p>
      <p>Financia.cloud se réserve le droit de modifier ses prix à tout moment. Le prix applicable est celui en vigueur au moment de la validation de la commande.</p>
    </div>

    <div class="legal-bloc">
      <h2>Article 4 &middot; Commande et paiement</h2>
      <p>La commande est validée après paiement intégral du prix, via la solution de paiement sécurisée Stripe. Financia.cloud ne collecte ni ne conserve aucune donnée bancaire du client ; ces données sont traitées exclusivement par Stripe, conformément à sa propre politique de confidentialité.</p>
    </div>

    <div class="legal-bloc">
      <h2>Article 5 &middot; Livraison et accès au contenu</h2>
      <p>Le produit numérique est mis à disposition du client <strong>immédiatement après confirmation du paiement</strong>, via un lien de téléchargement.</p>
    </div>

    <div class="legal-bloc">
      <h2>Article 6 &middot; Absence de droit de rétractation</h2>
      <p>Conformément à l'article L221-28 13° du code de la consommation, <strong>le droit de rétractation ne peut être exercé pour les contenus numériques non fournis sur un support matériel dont l'exécution a commencé après accord préalable et exprès du consommateur, et renoncement exprès à son droit de rétractation.</strong></p>
      <p>Au moment de la commande, le client doit cocher explicitement une case, non pré-cochée, confirmant sa demande d'accès immédiat et sa renonciation à ce droit. Sans cette action explicite, la commande ne peut être finalisée.</p>
      <p class="legal-note">Texte exact de la case à cocher, tel qu'il figure sur la page de commande :</p>
      <blockquote class="legal-citation">
        <p>☐ {CASE_RENONCIATION}</p>
      </blockquote>
    </div>

    <div class="legal-bloc">
      <h2>Article 7 &middot; Politique de non-remboursement</h2>
      <p><strong>Compte tenu de la nature numérique du produit et de la renonciation expresse au droit de rétractation prévue à l'article 6, aucun remboursement ni échange ne pourra être accordé une fois l'accès au contenu délivré.</strong></p>
      <p>Cette clause s'applique sans préjudice des dispositions légales impératives, notamment en cas de non-conformité du produit livré ou de défaut technique empêchant l'accès au contenu, cas dans lesquels le client conserve ses droits légaux.</p>
    </div>

    <div class="legal-bloc">
      <h2>Article 8 &middot; Propriété intellectuelle</h2>
      <p>Le contenu vendu (textes, mise en page, structure) est protégé par le droit d'auteur. Le client bénéficie d'un droit d'usage strictement personnel. Toute reproduction, diffusion ou revente, même partielle, est interdite sans autorisation écrite préalable.</p>
    </div>

    <div class="legal-bloc">
      <h2>Article 9 &middot; Responsabilité</h2>
      <p>Le contenu est fourni à titre informatif. Financia.cloud ne saurait être tenu responsable des décisions financières prises par le client sur la base des informations contenues dans le guide. Le client reste seul responsable de ses choix, et est encouragé à consulter un professionnel agréé avant toute décision d'investissement.</p>
    </div>

    <div class="legal-bloc">
      <h2>Article 10 &middot; Données personnelles</h2>
      <p>Les données collectées lors de la commande, l'adresse email notamment, sont utilisées exclusivement pour la gestion de la commande et l'envoi du contenu.</p>
      <p>Le détail des traitements, des bases légales, des durées de conservation et de vos droits au titre du RGPD figure dans la <a href="/confidentialite" class="legal-lien">politique de confidentialité &rarr;</a></p>
    </div>

    <div class="legal-bloc">
      <h2>Article 11 &middot; Médiation de la consommation</h2>
      <p>Conformément aux articles L. 616-1 et R. 616-1 du code de la consommation, en cas de litige non résolu directement avec Financia.cloud, le client peut recourir gratuitement à un médiateur de la consommation.</p>
      <div class="legal-vide-bloc" role="note">
        <p><strong>Nom et coordonnées du médiateur : à compléter.</strong> L'adhésion à un médiateur de la consommation est une obligation légale pour tout professionnel vendant à des consommateurs en France. Elle doit être souscrite avant l'ouverture de la vente.</p>
      </div>
    </div>

    <div class="legal-bloc">
      <h2>Article 12 &middot; Droit applicable et juridiction</h2>
      <p>Les présentes CGV sont soumises au droit français. En cas de litige, et à défaut de résolution amiable ou via le médiateur mentionné à l'article 11, les tribunaux français compétents seront seuls saisis.</p>
    </div>

    <div class="legal-bloc">
      <h2>Contact</h2>
      <p>Pour toute question relative à ces conditions : <a href="mailto:financiacloud@gmail.com" class="legal-lien">financiacloud@gmail.com</a></p>
      <p><a href="/mentions-legales" class="legal-lien">Mentions légales &rarr;</a></p>
    </div>

  </div>
</section>
'''

io.open(CIBLE, 'w', encoding='utf-8').write(absolus(
    TETE + GTAG + '\n</head>\n' + NAV + '\n' + CORPS + '\n' + PIED))
print('écrit : public/cgv.html')
print('champs vides :', len(CHAMPS_VIDES))
