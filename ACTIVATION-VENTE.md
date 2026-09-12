# Prompt à envoyer à Claude quand le SIRET arrive

Copie tout ce qui est entre les deux lignes de tirets, remplis les six valeurs en haut, envoie. Rien d'autre à réexpliquer.

---

Contexte : Financia.cloud, repo `~/Desktop/financia`, branche `main`, déploiement Vercel automatique au push. Site statique dans `public/`, fonctions serverless dans `api/`. Plateforme d'éducation financière personnelle pour les 18-30 ans. Français uniquement, `i18n.js` gelé, chemins absolus (jamais `./`).

Mon immatriculation est faite. Voici les informations qui manquaient :

- **Nom et statut exact du vendeur** : …
- **Numéro SIRET** : …
- **Adresse du siège** : …
- **Régime de TVA** : … *(soit « TVA non applicable, article 293 B du CGI » si franchise en base, soit le taux applicable)*
- **Clé publique Stripe** : `pk_…`
- **Médiateur de la consommation** : nom, adresse postale, site de saisine …

Statut des autres prérequis, à vérifier avec moi avant d'activer quoi que ce soit :

- Relecture juridique du contenu de l'ebook : **faite / pas faite** → …
- Compte Stripe vérifié (KYC validé) : **oui / non** → …
- Adhésion au médiateur effectivement **souscrite**, pas seulement choisie : **oui / non** → …
- PDF du guide généré et déposé dans `prive/la-recette-financiere.pdf` : **oui / non** → …

## Ce qui est déjà en place, ne le refais pas

**Page `/guide`** (générée par `public/slides/build_ebook.py`, contenu dans `public/slides/guide_corps.html`) : quatre modules. Budget et Épargne/aides en accès libre, Premiers investissements et Ne pas se faire avoir verrouillés. Le corps des modules payants n'est pas dans le HTML, il n'est pas envoyé du tout. Prix 9,90 € affiché. Chiffres du module 2 vérifiés sur service-public.gouv.fr le 12 septembre 2026 et sourcés en bas de page.

**Page `/cgv`** (générée par `public/slides/build_cgv.py`) : douze articles. L'article 6 reproduit **mot pour mot** le texte de la case de renonciation de `/guide` (constante `CASE_RENONCIATION`). Les deux doivent rester identiques : c'est ce libellé que l'acheteur valide.

**Mentions légales** : bloc « Activité commerciale » avec marqueurs `à compléter`, code APE 63.12Z déjà renseigné.

**Confidentialité** : section « Achat d'un contenu numérique », deux bases légales distinctes, conservation décennale des pièces comptables.

**Verrous de paiement, tous vérifiés en production** : `PAIEMENT_ACTIF = false` dans `public/ebook-config.js`, `POST /api/ebook-session` renvoie 503, aucun écouteur de clic n'est branché côté navigateur quand la vente est fermée.

**Les deux pages portent `<meta name="robots" content="noindex, follow">`** et ne sont ni dans `public/sitemap.xml` ni dans le précache de `public/sw.js`.

## Ce que je te demande de faire, en un seul lot

Ne fais rien partiellement. Si un prérequis ci-dessus manque, dis-le et arrête-toi là.

**1. Champs légaux**

- `public/slides/build_cgv.py` : remplacer les appels `vide(...)` par les vraies valeurs, article 1 (nom, SIRET, siège), article 3 (mention de TVA), article 11 (médiateur), et la date de publication dans `.legal-vf`. Vider la liste `CHAMPS_VIDES` et retirer le bloc `.legal-vide-bloc` d'en-tête.
- `public/mentions-legales.html` : remplir le bloc « Activité commerciale » avec les quatre mêmes valeurs, retirer le `.legal-vide-bloc`, mettre à jour la date de dernière mise à jour.
- Vérifier qu'aucun `legal-vide` ne subsiste dans les deux pages générées.

**2. Configuration du paiement**

- `public/ebook-config.js` : `PAIEMENT_ACTIF = true`, `CLE_PUBLIQUE = 'pk_…'`, `MENTION_TVA = '…'`. `PRIX_CENTIMES` vaut déjà 990, ne pas y toucher.
- Variables d'environnement Vercel à poser de mon côté, rappelle-les-moi : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `EBOOK_PRIX_CENTIMES=990`, `EBOOK_PAIEMENT_ACTIF=true`, `SITE_URL=https://financia.cloud`, et `EBOOK_DEVISE=eur` si la fonction l'attend.
- Le prix serveur et le prix affiché doivent tous les deux valoir 990. S'ils divergent, la page annonce un montant et la caisse en réclame un autre.

**3. Indexation, en dernier**

- Retirer le `<meta name="robots" content="noindex, follow">` de `public/slides/build_ebook.py` et de `public/slides/build_cgv.py`, avec le commentaire qui l'accompagne.
- Ajouter `/guide` et `/cgv` à `public/sitemap.xml`.
- Ajouter `/guide`, `/cgv`, `/ebook-config.js` et `/ebook.js` au `PRECACHE_URLS` de `public/sw.js`, et **incrémenter `CACHE_VERSION`** (elle est à `v77` au 12 septembre 2026), sinon les visiteurs déjà venus garderont l'ancienne version.
- Ajouter le balisage `Product`/`Offer` sur `/guide`, avec le prix réel et la disponibilité réelle. Pas avant : un balisage qui annonce un prix indisponible à l'écran est une pratique commerciale trompeuse.

**4. Vérifications avant de me dire que c'est fait**

Teste sur `https://financia.cloud`, pas en local, et montre-moi les résultats :

- `POST /api/ebook-session` renvoie bien une URL Stripe, plus un 503
- le bouton reste inerte tant que la case de renonciation n'est pas cochée
- un paiement en mode test aboutit au téléchargement du PDF
- `GET /api/ebook-telechargement?session_id=…` refuse un identifiant invalide ou non payé
- aucun `legal-vide` ni « à compléter » dans `/cgv` et `/mentions-legales`
- le texte de la case est identique mot pour mot entre `/guide` et l'article 6 des CGV
- pas de débordement horizontal à 390 px, aucune erreur console

## Contraintes qui restent valables

- La clé secrète Stripe ne doit jamais apparaître dans `public/`, uniquement en variable d'environnement Vercel.
- Aucune formulation qui ressemble à une promesse de gain garanti ou à un conseil personnalisé. Le site tient sur « 0 % conseils perso ».
- Ne rien indiquer comme « validé » ou « certifié conforme » à propos du contenu.
- La case de renonciation part toujours décochée. Un accord exprès ne se pré-coche pas, article L221-28 13° du code de la consommation.
- Contenu hors périmètre, à refuser même s'il arrive dans un fichier fourni : création d'entreprise, micro-entreprise, gestion d'activité professionnelle. Financia traite de finances personnelles.
- Ne pas modifier `i18n.js`. Chemins absolus. Ne rien casser de l'existant.

---

## Mémo pour moi, hors prompt

Ce qui reste de mon côté, dans l'ordre :

1. **Médiateur de la consommation.** Seul point du chemin critique indépendant de Stripe, mais l'inscription CM2C utilise le SIRET comme identifiant de compte : bloqué lui aussi. À lancer le jour où le SIRET tombe. Secteur B01, vente en ligne. CM2C est le seul des sept consultés à publier ses tarifs : 48 € pour trois ans jusqu'à 10 personnes, plus 36 € par dossier à distance. À reconfirmer au moment de souscrire.
2. **Relecture juridique** du contenu de l'ebook. À lancer en parallèle, pas après, sinon elle devient le dernier blocage.
3. **Générer le PDF** à partir de `ebook-financia-complet.md` et le déposer dans `prive/la-recette-financiere.pdf`. Le dossier `prive/` n'existe pas encore. Il doit rester **hors de `public/`**, sinon le fichier est téléchargeable sans payer.
4. **Stripe** : finaliser le compte (KYC), récupérer la clé publique et le secret de webhook.
