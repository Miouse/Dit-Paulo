# Salut ! Bienvenue sur Dit-Paulo

Si tu es là, c'est pour tester le jeu sur ton Mac.
Si les mots Terminal ou GitHub te font un peu peur, ne t'inquiète pas : ton Mac ne risque rien du tout.

C'est plié en 3 minutes chrono avec 4 petites étapes.

---

### 1. Installer Node.js
Ton Mac a juste besoin de ce petit programme gratuit pour exécuter le jeu.
- Va sur : **https://nodejs.org**
- Clique sur le bouton vert **LTS**.
- Ouvre le fichier téléchargé et installe-le normalement en faisant suivant / continuer jusqu'au bout.

---

### 2. Télécharger le dossier du jeu
Pas besoin de compte :
- Va sur ce lien : **https://github.com/Miouse/Dit-Paulo**
- En haut à droite, clique sur le bouton vert **Code**, puis sur **Download ZIP**.
- Double-clique sur le fichier téléchargé pour le décompresser, et pose le dossier obtenu sur ton **Bureau** (ou dans tes Téléchargements).

---

### 3. Ouvrir le Terminal
- Sur ton clavier de Mac, fais : **Cmd + Espace** pour ouvrir la recherche Spotlight.
- Tape `terminal` et appuie sur **Entrée**.
- Une fenêtre s'ouvre. C'est ici qu'on va taper deux lignes de commande toutes simples.

---

### 4. Lancer le jeu

1. Dans la fenêtre du Terminal, tape `cd ` (avec un espace après `cd`), puis **glisse et dépose le dossier du jeu directement depuis ton Finder dans la fenêtre**, et appuie sur **Entrée**.
   *(Ça écrit le chemin complet tout seul sans risque d'erreur).*

2. Tape ensuite :
   ```bash
   npm install
   ```
   *(Patiente une trentaine de secondes le temps qu'il charge les composants du jeu).*

3. Et enfin, tape :
   ```bash
   npm run web
   ```

Et voilà ! Ton navigateur (Safari ou Chrome) va s'ouvrir automatiquement avec **Dit-Paulo** prêt à jouer.

---

### Pour récupérer les questions personnalisées (le Deck)
Si je t'ai envoyé un fichier ou un texte avec des questions spécifiques :
1. Dans le jeu, va dans **Mes Cartes Personnalisées**.
2. Clique sur **Importer un Deck**.
3. Colle le texte (ou sélectionne le fichier reçu) et clique sur **Importer**.
4. Les questions s'ajoutent directement à ta partie.
