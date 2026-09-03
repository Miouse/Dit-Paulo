// services/playersService.ts
// Service de persistance locale de la liste des joueurs avec AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Player } from '../types/game';

const SAVED_PLAYERS_KEY = '@dit_paul_saved_players';

export const playersService = {
  /**
   * Récupère les joueurs sauvegardés
   */
  async getSavedPlayers(): Promise<Player[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(SAVED_PLAYERS_KEY);
      if (jsonValue != null) {
        const parsed = JSON.parse(jsonValue);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          return parsed;
        }
      }
      return [];
    } catch (e) {
      console.error('Erreur lors de la récupération des joueurs sauvegardés:', e);
      return [];
    }
  },

  /**
   * Sauvegarde la liste des joueurs actuels
   */
  async savePlayers(players: Player[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SAVED_PLAYERS_KEY, JSON.stringify(players));
    } catch (e) {
      console.error('Erreur lors de la sauvegarde des joueurs:', e);
    }
  },
};
