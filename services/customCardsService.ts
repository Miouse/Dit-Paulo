// services/customCardsService.ts
// Gestionnaire persistant des cartes personnalisées (AsyncStorage)
// Permet d'ajouter, modifier, supprimer et injecter des questions créées par l'utilisateur.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { questions } from '../data/questions';
import type { Question, QuestionCategory } from '../types/question';

const CUSTOM_QUESTIONS_STORAGE_KEY = '@dit_paulo_custom_questions_v1';

let memoryCustomCards: Question[] | null = null;
let listeners: Array<(cards: Question[]) => void> = [];

export const customCardsService = {
  /**
   * S'abonner aux changements de la liste de cartes personnalisées
   */
  subscribe(listener: (cards: Question[]) => void) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  notifyListeners(cards: Question[]) {
    listeners.forEach((l) => {
      try {
        l(cards);
      } catch (err) {
        console.error('Error in customCardsService listener', err);
      }
    });
  },

  /**
   * Initialise et injecte les cartes personnalisées dans la base questions en mémoire
   */
  async initCustomCards(): Promise<Question[]> {
    return this.getCustomCards();
  },

  /**
   * Récupère la liste des cartes personnalisées
   */
  async getCustomCards(): Promise<Question[]> {
    if (memoryCustomCards !== null) {
      return memoryCustomCards;
    }
    try {
      const raw = await AsyncStorage.getItem(CUSTOM_QUESTIONS_STORAGE_KEY);
      const list: Question[] = raw ? JSON.parse(raw) : [];
      memoryCustomCards = list;

      // Injecter dans la collection questions si pas déjà présent
      list.forEach((customQ) => {
        const index = questions.findIndex((q) => q.id === customQ.id);
        if (index === -1) {
          questions.unshift(customQ);
        } else {
          questions[index] = customQ;
        }
      });

      return memoryCustomCards;
    } catch (e) {
      console.error('Erreur lors du chargement des cartes personnalisées:', e);
      memoryCustomCards = [];
      return [];
    }
  },

  /**
   * Ajoute une nouvelle carte personnalisée
   */
  async addCustomCard(card: {
    text: string;
    category: QuestionCategory;
    minPlayers?: number;
    maxPlayers?: number;
  }): Promise<Question> {
    const current = await this.getCustomCards();
    const newCard: Question = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: card.text.trim(),
      category: card.category,
      minPlayers: card.minPlayers ?? 2,
      maxPlayers: card.maxPlayers,
      isCustom: true,
      modes: ['friends', 'party', 'deep', 'nofilter'],
    };

    const updated = [newCard, ...current];
    memoryCustomCards = updated;

    // Injecter au début de la collection questions globale
    questions.unshift(newCard);

    try {
      await AsyncStorage.setItem(CUSTOM_QUESTIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Erreur lors de l'enregistrement de la carte personnalisée:", e);
    }

    this.notifyListeners(updated);
    return newCard;
  },

  /**
   * Supprime une carte personnalisée
   */
  async deleteCustomCard(id: string): Promise<void> {
    const current = await this.getCustomCards();
    const updated = current.filter((c) => c.id !== id);
    memoryCustomCards = updated;

    // Retirer de la collection questions globale
    const idx = questions.findIndex((q) => q.id === id);
    if (idx !== -1) {
      questions.splice(idx, 1);
    }

    try {
      await AsyncStorage.setItem(CUSTOM_QUESTIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Erreur lors de la suppression de la carte personnalisée:', e);
    }

    this.notifyListeners(updated);
  },

  /**
   * Modifie une carte personnalisée
   */
  async updateCustomCard(
    id: string,
    updates: Partial<Pick<Question, 'text' | 'category' | 'minPlayers' | 'maxPlayers'>>
  ): Promise<Question | null> {
    const current = await this.getCustomCards();
    const target = current.find((c) => c.id === id);
    if (!target) return null;

    const modified: Question = {
      ...target,
      ...updates,
      text: updates.text ? updates.text.trim() : target.text,
    };

    const updatedList = current.map((c) => (c.id === id ? modified : c));
    memoryCustomCards = updatedList;

    // Mettre à jour dans questions
    const idx = questions.findIndex((q) => q.id === id);
    if (idx !== -1) {
      questions[idx] = modified;
    }

    try {
      await AsyncStorage.setItem(CUSTOM_QUESTIONS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Erreur lors de la mise à jour de la carte personnalisée:', e);
    }

    this.notifyListeners(updatedList);
    return modified;
  },
};
