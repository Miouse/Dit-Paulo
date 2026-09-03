# 💬 Dit-Paulo ?

> **Les meilleures conversations commencent parfois par une question.**

Application mobile moderne de cartes de questions pour animer vos soirées, rendez-vous, moments entre potes ou en couple. Des rires, des vérités croustillantes, des débats passionnés et des dilemmes inavouables !

---

## 📱 Aperçu & Concept

**Dit-Paulo ?** est conçu pour briser la glace, approfondir les relations et transformer n'importe quelle soirée en un moment inoubliable.

* 🃏 **Plus de 545 questions uniques** intégrées localement en français.
* 👥 **Prénoms personnalisés** : les questions ciblent directement les joueurs de la partie.
* ⚖️ **Vote du groupe & Gamification** : validez les réponses sincères ou punissez la langue de bois.
* 💣 **Cartes Extrêmes & Potins** surprises qui pimentent le jeu.
* 📶 **100% Hors-ligne** : jouable partout sans connexion internet (plage, bar, camping, mode avion).

---

## 🎮 Fonctionnalités Clés & Mécaniques de Jeu

### 1. 🎯 Questions à Prénoms Dynamiques
L'application remplace automatiquement les balises `{Joueur1}`, `{Joueur2}` par les prénoms réels des participants saisis en début de partie.
> *Exemple : « Est-ce que tu penses que **Sarah** cacherait un corps pour **Maxime** ? »*

### 2. ⭐ Système de Points & Validation du Groupe
Après chaque question, le groupe juge la sincérité du joueur interrogé :
* **👍 Validé (+10 Pts / +25 Pts pour Extrême)** : Le joueur a répondu franchement et gagne des points.
* **👎 Langue de bois (0 Pt)** : Réponse esquivée ou non convaincante !

### 3. 💣 Cartes "Extrême" & "Extrême Potin"
Des cartes surprises à fort impact apparaissent aléatoirement durant la partie : anecdotes choc, révélations piquantes et dossiers de soirée.

### 4. 🎟️ Double Système de Jokers (Achat avec Points)
Une question est trop indiscrète ? Le joueur peut utiliser ses points accumulés pour esquiver :
* **🎲 Joker Hasard (-10 Pts)** : Déclenche une roulette animée qui désigne un autre joueur au hasard pour répondre à sa place !
* **🎯 Joker Victime (-15 Pts)** : Permet de choisir directement le joueur du groupe qui devra répondre à la question.

### 5. ⏱️ Mode Timer "Patate Chaude" (15s sous Pression)
Activez le mode chrono : le joueur a **15 secondes** montre en main pour répondre. Si le temps s'écoule avant, une alerte retentit et un **gage aléatoire** lui est attribué !

### 6. 🏆 Podium Interactif & Médailles
À la fin de la partie ou lors de la consultation des scores, un podium interactif célèbre les gagnants :
* 🥇 **Médaille d'or**
* 🥈 **Médaille d'argent**
* 🥉 **Médaille de bronze**

### 7. 🃏 Pioche & Défausse 3D
Visualisez l'état de votre paquet en temps réel grâce à la pile de cartes interactive :
* Compteur de cartes restantes dans la pioche.
* Compteur de cartes défaussées.
* Détection automatique de la fin du deck avec option de remélanger.

### 8. ❤️ Favoris & Gestion Locale
* Enregistrez vos questions préférées d'un simple tap sur le cœur.
* Retrouvez-les dans l'écran **Favoris** persistant via `AsyncStorage`.
* Possibilité de réinitialiser la pioche depuis les paramètres.

---

## 🕹️ Modes de Jeu & Niveaux d'Intensité

### Les 5 Modes

| Mode | Emoji | Description |
|---|:---:|---|
| **Entre amis** | 🍻 | Anecdotes, débats, souvenirs et fous rires |
| **Date / Crush** | 😏 | Briser la glace, découverte mutuelle et flirt subtil |
| **Couple** | ❤️ | Complicité, projets, intimité et tendresse |
| **Deep mais chill** | 🧠 | Philosophie de vie, ambitions, vulnérabilité et rêves |
| **Soirée** | 🎉 | Rythme rapide, cartes piquantes, dilemmes et vérités |

### Les Niveaux d'Intensité

| Niveau | Emoji | Nom | Ambiance |
|:---:|:---:|---|---|
| **1** | 🧊 | **Icebreaker** | Léger, facile pour démarrer |
| **2** | 👀 | **Curieux** | On commence à creuser |
| **3** | 🫶 | **Personnel** | Confidences et anecdotes vraies |
| **4** | 😏 | **Flirt** | Séduction, tension et sous-entendus |
| **5** | 🧠 | **Deep** | Vérités intenses et introspectives |

---

## 🛠 Stack Technique

* **Framework :** [React Native](https://reactnative.dev/) (0.86.3)
* **Toolchain & Native APIs :** [Expo](https://expo.dev/) (SDK 57)
* **Navigation :** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
* **Langage :** [TypeScript](https://www.typescriptlang.org/) (Typage strict à 100%)
* **Stockage Local :** [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
* **Gestion d'État :** React Context API (`useReducer` typé)
* **CI/CD & Automatisation :** GitHub Actions (Compilation Android APK & GitHub Releases)
* **Design :** Vanilla React Native StyleSheet, Dark Theme `#0E0E17`, Palette Violette néon `#7B61FF`

---

## 📁 Architecture du Projet

```
Dit-Paul/
├── .github/
│   └── workflows/
│       └── build-apk.yml       # Automatisation du build APK & GitHub Releases
├── app/                        # Routes de l'application (Expo Router)
│   ├── _layout.tsx             # Layout racine (thème sombre + GameProvider)
│   ├── index.tsx               # Écran d'accueil (Hero, animations, CTA)
│   ├── cards.tsx               # Visualiseur de cartes du deck
│   ├── questions-list.tsx      # Explorateur complet des questions
│   ├── favorites.tsx           # Écran des questions favorites
│   ├── settings.tsx            # Paramètres et remise à zéro
│   ├── game/
│   │   └── index.tsx           # Moteur de jeu (cartes, jokers, timer, podium)
│   └── setup/
│       ├── mode.tsx            # Choix du mode de jeu
│       ├── players.tsx         # Saisie et gestion des prénoms (min 2)
│       └── intensity.tsx       # Choix de l'intensité
│
├── assets/                     # Icônes 3D, splash screen et fonds d'écran
├── components/                 # Composants UI réutilisables
│   ├── CardDeck.tsx            # Paquet de cartes 3D interactif
│   ├── IntensitySelector.tsx   # Sélecteur de paliers d'intensité
│   ├── ModeCard.tsx            # Carte interactive de sélection de mode
│   ├── PlayerInput.tsx         # Champ de saisie et suppression de joueur
│   ├── PrimaryButton.tsx       # Boutons stylisés (primary, secondary, danger)
│   ├── QuestionCard.tsx        # Carte de question avec badges et favoris
│   └── ScreenContainer.tsx    # Conteneur responsive avec SafeArea et background
│
├── constants/
│   └── theme.ts                # Design System : couleurs, typographie, espacements
├── context/
│   └── GameContext.tsx         # État global du jeu (session, scores, historique)
├── data/
│   └── questions.ts            # Base de données locale de 545+ questions
├── services/
│   ├── questionEngine.ts       # Algorithme anti-répétition et filtrage
│   ├── jokeEngine.ts           # Moteur d'effets et de gages aléatoires
│   ├── favoritesService.ts     # Gestionnaire AsyncStorage des favoris
│   ├── playersService.ts       # Sauvegarde et historique des joueurs
│   └── seenQuestionsService.ts # Suivi des cartes déjà jouées
├── types/
│   ├── game.ts                 # Types TypeScript (Session, Mode, Player, Score)
│   └── question.ts             # Types (Question, QuestionCategory, Intensity)
├── app.json                    # Configuration Expo & métadonnées Android
└── package.json                # Dépendances et scripts npm
```

---

## 🚀 Démarrage Rapide (Développement)

### Prérequis
* [Node.js](https://nodejs.org) v18 ou supérieur
* [Expo Go](https://expo.dev/go) sur smartphone OU un navigateur web

### Installation
```bash
# 1. Cloner le dépôt
git clone https://github.com/<votre-pseudo>/Dit-Paulo.git
cd Dit-Paulo

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npx expo start
```

* **Sur smartphone :** Scannez le QR code affiché dans le terminal avec l'application Expo Go (Android) ou l'appareil photo (iOS).
* **Sur navigateur Web :** Tapez `w` dans le terminal pour ouvrir le jeu dans votre navigateur.

---

## 🤖 Déploiement & Distribution de l'APK (Sans les Stores)

Le projet intègre un pipeline **GitHub Actions** qui compile l'application en fichier APK Android autonome et le publie directement sur vos **GitHub Releases**.

### 1. Générer une nouvelle version APK
Poussez simplement un tag de version Git :
```bash
git tag v1.0.0
git push origin v1.0.0
```
*(Ou rendez-vous sur GitHub > onglet **Actions** > **Build & Release Android APK** > cliquez sur **Run workflow**).*

### 2. Téléchargement pour les joueurs
1. Allez dans la section **Releases** de votre dépôt GitHub.
2. Téléchargez le fichier **`Dit-Paulo.apk`** directement depuis un smartphone Android.
3. À l'ouverture, autorisez l'installation d'applications de sources inconnues.
4. L'application est installée sur le téléphone avec son logo officiel et fonctionne **sans aucune connexion internet** !

---

## 🗺 Roadmap

- [x] Base de 545+ questions catégorisées et rédigées en français
- [x] Injection dynamique des prénoms des joueurs
- [x] Système de points et validation des réponses
- [x] Double Joker (Roulette Hasard animée & Choix de la Victime)
- [x] Timer "Patate Chaude" (15s) avec gages
- [x] Podium interactif de fin de partie avec médailles
- [x] Nouveau logo & icône d'application 3D néon violet
- [x] Configuration Android (`app.json`) et packaging `com.ditpaulo.game`
- [x] Workflow GitHub Actions pour compilation APK automatique & Releases
- [ ] 🎨 Créateur de Deck Personnalisé (Inside Jokes entre amis)
- [ ] 🔊 Design Sonore & Bruitages SFX immersifs
- [ ] 📸 Générateur de Carte pour Story (Instagram, Snapchat, TikTok)
- [ ] 🌐 Synchronisation en ligne optionnelle (Supabase)

---

## 📄 Licence

Distribué sous la licence **MIT**. Libre d'utilisation et de modification.

---

*Fait avec ❤️ pour que les conversations qui comptent puissent enfin commencer.*
