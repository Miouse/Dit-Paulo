// types/game.ts
// Tous les types TypeScript du domaine "jeu"

export type GameMode = 'friends' | 'date' | 'couple' | 'deep' | 'party' | 'nofilter';

// Intensité de 1 à 6
export type IntensityLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface ModeConfig {
  id: GameMode;
  label: string;
  emoji: string;
  description: string;
  // Intensités disponibles pour ce mode
  availableIntensities: IntensityLevel[];
}

export interface Player {
  id: string;
  name: string;
  points?: number;
}

export interface GameSession {
  mode: GameMode;
  players: Player[];
  intensity: IntensityLevel;
  currentPlayerIndex: number;
  seenQuestionIds: string[];
  currentQuestionId: string | null;
}

// Configuration des modes
export const MODE_CONFIGS: Record<GameMode, ModeConfig> = {
  friends: {
    id: 'friends',
    label: 'Entre amis',
    emoji: '🍻',
    description: 'Amusant, anecdotes, opinions et bons souvenirs',
    availableIntensities: [1, 2, 3, 5, 6],
  },
  date: {
    id: 'date',
    label: 'Date / Crush',
    emoji: '😏',
    description: 'Découvrir l\'autre, avec une touche de flirt',
    availableIntensities: [1, 2, 3, 4, 6],
  },
  couple: {
    id: 'couple',
    label: 'Couple',
    emoji: '❤️',
    description: 'Complicité, souvenirs et projets à deux',
    availableIntensities: [1, 2, 3, 4, 5, 6],
  },
  deep: {
    id: 'deep',
    label: 'Deep mais chill',
    emoji: '🧠',
    description: 'Questions profondes, sans tomber dans le glauque',
    availableIntensities: [2, 3, 5, 6],
  },
  party: {
    id: 'party',
    label: 'Soirée',
    emoji: '🎉',
    description: 'Rapide, surprenant, propice aux débats',
    availableIntensities: [1, 2, 3, 6],
  },
  nofilter: {
    id: 'nofilter',
    label: 'Sans Filtre',
    emoji: '💣',
    description: 'Dilemmes trash, vérités cash, secrets et révélations pimentées',
    availableIntensities: [3, 4, 5, 6],
  },
};

// Labels des niveaux d'intensité
export const INTENSITY_CONFIGS: Record<IntensityLevel, { label: string; emoji: string; description: string }> = {
  1: { label: 'Icebreaker', emoji: '🧊', description: 'Tranquille, pour briser la glace (+1 Pt)' },
  2: { label: 'Curieux', emoji: '👀', description: 'On commence à s\'intéresser (+2 Pts)' },
  3: { label: 'Personnel', emoji: '🫶', description: 'On rentre dans le vif du sujet (+3 Pts)' },
  4: { label: 'Corsé', emoji: '🌶️', description: 'Séduction et vérités d\'amis (+4 Pts)' },
  5: { label: 'Extrême', emoji: '💣', description: 'Questions cash et dilemmes (+5 Pts)' },
  6: { label: 'Mortel', emoji: '💀', description: 'Cartes Choc Dorées (+10 Pts ou -10 Pts)' },
};

// Points attribués par niveau — source unique de vérité pour toute l'application
export const INTENSITY_POINTS: Record<IntensityLevel, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 10,
};

// Nombre max de joueurs autorisés
export const MAX_PLAYERS = 8;

