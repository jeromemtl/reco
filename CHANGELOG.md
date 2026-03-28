# Changelog

Tous les changements notables de l'application Reco.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-03-28

### ✨ Ajouté
#### Modes d'utilisation
- **Mode solo** : données stockées uniquement en local (localStorage)
  - Fonctionne sans connexion Internet
  - Export manuel pour sauvegarde
  - UAI optionnel (utilisé pour les statistiques)
- **Mode collaboratif** : synchronisation Firestore temps réel
  - Travail à plusieurs en même temps
  - Sauvegarde automatique dans le cloud
  - Connexion Internet requise
- **Choix du mode** à la connexion avec descriptions détaillées
- **Indicateur de mode** dans le footer (👤 Solo / 👥 Collaboratif)
- **Modale de confirmation** lors du changement de mode
  - Message adapté (solo → collab / collab → solo)
  - Affiche le nombre de lignes locales avant changement

#### Synchronisation et hors-ligne
- **Synchronisation Firebase Firestore** en temps réel
- **Écran de connexion UAI** : saisie du code établissement
- **Indicateur de synchronisation** : ☁️, 🔄, ⚠️
- **Mode hors-ligne** : travail sans connexion avec file d'attente
- **File d'attente** des opérations en mode hors-ligne (stockée dans localStorage)
- **Fusion automatique des conflits** : concaténation des données lors de synchronisation
- **Indicateurs de connexion** : 🟢 En ligne / 🔴 Hors ligne / 🟡 Sync en attente
- **Badge de file d'attente** avec compteur des opérations en attente
- **Reconnexion automatique** : traitement de la file au retour en ligne

#### Interface et RGPD
- **Politique de confidentialité** (modale accessible depuis le footer)
- **Mentions légales** (modale avec éditeur, hébergement, licences)
- **Formulaire de contact** via Google Forms
- **Favicon personnalisé** (code-barres stylisé, s'adapte au mode nuit)
- **Bouton de déconnexion / changement d'établissement** (desktop et mobile)
- **Détection automatique du thème système** (prefers-color-scheme)

#### Indicateurs et feedback
- **Indicateur de sauvegarde** 💾 avec feedback visuel
- **Badge de file d'attente** dans le footer
- **Statuts de synchronisation** dans le footer (☁️ Synchronisé / 🔄 Synchro... / ⚠️ Erreur / 📴 Hors ligne)

#### Optimisations et debug
- **Mode debug** activable avec `?debug` dans l'URL
- Fichier `debug.js` pour les logs conditionnels

### 🔧 Modifié

#### Optimisations
- Réorganisation du footer : ajout des statuts de connexion et synchronisation
- Sauvegarde périodique avec détection de changement (30s) : évite les sauvegardes inutiles
- Optimisation des écritures Firestore : flag anti-boucle `_saving`
- Amélioration du compteur de lignes (plus fiable)
- Amélioration du menu mobile hamburger (gestion du thème)

### 🐛 Corrigé

- Effacement du contenu de l'onglet actif au refresh
- Feedback de sauvegarde qui ne s'affichait pas
- Points verts qui ne s'actualisaient pas correctement
- Appels en boucle de `saveState` (boucle d'écritures Firestore)
- Scanner caméra : correction des formats de codes-barres
- Mode nuit dans le menu mobile : l'icône se met à jour correctement

---

## [0.3.0] - 2025-03-22

### ✨ Ajouté

- **Scanner caméra** intégré avec html5-qrcode
- **Menu hamburger** pour mobile (responsive)

### 🔧 Modifié

- Refonte de l'interface : header avec barre d'outils

---

## [0.2.0] - 2025-03-15

### ✨ Ajouté

- **Remplacer tous les onglets** : import d'une liste depuis un texte
- **Statistiques** : modal avec nombre de lignes par onglet

### 🔧 Modifié

- Refonte de l'interface : header avec barre d'outils
- Amélioration des tooltips sur les boutons
- Uniformisation du style CSS
- Sélecteur de taille de police (16px à 64px)
- Mode nuit avec stockage du thème (manuel et détection système)
- Architecture modulaire : découpage en `storage.js`, `sync.js`, `auth.js`, `tabs.js`, `editor.js`, `ui.js`, `theme.js`, `app.js`

### 🐛 Corrigé

- Compteur de lignes qui ne se mettait pas à jour
- Focus du textarea après changement d'onglet
- Drag & drop des onglets

---

## [0.1.0] - 2025-02-15

### ✨ Ajouté

- Version initiale
- **Onglets dynamiques** : création, renommage, suppression
- **Sauvegarde locale** (`localStorage`)
- **Export d'un onglet** (bouton 📤) au format `.txt`
- **Export tous les onglets** (bouton 📦) au format `.txt`
- **Réinitialisation** des onglets par défaut (bouton 🗑️)
- **Mode nuit** (bouton 🌙/☀️)
- **Drag & drop** pour réorganiser les onglets
- **Points verts** : indicateur visuel pour les onglets contenant du texte
- **Feedback de sauvegarde** "💾 Sauvegardé"
- **Menu contextuel** (clic droit) pour renommer/supprimer
- **Tabulation** automatiquement convertie en retour à la ligne
- **Compteur de lignes** basique
- **Sélecteur de taille de police**