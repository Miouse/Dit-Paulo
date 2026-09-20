# Salut ! Bienvenue sur Dit-Paulo

Si tu es sous Linux, c'est encore plus rapide à mettre en place.
Voici les 4 étapes pour lancer le jeu en 2 minutes.

---

### 1. Installer Node.js et Git (si pas déjà fait)
Ouvre ton terminal et lance la commande correspondant à ta distribution :

- **Ubuntu / Debian / Linux Mint :**
  ```bash
  sudo apt update && sudo apt install -y nodejs npm git
  ```
- **Fedora :**
  ```bash
  sudo dnf install -y nodejs npm git
  ```
- **Arch Linux / Manjaro :**
  ```bash
  sudo pacman -S nodejs npm git
  ```

---

### 2. Récupérer le projet
Dans ton terminal, clone le dépôt :
```bash
git clone https://github.com/Miouse/Dit-Paulo.git
cd Dit-Paulo
```
*(Ou télécharge le ZIP sur **https://github.com/Miouse/Dit-Paulo** si tu préfères).*

---

### 3. Installer les dépendances
Toujours dans le dossier du jeu :
```bash
npm install
```

---

### 4. Lancer le jeu
Tape simplement :
```bash
npm run web
```

Ton navigateur s'ouvre automatiquement avec **Dit-Paulo**.

---

### Pour récupérer les questions personnalisées (le Deck)
Si je t'ai envoyé un fichier ou un texte avec des questions spécifiques :
1. Dans le jeu, va dans **Mes Cartes Personnalisées**.
2. Clique sur **Importer un Deck**.
3. Colle le texte (ou sélectionne le fichier reçu) et clique sur **Importer**.
4. Les questions s'ajoutent directement à ta partie.
