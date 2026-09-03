// types/question.ts
// Structure d'une question dans Dit-Paul ?

import type { GameMode } from './game';

export type QuestionCategory =
  | 'fun'
  | 'future'
  | 'personality'
  | 'relationships'
  | 'hypothetical'
  | 'debate'
  | 'memories'
  | 'dreams'
  | 'flirt'
  | 'lifestyle'
  | 'gossip'
  | 'philosophy'
  | 'hot';

export interface Question {
  id: string;
  text: string;
  modes: GameMode[];
  // 1 = Icebreaker, 2 = Curieux, 3 = Personnel, 4 = Flirt, 5 = Deep
  // (6 = Spicy prévu mais non implémenté)
  intensity: number;
  category: QuestionCategory;
  minPlayers: number;
  maxPlayers?: number; // undefined = pas de limite haute
}
