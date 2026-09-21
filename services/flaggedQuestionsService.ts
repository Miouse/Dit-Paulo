// services/flaggedQuestionsService.ts
// Gestion de la persistance locale des questions signalées à modifier (avec drapeau 🚩)

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Question } from '../types/question';

export interface FlaggedQuestion {
  id: string;
  category: string;
  originalText: string;
  modifiedText?: string;
  notes?: string;
  flaggedAt: number;
}

const FLAGGED_STORAGE_KEY = '@dit_paul_flagged_questions_v1';

// Cache en mémoire pour un accès synchrone performant
let cachedFlagged: FlaggedQuestion[] = [];
let isInitialized = false;
const listeners = new Set<(flagged: FlaggedQuestion[]) => void>();

function notifyListeners() {
  const copy = [...cachedFlagged];
  listeners.forEach((cb) => cb(copy));
}

// Initialisation au chargement du module
async function initializeCache(): Promise<FlaggedQuestion[]> {
  try {
    const raw = await AsyncStorage.getItem(FLAGGED_STORAGE_KEY);
    if (raw) {
      cachedFlagged = JSON.parse(raw);
    } else {
      cachedFlagged = [];
    }
  } catch (e) {
    console.error('Erreur chargement flaggedQuestions:', e);
    cachedFlagged = [];
  }
  isInitialized = true;
  notifyListeners();
  return cachedFlagged;
}

initializeCache();

export const flaggedQuestionsService = {
  /**
   * S'abonner aux changements des questions signalées
   */
  subscribe(listener: (flagged: FlaggedQuestion[]) => void): () => void {
    listeners.add(listener);
    if (isInitialized) {
      listener([...cachedFlagged]);
    }
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Récupère la liste de toutes les questions signalées
   */
  async getFlaggedQuestions(): Promise<FlaggedQuestion[]> {
    if (!isInitialized) {
      await initializeCache();
    }
    return [...cachedFlagged];
  },

  /**
   * Retourne la liste synchronisée en mémoire
   */
  getFlaggedQuestionsSync(): FlaggedQuestion[] {
    return [...cachedFlagged];
  },

  /**
   * Vérifie si une question est signalée
   */
  isFlagged(questionId: string): boolean {
    return cachedFlagged.some((item) => item.id === questionId);
  },

  /**
   * Récupère les données d'une question signalée si elle existe
   */
  getFlaggedItem(questionId: string): FlaggedQuestion | undefined {
    return cachedFlagged.find((item) => item.id === questionId);
  },

  /**
   * Récupère le texte modifié d'une question si disponible
   */
  getOverriddenText(questionId: string): string | undefined {
    const item = cachedFlagged.find((f) => f.id === questionId);
    return item?.modifiedText?.trim() ? item.modifiedText.trim() : undefined;
  },

  /**
   * Alterne l'état signalé (drapeau 🚩) d'une question
   */
  async toggleFlag(question: Question): Promise<boolean> {
    if (!isInitialized) {
      await initializeCache();
    }

    const index = cachedFlagged.findIndex((item) => item.id === question.id);
    let isNowFlagged: boolean;

    if (index >= 0) {
      // Retirer le drapeau
      cachedFlagged.splice(index, 1);
      isNowFlagged = false;
    } else {
      // Ajouter le drapeau
      cachedFlagged.push({
        id: question.id,
        category: question.category,
        originalText: question.text,
        flaggedAt: Date.now(),
      });
      isNowFlagged = true;
    }

    await this.persist();
    notifyListeners();
    return isNowFlagged;
  },

  /**
   * Met à jour le texte modifié et/ou les notes d'une question signalée
   */
  async updateFlaggedQuestion(
    questionId: string,
    updates: { modifiedText?: string; notes?: string }
  ): Promise<FlaggedQuestion | null> {
    if (!isInitialized) {
      await initializeCache();
    }

    const item = cachedFlagged.find((f) => f.id === questionId);
    if (!item) return null;

    if (updates.modifiedText !== undefined) {
      item.modifiedText = updates.modifiedText;
    }
    if (updates.notes !== undefined) {
      item.notes = updates.notes;
    }

    await this.persist();
    notifyListeners();
    return item;
  },

  /**
   * Supprime une question de la liste signalée (démarque)
   */
  async unflag(questionId: string): Promise<void> {
    if (!isInitialized) {
      await initializeCache();
    }
    cachedFlagged = cachedFlagged.filter((f) => f.id !== questionId);
    await this.persist();
    notifyListeners();
  },

  /**
   * Réinitialise toutes les questions signalées
   */
  async clearAll(): Promise<void> {
    cachedFlagged = [];
    await this.persist();
    notifyListeners();
  },

  /**
   * Génère un extrait de code TypeScript prêt à être collé dans data/questions.ts
   */
  generateCodeExport(): string {
    const modifiedItems = cachedFlagged.filter(
      (f) => f.modifiedText && f.modifiedText.trim().length > 0
    );

    if (modifiedItems.length === 0 && cachedFlagged.length === 0) {
      return '// Aucune question signalée.';
    }

    const lines = [
      '// --- QUESTIONS SIGNALÉES / MODIFIÉES DIT-PAULO ---',
      '// Tu peux remplacer ou ajuster ces questions directement dans data/questions.ts :',
      '',
    ];

    cachedFlagged.forEach((f) => {
      const activeText = f.modifiedText?.trim() || f.originalText;
      const hasChanges = !!f.modifiedText?.trim() && f.modifiedText.trim() !== f.originalText;
      
      lines.push(`// ID: ${f.id} (${f.category})${hasChanges ? ' [MODIFIÉ]' : ' [À REVOIR]'}`);
      if (f.notes?.trim()) {
        lines.push(`// Note : ${f.notes.trim()}`);
      }
      lines.push(`{`);
      lines.push(`  id: '${f.id}',`);
      lines.push(`  category: '${f.category}',`);
      lines.push(`  text: ${JSON.stringify(activeText)},`);
      lines.push(`},`);
      lines.push('');
    });

    return lines.join('\n');
  },

  /**
   * Sauvegarde interne dans AsyncStorage
   */
  async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(FLAGGED_STORAGE_KEY, JSON.stringify(cachedFlagged));
    } catch (e) {
      console.error('Erreur sauvegarde flaggedQuestions:', e);
    }
  },
};
