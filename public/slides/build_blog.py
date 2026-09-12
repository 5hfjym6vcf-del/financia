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
        'slug': 'etf-debutant',
        'date_iso': '2026-09-11', 'date': '11 septembre 2026', 'duree': '6 min',
        'categorie': 'Guide', 'icone': '📊',
        'perenne': True,
        'titre': 'Les ETF expliqués simplement',
        'h1': 'Les ETF <em>expliqués simplement</em>',
        'meta_titre': "ETF débutant : comment investir dans des centaines d'entreprises en un clic",
        'meta_desc': "Ce qu'est un ETF, comment lire son TER, les grandes familles et la différence avec une action individuelle. Le guide pour débuter, sans jargon.",
        'lead': "Comment investir dans des centaines d'entreprises en une seule opération, ce que coûte un ETF, et ce qu'il ne garantit pas.",
        'sources': [
            ('AMF, espace épargnants : définitions réglementaires des produits financiers', 'https://www.amf-france.org/fr/espace-epargnants'),
        ],
        'corps': '''
      <p class="art-chapo">Tu as sûrement déjà entendu ce terme sans savoir exactement ce qu'il recouvre. Voici ce qu'est un <strong>ETF</strong>, sans jargon.</p>

      <h2>Qu'est-ce qu'un ETF ?</h2>

      <p><strong>ETF</strong> signifie <em>Exchange Traded Fund</em>, ou <strong>fonds indiciel coté</strong> en français. Concrètement, c'est un panier qui regroupe automatiquement des dizaines, des centaines, voire des milliers d'entreprises, et que tu achètes en une seule opération, comme une action classique.</p>

      <p>Plutôt que de choisir toi-même chaque entreprise dans laquelle investir, un ETF <strong>réplique un indice</strong> existant : le CAC 40 (les 40 plus grandes entreprises françaises), le S&amp;P 500 (les 500 plus grandes entreprises américaines), ou le MSCI World (plus de 1 500 entreprises dans le monde entier).</p>

      <h2>Pourquoi les ETF reviennent souvent quand on débute</h2>

      <ul class="art-liste">
        <li><strong>La diversification automatique.</strong> En achetant un seul ETF MSCI World, tu es exposé à des milliers d'entreprises de secteurs et de pays différents. Si une entreprise se porte mal, elle ne pèse qu'une infime partie de l'ensemble, contrairement à une action individuelle où tout repose sur une seule société.</li>
        <li><strong>Des frais généralement bas.</strong> Les ETF sont majoritairement des fonds <em>passifs</em> : ils suivent un indice sans intervention humaine active, ce qui réduit fortement leurs frais de gestion comparé à des fonds gérés activement.</li>
        <li><strong>La simplicité.</strong> Un seul achat suffit pour obtenir une exposition large, plutôt que de sélectionner et suivre individuellement plusieurs dizaines d'entreprises.</li>
      </ul>

      <h2>Comment lire les frais d'un ETF : le TER</h2>

      <p>Le <strong>TER</strong> (<em>Total Expense Ratio</em>, ou ratio de frais total) est le pourcentage annuel prélevé sur ton investissement pour couvrir les frais de gestion du fonds. Il est directement déduit de la performance de l'ETF : tu ne le paies pas séparément, mais il réduit mécaniquement ton rendement.</p>

      <p>Un TER bas, souvent en dessous de 0,5 % pour les grands indices comme le S&amp;P 500 ou le MSCI World, est généralement recherché : sur le long terme, même un petit écart de frais a un effet cumulatif important.</p>

      <h2>Les grandes familles d'ETF</h2>

      <ul class="art-liste">
        <li><strong>ETF actions monde.</strong> Exposition très large, par exemple le MSCI World, pour une diversification maximale.</li>
        <li><strong>ETF sectoriels.</strong> Concentrés sur un secteur précis, technologie, santé, énergie, donc moins diversifiés.</li>
        <li><strong>ETF obligataires.</strong> Composés d'obligations plutôt que d'actions, généralement moins volatils.</li>
        <li><strong>ETF éligibles au <a href="/blog/pea-explique-simplement">PEA</a>.</strong> Certains ETF dits « synthétiques » répliquent des indices internationaux tout en restant éligibles à cette enveloppe fiscale.</li>
      </ul>

      <h2>ETF ou action individuelle : quelle différence ?</h2>

      <div class="part-table-boite">
        <table class="part-table art-table">
          <caption class="sr-only">Comparaison entre une action individuelle et un ETF</caption>
          <thead>
            <tr><th scope="col"></th><th scope="col">Action individuelle</th><th scope="col">ETF</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row" class="part-td-nom">Diversification</th><td>Une seule entreprise</td><td>Des dizaines à des milliers</td></tr>
            <tr><th scope="row" class="part-td-nom">Risque</th><td>Concentré sur une société</td><td>Réparti sur l'ensemble de l'indice</td></tr>
            <tr><th scope="row" class="part-td-nom">Suivi nécessaire</th><td>Analyser chaque entreprise</td><td>Suivre la tendance de l'indice</td></tr>
            <tr><th scope="row" class="part-td-nom">Frais</th><td>Courtage à l'achat et à la vente</td><td>Courtage, plus le TER annuel</td></tr>
          </tbody>
        </table>
      </div>

      <p>Ni l'un ni l'autre n'est « meilleur » dans l'absolu. Cela dépend de ton objectif, du temps dont tu disposes pour te former, et de ta tolérance au risque.</p>

      <h2>En résumé</h2>

      <p>Les ETF permettent d'investir de façon diversifiée sans choisir soi-même chaque entreprise, avec des frais généralement contenus. Comme tout placement en actions, ils comportent un <strong>risque de perte en capital</strong> : ce n'est pas un placement sans risque comme un <a href="/blog/placements-jeunes-actifs">livret réglementé</a>.</p>
''',
        'disclaimer': "Cet article est informatif et pédagogique. Il ne constitue ni un conseil ni une recommandation d'investissement personnalisée. Investir comporte un risque de perte en capital.",
        'resume': "Diversification, TER, familles d'ETF et comparaison avec l'action individuelle. Ce qu'un ETF apporte, et le risque qu'il ne supprime pas.",
    },
    {
        'slug': 'interets-composes',
        'date_iso': '2026-09-11', 'date': '11 septembre 2026', 'duree': '4 min',
        'categorie': 'Guide', 'icone': '📈',
        'perenne': True,
        'titre': 'Les intérêts composés',
        'h1': 'Les intérêts composés : pourquoi <em>commencer tôt</em> change la donne',
        'meta_titre': 'Intérêts composés : pourquoi commencer tôt change vraiment la donne',
        'meta_desc': "Intérêts simples ou composés, l'écart sur 30 ans, et pourquoi la durée pèse souvent plus que le montant investi. Expliqué avec un exemple chiffré.",
        'lead': 'Tes gains produisent eux-mêmes des gains. Ce que ça donne sur dix, vingt et trente ans, et ce que ça ne garantit pas.',
        'sources': [
            ("Exemple mathématique illustratif calculé pour cet article, à taux fixe de 5 %. Aucune source externe, aucun placement réel n'est décrit.", None),
        ],
        'corps': '''
      <p class="art-chapo">C'est un concept simple sur le papier, mais dont l'effet réel surprend presque toujours. Voici comment ça marche.</p>

      <h2>Le principe en une phrase</h2>

      <p>Les intérêts composés, c'est le fait que <strong>tes gains génèrent eux-mêmes des gains</strong>, année après année, plutôt que de rester figés.</p>

      <p>Avec des intérêts simples, seul ton capital de départ produit des gains chaque année. Avec des intérêts composés, les gains de l'année précédente s'ajoutent au capital et produisent, à leur tour, de nouveaux gains l'année suivante.</p>

      <h2>Un exemple pour visualiser</h2>

      <p>Imaginons un placement à 5 % de rendement annuel, sans aucun versement supplémentaire :</p>

      <div class="part-table-boite">
        <table class="part-table art-table">
          <caption class="sr-only">Comparaison illustrative entre intérêts simples et intérêts composés sur 30 ans</caption>
          <thead>
            <tr><th scope="col">Année</th><th scope="col">Avec intérêts simples</th><th scope="col">Avec intérêts composés</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row" class="part-td-nom">Départ</th><td>1 000 €</td><td>1 000 €</td></tr>
            <tr><th scope="row" class="part-td-nom">Après 10 ans</th><td>1 500 €</td><td class="art-td-fort">1 629 €</td></tr>
            <tr><th scope="row" class="part-td-nom">Après 20 ans</th><td>2 000 €</td><td class="art-td-fort">2 653 €</td></tr>
            <tr><th scope="row" class="part-td-nom">Après 30 ans</th><td>2 500 €</td><td class="art-td-fort">4 322 €</td></tr>
          </tbody>
        </table>
      </div>
      <p class="art-note-table">Exemple purement illustratif, à taux fixe de 5 %, à but pédagogique. Aucun placement ne garantit un rendement constant.</p>

      <p>L'écart entre les deux se creuse progressivement, puis s'accélère avec le temps. C'est tout l'intérêt, au sens propre, de laisser un placement fructifier sur une longue durée.</p>

      <h2>Pourquoi le facteur temps compte plus que le montant</h2>

      <p>Une conséquence directe : <strong>commencer tôt avec un petit montant peut, sur le long terme, produire un résultat comparable à commencer plus tard avec un montant plus important</strong>. Ce n'est pas systématique, cela dépend du rendement, de la durée et des versements, mais c'est la logique qui explique pourquoi l'horizon de temps est souvent présenté comme un facteur aussi important que le montant investi.</p>

      <h2>Ce qui influence la puissance des intérêts composés</h2>

      <ul class="art-liste">
        <li><strong>Le rendement annuel.</strong> Plus il est élevé, plus l'effet est marqué. Mais un rendement plus élevé s'accompagne généralement d'un risque plus élevé.</li>
        <li><strong>La durée.</strong> C'est le facteur le plus déterminant. L'effet reste modeste les premières années, puis s'accélère nettement sur le long terme.</li>
        <li><strong>La régularité des versements.</strong> Ajouter des versements réguliers, même modestes, amplifie encore l'effet : chaque nouveau versement bénéficie à son tour du même mécanisme.</li>
      </ul>

      <h2>Simuler ta propre projection</h2>

      <p>Plutôt que de se fier à un exemple générique, le plus utile est de tester différents scénarios avec tes propres chiffres : montant de départ, versement mensuel, durée, rendement estimé. Le <a href="/simulateur">simulateur</a> le fait, et le <a href="/comparateur">comparateur</a> met trois supports côte à côte, nets de fiscalité.</p>

      <h2>En résumé</h2>

      <p>Les intérêts composés expliquent pourquoi le temps est souvent considéré comme l'un des leviers les plus importants en matière d'épargne et d'investissement. Ce n'est pas une garantie de gain, tout placement autre qu'un livret réglementé comportant un risque de perte, mais c'est un mécanisme mathématique qui joue en faveur de qui commence tôt, à rendement égal.</p>
''',
        'disclaimer': "Cet article est informatif et pédagogique. Il ne constitue ni un conseil ni une recommandation d'investissement personnalisée. Investir comporte un risque de perte en capital.",
        'resume': 'Un exemple chiffré sur 30 ans, les trois facteurs qui jouent, et pourquoi la durée compte souvent plus que le montant.',
    },
    {
        'slug': 'bce-hausse-taux-2026',
        'sources': [
            ('Banque de France, taux directeurs', 'https://www.banque-france.fr/fr/les-taux-monetaires-directeurs'),
            ('Touteleurope.eu, décision de la BCE du 10 septembre 2026', 'https://www.touteleurope.eu/economie-et-social/face-a-la-hausse-des-prix-la-bce-releve-les-taux-d-interet/'),
        ],
        'date_iso': '2026-09-10', 'date': '10 septembre 2026', 'duree': '5 min',
        'categorie': 'Actualité', 'icone': '🏛️',
        'titre': "La BCE relève ses taux : ce que ça change pour ton épargne et tes crédits",
        'h1': "La BCE relève ses taux : ce que ça change pour <em>ton épargne et tes crédits</em>",
        'meta_titre': "Hausse des taux BCE 2026 : quel impact sur le crédit et l'épargne ?",
        'meta_desc': ("La BCE relève ses trois taux directeurs de 0,25 point au 16 septembre 2026. "
                      "Taux de dépôt à 2,50 %, inflation à 3,3 % : ce que ça change concrètement "
                      "pour tes crédits et ton épargne."),
        'lead': ("Deuxième hausse de l'année. Ce qu'est un taux directeur, pourquoi il monte, et "
                 "ce que ça déplace vraiment de ton côté."),
        'corps': '''
      <p class="art-chapo">Le 10 septembre 2026, la Banque centrale européenne a annoncé une nouvelle hausse de ses taux directeurs, la deuxième de l'année. Voici ce qu'il faut comprendre, sans jargon.</p>

      <h2>Ce qui a été décidé</h2>

      <p>Le Conseil des gouverneurs de la BCE, réuni à Berlin, a relevé ses <strong>trois taux directeurs de 25 points de base</strong>, soit 0,25 point.</p>

      <div class="part-table-boite">
        <table class="part-table art-table">
          <caption class="sr-only">Taux directeurs de la BCE avant et après le 16 septembre 2026</caption>
          <thead>
            <tr><th scope="col">Taux</th><th scope="col">Avant</th><th scope="col">Après le 16 septembre</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row" class="part-td-nom">Facilité de dépôt</th><td>2,25 %</td><td class="art-td-fort">2,50 %</td></tr>
            <tr><th scope="row" class="part-td-nom">Refinancement <span class="art-cond">(MRO)</span></th><td>2,40 %</td><td class="art-td-fort">2,65 %</td></tr>
            <tr><th scope="row" class="part-td-nom">Prêt marginal</th><td>2,65 %</td><td class="art-td-fort">2,90 %</td></tr>
          </tbody>
        </table>
      </div>

      <p>Le taux de dépôt, celui qui sert de référence principale, atteint ainsi son plus haut niveau depuis mars 2025. Les nouveaux barèmes entrent en application le <strong>16 septembre 2026</strong>.</p>

      <h2>Pourquoi cette hausse ?</h2>

      <p>L'inflation en zone euro s'est établie à <strong>3,3 %</strong> en août 2026, bien au-dessus de l'objectif de 2 % que vise la BCE. Cette poussée est largement liée à la flambée du prix du pétrole : le baril de Brent a dépassé les 100 dollars début septembre, un niveau plus vu depuis fin juillet, sur fond de tensions géopolitiques persistantes au Moyen-Orient.</p>

      <p>Face à des perspectives économiques que l'institution juge « de plus en plus instables », la BCE a choisi de resserrer sa politique monétaire pour tenter de contenir cette inflation.</p>

      <h2>Qu'est-ce qu'un taux directeur, concrètement ?</h2>

      <p>Le taux directeur est le taux auquel les banques commerciales se refinancent auprès de la banque centrale. Quand il monte, l'argent devient plus cher à emprunter pour les banques, et ce surcoût se répercute, avec un certain délai, sur les taux qu'elles proposent à leurs clients.</p>

      <div class="risque risque-info" role="note">
        <span class="risque-icone" aria-hidden="true">&#128161;</span>
        <p><strong>Un point important à retenir.</strong> En France, la majorité des crédits immobiliers sont à taux fixe. Un prêt déjà signé n'est donc pas recalculé après une décision de la BCE : seuls les nouveaux prêts et certains produits à taux variable sont concernés à court terme. Les barèmes des crédits immobiliers à taux fixe réagissent surtout aux taux des obligations d'État à long terme, l'OAT à 10 ans, et non directement au taux BCE du jour.</p>
      </div>

      <h2>Ce que ça peut changer pour toi</h2>

      <p><strong>Côté crédit.</strong> Si tu envisages un prêt étudiant, un crédit à la consommation ou un futur prêt immobilier, un contexte général de taux plus élevés peut se traduire par des mensualités plus importantes sur les nouveaux emprunts. L'effet n'est ni immédiat ni automatique.</p>

      <p><strong>Côté épargne.</strong> À l'inverse, une hausse des taux directeurs peut, avec le temps, améliorer la rémunération de certains produits d'épargne à terme ou de certains comptes rémunérés. Les <a href="/blog/placements-jeunes-actifs">livrets réglementés</a> comme le Livret A ou le LDDS suivent en revanche leur propre mécanisme de révision, indépendant des décisions de la BCE.</p>

      <h2>Et la suite ?</h2>

      <p>La prochaine réunion du Conseil des gouverneurs est prévue le <strong>29 octobre 2026</strong>. La présidente de la BCE, Christine Lagarde, a indiqué que l'institution reste attentive à l'évolution de l'inflation, avec des projections qui tablent sur un retour progressif vers l'objectif de 2 % d'ici 2028.</p>
''',
        'disclaimer': ("Cet article est informatif et pédagogique. Il ne constitue ni un conseil "
                       "ni une recommandation d'investissement. Les taux cités sont ceux annoncés "
                       "à la date de publication."),
        'resume': ("Trois taux relevés de 0,25 point au 16 septembre, inflation à 3,3 %. "
                   "Ce qu'est un taux directeur, et pourquoi un prêt déjà signé ne bouge pas."),
    },
    {
        'slug': 'pea-explique-simplement',
        'sources': [
            ("Service-Public.fr, imposition des revenus d'un PEA", 'https://www.service-public.gouv.fr/particuliers/vosdroits/F22449'),
            ('Code général des impôts, art. 157 5° bis (exonération après cinq ans) et art. 200 A (prélèvement forfaitaire unique)', None),
        ],
        'date_iso': '2026-09-10', 'date': '10 septembre 2026', 'duree': '6 min',
        'categorie': 'Guide', 'icone': '📘',
        # Contenu pérenne : il se démode par mise à jour, pas par péremption.
        # D'où « Mis à jour le » plutôt que « Publié le », et le type Article
        # en données structurées là où les actualités portent NewsArticle.
        'perenne': True,
        'titre': "Le PEA expliqué simplement",
        'h1': "Le PEA <em>expliqué simplement</em>",
        'meta_titre': "PEA débutant : le guide complet pour ouvrir un plan d'épargne en actions",
        'meta_desc': ("Plafonds, fiscalité après 5 ans, PEA Jeune pour les étudiants, ETF "
                      "éligibles : le plan d'épargne en actions expliqué simplement, sans jargon."),
        'lead': ("Le guide complet pour débuter en 2026 : ce qu'est un PEA, ce qu'on peut y mettre, "
                 "et ce que change le cap des cinq ans."),
        'corps': '''
      <p class="art-chapo">Le <strong>Plan d'épargne en actions (PEA)</strong> est souvent présenté comme l'enveloppe la plus avantageuse pour investir en bourse en France. Voici comment il fonctionne, concrètement, sans jargon.</p>

      <h2>Qu'est-ce qu'un PEA ?</h2>

      <p>Un PEA est une enveloppe fiscale qui permet d'investir dans des <strong>actions européennes</strong> et certains <strong>ETF</strong>, ces fonds qui regroupent plusieurs entreprises, avec un avantage fiscal important : après cinq ans, tes gains ne sont plus imposés sur le revenu.</p>

      <p>Concrètement, un PEA se compose de deux parties :</p>

      <ul class="art-liste">
        <li>Un <strong>compte espèces</strong>, où atterrit l'argent que tu verses mais n'as pas encore investi</li>
        <li>Un <strong>compte-titres associé</strong>, où sont logées tes actions et tes ETF</li>
      </ul>

      <h2>Les plafonds à connaître</h2>

      <div class="part-table-boite">
        <table class="part-table art-table">
          <caption class="sr-only">Plafonds de versement des différents types de PEA</caption>
          <thead>
            <tr><th scope="col">Type de PEA</th><th scope="col">Plafond de versement</th><th scope="col">Pour qui</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row" class="part-td-nom">PEA classique</th><td>150 000 €</td><td>Tout majeur fiscalement indépendant</td></tr>
            <tr><th scope="row" class="part-td-nom">PEA-PME</th><td>225 000 € <span class="art-cond">(cumulé avec le PEA classique)</span></td><td>Investir dans des PME et ETI</td></tr>
            <tr><th scope="row" class="part-td-nom">PEA Jeune</th><td>20 000 €</td><td>18-25 ans rattachés au foyer fiscal parental</td></tr>
          </tbody>
        </table>
      </div>

      <p>Si tu es étudiant et rattaché au foyer fiscal de tes parents, c'est le <strong>PEA Jeune</strong> qui te concerne. À 25 ans, ou dès la fin de ton rattachement fiscal, il se transforme automatiquement en PEA classique <strong>sans perdre l'antériorité fiscale déjà acquise</strong>. C'est un point important : les années comptées avant tes 25 ans continuent de courir vers le cap des cinq ans.</p>

      <h2>La fiscalité : ce qui change avant et après cinq ans</h2>

      <p>C'est le cœur de l'intérêt du PEA. Tant que tu ne retires rien, <strong>aucun impôt n'est dû</strong>, même si tes placements prennent de la valeur.</p>

      <div class="part-table-boite">
        <table class="part-table art-table">
          <caption class="sr-only">Fiscalité d'un retrait sur PEA avant et après cinq ans</caption>
          <thead>
            <tr><th scope="col">Prélèvement</th><th scope="col">Avant 5 ans</th><th scope="col">Après 5 ans</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row" class="part-td-nom">Impôt sur le revenu</th><td>12,8 %</td><td>0 %</td></tr>
            <tr><th scope="row" class="part-td-nom">Prélèvements sociaux</th><td>18,6 %</td><td>18,6 %</td></tr>
            <tr class="art-tr-total"><th scope="row" class="part-td-nom">Total</th><td>31,4 %</td><td>18,6 %</td></tr>
          </tbody>
        </table>
      </div>

      <p><strong>Le point à retenir</strong> : un retrait avant cinq ans ferme en principe le plan, sauf exceptions comme la création d'entreprise, le licenciement ou l'invalidité. L'horizon du PEA est donc pensé pour du long terme, pas pour de l'épargne disponible à court terme.</p>

      <h2>Ce que tu peux mettre dans un PEA</h2>

      <p>Le PEA est limité aux actions d'entreprises européennes et à certains fonds et ETF composés d'au moins <strong>75 % d'actions européennes</strong>.</p>

      <p>Il existe cependant des <strong>ETF synthétiques</strong> qui répliquent des indices mondiaux, comme le S&amp;P 500 ou le MSCI World, tout en restant éligibles au PEA. C'est une façon d'avoir une exposition internationale sans sortir du cadre fiscal.</p>

      <h2>PEA ou Livret A : lequel choisir en premier ?</h2>

      <p>Ce n'est pas vraiment l'un ou l'autre, ce sont deux outils complémentaires :</p>

      <ul class="art-liste">
        <li>Le <a href="/blog/placements-jeunes-actifs"><strong>Livret A</strong></a>, le LDDS ou le LEP servent à l'épargne de précaution : disponible immédiatement, sans risque de perte</li>
        <li>Le <strong>PEA</strong> sert à investir sur le long terme, avec un potentiel de rendement supérieur, mais aussi un <strong>risque de perte en capital</strong> que n'a pas un livret</li>
      </ul>

      <p>La logique généralement présentée par les acteurs de l'éducation financière : consolider d'abord son épargne de précaution, puis envisager le PEA une fois son fonctionnement compris et à condition de pouvoir se projeter sur plusieurs années sans avoir besoin de cet argent.</p>

      <h2>En résumé</h2>

      <p>Le PEA est un outil puissant pour qui investit sur le long terme, avec un vrai avantage fiscal après cinq ans. Mais il demande de comprendre ses règles avant de s'y lancer : <strong>un retrait mal calibré peut faire perdre l'avantage fiscal accumulé</strong>.</p>
''',
        'disclaimer': ("Cet article est informatif et pédagogique. Il ne constitue ni un conseil "
                       "ni une recommandation d'investissement personnalisée. Investir comporte "
                       "un risque de perte en capital. Les plafonds et taux cités sont ceux en "
                       "vigueur à la date de mise à jour et évoluent par voie législative."),
        'resume': ("Plafonds, PEA Jeune pour les étudiants, fiscalité avant et après cinq ans, "
                   "et ce qu'on peut réellement y loger. Le guide pour partir de zéro."),
    },
    {
        'slug': 'nvidia-premiere-capitalisation-mondiale',
        'sources': [
            ('Nvidia, communiqué de résultats du deuxième trimestre 2026', None),
            ('Presse financière, capitalisation boursière et mouvements de marché', None),
        ],
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
        'sources': [
            ('Apple, keynote du 9 septembre 2026', None),
            ("Couverture presse tech de l'événement : direction, iPhone Duo, iPhone 18 Pro", None),
        ],
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
        'sources': [
            ("Banque de France, portail Mes questions d'argent (dispositif EDUCFI)", 'https://www.mesquestionsdargent.fr/'),
            ('OCDE, données sur la littératie financière des jeunes', None),
        ],
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
    # Un guide pérenne n'est pas une actualité : Article, pas NewsArticle.
    tp = "Article" if a.get("perenne") else "NewsArticle"
    return f'''
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org", "@type": "{tp}",
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


# Une entrée est (libellé, url) ; url vaut None quand aucune adresse n'a pu
# être vérifiée. On préfère alors la référence en clair au lien inventé :
# elle reste vérifiable par le lecteur, un lien mort ne l'est pas.
def bloc_sources(sources):
    if not sources:
        return ''
    lis = []
    for libelle, url in sources:
        lis.append('        <li>%s</li>' % (
            '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>' % (url, libelle)
            if url else libelle))
    return ('\n      <div class="sources-block">\n'
            '        <p class="sources-titre">Sources</p>\n'
            '        <ul class="sources-liste">\n'
            + '\n'.join(lis) + '\n'
            '        </ul>\n'
            '      </div>\n')


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
    <p class="art-meta">{'Mis à jour le' if a.get('perenne') else 'Publié le'} {a['date']} &middot; Lecture {a['duree']}</p>
  </div>
</section>

<section class="section section-dark">
  <div class="wrap art-wrap">
    <article class="art-corps">
{a['corps']}{bloc_sources(a.get('sources'))}
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
        <article class="blog-carte{' blog-carte-guide' if a.get('perenne') or a['categorie'] == 'Guide' else ''}">
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


# DEUX SECTIONS PLUTÔT QU'UNE LISTE UNIQUE
# Le regroupement suit le drapeau `perenne`, PAS le libellé `categorie`.
# Les libellés sont hétérogènes par nature : « Actualité » (x3), « Guide »,
# « Éducation financière », « Épargne sans risque ». Grouper dessus mettrait
# trois articles seulement sous Actualités et laisserait les deux autres
# orphelins. `perenne` dit exactement ce qui nous intéresse ici : un contenu
# se démode-t-il par mise à jour ou par péremption.
#
# Chaque carte conserve intégralement ses métadonnées : sa propre pastille de
# catégorie et sa date. Seul le regroupement change.
def section(titre, sous_titre, articles, classe=''):
    if not articles:
        return ''
    return f'''    <div class="blog-section{classe}">
      <div class="blog-section-tete">
        <h2 class="blog-section-titre">{titre}</h2>
        <p class="blog-section-sous">{sous_titre}</p>
      </div>
      <div class="blog-grille">{''.join(carte(a) for a in articles)}
      </div>
    </div>
'''


def ld_listing(guides, actus):
    # CollectionPage plutot qu'une simple WebPage : la page n'est pas un
    # contenu, c'est un index. Le ItemList reprend l'ordre d'affichage reel,
    # guides d'abord, ce qui evite d'annoncer a Google une hierarchie que la
    # page ne montre pas.
    items = []
    for i, a in enumerate(guides + actus, 1):
        items.append(
            '      { "@type": "ListItem", "position": %d, '
            '"url": "https://financia.cloud/blog/%s", "name": "%s" }'
            % (i, a['slug'], a['titre'].replace('"', "'")))
    corps = ',\n'.join(items)
    return (
        '\n  <script type="application/ld+json">\n'
        '  {\n'
        '    "@context": "https://schema.org", "@type": "CollectionPage",\n'
        '    "name": "Blog Financia", "inLanguage": "fr-FR",\n'
        '    "url": "https://financia.cloud/blog",\n'
        '    "isPartOf": { "@type": "WebSite", "name": "Financia", "url": "https://financia.cloud" },\n'
        '    "mainEntity": {\n'
        '      "@type": "ItemList", "numberOfItems": %d,\n'
        '      "itemListElement": [\n%s\n      ]\n'
        '    }\n'
        '  }\n'
        '  </script>\n' % (len(items), corps))


def page_listing(tous):
    url = 'https://financia.cloud/blog'
    titre = "Blog Financia | Guides et actualités sur l'argent des jeunes"
    desc = ("Les guides de fond sur le PEA, les ETF et les intérêts composés, et l'actualité "
            "économique expliquée aux 18-30 ans. Gratuit, sans jargon, sans conseil personnalisé.")
    guides = [a for a in tous if a.get('perenne')]
    actus  = [a for a in tous if not a.get('perenne')]
    sections = (
        section('Nos guides', "Les fondamentaux, mis à jour quand les règles changent.",
                guides, ' blog-section-guides')
        + section('Actualités', "Ce qui bouge, expliqué au moment où ça bouge.", actus))
    guides = [a for a in tous if a.get('perenne')]
    actus  = [a for a in tous if not a.get('perenne')]
    sections = (
        section('Nos guides', "Les fondamentaux, mis à jour quand les règles changent.",
                guides, ' blog-section-guides')
        + section('Actualités', "Ce qui bouge, expliqué au moment où ça bouge.", actus))
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
{sections}

    <div class="risque" role="note" style="margin-top:40px;">
      <span class="risque-icone" aria-hidden="true">⚠️</span>
      <p>Les articles publiés ici sont généraux et pédagogiques. Ils ne constituent ni un conseil en investissement, ni une recommandation de produit ou d'établissement. Investir comporte un risque de perte en capital.</p>
    </div>
  </div>
</section>
'''
    html = (tete(titre, desc, url, 'website', ld_listing(guides, actus)) + GTAG + '\n</head>\n'
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
