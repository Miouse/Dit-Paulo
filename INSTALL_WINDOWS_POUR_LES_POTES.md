# Salut ! Bienvenue sur Dit-Paulo

Si tu es là, c'est pour lancer le jeu sur ton PC Windows.
Ne t'en fais pas si tu n'y connais rien en informatique : ça prend 3 minutes et ton PC ne risque absolument rien.

---

### 1. Installer Node.js
Ton PC a besoin de ce petit programme gratuit pour faire tourner le jeu.
- Va sur : **https://nodejs.org**
- Clique sur le bouton vert **LTS**.
- Ouvre le fichier téléchargé et clique sur suivant / installer jusqu'au bout (laisse les options par défaut).

---

### 2. Télécharger le dossier du jeu
- Va sur ce lien : **https://github.com/Miouse/Dit-Paulo**
- En haut à droite, clique sur le bouton vert **Code**, puis sur **Download ZIP**.
- Fais un clic droit sur le fichier ZIP téléchargé > **Extraire tout...** > clique sur **Extraire**.
- Place le dossier obtenu sur ton **Bureau** (ou dans tes Téléchargements).

---

### 3. Ouvrir le Terminal (l'astuce toute simple)
Pas besoin de taper des chemins compliqués :
1. Ouvre le dossier du jeu dans l'Explorateur de fichiers de Windows.
2. Clique tout en haut dans la **barre d'adresse** (là où est écrit le chemin du dossier).
3. Efface ce qui est écrit, tape simplement `powershell` (ou `cmd`) et appuie sur **Entrée**.
4. Une fenêtre bleue ou noire s'ouvre, déjà positionnée au bon endroit dans le dossier.

---

### 4. Lancer le jeu

1. Dans la fenêtre, tape :
   ```bash
   npm install
   ```
   *(Patiente 30 secondes le temps que les composants s'installent).*

2. Ensuite, tape :
   ```bash
   npm run web
   ```

Ton navigateur (Chrome, Edge ou Firefox) s'ouvre tout seul avec **Dit-Paulo** prêt à jouer.

---

### Pour récupérer les questions personnalisées (le Deck)
Si je t'ai envoyé un fichier ou un texte avec des questions spécifiques :
1. Dans le jeu, va dans **Mes Cartes Personnalisées**.
2. Clique sur **Importer un Deck**.
3. Colle le texte (ou sélectionne le fichier reçu) et clique sur **Importer**.
4. Les questions s'ajoutent directement à ta partie.
