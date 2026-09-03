// services/favoritesService.ts
// Gestion de la persistance locale des questions favorites avec AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@dit_paul_favorite_question_ids';

export const favoritesService = {
  /**
   * Récupère tous les IDs de questions mises en favoris
   */
  async getFavoriteIds(): Promise<string[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Erreur lors de la récupération des favoris:', e);
      return [];
    }
  },

  /**
   * Ajoute un ID aux favoris
   */
  async addFavorite(questionId: string): Promise<string[]> {
    try {
      const favorites = await this.getFavoriteIds();
      if (!favorites.includes(questionId)) {
        const updated = [...favorites, questionId];
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
        return updated;
      }
      return favorites;
    } catch (e) {
      console.error('Erreur lors de l\'ajout aux favoris:', e);
      return [];
    }
  },

  /**
   * Supprime un ID des favoris
   */
  async removeFavorite(questionId: string): Promise<string[]> {
    try {
      const favorites = await this.getFavoriteIds();
      const updated = favorites.filter((id) => id !== questionId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Erreur lors de la suppression des favoris:', e);
      return [];
    }
  },

  /**
   * Bascule l'état favori d'une question
   */
  async toggleFavorite(questionId: string): Promise<boolean> {
    const favorites = await this.getFavoriteIds();
    const isFav = favorites.includes(questionId);
    if (isFav) {
      await this.removeFavorite(questionId);
      return false;
    } else {
      await this.addFavorite(questionId);
      return true;
    }
  },

  /**
   * Vérifie si une question est en favori
   */
  async isFavorite(questionId: string): Promise<boolean> {
    const favorites = await this.getFavoriteIds();
    return favorites.includes(questionId);
  },
};
