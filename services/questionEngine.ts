// services/questionEngine.ts
// Algorithme de filtrage, sélection des questions par Catégorie et substitution dynamique des prénoms

import { questions } from '../data/questions';
import type { GameMode, IntensityLevel, QuestionCategory } from '../types/game';
import type { Question } from '../types/question';
import { flaggedQuestionsService } from './flaggedQuestionsService';
import { tinderSortService } from './tinderSortService';

export interface QuestionEngineFilter {
  categories?: QuestionCategory[];
  playerCount: number;
  seenQuestionIds: string[];
  lastCategory?: QuestionCategory | null;
  excludedQuestionIds?: string[];
  // Rétrocompatibilité
  mode?: GameMode;
  intensity?: IntensityLevel;
}

// Cache local des cartes exclues (synchronisé automatiquement)
let cachedExcludedIds: string[] = [];

// Initialisation asynchrone et écoute des changements
tinderSortService.getExcludedIds().then((ids) => {
  cachedExcludedIds = ids;
});

tinderSortService.subscribe((state) => {
  cachedExcludedIds = state.rejectedIds;
});

export const questionEngine = {
  /**
   * Retourne la liste des IDs actuellement exclus du jeu
   */
  getExcludedIds(): string[] {
    return cachedExcludedIds;
  },

  /**
   * Force la mise à jour des IDs exclus
   */
  async reloadExcludedIds(): Promise<string[]> {
    cachedExcludedIds = await tinderSortService.getExcludedIds();
    return cachedExcludedIds;
  },

  /**
   * Récupère toutes les questions éligibles selon les critères
   */
  getEligibleQuestions({
    categories,
    playerCount,
    seenQuestionIds,
    excludedQuestionIds,
    mode,
  }: QuestionEngineFilter): Question[] {
    const effectiveExcluded = excludedQuestionIds ?? cachedExcludedIds;
    const seenSet = new Set(seenQuestionIds);
    const excludedSet = new Set(effectiveExcluded);
    const categorySet = categories && categories.length > 0 ? new Set(categories) : null;

    return questions.filter((q) => {
      // 1. Filtrer par catégories choisies
      if (categorySet) {
        if (!categorySet.has(q.category)) return false;
      } else if (mode && q.modes) {
        if (!q.modes.includes(mode)) return false;
      }

      // 2. Filtrer par nombre de joueurs
      if (playerCount < q.minPlayers || (q.maxPlayers && playerCount > q.maxPlayers)) {
        return false;
      }

      // 3. Exclure les questions déjà vues dans cette session
      if (seenSet.has(q.id)) return false;

      // 4. Exclure automatiquement les questions jetées (bannies via le tri Tinder)
      if (excludedSet.has(q.id)) return false;

      return true;
    });
  },

  /**
   * Applique les éventuelles modifications de texte enregistrées localement
   */
  getEffectiveQuestion(q: Question): Question {
    const overridden = flaggedQuestionsService.getOverriddenText(q.id);
    if (overridden) {
      return { ...q, text: overridden };
    }
    return q;
  },

  /**
   * Sélectionne la prochaine question avec alternance intelligente des catégories
   */
  getNextQuestion(filter: QuestionEngineFilter): Question | null {
    const effectiveExcluded = filter.excludedQuestionIds ?? cachedExcludedIds;
    const eligible = this.getEligibleQuestions(filter);

    if (eligible.length === 0) {
      // Fallback si toutes les questions ont été vues : rester dans les catégories choisies
      const excludedSet = new Set(effectiveExcluded);
      const seenSet = new Set(filter.seenQuestionIds);
      const categorySet = filter.categories && filter.categories.length > 0 ? new Set(filter.categories) : null;

      const fallback = questions.filter((q) => {
        const matchCat = categorySet ? categorySet.has(q.category) : true;
        return matchCat && !seenSet.has(q.id) && !excludedSet.has(q.id);
      });
      return fallback.length > 0 ? this.getEffectiveQuestion(fallback[Math.floor(Math.random() * fallback.length)]) : null;
    }

    // Tenter d'abord de trouver des questions d'une catégorie différente de la précédente pour varier le rythme
    if (filter.lastCategory && filter.categories && filter.categories.length > 1) {
      const differentCategoryQuestions = eligible.filter((q) => q.category !== filter.lastCategory);
      if (differentCategoryQuestions.length > 0) {
        return this.getEffectiveQuestion(
          differentCategoryQuestions[Math.floor(Math.random() * differentCategoryQuestions.length)]
        );
      }
    }

    // Sinon, piocher n'importe quelle question éligible
    return this.getEffectiveQuestion(eligible[Math.floor(Math.random() * eligible.length)]);
  },

  /**
   * Récupère une question par son ID
   */
  getQuestionById(id: string): Question | undefined {
    const q = questions.find((item) => item.id === id);
    if (!q) return undefined;
    return this.getEffectiveQuestion(q);
  },

  /**
   * Remplace dynamiquement les balises {player}, {player1}, {otherPlayer}, {player2}
   * par les vrais prénoms des joueurs de la partie.
   */
  formatQuestionText(
    text: string,
    currentPlayerName?: string,
    allPlayers?: { id: string; name: string }[]
  ): string {
    if (!text) return '';

    let formatted = text;

    // Prénom du joueur dont c'est le tour
    const mainPlayer = currentPlayerName?.trim() || 'Tu';
    formatted = formatted.replace(/{player}/g, mainPlayer);
    formatted = formatted.replace(/{player1}/g, mainPlayer);

    // Tirer au sort un autre joueur de la liste
    const otherPlayers =
      allPlayers
        ?.map((p) => p.name.trim())
        .filter((name) => name && name.toLowerCase() !== mainPlayer.toLowerCase()) ?? [];

    const otherPlayer1 =
      otherPlayers.length > 0
        ? otherPlayers[Math.floor(Math.random() * otherPlayers.length)]
        : 'un(e) ami(e)';

    formatted = formatted.replace(/{otherPlayer}/g, otherPlayer1);
    formatted = formatted.replace(/{player2}/g, otherPlayer1);

    // Tirer au sort un 3ème joueur si nécessaire
    const remainingPlayers = otherPlayers.filter((name) => name !== otherPlayer1);
    const otherPlayer2 =
      remainingPlayers.length > 0
        ? remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)]
        : "quelqu'un d'autre";

    formatted = formatted.replace(/{player3}/g, otherPlayer2);

    return formatted;
  },
};
