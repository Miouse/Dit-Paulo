# 🎮 Comment lancer Dit-Paulo sur ton Mac (Spécial Potos) 🍏

Pas de panique, tu n'as besoin d'aucune compétence en informatique ! Suis juste ces 4 étapes simples, ça prend 3 minutes chrono.

---

### Étape 1 : Installer le seul logiciel obligatoire (Node.js)
1. Va sur ce site officiel : **[https://nodejs.org](https://nodejs.org)**
2. Clique sur le gros bouton vert marqué **LTS (Recommandé pour la plupart des utilisateurs)**.
3. Ouvre le fichier téléchargé (fichier `.pkg`) et clique sur *Continuer / Suivant / Installer* jusqu'au bout comme n'importe quelle application.

---

### Étape 2 : Récupérer le jeu

Tu as deux façons très simples, choisis celle qui te plaît :

#### Option A (Le plus simple — sans rien taper) :
1. Va sur le lien GitHub : **[https://github.com/Miouse/Dit-Paulo](https://github.com/Miouse/Dit-Paulo)**
2. Clique sur le bouton vert **Code** (en haut à droite), puis sur **Download ZIP**.
3. Dézippe le dossier téléchargé (double-clic dessus) et glisse-le sur ton **Bureau** (ou dans tes Documents).

---

### Étape 3 : Ouvrir le Terminal de ton Mac
1. Sur ton clavier de Mac, appuie en même temps sur les touches :  
   **Cmd (⌘) + Barre d'Espace** (pour ouvrir la recherche Spotlight).
2. Tape `terminal` et appuie sur **Entrée**.
3. Une petite fenêtre noire ou blanche s'ouvre. C'est ici que la magie opère !

---

### Étape 4 : Lancer le jeu ! 🚀

1. Dans la fenêtre du Terminal, tape `cd ` (avec un espace après), puis **glisse-dépose le dossier du jeu directement depuis ton Finder dans la fenêtre du terminal**, puis appuie sur **Entrée**.  
   *(Ça écrit automatiquement le bon chemin vers le dossier sans risque d'erreur !)*

2. Tape ensuite cette commande et appuie sur **Entrée** (patiente 30 secondes pendant que les fichiers s'installent) :
   ```bash
   npm install
   ```

3. Une fois terminé, tape la commande magique pour lancer le jeu :
   ```bash
   npm run web
   ```

🎉 **Et voilà !** Une page internet s'ouvre automatiquement dans ton navigateur Safari ou Chrome avec le jeu **Dit-Paulo** prêt à jouer !

---

### 🎁 Comment importer le paquet de cartes que ton pote t'a envoyé ?
1. Dans le jeu, clique sur **Mes Cartes Personnalisées ⭐**.
2. Clique sur le bouton **📥 Importer un Deck**.
3. Si ton pote t'a envoyé un fichier `.json`, clique sur **📁 Choisir un fichier .json** et sélectionne-le. S'il t'a envoyé un texte par message, colle-le simplement dans la grande case.
4. Clique sur **📥 Importer**... et toutes ses questions exclusives apparaîtront directement dans ta partie !
