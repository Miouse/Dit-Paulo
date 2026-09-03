// services/questionEngine.ts
// Algorithme de filtrage, sélection des questions et substitution dynamique des prénoms

import { questions } from '../data/questions';
import type { GameMode, IntensityLevel } from '../types/game';
import type { Question, QuestionCategory } from '../types/question';

export interface QuestionEngineFilter {
  mode: GameMode;
  intensity: IntensityLevel;
  playerCount: number;
  seenQuestionIds: string[];
  lastCategory?: QuestionCategory | null;
}

export const questionEngine = {
  /**
   * Récupère toutes les questions éligibles selon les critères
   */
  getEligibleQuestions({
    mode,
    intensity,
    playerCount,
    seenQuestionIds,
  }: QuestionEngineFilter): Question[] {
    return questions.filter((q) => {
      // 1. Filtrer par mode
      const matchMode = q.modes.includes(mode);
      if (!matchMode) return false;

      // 2. Filtrer par intensité (questions d'intensité <= intensité sélectionnée)
      const matchIntensity = q.intensity <= intensity;
      if (!matchIntensity) return false;

      // 3. Filtrer par nombre de joueurs
      const matchMinPlayers = playerCount >= q.minPlayers;
      const matchMaxPlayers = q.maxPlayers ? playerCount <= q.maxPlayers : true;
      if (!matchMinPlayers || !matchMaxPlayers) return false;

      // 4. Exclure les questions déjà vues dans cette session
      const notSeen = !seenQuestionIds.includes(q.id);

      return notSeen;
    });
  },

  /**
   * Sélectionne la prochaine question avec ~18% de chance d'apparition d'une Carte Extrême Dorée Surprise (Niveau 6 💀)
   */
  getNextQuestion(filter: QuestionEngineFilter): Question | null {
    // ~18% de chance qu'une Carte Extrême Dorée Surprise (Niveau 6 💀) apparaisse pendant la partie
    const isSurpriseGold = Math.random() < 0.18;

    if (isSurpriseGold && filter.intensity < 6) {
      const goldQuestions = questions.filter(
        (q) =>
          q.intensity === 6 &&
          q.modes.includes(filter.mode) &&
          !filter.seenQuestionIds.includes(q.id)
      );
      if (goldQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * goldQuestions.length);
        const picked = goldQuestions[randomIndex];
        // Marquer comme vue pour qu'elle ne réapparaisse pas
        filter.seenQuestionIds.push(picked.id);
        return picked;
      }
    }

    const eligible = this.getEligibleQuestions(filter);

    if (eligible.length === 0) {
      // Fallback si toutes les questions éligibles de l'intensité ont été vues :
      // rester impérativement dans le mode de jeu choisi
      const fallback = questions.filter(
        (q) => q.modes.includes(filter.mode) && !filter.seenQuestionIds.includes(q.id)
      );
      if (fallback.length > 0) {
        return fallback[Math.floor(Math.random() * fallback.length)];
      }
      return null;
    }

    // Tenter d'abord de trouver des questions d'une catégorie différente de la précédente
    if (filter.lastCategory) {
      const differentCategoryQuestions = eligible.filter(
        (q) => q.category !== filter.lastCategory
      );
      if (differentCategoryQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * differentCategoryQuestions.length);
        return differentCategoryQuestions[randomIndex];
      }
    }

    // Sinon, prendre n'importe quelle question éligible
    const randomIndex = Math.floor(Math.random() * eligible.length);
    return eligible[randomIndex];
  },

  /**
   * Récupère une question par son ID
   */
  getQuestionById(id: string): Question | undefined {
    return questions.find((q) => q.id === id);
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
    const otherPlayers = allPlayers
      ?.map((p) => p.name.trim())
      .filter((name) => name && name.toLowerCase() !== mainPlayer.toLowerCase()) ?? [];

    const otherPlayer1 = otherPlayers.length > 0
      ? otherPlayers[Math.floor(Math.random() * otherPlayers.length)]
      : 'un(e) ami(e)';

    formatted = formatted.replace(/{otherPlayer}/g, otherPlayer1);
    formatted = formatted.replace(/{player2}/g, otherPlayer1);

    // Tirer au sort un 3ème joueur si nécessaire
    const remainingPlayers = otherPlayers.filter((name) => name !== otherPlayer1);
    const otherPlayer2 = remainingPlayers.length > 0
      ? remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)]
      : 'quelqu\'un d\'autre';

    formatted = formatted.replace(/{player3}/g, otherPlayer2);

    return formatted;
  },
};
