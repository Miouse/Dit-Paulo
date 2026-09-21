# 💬 Dit-Paulo ?

> **Les meilleures conversations commencent parfois par une question.**

Application mobile moderne de cartes de questions pour animer vos soirées, rendez-vous, moments entre potes ou en couple. Des rires, des vérités croustillantes, des débats passionnés et des dilemmes inavouables !

---

## 📱 Aperçu & Concept

**Dit-Paulo ?** est conçu pour briser la glace, approfondir les relations et transformer n'importe quelle soirée en un moment inoubliable.

* 🃏 **Près de 700 questions uniques** intégrées localement en français.
* 👥 **Prénoms personnalisés** : les questions ciblent directement les joueurs de la partie.
* ⚖️ **Vote du groupe & Points optionnels** : validez les réponses sincères (+1 Pt) ou punissez la langue de bois (0 Pt).
* 🎭 **14 Catégories thématiques & 5 Préréglages** : ambiance chill, soirée potins, date romantique ou 100% sans filtre.
* 🃏 **Tri Tinder & Decks Custom** : swipez pour exclure des cartes et créez vos propres questions privées.
* 📶 **100% Hors-ligne** : jouable partout sans connexion internet (plage, bar, camping, mode avion).

---

## 🎮 Fonctionnalités Clés & Mécaniques de Jeu

### 1. 🎯 Questions à Prénoms Dynamiques
L'application remplace automatiquement les balises `{Joueur1}`, `{Joueur2}` par les prénoms réels des participants saisis en début de partie.
> *Exemple : « Est-ce que tu penses que **Sarah** cacherait un corps pour **Maxime** ? »*

### 2. ⭐ Système de Points & Validation du Groupe
Le calcul des points est **optionnel** : vous pouvez jouer pour la gagne ou en mode détendu sans compétition.

Lorsque les points sont activés :
* **👍 Validé (+1 Pt)** : Le joueur a répondu avec franchise et sincérité. Il marque 1 point.
* **🙈 Langue de bois / Passe (0 Pt)** : Réponse esquivée, botte en touche ou passage de tour.

En mode sans points, le groupe fait défiler les cartes librement à son propre rythme.

### 3. 🔥 Catégories Piquantes & Vérités Sans Filtre
Selon les catégories activées en début de partie, des questions à fort impact surgissent au fil de la session : potins de soirée, dossiers inavouables, dilemmes impossibles et vérités cash pour secouer la tablée.

### 4. 🎟️ Double Système de Jokers (Achat avec Points)
Lorsque les points sont activés, un joueur interrogé peut dépenser ses points accumulés pour esquiver une question trop indiscrète :
* **🎲 Joker Hasard (-10 Pts)** : Déclenche une roulette animée qui désigne un autre joueur au hasard pour répondre à sa place.
* **🎯 Joker Cible / Victime (-15 Pts)** : Permet de choisir directement le joueur du groupe qui devra répondre à la question.

### 5. ⏱️ Mode Timer "Patate Chaude" (15s sous Pression)
Activez le mode chrono à tout moment : le joueur interrogé dispose de **15 secondes** montre en main pour répondre. Si la jauge atteint zéro avant la fin de sa réponse, une alerte retentit et un **gage aléatoire** lui est immédiatement infligé !

### 6. 🃏 Tri des Cartes façon Tinder (Swipe)
Personnalisez votre jeu avant de lancer la partie :
* **Swipe à droite** : Garder la carte dans la pioche.
* **Swipe à gauche** : Exclure définitivement la carte du jeu.
* **Édition directe** : Modifiez le texte de n'importe quelle question pour l'adapter à votre groupe d'amis.

### 7. 🎨 Créateur de Decks Personnalisés & Partage
Créez vos propres cartes et dossiers d'amis :
* Rédigez vos questions privées et inside jokes avec le support des prénoms dynamiques.
* Exportez et importez vos decks en un clic au format JSON pour les échanger facilement entre téléphones.

### 8. 🏆 Podium Interactif & Médailles
À la fin de la partie ou lors de la consultation des scores, un podium interactif célèbre les gagnants :
* 🥇 **Médaille d'or**
* 🥈 **Médaille d'argent**
* 🥉 **Médaille de bronze**

### 9. ❤️ Favoris & Historique de Partie
* Enregistrez vos questions préférées d'un simple tap sur le cœur pour les retrouver dans l'écran **Favoris**.
* Consultez l'historique complet de la partie en cours pour revoir les cartes passées et les validations.

---

## 🕹️ Catégories & Préréglages d'Ambiance

Choisissez parmi **14 catégories thématiques** combinables à volonté, ou sélectionnez un préréglage d'ambiance en un tap :

### Les Préréglages Rapides

| Préréglage | Emoji | Ambiance | Catégories incluses |
|---|:---:|---|---|
| **Grand Mix** | 🎲 | Toutes les cartes | L'ensemble des 14 catégories actives |
| **Soirée & Potins** | 🎉 | Fous rires et révélations | Fun, Potins, Débats, Dilemmes, Situationship |
| **Date & Flirt** | 😏 | Séduction et complicité | Flirt, Relations, Situationship, Hot |
| **Chill & Deep** | 🧠 | Discussions profondes | Personnalité, Souvenirs, Futur, Philosophie, Rêves |
| **100% Cash & Hot** | 🔥 | Vérités crues et piquant | Potins, Situationship, Hot, Dilemmes |

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
│   ├── custom-cards.tsx        # Créateur et import/export de cartes personnalisées
│   ├── favorites.tsx           # Écran des questions favorites
│   ├── questions-list.tsx      # Explorateur complet des questions
│   ├── settings.tsx            # Paramètres et remise à zéro
│   ├── tinder-sort.tsx         # Tri et personnalisation des cartes façon Tinder
│   ├── game/
│   │   └── index.tsx           # Moteur de jeu (cartes, jokers, timer, podium)
│   └── setup/
│       ├── categories.tsx      # Choix des catégories et préréglages d'ambiance
│       └── players.tsx         # Saisie des prénoms (min 2) et points optionnels
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
│   └── questions.ts            # Base de données locale de près de 700 questions
├── services/
│   ├── questionEngine.ts       # Algorithme anti-répétition et filtrage
│   ├── jokeEngine.ts           # Moteur d'effets et de gages aléatoires
│   ├── customCardsService.ts   # Gestionnaire de decks custom et import/export JSON
│   ├── tinderSortService.ts    # Gestionnaire du tri, exclusion et édition Tinder
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

### Lanceurs 1-clic (Recommandé pour les potes)
* **Sur Mac :** Double-cliquez sur `LANCER-LE-JEU-MAC.command`.
* **Sur Windows :** Double-cliquez sur `LANCER-LE-JEU-WINDOWS.bat`.

### Installation manuelle
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

- [x] Base de près de 700 questions catégorisées et rédigées en français
- [x] Injection dynamique des prénoms des joueurs
- [x] Système de points optionnel (+1 Pt) et validation des réponses
- [x] Double Joker (Roulette Hasard animée & Choix de la Cible)
- [x] Timer "Patate Chaude" (15s) avec gages aléatoires
- [x] Tri et exclusion des cartes façon Tinder (Swipe & édition de cartes)
- [x] Créateur et partage de decks de cartes personnalisées (import / export JSON)
- [x] Lanceurs 1-clic pour Mac et Windows
- [x] Podium interactif de fin de partie avec médailles
- [x] Nouveau logo & icône d'application 3D néon violet
- [x] Configuration Android (`app.json`) et packaging `com.ditpaulo.game`
- [x] Workflow GitHub Actions pour compilation APK automatique & Releases
- [ ] 🔊 Design Sonore & Bruitages SFX immersifs
- [ ] 📸 Générateur de Carte pour Story (Instagram, Snapchat, TikTok)
- [ ] 🌐 Synchronisation en ligne optionnelle (Supabase)

---

## 📄 Licence

Distribué sous la licence **MIT**. Libre d'utilisation et de modification.

---

*Fait avec ❤️ pour que les conversations qui comptent puissent enfin commencer.*
