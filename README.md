# 📦 Réco — Récolement collaboratif au CDI

![vibe-coded](https://img.shields.io/badge/vibe-coded-black?style=for-the-badge)
![Hors ligne](https://img.shields.io/badge/hors_ligne-fonctionne-2c3e50?style=for-the-badge)
![Local Only](https://img.shields.io/badge/données-locales_uniquement-2ecc71?style=for-the-badge)
![Collaboratif](https://img.shields.io/badge/collaboratif-à_plusieurs-9b59b6?style=for-the-badge)
![Mode sombre](https://img.shields.io/badge/mode_sombre-supporté-000000?style=for-the-badge)

## 🎯 Pourquoi Réco ?

**Réco** est une application web pensée pour **simplifier et accélérer le récolement au CDI**, sans se prendre la tête avec du matériel spécifique.

👉 **Ce n'est pas un remplaçant de BCDI**, mais un outil complémentaire pour la phase de terrain :  
capture rapide des codes-barres (scan ou saisie), organisation par onglets, export facile pour réintégration dans votre logiciel documentaire.

[**▶️ Tester Réco maintenant**](https://jeromemtl.github.io/reco/)

---

## 👥 Un outil collaboratif

L'atout de Réco ? **On peut être plusieurs à récoler en même temps** !  
- Plusieurs collègues peuvent participer sur des postes différents
- Et pourquoi pas **embarquer les élèves** dans l'opération ?  
  Sous votre supervision, ils peuvent scanner les documents, ce qui les responsabilise et les implique dans la vie du CDI.

Pas de connexion nécessaire, pas de compte à créer : chacun ouvre l'application sur son appareil et c'est parti !

---

## ✨ Fonctionnalités

### Scan par caméra 📷
- Utilisation de la caméra du téléphone ou de l'ordinateur
- Détection automatique des codes-barres (EAN-13, CODE-128, QR Code, etc.)
- Bip sonore activable/désactivable
- Flash utilisable si supporté par l'appareil

### Gestion des onglets
- Création, renommage et suppression d'onglets
- Réorganisation par glisser-déposer
- Indicateur visuel pour les onglets contenant du texte
- Remplacement complet de la liste via une fenêtre dédiée

### Zone de saisie optimisée
- Saisie manuelle, via douchette **ou par caméra**
- **Aucune configuration nécessaire** : la touche **Tab** est automatiquement convertie en retour à la ligne
- Sauvegarde automatique après chaque modification
- Compteur de lignes dynamique
- Choix de la taille du texte

### Export & sauvegarde
- Export TXT de l'onglet courant
- Export TXT de tous les onglets remplis
- Sauvegarde automatique locale (localStorage)
- Restauration automatique à l'ouverture

### Statistiques intégrées
- Nombre total d'onglets et de lignes
- Onglets vides / remplis
- Détail par onglet
- Export TXT des statistiques

### Interface moderne
- Mode clair / sombre
- Interface responsive
- Feedback visuel lors de la sauvegarde

---

## 🚀 Comment l'utiliser ?

C'est tout simple :

1. Ouvrez [**l'application en ligne**](https://jeromemtl.github.io/reco/)
2. Créez vos onglets (un par cote, par emplacement...)
3. Scannez ou saisissez les codes-barres
4. Exportez le tout pour réintégrer dans BCDI

**Aucune installation, aucune configuration** : ça marche partout, même sans Internet après le premier chargement.

---

## 👨‍🏫 Idées d'utilisation avec les élèves

- **Par équipes** : chaque groupe d'élèves a son onglet et scanne une partie du CDI
- **Suivi en temps réel** : vous voyez l'avancement de chaque groupe
- **Responsabilisation** : les élèves participent à une tâche concrète et utile
- **Apprentissage** : l'occasion de parler des codes-barres, des cotes, de l'organisation du CDI

---

## 📜 Licences

Ce projet est sous double licence :

| Code | Licence |
|------|---------|
| **Code original de l'application** (fichiers `.js`, `.css`, `.html`) | [MIT](LICENSE) |
| **Bibliothèque [html5-qrcode](https://github.com/mebjas/html5-qrcode)** utilisée pour le scan par caméra | [Apache 2.0](LICENSE-APACHE.txt) |

Les deux licences sont compatibles entre elles. Vous pouvez donc utiliser, modifier et distribuer cette application librement, y compris dans un contexte commercial, à condition de respecter les termes des licences (conservation des copyrights, inclusion des textes de licence).

---

*Projet développé pour simplifier le quotidien des documentalistes et professeurs documentalistes.*  
💡 Des idées ? Des retours ? N'hésitez pas à ouvrir une issue ou à contribuer !
