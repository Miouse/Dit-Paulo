// services/customCardsService.ts
// Gestionnaire persistant des cartes personnalisées (AsyncStorage)
// Permet d'ajouter, modifier, supprimer, exporter et importer des decks créés par les utilisateurs.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { questions } from '../data/questions';
import { ALL_CATEGORIES, type Question, type QuestionCategory } from '../types/question';

const CUSTOM_QUESTIONS_STORAGE_KEY = '@dit_paulo_custom_questions_v1';

export interface ExportedCard {
  text: string;
  category: QuestionCategory;
  minPlayers?: number;
  maxPlayers?: number;
}

export interface CustomDeckExport {
  version: 1;
  deckName: string;
  author?: string;
  description?: string;
  createdAt: string;
  cardCount: number;
  cards: ExportedCard[];
}

/**
 * Normalise le texte d'une question pour comparer rigoureusement les doublons :
 * - Minuscules
 * - Suppression des accents diacritiques (Unicode NFD)
 * - Suppression des espaces superflus
 * - Suppression de la ponctuation finale (? ! . , ;) y compris précédée ou suivie d'espaces
 */
export function normalizeQuestionText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retrait des accents
    .replace(/\s+/g, ' ')             // Espaces multiples -> simple espace
    .trim()
    .replace(/[\s?!.,;:]+$/g, '')     // Retrait de la ponctuation finale et des espaces
    .trim();
}

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

  /**
   * Exporte les cartes personnalisées sous forme de Deck structuré SANS les identifiants internes.
   */
  async exportDeck(options: {
    deckName: string;
    author?: string;
    description?: string;
  }): Promise<{ jsonString: string; deck: CustomDeckExport }> {
    const current = await this.getCustomCards();

    // Règle 1 : Ne JAMAIS exporter les IDs internes
    const cleanCards: ExportedCard[] = current.map((c) => ({
      text: c.text,
      category: c.category,
      minPlayers: c.minPlayers ?? 2,
      ...(c.maxPlayers ? { maxPlayers: c.maxPlayers } : {}),
    }));

    const deck: CustomDeckExport = {
      version: 1,
      deckName: options.deckName.trim() || 'Mon Deck Dit-Paulo',
      author: options.author?.trim() || undefined,
      description: options.description?.trim() || undefined,
      createdAt: new Date().toISOString(),
      cardCount: cleanCards.length,
      cards: cleanCards,
    };

    const jsonString = JSON.stringify(deck, null, 2);
    return { jsonString, deck };
  },

  /**
   * Analyse et valide un texte JSON de deck avant import
   */
  parseAndValidateDeck(rawJson: string): {
    valid: boolean;
    deck?: CustomDeckExport;
    error?: string;
  } {
    if (!rawJson || !rawJson.trim()) {
      return { valid: false, error: 'Le contenu est vide.' };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawJson.trim());
    } catch (err: any) {
      return { valid: false, error: 'Format JSON invalide. Vérifie la syntaxe.' };
    }

    // Cas 1 : format deck complet
    let rawCards: any[] = [];
    let deckName = 'Deck Importé';
    let author: string | undefined;
    let description: string | undefined;

    if (Array.isArray(parsed)) {
      rawCards = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.cards)) {
        rawCards = parsed.cards;
        if (typeof parsed.deckName === 'string' && parsed.deckName.trim()) {
          deckName = parsed.deckName.trim();
        }
        if (typeof parsed.author === 'string' && parsed.author.trim()) {
          author = parsed.author.trim();
        }
        if (typeof parsed.description === 'string' && parsed.description.trim()) {
          description = parsed.description.trim();
        }
      } else {
        return { valid: false, error: 'Structure invalide : aucune liste de cartes trouvée.' };
      }
    } else {
      return { valid: false, error: 'Le format des données est invalide.' };
    }

    if (rawCards.length === 0) {
      return { valid: false, error: 'Le deck ne contient aucune carte.' };
    }

    const validCategories = new Set(ALL_CATEGORIES);
    const validatedCards: ExportedCard[] = [];

    for (let i = 0; i < rawCards.length; i++) {
      const item = rawCards[i];
      if (!item || typeof item !== 'object') continue;

      const text = typeof item.text === 'string' ? item.text.trim() : '';
      if (!text) continue; // ignorer les entrées sans texte

      // Catégorie valide ou fallback 'fun'
      const category: QuestionCategory = validCategories.has(item.category)
        ? item.category
        : 'fun';

      const minPlayers = typeof item.minPlayers === 'number' && item.minPlayers >= 1 ? item.minPlayers : 2;
      const maxPlayers = typeof item.maxPlayers === 'number' ? item.maxPlayers : undefined;

      // Note : aucun ID n'est conservé ici !
      validatedCards.push({
        text,
        category,
        minPlayers,
        ...(maxPlayers ? { maxPlayers } : {}),
      });
    }

    if (validatedCards.length === 0) {
      return { valid: false, error: 'Aucune carte valide trouvée dans les données fournies.' };
    }

    const deck: CustomDeckExport = {
      version: 1,
      deckName,
      author,
      description,
      createdAt: parsed.createdAt || new Date().toISOString(),
      cardCount: validatedCards.length,
      cards: validatedCards,
    };

    return { valid: true, deck };
  },

  /**
   * Importe un deck avec détection avancée des doublons (normalisation)
   * et génération automatique de nouveaux IDs internes sécurisés.
   */
  async importDeck(
    deck: CustomDeckExport,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<{
    importedCount: number;
    duplicateCount: number;
    deckName: string;
  }> {
    const current = await this.getCustomCards();

    // Construction d'un Set des textes normalisés existants pour détecter les doublons
    const existingNormalizedSet = new Set<string>();
    if (mode === 'merge') {
      current.forEach((c) => {
        existingNormalizedSet.add(normalizeQuestionText(c.text));
      });
    }

    const cardsToInsert: Question[] = [];
    let duplicateCount = 0;

    for (const card of deck.cards) {
      const normalized = normalizeQuestionText(card.text);

      // Détection de doublon (uniquement en mode fusion)
      if (mode === 'merge' && existingNormalizedSet.has(normalized)) {
        duplicateCount++;
        continue;
      }

      existingNormalizedSet.add(normalized);

      // Règle 1 : Génération d'un tout nouvel ID interne propre
      const freshId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      cardsToInsert.push({
        id: freshId,
        text: card.text,
        category: card.category,
        minPlayers: card.minPlayers ?? 2,
        maxPlayers: card.maxPlayers,
        isCustom: true,
        modes: ['friends', 'party', 'deep', 'nofilter'],
      });
    }

    let updatedList: Question[];

    if (mode === 'replace') {
      // Retirer toutes les anciennes cartes persos de questions
      const currentIds = new Set(current.map((c) => c.id));
      for (let i = questions.length - 1; i >= 0; i--) {
        if (currentIds.has(questions[i].id)) {
          questions.splice(i, 1);
        }
      }
      // Injecter les nouvelles
      updatedList = cardsToInsert;
      cardsToInsert.forEach((c) => questions.unshift(c));
    } else {
      // Merge : ajouter les nouvelles cartes en tête
      updatedList = [...cardsToInsert, ...current];
      cardsToInsert.forEach((c) => questions.unshift(c));
    }

    memoryCustomCards = updatedList;

    try {
      await AsyncStorage.setItem(CUSTOM_QUESTIONS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error("Erreur lors de l'enregistrement du deck importé:", e);
    }

    this.notifyListeners(updatedList);

    return {
      importedCount: cardsToInsert.length,
      duplicateCount,
      deckName: deck.deckName,
    };
  },
};

