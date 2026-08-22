# Financia — Rapport de suivi technique

**Site :** [financia.cloud](https://financia.cloud)
**Période couverte :** 29 juillet 2026 → 22 août 2026
**Date de l'audit :** 22 août 2026
**Auteur du projet :** Paolo Scappaticci

---

## Sommaire

1. [Résumé exécutif](#1-résumé-exécutif)
2. [Check-up technique](#2-check-up-technique)
3. [Chronologie des évolutions](#3-chronologie-des-évolutions)
4. [Ce qui reste en cours ou prévu](#4-ce-qui-reste-en-cours-ou-prévu)
5. [Analyse professionnelle](#5-analyse-professionnelle)
6. [Priorités avant l'oral Pépite](#6-priorités-avant-loral-pépite-21-25-septembre)

---

## 1. Résumé exécutif

Sur la période, Financia est passé d'un site vitrine pédagogique à une **application web installable**, avec des données de marché temps réel structurées par région et un fil d'actualité personnalisable par thème.

**Chiffres clés**

| Indicateur | Valeur |
|---|---|
| Évolutions livrées sur la période | 27 |
| Total depuis la création du dépôt | 115 |
| Pages publiques | 4 (+ 8 sections sur l'accueil) |
| Fonctions serverless | 7 |
| Langues supportées | 5 (FR, EN, ES, RU, DE) |
| Actifs financiers suivis en direct | 18, répartis en 8 régions |

**État à l'issue de l'audit :** aucune anomalie bloquante. Toutes les pages, API, sections interactives et le parcours d'installation PWA ont été testés en conditions réelles sur le site en production.

---

## 2. Check-up technique

Tests réalisés le 22 août 2026 directement sur l'environnement de production, pas en local.

### 2.1 Disponibilité des pages

| Page | Statut | Temps de réponse |
|---|---|---|
| Accueil `/` | 200 | 0,15 s |
| Marchés `/marches` | 200 | 0,29 s |
| Histoire `/histoire` | 200 | 0,31 s |
| Contact `/contact` | 200 | 0,07 s |
| Page hors-ligne `/offline.html` | 200 | 0,23 s |

Les rubriques Apprendre, Simulateur, Chat IA, Quiz, Actus, Témoignages, À propos et Mentions légales sont des **sections de la page d'accueil**, non des pages distinctes. Les huit ont été vérifiées comme présentes et fonctionnelles.

### 2.2 API et données temps réel

| Endpoint | Statut | Source | Observations |
|---|---|---|---|
| `/api/marches` | 200 | Yahoo Finance + CoinGecko | 18 actifs, aucun prix manquant |
| `/api/actus` | 200 | Alpha Vantage | 12 articles, 4 thèmes disponibles |
| `/api/avis` | 200 | Google Sheets (CSV publié) | Répond correctement, aucun avis publié à ce jour |
| `/api/news` | 200 | — | Fonctionnel |
| `/api/ask` | 200 | Groq | Chat IA, réponse en ~1,8 s |
| `/api/translate` | 200 | Groq | Traduction des titres d'actus |

### 2.3 Sections interactives

- **Apprendre** — 9 cartes de modules, 8 boutons interrogeant l'IA. Test de bout en bout sur la carte « Le PEA » : la fenêtre s'ouvre, la réponse arrive et s'affiche correctement (6 paragraphes, 4 listes, mise en gras). **Aucune erreur de chargement.**
- **Simulateur** — Calcul vérifié manuellement : 1 000 € de capital + 150 €/mois sur 10 ans à 7 % donne 19 000 € investis pour 27 972 € de valeur finale. Résultat exact, graphique rendu.
- **Quiz** — Les deux modes (profil investisseur et test de connaissances) sont présents, 5 étapes actives.
- **Marchés** — 8 régions, 18 actifs, 90 éléments graphiques rendus, aucun actif sans prix.
- **Actus** — Sélecteur « L'actu qu'il te faut » opérationnel avec 4 filtres (Tout, Cryptos, Bourse, Matières premières), 6 articles affichés.
- **Histoire** — 12 événements sur la chronologie, de 1602 à 2026.
- **Vitrine vidéo** — 3 Reels intégrés en tête de page d'accueil.

### 2.4 PWA — installation

Les 10 critères d'installabilité sont satisfaits :

| Critère | État |
|---|---|
| HTTPS | Oui |
| Service worker actif | Oui |
| Manifest lié dans le HTML | Oui, sur les 4 pages |
| `display: standalone` | Oui |
| Icône 192×192 | Oui |
| Icône 512×512 | Oui |
| Icône *maskable* (rognage Android) | Oui |
| `start_url` défini | Oui |
| `short_name` défini | Oui |
| Toutes les icônes accessibles | Oui (5/5 en HTTP 200) |

**Identité visuelle appliquée :** fond noir `#000000`, « F » blanc, barre d'accent violette `#7C3AED`. Déclinée sur les 6 fichiers (SVG, 192, 512, deux versions *maskable*, icône Apple 180). Couleur de thème `#7C3AED`, couleur de fond `#000000`. Deux raccourcis configurés : Marchés et Actus.

### 2.5 Alignement de la page Contact

Les trois cartes Email / Instagram / TikTok sont désormais **parfaitement alignées** : colonnes strictement égales (273 px chacune), et une valeur unique partagée pour la largeur, la hauteur, la position de l'icône, du titre, de la valeur et du bas du bouton. La grille partage exactement le même axe central que le titre « Nous contacter ». L'adresse e-mail tient sur une seule ligne, sans coupure en plein mot.

### 2.6 Responsive

| Contexte | Résultat |
|---|---|
| Desktop (1280 px) | 3 colonnes, aucun débordement horizontal |
| Mobile (≈400 px) | 1 colonne, menu burger actif, navigation desktop masquée, aucun débordement |

### 2.7 Multilingue

Les 5 langues ont été testées sur un échantillon de clés couvrant la navigation, les modules, le sélecteur d'actus, le footer et les régions de marché.

- **Aucune clé manquante** dans aucune des 5 langues.
- **Aucune clé non traduite visible dans le DOM.**
- L'attribut `lang` du document se met à jour correctement à chaque changement.

### 2.8 Liens sociaux

Instagram et TikTok sont à **parité exacte** sur l'ensemble du site :

| Page | Instagram | TikTok |
|---|---|---|
| Accueil | 7 | 7 |
| Marchés | 1 | 1 |
| Histoire | 2 | 2 |
| Contact | 2 | 2 |

### 2.9 Console navigateur

**Aucune erreur** relevée sur la page d'accueil en production.

---

## 3. Chronologie des évolutions

### 3.1 Fonctionnalités ajoutées

#### Internationalisation — 31 juillet

Ajout du **russe** puis de l'**allemand**, portant le site à 5 langues. Le fichier de traductions compte aujourd'hui 3 000 lignes.

#### Vitrine vidéo — 14 août

Intégration de **3 Reels** en tête de page d'accueil, au format vertical 1080×1920, avec navigation au glissement, barres de progression façon story, contrôle de lecture et de son. Pas de lecture automatique au chargement.

#### Présence TikTok — 15 août

Ajout de TikTok **partout où Instagram apparaissait** : bandeaux, pieds de page des 4 pages, carte de contact, boutons d'appel à l'action. Parité vérifiée lors de cet audit.

#### Nouveau système d'avis — 15 août

Remplacement du système précédent, dont les identifiants de base de données étaient devenus inaccessibles, par une architecture **sans base de données** : collecte via Google Forms, stockage en Google Sheets, lecture via export CSV publié. La modération se fait manuellement par une colonne du tableur, ce qui permet de filtrer les contenus indésirables avant publication.

#### Marchés par région — 17 août

Réorganisation de la section Marchés en **8 blocs géographiques** au lieu d'une liste plate :

| Région | Actifs suivis |
|---|---|
| États-Unis | S&P 500, Nasdaq, Dow Jones, JPMorgan Chase |
| France | CAC 40, LVMH |
| Allemagne | DAX, SAP |
| Royaume-Uni | FTSE 100, Shell |
| Japon | Nikkei 225, Toyota |
| Chine / Asie | Hang Seng, Alibaba |
| Mondial | Or, ETF MSCI World |
| Cryptomonnaies | Bitcoin, Ethereum |

Chaque pays associe un **indice** et une **entreprise emblématique**, pour donner un ancrage concret à un public débutant. Passage de 7 à 18 actifs suivis.

#### « L'actu qu'il te faut » — 17 août

Ajout d'un sélecteur de thème au-dessus du fil d'actualité (Cryptos, Bourse, Matières premières). Le filtrage exploite les scores de pertinence déjà présents dans les données et s'effectue **côté navigateur**, sans requête supplémentaire : le quota de l'API gratuite reste donc inchangé.

#### PWA installable — 21 août

Transformation en application installable : manifest, service worker, page hors-ligne traduite en 5 langues, jeu complet d'icônes, balises iOS et Android. Stratégie de cache différenciée selon la nature de la ressource.

#### Références institutionnelles — 21 août

Deux modules pédagogiques ajoutés (« Les banques d'investissement », « Les gestionnaires d'actifs ») et deux repères historiques (1907, la panique qui a mené à la création de la Fed ; 1988, la naissance de BlackRock).

### 3.2 Corrections apportées

| Date | Problème | Cause identifiée |
|---|---|---|
| 14 août | Son coupé sur la vitrine vidéo | `muted="false"` reste vrai en HTML : un attribut booléen se lit à sa présence, pas à sa valeur |
| 14 août | Le défilement vertical interrompait les vidéos | Tout contact était traité comme un glissement horizontal ; ajout d'un seuil de classification du geste |
| 21 août | Cartes de contact désalignées | `repeat(3, 1fr)` produisait des colonnes inégales, l'adresse e-mail insécable élargissant sa colonne au détriment des autres |
| 22 août | **Chat IA hors service** | Groq avait retiré le modèle utilisé ; chaque appel renvoyait une erreur 404 |
| 22 août | Titres d'actus restés en anglais | Même cause, mais l'échec était silencieux |
| 22 août | Markdown brut affiché dans les réponses IA | Le nouveau modèle produit des tableaux et titres que le rendu ne gérait pas |
| 22 août | Correctifs CSS invisibles pour les visiteurs | Erreur de conception du service worker (voir ci-dessous) |
| 22 août | Boutons de modules à des hauteurs différentes | Les cartes n'étaient pas en colonne flexible |
| 22 août | Erreurs sporadiques du chat | Débit limité de l'API gratuite ; ajout d'une reprise automatique |

**Deux corrections méritent d'être signalées comme des enseignements :**

> **Le modèle d'IA retiré sans préavis.** Le fournisseur Groq a décommissionné la famille de modèles utilisée. Le chat IA, fonctionnalité centrale du projet, était donc hors service sur *tous* les boutons du site, et la traduction des actualités échouait sans alerte. Cela met en évidence une dépendance à un fournisseur externe qui mérite une surveillance active.

> **Le cache trop agressif.** Le service worker avait initialement été configuré pour servir les fichiers statiques depuis le cache en priorité. Or les fichiers du site ne sont pas versionnés dans leur nom : une fois en cache, ils n'étaient plus jamais rechargés. Concrètement, un correctif CSS déployé restait invisible pour tout visiteur déjà venu une fois. Corrigé par une stratégie qui sert le cache pour la rapidité **puis rafraîchit en arrière-plan**.

---

## 4. Ce qui reste en cours ou prévu

### 4.1 En cours

**Système d'avis** — L'infrastructure est en place et testée, mais **aucun avis n'est publié à ce jour**. La section s'affiche donc vide. Une sollicitation auprès de la communauté Instagram est nécessaire pour l'alimenter avant l'oral.

### 4.2 Prévu

| Chantier | Description | Complexité |
|---|---|---|
| Section « Mon profil perso » | Un bilan personnalisé façon rétrospective annuelle Spotify, à partir des réponses au quiz et du simulateur | Élevée |
| Direction artistique interactive | Animations et transitions plus poussées | Moyenne |
| Enrichissement des références institutionnelles | Poursuivre l'intégration des grands acteurs dans les contenus pédagogiques | Faible |

---

## 5. Analyse professionnelle

### 5.1 Maturité technique

**Points forts**

- **Architecture sobre et adaptée.** Site statique servi par un réseau de diffusion, avec 7 fonctions serverless pour les données dynamiques. Pas de serveur à maintenir, pas de base de données à administrer, coût d'hébergement quasi nul. Pour un projet porté par une seule personne, c'est un choix pertinent.
- **Clés d'API protégées.** Aucun identifiant n'est exposé côté navigateur ; tous les appels externes transitent par les fonctions serveur.
- **Gestion sérieuse des quotas.** Chaque source externe est mise en cache avec une durée adaptée à sa fraîcheur réelle (25 minutes pour les marchés, 3 heures pour les actualités). Le fil d'actualité personnalisable a été conçu pour ne consommer aucun quota supplémentaire.
- **Robustesse en cas de panne externe.** En cas d'échec d'une source, la dernière réponse valide est servie plutôt qu'une erreur.
- **Multilingue complet et sans faille.** 5 langues, aucune clé manquante, vérifié.
- **Protection contre les injections.** Les contenus soumis par les utilisateurs sont échappés côté serveur avant tout affichage.

**Points encore faibles**

- **Dépendance forte à des services gratuits tiers.** L'incident Groq du 22 août l'a démontré : une décision unilatérale d'un fournisseur peut mettre hors service une fonctionnalité centrale, sans alerte. Il n'existe aujourd'hui **aucune supervision automatique** qui signalerait une telle panne : elle a été découverte par hasard.
- **Aucun test automatisé.** Chaque vérification est manuelle. Sur un projet qui évolue vite, cela signifie qu'une régression peut passer inaperçue jusqu'à ce qu'un visiteur la rencontre.
- **Fichiers statiques non versionnés dans leur nom.** À l'origine du problème de cache décrit plus haut. La stratégie actuelle corrige le symptôme, mais la cause reste présente.
- **Preuve sociale absente.** Le système d'avis fonctionne mais reste vide, ce qui est visible pour un visiteur.
- **Hygiène du dépôt perfectible.** Quelques fichiers de travail traînent à la racine du projet.

### 5.2 Cohérence entre le positionnement et la réalisation

Le positionnement annoncé est : *éducation financière gratuite, sans jargon, pour les 18-30 ans*.

**Ce qui soutient réellement ce positionnement :**

| Promesse | Traduction concrète |
|---|---|
| Gratuit | Aucun paiement, aucun compte requis, aucune donnée personnelle collectée |
| Sans jargon | Chaque actif de marché est accompagné d'une explication en langage courant |
| Pédagogique et non prescriptif | L'IA a pour consigne explicite de ne donner aucun conseil personnalisé ; un avertissement est affiché sur la page Marchés |
| Pour les 18-30 ans | Format Reels, ton direct, présence Instagram et TikTok, module dédié aux chiffres des jeunes investisseurs |
| Accessible | 5 langues, installable comme une application, utilisable partiellement hors connexion |

**Là où la cohérence est perfectible :**

- Le site revendique une approche par l'expérience, mais **l'essentiel du contenu reste de la lecture**. Le simulateur et le quiz sont les seuls véritables outils interactifs. La section « Mon profil perso » prévue répondrait directement à ce manque.
- La promesse de **communauté** portée par les témoignages n'est pas encore appuyée par des avis réels.
- Le module « Jeunes & investissement » est le plus aligné avec la cible, mais reste un module parmi neuf plutôt qu'un axe structurant.

**Verdict :** la cohérence est réelle et défendable. L'écart principal n'est pas un décalage entre le discours et le produit, mais un **déficit de preuves** : le produit fait ce qu'il annonce, mais peu d'éléments le démontrent à un tiers.

### 5.3 Ce qui est solide à présenter

Trois éléments se défendent particulièrement bien à l'oral :

1. **Les données de marché en direct.** 18 actifs, 8 régions, deux sources externes, mise en cache maîtrisée. C'est visuellement démonstratif et techniquement non trivial.
2. **L'application installable.** Passer de « site web » à « application sur l'écran d'accueil » est une évolution que le jury peut constater en direct sur son propre téléphone.
3. **La modération des avis.** Le choix d'une validation manuelle avant publication peut être présenté comme un parti pris assumé de protection contre les contenus haineux et le spam, sur un sujet propice aux dérives : l'argent.

---

## 6. Priorités avant l'oral Pépite (21-25 septembre)

Classées par rapport bénéfice/effort.

### Priorité haute

**1. Recueillir de vrais avis.**
C'est le point faible le plus visible et le plus simple à corriger. Le formulaire est prêt ; il ne manque qu'une sollicitation en story Instagram. Un jury qui voit une section vide en tire une conclusion sur la traction du projet.
*Effort : très faible. Impact : élevé.*

**2. Mettre en place une supervision des services externes.**
La panne du chat IA a duré un temps indéterminé sans être détectée. Une vérification automatique quotidienne des endpoints critiques, avec alerte, éviterait de découvrir une panne **pendant** la démonstration.
*Effort : faible. Impact : élevé, c'est une assurance sur le jour J.*

**3. Répéter la démonstration sur mobile.**
L'installation de la PWA est l'argument le plus frappant, mais l'icône d'une application déjà installée n'est pas mise à jour automatiquement par le système. Il faut désinstaller puis réinstaller pour voir la nouvelle identité visuelle. À faire avant, pas pendant.
*Effort : très faible. Impact : évite un incident.*

### Priorité moyenne

**4. Préparer un plan de repli pour la démonstration.**
Captures ou courte vidéo des fonctionnalités clés, au cas où le réseau ou une API ferait défaut sur place.

**5. Ajouter quelques tests automatisés ciblés.**
Sans viser une couverture complète : vérifier que les endpoints répondent et que les pages se chargent suffirait à détecter les régressions les plus coûteuses.

### Priorité basse

**6. Nettoyer le dépôt.** Cosmétique, mais si le code est montré, cela compte.

**7. Reporter la section « Mon profil perso ».** C'est le chantier le plus ambitieux et le plus démonstratif, mais aussi le plus risqué à moins d'un mois de l'oral. Mieux vaut le présenter comme une **feuille de route argumentée** que le livrer à moitié.

---

### Avertissement sur ce document

Ce rapport porte exclusivement sur l'état technique du projet, constaté par des tests exécutés sur l'environnement de production le 22 août 2026. Il ne comporte aucune évaluation des chances de sélection, du modèle économique ou du potentiel commercial, qui relèvent d'autres critères que ceux observables dans le code.
