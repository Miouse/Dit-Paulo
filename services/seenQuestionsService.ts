// services/seenQuestionsService.ts
// Gestionnaire persistant de l'historique des questions déjà jouées (AsyncStorage)
// Empêche de retomber sur les mêmes questions entre les parties et sessions.

import AsyncStorage from '@react-native-async-storage/async-storage';

const SEEN_QUESTIONS_KEY = '@dit_paul_seen_question_ids';

// Cache mémoire synchrone pour fluidité maximale
let _seenCache: string[] | null = null;

export const seenQuestionsService = {
  /**
   * Récupère tous les IDs de questions déjà vues dans l'historique
   */
  async getSeenQuestionIds(): Promise<string[]> {
    if (_seenCache !== null) {
      return _seenCache;
    }
    try {
      const json = await AsyncStorage.getItem(SEEN_QUESTIONS_KEY);
      const list: string[] = json != null ? JSON.parse(json) : [];
      _seenCache = list;
      return list;
    } catch (e) {
      console.error('Erreur lors de la récupération des questions vues:', e);
      return [];
    }
  },

  /**
   * Marque une question comme vue et persiste l'historique
   */
  async markQuestionSeen(questionId: string): Promise<string[]> {
    try {
      const current = await this.getSeenQuestionIds();
      if (!current.includes(questionId)) {
        const updated = [...current, questionId];
        _seenCache = updated;
        await AsyncStorage.setItem(SEEN_QUESTIONS_KEY, JSON.stringify(updated));
        return updated;
      }
      return current;
    } catch (e) {
      console.error('Erreur lors de la sauvegarde de la question vue:', e);
      return _seenCache ?? [];
    }
  },

  /**
   * Réinitialise totalement l'historique pour repartir de 0
   */
  async resetAllSeenQuestions(): Promise<void> {
    try {
      _seenCache = [];
      await AsyncStorage.removeItem(SEEN_QUESTIONS_KEY);
    } catch (e) {
      console.error('Erreur lors de la réinitialisation des questions vues:', e);
    }
  },

  /**
   * Nombre de questions vues
   */
  async getSeenCount(): Promise<number> {
    const list = await this.getSeenQuestionIds();
    return list.length;
  },

  // Alias courts
  async getSeenIds(): Promise<string[]> {
    return this.getSeenQuestionIds();
  },

  async markSeen(questionId: string): Promise<string[]> {
    return this.markQuestionSeen(questionId);
  },

  async resetSeen(): Promise<void> {
    return this.resetAllSeenQuestions();
  },
};
