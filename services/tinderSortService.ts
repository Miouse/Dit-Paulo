// services/tinderSortService.ts
// Gestion de l'état du tri Tinder, de l'exclusion des cartes jetées et de l'édition personnalisée des questions

import AsyncStorage from '@react-native-async-storage/async-storage';
import { questions } from '../data/questions';

const TINDER_SORT_STORAGE_KEY = '@dit_paulo_tinder_sort_v1';

export interface TinderSortState {
  keptIds: string[];
  rejectedIds: string[];
  // Historique ordonné des actions pour permettre le Undo étape par étape
  history: Array<{ id: string; action: 'keep' | 'reject' }>;
  // Questions modifiées par l'utilisateur : { [questionId]: nouveauTexte }
  editedQuestions: Record<string, string>;
}

const DEFAULT_STATE: TinderSortState = {
  keptIds: [],
  rejectedIds: [],
  history: [],
  editedQuestions: {},
};

// Snapshot des textes originaux au chargement de l'application
const originalTexts: Record<string, string> = {};
questions.forEach((q) => {
  originalTexts[q.id] = q.text;
});

// Cache en mémoire pour synchronisation rapide et synchrone
let memoryCache: TinderSortState | null = null;
let listeners: Array<(state: TinderSortState) => void> = [];

export const tinderSortService = {
  /**
   * S'abonner aux changements d'état du tri
   */
  subscribe(listener: (state: TinderSortState) => void) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  notifyListeners(state: TinderSortState) {
    listeners.forEach((l) => {
      try {
        l(state);
      } catch (err) {
        console.error('Error in tinderSortService listener', err);
      }
    });
  },

  /**
   * Récupère le texte original d'une question avant modification
   */
  getOriginalText(questionId: string): string {
    return originalTexts[questionId] || '';
  },

  /**
   * Vérifie si une question a été personnalisée
   */
  isQuestionEdited(questionId: string): boolean {
    return !!(memoryCache?.editedQuestions && memoryCache.editedQuestions[questionId]);
  },

  /**
   * Récupère l'état complet du tri depuis le stockage et applique les textes modifiés en mémoire
   */
  async getSortState(): Promise<TinderSortState> {
    if (memoryCache) {
      return memoryCache;
    }
    try {
      const raw = await AsyncStorage.getItem(TINDER_SORT_STORAGE_KEY);
      if (raw) {
        const parsed: TinderSortState = JSON.parse(raw);
        const validIds = new Set(questions.map((q) => q.id));

        const rawKept = Array.isArray(parsed.keptIds) ? parsed.keptIds : [];
        const rawRejected = Array.isArray(parsed.rejectedIds) ? parsed.rejectedIds : [];
        const rawHistory = Array.isArray(parsed.history) ? parsed.history : [];

        // Éliminer les identifiants orphelins (questions définitivement supprimées du code)
        const cleanKept = rawKept.filter((id) => validIds.has(id));
        const cleanRejected = rawRejected.filter((id) => validIds.has(id));
        const cleanHistory = rawHistory.filter((h) => validIds.has(h.id));

        memoryCache = {
          keptIds: cleanKept,
          rejectedIds: cleanRejected,
          history: cleanHistory,
          editedQuestions:
            parsed.editedQuestions && typeof parsed.editedQuestions === 'object'
              ? parsed.editedQuestions
              : {},
        };

        // Si des cartes supprimées ont été nettoyées, sauvegarder le nouvel état propre
        if (
          cleanKept.length !== rawKept.length ||
          cleanRejected.length !== rawRejected.length ||
          cleanHistory.length !== rawHistory.length
        ) {
          AsyncStorage.setItem(TINDER_SORT_STORAGE_KEY, JSON.stringify(memoryCache)).catch((e) =>
            console.error('Erreur lors de la sauvegarde du nettoyage Tinder:', e)
          );
        }

        // Appliquer immédiatement les textes modifiés à la collection globale questions
        Object.entries(memoryCache.editedQuestions).forEach(([id, text]) => {
          const q = questions.find((item) => item.id === id);
          if (q && typeof text === 'string') {
            q.text = text;
          }
        });
      } else {
        memoryCache = { ...DEFAULT_STATE };
      }
    } catch (e) {
      console.error('Erreur lors du chargement du tri Tinder:', e);
      memoryCache = { ...DEFAULT_STATE };
    }
    return memoryCache;
  },

  /**
   * Sauvegarde l'état dans AsyncStorage et met à jour le cache
   */
  async saveState(state: TinderSortState): Promise<void> {
    memoryCache = state;
    try {
      await AsyncStorage.setItem(TINDER_SORT_STORAGE_KEY, JSON.stringify(state));
      this.notifyListeners(state);
    } catch (e) {
      console.error('Erreur lors de la sauvegarde du tri Tinder:', e);
    }
  },

  /**
   * Modifie le texte d'une question et l'applique partout dans l'application
   */
  async updateQuestionText(questionId: string, newText: string): Promise<TinderSortState> {
    const current = await this.getSortState();
    const cleanText = newText.trim();

    // Mettre à jour l'instance en mémoire dans questions
    const q = questions.find((item) => item.id === questionId);
    if (q) {
      q.text = cleanText;
    }

    const updated: TinderSortState = {
      ...current,
      editedQuestions: {
        ...current.editedQuestions,
        [questionId]: cleanText,
      },
    };

    await this.saveState(updated);
    return updated;
  },

  /**
   * Rétablit le texte d'origine d'une question
   */
  async resetQuestionText(questionId: string): Promise<TinderSortState> {
    const current = await this.getSortState();
    const orig = originalTexts[questionId];

    // Rétablir en mémoire
    if (orig) {
      const q = questions.find((item) => item.id === questionId);
      if (q) {
        q.text = orig;
      }
    }

    const newEdited = { ...current.editedQuestions };
    delete newEdited[questionId];

    const updated: TinderSortState = {
      ...current,
      editedQuestions: newEdited,
    };

    await this.saveState(updated);
    return updated;
  },

  /**
   * Marque une carte comme gardée ('keep') ou jetée ('reject')
   */
  async markCard(questionId: string, action: 'keep' | 'reject'): Promise<TinderSortState> {
    const current = await this.getSortState();

    // Retirer l'ID des deux listes pour éviter les doublons
    const cleanKept = current.keptIds.filter((id) => id !== questionId);
    const cleanRejected = current.rejectedIds.filter((id) => id !== questionId);

    const updated: TinderSortState = {
      ...current,
      keptIds: action === 'keep' ? [...cleanKept, questionId] : cleanKept,
      rejectedIds: action === 'reject' ? [...cleanRejected, questionId] : cleanRejected,
      history: [...current.history, { id: questionId, action }],
    };

    await this.saveState(updated);
    return updated;
  },

  /**
   * Annule la dernière action effectuée
   */
  async undoLastAction(): Promise<{ state: TinderSortState; undoneCardId: string | null }> {
    const current = await this.getSortState();
    if (current.history.length === 0) {
      return { state: current, undoneCardId: null };
    }

    const last = current.history[current.history.length - 1];
    const newHistory = current.history.slice(0, -1);

    const updated: TinderSortState = {
      ...current,
      keptIds: current.keptIds.filter((id) => id !== last.id),
      rejectedIds: current.rejectedIds.filter((id) => id !== last.id),
      history: newHistory,
    };

    await this.saveState(updated);
    return { state: updated, undoneCardId: last.id };
  },

  /**
   * Restaure une carte spécifique rejetée (la remet dans les cartes non triées)
   */
  async restoreCard(questionId: string): Promise<TinderSortState> {
    const current = await this.getSortState();
    const updated: TinderSortState = {
      ...current,
      keptIds: current.keptIds.filter((id) => id !== questionId),
      rejectedIds: current.rejectedIds.filter((id) => id !== questionId),
      history: current.history.filter((h) => h.id !== questionId),
    };
    await this.saveState(updated);
    return updated;
  },

  /**
   * Récupère la liste des cartes rejetées (pour exclusion automatique du jeu)
   */
  async getExcludedIds(): Promise<string[]> {
    const state = await this.getSortState();
    return state.rejectedIds;
  },

  /**
   * Réinitialise totalement le tri et réapplique les textes originaux
   */
  async resetSortState(): Promise<TinderSortState> {
    // Rétablir tous les textes en mémoire
    Object.entries(originalTexts).forEach(([id, text]) => {
      const q = questions.find((item) => item.id === id);
      if (q) {
        q.text = text;
      }
    });

    const fresh: TinderSortState = {
      keptIds: [],
      rejectedIds: [],
      history: [],
      editedQuestions: {},
    };
    await this.saveState(fresh);
    return fresh;
  },
};

// Initialiser et charger les textes modifiés au lancement
tinderSortService.getSortState().catch((err) => {
  console.error('Initial tinderSortService load failed', err);
});
