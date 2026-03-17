# Reco — Alternative au bloc-notes pour le récolement
![vibe-coded](https://img.shields.io/badge/vibe-coded-black?style=for-the-badge)
![Hors ligne](https://img.shields.io/badge/hors_ligne-fonctionne-2c3e50?style=for-the-badge)
![Local Only](https://img.shields.io/badge/données-locales_uniquement-2ecc71?style=for-the-badge)
![Mode sombre](https://img.shields.io/badge/mode_sombre-supporté-000000?style=for-the-badge)
![Autosave](https://img.shields.io/badge/sauvegarde-automatique-3498db?style=for-the-badge)

## Présentation

**Récolement+** est une application web légère et ergonomique destinée au **récolement du CDI**.  
Elle permet de saisir, organiser et exporter facilement les cotes scannées ou tapées, sans configuration particulière de la douchette.

L’application fonctionne entièrement **en local** (localStorage) et ne nécessite aucune installation.  
Il suffit d’ouvrir `index.html` dans un navigateur moderne.

[**▶️ Tester Reco maintenant**](https://jeromemtl.github.io/reco/)

---

## Fonctionnalités

### Scan par caméra (nouveau !) 📷
- Utilisation de la caméra du téléphone ou de l'ordinateur via la bibliothèque [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- Détection automatique des codes-barres (EAN-13, CODE-128, QR Code, etc.)
- Bip sonore activable/désactivable
- Flash utilisable si supporté par l'appareil
- Le dernier code scanné s'affiche à l'écran

### Gestion des onglets
- création, renommage et suppression d’onglets  
- réorganisation par glisser‑déposer  
- indicateur visuel pour les onglets contenant du texte  
- remplacement complet de la liste d’onglets via une fenêtre dédiée  

### Zone de saisie optimisée
- saisie manuelle, via douchette **ou par caméra**
- **aucune configuration nécessaire** : la touche **Tab** envoyée par la douchette est automatiquement convertie en **retour à la ligne**  
- sauvegarde automatique après chaque modification (Enter, Tab, Backspace, scan…)  
- compteur de lignes dynamique  
- choix de la taille du texte  

### Export & sauvegarde
- export TXT de l’onglet courant  
- export TXT de tous les onglets remplis  
- sauvegarde automatique locale (localStorage)  
- restauration automatique à l’ouverture  

### Statistiques intégrées
- nombre total d’onglets  
- nombre total de lignes  
- onglets vides / remplis  
- détail par onglet  
- export TXT des statistiques  

### Interface moderne
- mode clair / sombre  
- interface responsive  
- feedback visuel lors de la sauvegarde  

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
