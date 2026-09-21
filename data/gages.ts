// data/gages.ts
// Liste des 30 gages intégrés par défaut pour le mode Patate Chaude de Dit-Paulo ?

export interface Gage {
  id: string;
  text: string;
  category: 'defi' | 'smartphone' | 'verite' | 'soiree';
  isCustom?: boolean;
}

export const DEFAULT_GAGES: Gage[] = [
  // Défis & Rôles autour de la table
  {
    id: 'gage_001',
    text: "Parle avec un accent choisi par le groupe jusqu'à ton prochain tour.",
    category: 'defi',
  },
  {
    id: 'gage_002',
    text: "Fais une imitation d'une personne présente autour de la table sans dire son nom. Le premier qui devine gagne le point.",
    category: 'defi',
  },
  {
    id: 'gage_003',
    text: "Fais le prochain tour en chuchotant comme si tu racontais un secret d'État.",
    category: 'defi',
  },
  {
    id: 'gage_004',
    text: "Laisse ton voisin de gauche te donner un nouveau surnom que tout le monde doit utiliser jusqu'à la fin de la partie.",
    category: 'defi',
  },
  {
    id: 'gage_005',
    text: "Regarde la personne en face de toi dans les yeux pendant 20 secondes sans rire ni sourire.",
    category: 'defi',
  },
  {
    id: 'gage_006',
    text: "Ne dis plus aucun mot contenant la lettre « E » pendant deux tours de table (ou subis un deuxième gage).",
    category: 'defi',
  },
  {
    id: 'gage_007',
    text: "Réponds à la prochaine question en commençant obligatoirement par « Franchement, pour être honnête avec vous... ».",
    category: 'defi',
  },
  {
    id: 'gage_008',
    text: "Fais un compliment sincère et inattendu à chaque personne présente autour de la table.",
    category: 'defi',
  },
  {
    id: 'gage_009',
    text: "Raconte ta pire honte d'enfance en moins de 30 secondes chrono.",
    category: 'defi',
  },
  {
    id: 'gage_010',
    text: "Répète le dernier mot de chaque phrase que tu prononces jusqu'à ton prochain tour.",
    category: 'defi',
  },

  // Smartphone & Petites révélations
  {
    id: 'gage_011',
    text: "Montre la toute dernière photo de ta galerie (sans tricher ni faire défiler).",
    category: 'smartphone',
  },
  {
    id: 'gage_012',
    text: "Lis à voix haute ta dernière recherche sur Google ou ton navigateur.",
    category: 'smartphone',
  },
  {
    id: 'gage_013',
    text: "Révèle ton temps d'écran quotidien de la journée.",
    category: 'smartphone',
  },
  {
    id: 'gage_014',
    text: "Montre la dernière note écrite dans ton application Notes.",
    category: 'smartphone',
  },
  {
    id: 'gage_015',
    text: "Fais écouter les 10 premières secondes du dernier morceau que tu as écouté sur ton application musicale.",
    category: 'smartphone',
  },
  {
    id: 'gage_016',
    text: "Montre ta liste des conversations récentes sur WhatsApp ou Messages (juste les noms, pas le contenu).",
    category: 'smartphone',
  },
  {
    id: 'gage_017',
    text: "Lis à voix haute le dernier message privé que tu as envoyé ou reçu.",
    category: 'smartphone',
  },
  {
    id: 'gage_018',
    text: "Révèle le nom de la dernière personne avec qui tu as parlé au téléphone et pourquoi.",
    category: 'smartphone',
  },

  // Vérités & Choix sous pression
  {
    id: 'gage_019',
    text: "Réponds obligatoirement et sans filtre à la question que tu viens d'esquiver.",
    category: 'verite',
  },
  {
    id: 'gage_020',
    text: "Désigne la personne autour de la table avec qui tu partirais sur une île déserte et celle que tu n'emmènerais surtout pas.",
    category: 'verite',
  },
  {
    id: 'gage_021',
    text: "Raconte la pire excuse que tu aies inventée pour annuler une soirée ou un rendez-vous.",
    category: 'verite',
  },
  {
    id: 'gage_022',
    text: "Avoue un mensonge que tu as dit à l'un des joueurs présents et que personne n'a jamais découvert.",
    category: 'verite',
  },
  {
    id: 'gage_023',
    text: "Donne une note de sincérité sur 10 à la dernière réponse donnée par le joueur précédent.",
    category: 'verite',
  },
  {
    id: 'gage_024',
    text: "Désigne la personne présente qui a, selon toi, le style vestimentaire le plus discutable.",
    category: 'verite',
  },

  // Ambiance Soirée & Gages physiques légers
  {
    id: 'gage_025',
    text: "Bois 2 gorgées de ton verre (ou cul-sec de ton verre d'eau si tu ne bois pas).",
    category: 'soiree',
  },
  {
    id: 'gage_026',
    text: "Fais 10 squats ou 10 pompes immédiatement devant tout le monde.",
    category: 'soiree',
  },
  {
    id: 'gage_027',
    text: "Reste debout jusqu'à ton prochain tour sans pouvoir t'asseoir.",
    category: 'soiree',
  },
  {
    id: 'gage_028',
    text: "Fais un pierre-feuille-ciseaux contre chaque joueur : chaque défaite te coûte une gorgée ou un gage supplémentaire.",
    category: 'soiree',
  },
  {
    id: 'gage_029',
    text: "Laisse le joueur de droite choisir une boisson ou un mélange mystère que tu dois goûter.",
    category: 'soiree',
  },
  {
    id: 'gage_030',
    text: "Tire à la roulette : le groupe t'invente un gage sur-mesure validé à la majorité.",
    category: 'soiree',
  },
];
