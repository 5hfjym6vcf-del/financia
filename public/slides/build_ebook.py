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

UNE CORRECTION APPORTÉE AU TEXTE FOURNI
Le tableau des enveloppes annonçait « Flat tax 30 % » pour le CTO, alors que
la ligne PEA du même tableau portait déjà 18,6 %. Le site entier est passé à
31,4 % (12,8 % d'impôt + 18,6 % de prélèvements sociaux, hausse de CSG du
PLFSS 2026) : taux-config.js, i18n.js dans cinq langues, sigles.js et
l'article PEA. Laisser 30 % ici aurait recréé la contradiction corrigée deux
jours plus tôt, dans le produit payant.
"""
import io, os

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(RACINE, 'ressources.html')
CIBLE = os.path.join(RACINE, 'guide.html')

URL = 'https://financia.cloud/guide'
TITRE = "La Recette Financière | Le guide Financia pour reprendre le contrôle de son argent"
DESC = ("Micro-entreprise, ACRE, PEA, CTO, assurance-vie, arnaques : un guide en quatre "
        "modules pour les 18-30 ans. Les deux premiers modules sont en accès libre.")


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
    <p class="page-hero-lead">Le guide pas-à-pas pour reprendre le contrôle de ton argent, sans jargon et sans y passer ta vie. Les deux premiers modules sont en accès libre, ici même.</p>
  </div>
</section>

<section class="section section-dark">
  <div class="wrap art-wrap">

    <!-- Retour de paiement, rempli par ebook.js. Masqué par défaut. -->
    <div id="ebookRetour" class="ebook-retour" hidden></div>

    <!-- ═══ AVERTISSEMENT LÉGAL ═══
         En tête de page, avant le moindre contenu pédagogique. Placé plus
         bas, il se lirait comme une clause de style ; ici, il cadre la
         lecture de tout ce qui suit. -->
    <div class="ebook-avert" role="note">
      <div class="ebook-avert-tete">
        <span class="ebook-avert-icone" aria-hidden="true">⚠️</span>
        <h2 class="ebook-avert-titre">Avertissement légal</h2>
      </div>
      <p class="ebook-avert-chapeau">Ce guide est un contenu pédagogique et informatif. Il ne constitue en aucun cas un conseil en investissement personnalisé, une recommandation d'achat ou de vente d'instruments financiers, ni un conseil fiscal ou juridique individualisé.</p>
      <ul class="ebook-avert-liste">
        <li>Financia n'est pas un Conseiller en investissements financiers (CIF) et n'est pas habilité à formuler de recommandation adaptée à votre situation personnelle.</li>
        <li>Aucune méthode présentée ici ne garantit un résultat financier. Investir comporte un risque de perte en capital, partielle ou totale.</li>
        <li>Les informations fiscales et sociales (micro-entreprise, ACRE, fiscalité des enveloppes) sont données à titre général et à jour à la date de rédaction, septembre 2026. La réglementation évolue et peut avoir changé au moment où vous lisez ce guide. Vérifiez toujours l'information en vigueur sur <a href="https://www.service-public.fr" target="_blank" rel="noopener noreferrer">service-public.fr</a> ou auprès de l'Urssaf.</li>
        <li>Pour toute décision d'investissement ou de structuration fiscale personnelle, ce guide vous encourage explicitement à consulter un conseiller en gestion de patrimoine agréé, un expert-comptable ou votre banque.</li>
        <li>Ce document est un produit numérique. Conformément à l'article L221-28 du code de la consommation, le droit de rétractation ne s'applique pas dès lors que vous avez expressément consenti à un accès immédiat au contenu et renoncé à votre droit de rétractation au moment de l'achat.</li>
      </ul>
    </div>

    <!-- ═══ VERSION GRATUITE ═══ -->
    <div class="ebook-libre">
      <div class="ebook-libre-tete">
        <span class="ebook-pastille">Accès libre</span>
        <h2 class="ebook-h2">Introduction et deux premiers modules</h2>
        <p class="ebook-sous">À lire directement, sans compte et sans paiement.</p>
      </div>

      <article class="art-corps">

        <h2>Introduction</h2>

        <p class="art-chapo">Tu as sans doute déjà lu des dizaines d'articles sur « comment gérer son argent ». La plupart s'arrêtent à la théorie. Ce guide est pensé différemment, comme une recette de cuisine : chaque module donne les ingrédients, les notions à comprendre, les étapes dans l'ordre où les traiter, et le résultat attendu, ce que tu dois avoir mis en place à la fin.</p>

        <p>L'idée n'est pas de te promettre un chiffre précis. C'est de te faire gagner du temps : éviter les erreurs qui coûtent cher, une déclaration ratée, une offre de bienvenue jamais réclamée, une arnaque évitable, et te donner une méthode claire pour avancer, module après module.</p>

        <p>Une bonne partie de ce guide repose sur des dispositifs déjà existants et gratuits, comme l'ACRE, le cashback ou les remises étudiantes. L'objectif est de te les faire utiliser correctement, pas de te vendre un secret qui n'existe pas.</p>

        <h2>Module 1 &middot; La recette administrative et fiscale</h2>

        <h3>Ingrédient 1 : les seuils de la micro-entreprise</h3>

        <p>Si tu envisages une activité complémentaire, freelance, vente ou prestation de service, le régime micro-entreprise est généralement le plus simple pour démarrer.</p>

        <div class="part-table-boite">
          <table class="part-table art-table">
            <caption class="sr-only">Plafonds de chiffre d'affaires du régime micro-entreprise</caption>
            <thead>
              <tr><th scope="col">Type d'activité</th><th scope="col">Plafond de chiffre d'affaires annuel HT</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row" class="part-td-nom">Vente de marchandises, hébergement</th><td>203 100 €</td></tr>
              <tr><th scope="row" class="part-td-nom">Prestations de services (BIC/BNC)</th><td>83 600 €</td></tr>
              <tr><th scope="row" class="part-td-nom">Location de meublés de tourisme non classés</th><td>15 000 €</td></tr>
            </tbody>
          </table>
        </div>

        <p>Un dépassement une seule année ne fait pas sortir du régime : il faut un dépassement sur <strong>deux années consécutives</strong> pour basculer vers un régime réel.</p>

        <div class="risque risque-info" role="note">
          <span class="risque-icone" aria-hidden="true">&#128161;</span>
          <p><strong>Attention à la franchise de TVA</strong>, qui est différente des plafonds de chiffre d'affaires : 85 000 € pour la vente, 37 500 € pour les services. Au-delà, tu factures avec TVA, même en restant micro-entrepreneur.</p>
        </div>

        <h3>Ingrédient 2 : le dispositif ACRE</h3>

        <p>L'ACRE, aide à la création ou reprise d'entreprise, réduit les cotisations sociales la première année.</p>

        <p><strong>Ce qui a changé en 2026</strong> : l'ACRE n'est plus automatique. La demande se fait auprès de l'Urssaf <strong>dans les 60 jours</strong> suivant le début de l'activité. Sans cette démarche, aucune exonération n'est accordée.</p>

        <p>Le niveau d'exonération diffère aussi selon la date de création :</p>

        <div class="part-table-boite">
          <table class="part-table art-table">
            <caption class="sr-only">Taux d'exonération ACRE selon la date de création</caption>
            <thead>
              <tr><th scope="col">Date de création</th><th scope="col">Taux d'exonération</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row" class="part-td-nom">Avant le 1<sup>er</sup> juillet 2026</th><td>50 % des cotisations</td></tr>
              <tr><th scope="row" class="part-td-nom">À partir du 1<sup>er</sup> juillet 2026</th><td class="art-td-fort">25 % des cotisations</td></tr>
            </tbody>
          </table>
        </div>

        <p><strong>Étape concrète</strong> : si tu envisages de créer une activité dans les mois qui viennent, vérifie la date charnière du 1<sup>er</sup> juillet. Elle change significativement le montant de l'exonération.</p>

        <h3>Ingrédient 3 : déclarer sans se faire piéger</h3>

        <ul class="art-liste">
          <li>Déclare ton chiffre d'affaires <strong>encaissé</strong>, et non facturé, sur la période concernée</li>
          <li>Conserve une trace de chaque facture et de chaque encaissement. En cas de contrôle, c'est ce qui te protège</li>
          <li>Ne confonds jamais optimisation fiscale légale et dissimulation : ce guide ne couvre que des dispositifs officiels, déclarés</li>
        </ul>

        <p class="ebook-resultat"><strong>Résultat attendu à la fin de ce module.</strong> Tu sais dans quelle case tu te situes, seuils et ACRE, et tu as identifié la date limite ACRE si elle te concerne.</p>

        <h2>Module 2 &middot; La recette de l'investissement</h2>

        <h3>Étape 1 : bilan de situation et prise de rendez-vous</h3>

        <p>Avant tout placement, fais un point simple : tes revenus, tes charges fixes, ton épargne de précaution déjà constituée, idéalement trois à six mois de dépenses sur un <a href="/blog/placements-jeunes-actifs">livret disponible</a>.</p>

        <p><strong>Une fois ce bilan fait, prends rendez-vous avec un conseiller agréé</strong>, ta banque, un CGP ou un CIF, pour valider ta situation avant tout placement. Ce guide explique les mécanismes, pas ta situation personnelle, qu'un professionnel est seul habilité à évaluer.</p>

        <h3>Étape 2 : comprendre les enveloppes fiscales</h3>

        <div class="part-table-boite">
          <table class="part-table art-table">
            <caption class="sr-only">Comparaison du PEA, du compte-titres ordinaire et de l'assurance-vie</caption>
            <thead>
              <tr><th scope="col">Enveloppe</th><th scope="col">Fiscalité</th><th scope="col">Univers d'investissement</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row" class="part-td-nom"><a href="/blog/pea-explique-simplement">PEA</a></th><td>Exonération d'impôt sur le revenu après 5 ans, 18,6 % de prélèvements sociaux restants</td><td>Actions européennes, ETF éligibles</td></tr>
              <tr><th scope="row" class="part-td-nom">CTO <span class="art-cond">(compte-titres ordinaire)</span></th><td>Flat tax 31,4 % dès le premier euro, sans condition de durée</td><td>Univers mondial, sans plafond</td></tr>
              <tr><th scope="row" class="part-td-nom">Assurance-vie</th><td>Fiscalité dégressive avec la durée, avantageuse après 8 ans</td><td>Fonds euros et unités de compte</td></tr>
            </tbody>
          </table>
        </div>

        <p>Chaque enveloppe répond à un objectif différent : le PEA pour investir en actions européennes sur le long terme, le CTO pour un univers plus large sans plafond, l'assurance-vie pour la transmission et la diversification.</p>

        <h3>Étape 3 : comprendre les ETF et la diversification</h3>

        <p>Un <a href="/blog/etf-debutant">ETF</a>, fonds indiciel coté, regroupe automatiquement plusieurs entreprises en un seul produit, par exemple un indice comme le CAC 40 ou le MSCI World. Ce guide ne recommande <strong>aucun ETF ni aucune action en particulier</strong> : c'est un mécanisme à comprendre, la sélection d'un support précis relève d'un conseiller agréé ou de ta propre recherche approfondie.</p>

        <p>Ce qui compte à retenir : <strong>la diversification répartit le risque, elle ne l'annule pas</strong>.</p>

        <h3>Étape 4 : automatiser sa discipline d'épargne</h3>

        <p>La régularité compte souvent plus que le montant. Un virement automatique programmé le jour de la paie, vers le support d'épargne ou d'investissement choisi, retire la question « est-ce que j'ai envie ce mois-ci ? ». Tu investis avant de pouvoir dépenser. C'est aussi ce que montre le guide sur les <a href="/blog/interets-composes">intérêts composés</a>.</p>

        <p class="ebook-resultat"><strong>Résultat attendu à la fin de ce module.</strong> Tu comprends la logique des trois enveloppes principales et le principe d'un ETF, et tu as un rendez-vous pris, ou prévu, avec un professionnel avant toute décision.</p>

      </article>
    </div>

    <!-- ═══ MODULES VERROUILLÉS ═══
         Titre et accroche visibles, corps absent du HTML. Un contenu
         seulement masqué en CSS se lirait dans le code source de la page :
         ce qui n'est pas payé n'est tout simplement pas envoyé. -->
    <div class="ebook-verrou">
      <div class="ebook-libre-tete">
        <span class="ebook-pastille ebook-pastille-premium">Version complète</span>
        <h2 class="ebook-h2">Les deux modules suivants</h2>
        <p class="ebook-sous">Inclus dans le PDF, avec les deux premiers.</p>
      </div>

      <div class="ebook-verrou-grille">

        <article class="ebook-module-bloque">
          <span class="ebook-cadenas" aria-hidden="true">🔒</span>
          <h3 class="ebook-module-titre">Module 3 &middot; La recette de l'optimisation budgétaire</h3>
          <p class="ebook-module-accroche">Offres de bienvenue bancaires, cashback, remises étudiantes : ce qui existe réellement, à quelles conditions, et comment chiffrer un gain annuel honnête plutôt qu'un chiffre en l'air.</p>
        </article>

        <article class="ebook-module-bloque">
          <span class="ebook-cadenas" aria-hidden="true">🔒</span>
          <h3 class="ebook-module-titre">Module 4 &middot; Sécurisation et gestion des risques</h3>
          <p class="ebook-module-accroche">Les signaux d'alerte d'une arnaque financière, et où vérifier l'enregistrement réglementaire d'un intermédiaire avant de lui confier le moindre euro.</p>
        </article>

      </div>
    </div>

    <!-- ═══ BLOC DE VENTE ═══ -->
    <div class="ebook-offre">
      <!-- Pastille volontairement différente de celle des modules verrouillés
           juste au-dessus : deux « Version complète » qui se suivent se
           liraient comme une répétition, pas comme deux blocs distincts. -->
      <div class="ebook-offre-tete">
        <span class="ebook-pastille ebook-pastille-premium">L'offre</span>
        <h2 class="ebook-h2">La Recette Financière</h2>
      </div>

      <p class="ebook-accroche">Le guide pas-à-pas pour reprendre le contrôle de ton argent, sans jargon, sans y passer ta vie.</p>

      <p class="ebook-offre-sous"><strong>Tu n'as jamais eu de cours d'éducation financière. Ce guide comble ce vide, une étape à la fois.</strong> Pas de blabla théorique : une méthode claire, module par module, pour comprendre l'administratif, structurer une approche d'épargne réfléchie, optimiser ton budget légalement et éviter les pièges qui coûtent cher.</p>

      <h3 class="ebook-benefices-titre">Ce que tu repars avec</h3>
      <ul class="ebook-benefices">
        <li>Une checklist claire des seuils et dispositifs 2026, micro-entreprise et ACRE, à jour, pas une info périmée trouvée au hasard sur un forum</li>
        <li>La méthode pas-à-pas pour comprendre PEA, CTO et assurance-vie, sans avoir besoin d'un lexique à côté</li>
        <li>Un calcul concret pour chiffrer ton gain réel via offres de bienvenue, cashback et remises étudiantes</li>
        <li>Les signaux d'alerte pour repérer une arnaque financière avant qu'il ne soit trop tard</li>
        <li>Un contenu 100 % pédagogique : zéro recommandation d'actif, zéro conflit d'intérêt</li>
      </ul>

      <div class="ebook-nonest">
        <h3 class="ebook-benefices-titre">Ce que ce guide n'est pas</h3>
        <p>Ce n'est pas un conseil personnalisé. Ce n'est pas une martingale. C'est une base solide pour comprendre, avant de décider, avec toujours la recommandation d'en parler à un professionnel agréé pour toute décision qui t'engage.</p>
      </div>

      <div class="ebook-prix-zone">
        <span id="ebookPrix" class="ebook-prix">9,90&nbsp;&euro;</span>
        <span id="ebookTva" class="ebook-tva" hidden></span>
      </div>
      <p class="ebook-prix-note">Prix arr&ecirc;t&eacute;. La vente n'est pas encore ouverte.</p>

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
        Télécharger le guide
      </button>
      <p id="ebookEtat" class="ebook-etat" hidden></p>

      <p class="ebook-mentions">
        Paiement par carte, traité par Stripe. Financia ne voit ni ne conserve tes coordonnées bancaires.
        Une question&nbsp;: <a href="mailto:financiacloud@gmail.com">financiacloud@gmail.com</a>.
      </p>
    </div>

    <!-- Sources citées par le module 4, vérifiables sans acheter le guide. -->
    <div class="sources-block">
      <p class="sources-titre">Vérifier un intermédiaire</p>
      <ul class="sources-liste">
        <li><a href="https://www.regafi.fr" target="_blank" rel="noopener noreferrer">Regafi, registre des agents financiers</a></li>
        <li><a href="https://www.amf-france.org/fr/espace-epargnants" target="_blank" rel="noopener noreferrer">AMF, espace épargnants</a></li>
        <li><a href="https://www.service-public.fr" target="_blank" rel="noopener noreferrer">Service-Public.fr, seuils et régimes en vigueur</a></li>
      </ul>
    </div>

    <div class="risque" role="note">
      <span class="risque-icone" aria-hidden="true">⚠️</span>
      <p>Contenu pédagogique. Il ne constitue ni un conseil en investissement, ni une recommandation personnalisée, ni une promesse de résultat. Financia n'est pas conseiller en investissements financiers, ne gère aucun fonds et n'est pas intermédiaire en opérations de banque. Investir comporte un risque de perte en capital.</p>
    </div>

  </div>
</section>
'''

io.open(CIBLE, 'w', encoding='utf-8').write(absolus(
    TETE + GTAG + '\n</head>\n' + NAV + '\n' + CORPS + '\n' + PIED))
print('écrit : public/guide.html')
