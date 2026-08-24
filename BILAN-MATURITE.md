# Financia — Bilan de maturité technique

**Site :** [financia.cloud](https://financia.cloud)
**Date du bilan :** 24 août 2026
**Échéance :** oral Pépite Méditerranée, 21-25 septembre 2026 (environ un mois)
**Période couverte :** depuis l'audit du 22 août

---

## Verdict

> **Niveau technique suffisant pour basculer sur la traction.**

Le site n'a plus de lacune technique qui justifierait de repousser l'effort de communication. Les trois chantiers structurants sont livrés et vérifiés en production. Ce qui manque désormais au dossier n'est plus du code, mais des **preuves d'usage** : le produit fait ce qu'il annonce, mais presque rien ne le démontre à un tiers.

Le détail du raisonnement est en section 4.

---

## 1. Évolutions livrées depuis le 22 août

Sept livraisons, toutes déployées et vérifiées en production.

### PWA

| Livraison | Contenu |
|---|---|
| Installation guidée multi-plateforme | Section dédiée et entrée au menu mobile ouvrant une modale à quatre onglets (iPhone/iPad, Android, Mac, PC Windows). Détection automatique de l'appareil avec présélection, changement manuel possible. |
| Capture de l'invite d'installation | `beforeinstallprompt` n'était intercepté nulle part. Cet événement ne se déclenche qu'une fois, très tôt au chargement : sans mémorisation, il était perdu et aucun bouton n'aurait pu déclencher l'installation native. |
| Pictogramme Partager d'iOS | L'emoji 📤 (bac de courrier sortant) remplacé par un SVG reproduisant le vrai glyphe iOS, celui que l'utilisateur doit repérer dans sa barre Safari. |

### Corrections de bugs

| Problème | Cause identifiée |
|---|---|
| Dictée vocale sans transcription | Quatre défauts cumulés. Le principal : `rec.onerror` vide, donc micro refusé, absence de parole ou panne réseau échouaient dans un silence total. S'y ajoutaient une langue de dictée jamais définie, un plantage au second appui, et aucun retour visuel. |
| Micro invisible sur fond noir | Fond transparent, opacité 40 %, aucune couleur propre. Contraste porté de 3,66:1 à 5,87:1, soit le niveau du bouton d'envoi (5,70:1). |
| Saturation du chat sous charge | Groq réserve la valeur de `max_tokens` sur un budget de 8 000 tokens/minute, consommée ou non. À 2048 pour des réponses réelles de 667 tokens, le plafond tombait à environ trois requêtes par minute. Ramené à 1200. |

### Cohérence visuelle

| Livraison | Contenu |
|---|---|
| Hello bank! uniformisé | Déplacé du pied de page vers la grille des ressources, au même format que les neuf autres liens. L'avertissement qui ne couvrait que lui est remplacé par une mention unique sous toute la grille, traduite dans les cinq langues. |

### Contenu

Story Instagram de promotion de la PWA (six slides), avec son générateur versionné.

---

## 2. État de la PWA

### Critères d'installabilité

Les dix critères sont satisfaits, vérifiés en production : HTTPS, service worker actif, manifest lié sur les quatre pages, `display: standalone`, icônes 192 et 512, version *maskable* pour le rognage Android, `start_url`, `short_name`, et les cinq fichiers d'icônes accessibles en HTTP 200.

Les deux raccourcis (Marchés, Actus) pointent vers des URL valides.

### Couverture par plateforme

| Plateforme | Comportement | État |
|---|---|---|
| Android / Chrome | Invite d'installation native | Mécanisme vérifié |
| Chrome et Edge desktop | Invite native | **Confirmé en conditions réelles** |
| iPhone / iPad, Safari | Instructions manuelles en quatre étapes | Vérifié |
| Safari sur Mac | Instructions manuelles (Ajouter au Dock) | Vérifié |

Le bouton d'installation directe reste volontairement masqué sur les onglets autres que la plateforme détectée : l'afficher à quelqu'un consultant l'onglet Android depuis un iPhone ne mènerait nulle part.

**Preuve de fonctionnement du mécanisme natif :** Chrome affiche « Ouvrir dans l'appli » sur le poste de l'auteur, ce que le navigateur ne propose que pour une application déjà installée. L'invite native a donc bien été émise, acceptée, et l'installation menée à terme.

### Angles morts

| Cas non couvert | Portée | Conséquence |
|---|---|---|
| **Firefox desktop** | Pas de support de l'installation PWA | L'utilisateur voit les instructions Chrome/Edge, qui ne s'appliquent pas à lui. Aucun blocage, mais une instruction sans effet. |
| **Chrome sur iOS** | iOS réserve l'ajout à l'écran d'accueil à Safari | Couvert : la note de l'onglet iOS le précise explicitement. |
| **Android hors Chrome** (Samsung Internet, Firefox) | Support variable | Les instructions manuelles mentionnent Chrome uniquement. |
| **Test sur appareil Android physique** | Aucun appareil disponible | Le mécanisme est identique à Chrome desktop, où il est confirmé. Risque résiduel faible. |

Aucun de ces cas ne laisse un visiteur bloqué : l'absence d'invite native renvoie toujours vers des instructions manuelles.

---

## 3. Stabilité et points de fragilité

### État actuel

Les quatre pages répondent en HTTP 200 entre 0,08 et 0,22 seconde. Les six endpoints d'API répondent. Aucune erreur console. Aucun débordement horizontal en mobile comme en desktop. Les cinq langues sont complètes, sans clé manquante.

### Risques identifiés

**1. Dépendance à cinq services externes gratuits — risque élevé**

| Service | Usage | Limite |
|---|---|---|
| Groq | Chat IA, traduction des actus | 1 000 requêtes/jour, 8 000 tokens/minute |
| Alpha Vantage | Actualités | 25 requêtes/jour (cache de 3 h, soit 8 appels/jour) |
| Yahoo Finance | 16 actifs de marché | Non documentée, sans clé |
| CoinGecko | Bitcoin, Ethereum | Palier gratuit |
| Google Sheets | Avis | Aucune |

L'incident du 22 août est l'illustration du risque : Groq a retiré sans préavis le modèle utilisé, mettant hors service le chat IA — fonctionnalité centrale — ainsi que la traduction des actualités, sans aucune alerte. **La panne a été découverte par hasard.**

**2. Aucune supervision automatique — risque élevé**

Rien ne signale aujourd'hui qu'un service externe est tombé. C'est le point le plus préoccupant pour une démonstration en direct : une panne survenue la veille pourrait n'être découverte que devant le jury.

**3. Aucun test automatisé — risque moyen**

Chaque vérification est manuelle. Sur un projet qui évolue vite, une régression peut passer inaperçue jusqu'à ce qu'un visiteur la rencontre.

**4. Fichiers statiques non versionnés dans leur nom — risque faible**

Cause du problème de cache du 22 août. La stratégie actuelle (servir le cache puis rafraîchir en arrière-plan) corrige le symptôme et s'auto-répare en un rechargement, mais la cause reste présente.

**5. Section Avis vide — risque de perception**

L'infrastructure fonctionne, mais **aucun avis n'est publié à ce jour**. Un jury qui consulte le site y verra une section vide.

### Risques pour une démonstration en direct

| Scénario | Probabilité | Parade |
|---|---|---|
| Un service externe tombe le jour J | Faible mais réelle | Aucune aujourd'hui : à mettre en place |
| Chat saturé par plusieurs usages simultanés | Réduite depuis le 23 août | Six conversations rapprochées passent désormais, contre trois avant |
| Réseau défaillant sur place | Modérée | Aucune : prévoir des captures ou une vidéo de repli |
| Quota Alpha Vantage épuisé | Très faible | Cache de 3 h, soit 8 appels/jour pour un quota de 25 |

---

## 4. Verdict sur la maturité technique

### Ce qui est solide

- **Architecture proportionnée.** Site statique servi par un réseau de diffusion, sept fonctions serverless pour le dynamique. Pas de serveur à maintenir, pas de base de données, coût quasi nul. Pour un projet porté seul, c'est le bon choix.
- **Clés d'API protégées.** Aucun identifiant exposé côté navigateur.
- **Gestion sérieuse des quotas.** Chaque source a un cache calibré sur sa fraîcheur réelle. Le fil d'actualité personnalisable a été conçu pour ne consommer aucun quota supplémentaire.
- **Dégradation maîtrisée.** En cas d'échec d'une source, la dernière réponse valide est servie plutôt qu'une erreur. Les échecs remontent désormais des messages explicites à l'utilisateur.
- **Multilingue complet.** Cinq langues, aucune clé manquante.
- **Application installable** sur toutes les plateformes grand public, avec un chemin guidé partout.

### Ce qui reste faible

- Pas de supervision des services externes.
- Pas de tests automatisés.
- Pas de preuve sociale visible.

### Le raisonnement

Les trois faiblesses restantes ont un point commun : **aucune ne se corrige par du développement de fonctionnalités**. La supervision est une tâche d'une heure, les tests une tâche d'une demi-journée, et la preuve sociale ne dépend pas du tout du code.

À l'inverse, ce qui manque au dossier Pépite est aujourd'hui **entièrement hors du champ technique**. Le produit fait ce qu'il annonce — éducation financière gratuite, sans jargon, pour les 18-30 ans — et chaque promesse a sa traduction concrète dans le site. Mais rien ne démontre que quelqu'un l'utilise.

Continuer à investir du temps technique produirait des fonctionnalités supplémentaires que personne n'a demandées, pendant que la question réelle du jury restera sans réponse.

> **Verdict : le niveau technique est suffisant pour basculer sur la traction et la communication.**

La seule exception justifiant encore du temps technique est la **supervision automatique** — non pour améliorer le produit, mais pour protéger la démonstration du jour J.

---

## 5. Ce qu'il reste à faire, par ordre de priorité

### Avant l'oral, technique

**1. Mettre en place une supervision — une heure, impact élevé**
Une vérification quotidienne automatique des endpoints critiques, avec alerte. C'est une assurance contre le scénario où une panne est découverte devant le jury.

**2. Préparer un repli de démonstration — une heure**
Captures ou courte vidéo des fonctionnalités clés, au cas où le réseau ou une API ferait défaut sur place.

**3. Quelques tests automatisés ciblés — une demi-journée, optionnel**
Sans viser une couverture complète : vérifier que les endpoints répondent et que les pages se chargent suffirait à détecter les régressions les plus coûteuses.

### Avant l'oral, non technique

**4. Obtenir des avis publiés.** Le formulaire est en ligne et une sollicitation a déjà été faite. Il reste à **valider les réponses reçues** dans la colonne de modération du tableur : sans le passage à « oui », rien ne s'affiche, même pour une réponse bien reçue. Le cache se rafraîchit en dix minutes.

**5. Collecter des chiffres d'usage.** Google Analytics est en place sur le site. Extraire quelques indicateurs (visiteurs, pages vues, installations de l'app) donnerait au dossier ce qui lui manque le plus.

### À reporter après l'oral

**La section « Mon profil perso ».** C'est le chantier le plus ambitieux et le plus démonstratif, mais aussi le plus risqué à un mois de l'échéance. Mieux vaut la présenter comme une feuille de route argumentée que la livrer à moitié.

---

## 6. Vérifications réseaux sociaux — à faire par l'auteur

Ces points sortent du périmètre technique et n'ont **pas** été vérifiés : ils demandent un accès aux comptes Instagram et TikTok.

- [ ] Bio Instagram et TikTok à jour, sans coquille
- [ ] Stories à la une bien nommées, couvertures cohérentes (Flash info, Actus, Infos utiles, Avis, Témoignages, Financia)
- [ ] Aucun emoji dans les noms des stories à la une, conformément à la décision prise
- [ ] Logo et photo de profil identiques sur les deux plateformes
- [ ] Derniers posts conformes à la charte (sous-titres 55-60 px, direction artistique sobre)

Les cinq couvertures de stories à la une ont été livrées au format 500 × 500, en trait violet `#7C3AED` sur fond noir, nommées d'après leur destination.

---

### Portée de ce bilan

Ce document porte exclusivement sur l'état technique du projet, constaté par des tests exécutés sur l'environnement de production le 24 août 2026. Il ne comporte aucune évaluation des chances de sélection, du modèle économique ou du potentiel commercial, qui relèvent d'autres critères que ceux observables dans le code.
