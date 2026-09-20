// types/game.ts
// Types TypeScript du domaine "jeu" dans Dit-Paul ? (Système par Catégories)

import { ALL_CATEGORIES, CATEGORY_CONFIGS, type CategoryConfig, type QuestionCategory } from './question';

export { ALL_CATEGORIES, CATEGORY_CONFIGS, type CategoryConfig, type QuestionCategory };

export interface Player {
  id: string;
  name: string;
  points?: number;
}

export interface GameSession {
  selectedCategories: QuestionCategory[];
  pointsEnabled: boolean;
  players: Player[];
  currentPlayerIndex: number;
  seenQuestionIds: string[];
  currentQuestionId: string | null;
}

// Préréglages d'ambiance pour cocher facilement des lots de catégories
export interface CategoryPreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  categories: QuestionCategory[];
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: 'all',
    label: 'Grand Mix (Toutes)',
    emoji: '🎲',
    description: 'Toutes les cartes actives pour un maximum de variété',
    categories: ALL_CATEGORIES,
  },
  {
    id: 'party',
    label: 'Soirée & Potins',
    emoji: '🎉',
    description: 'Fun, potins croustillants, débats animés et dilemmes fous',
    categories: ['fun', 'gossip', 'debate', 'hypothetical', 'situationship'],
  },
  {
    id: 'date',
    label: 'Date & Flirt',
    emoji: '😏',
    description: 'Séduction, complicité amoureuse et tension positive',
    categories: ['flirt', 'relationships', 'situationship', 'hot'],
  },
  {
    id: 'chill',
    label: 'Chill & Deep',
    emoji: '🧠',
    description: 'Discussions profondes, souvenirs d\'enfance et philosophie',
    categories: ['personality', 'memories', 'future', 'philosophy', 'dreams'],
  },
  {
    id: 'spicy',
    label: '100% Cash & Hot',
    emoji: '🔥',
    description: 'Potins extrêmes, vérités crues et intimité sans filtre',
    categories: ['gossip', 'hot', 'hypothetical'],
  },
];

// Nombre max de joueurs autorisés
export const MAX_PLAYERS = 8;

// Types et constantes dépréciés conservés temporairement pour rétrocompatibilité
export type GameMode = 'friends' | 'date' | 'couple' | 'deep' | 'party' | 'nofilter';
export type IntensityLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface ModeConfig {
  id: GameMode;
  label: string;
  emoji: string;
  description: string;
  availableIntensities?: IntensityLevel[];
}

export const MODE_CONFIGS: Record<GameMode, ModeConfig> = {
  friends: { id: 'friends', label: 'Entre amis', emoji: '🍻', description: 'Amusant et souvenirs', availableIntensities: [1, 2, 3, 5, 6] },
  date: { id: 'date', label: 'Date / Crush', emoji: '😏', description: 'Découverte et flirt', availableIntensities: [1, 2, 3, 4, 6] },
  couple: { id: 'couple', label: 'Couple', emoji: '❤️', description: 'Complicité et projets', availableIntensities: [1, 2, 3, 4, 5, 6] },
  deep: { id: 'deep', label: 'Deep mais chill', emoji: '🧠', description: 'Questions profondes', availableIntensities: [2, 3, 5, 6] },
  party: { id: 'party', label: 'Soirée', emoji: '🎉', description: 'Rapide et débats', availableIntensities: [1, 2, 3, 6] },
  nofilter: { id: 'nofilter', label: 'Sans Filtre', emoji: '💣', description: 'Secrets et révélations', availableIntensities: [3, 4, 5, 6] },
};

export const INTENSITY_CONFIGS: Record<IntensityLevel, { label: string; emoji: string; description: string }> = {
  1: { label: 'Icebreaker', emoji: '🧊', description: 'Tranquille' },
  2: { label: 'Curieux', emoji: '👀', description: 'Intéressant' },
  3: { label: 'Personnel', emoji: '🫶', description: 'Vif du sujet' },
  4: { label: 'Corsé', emoji: '🌶️', description: 'Séduction' },
  5: { label: 'Extrême', emoji: '💣', description: 'Dilemmes' },
  6: { label: 'Mortel', emoji: '💀', description: 'Cartes Choc' },
};

export const INTENSITY_POINTS: Record<IntensityLevel, number> = {
  1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1,
};
