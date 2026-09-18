// context/GameContext.tsx
// État global de la session de jeu — React Context avec sélection par Catégories et points en option

import React, { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { seenQuestionsService } from '../services/seenQuestionsService';
import { ALL_CATEGORIES, type GameMode, type IntensityLevel, type Player, type QuestionCategory } from '../types/game';

// ─── État ───────────────────────────────────────────────────────────────────

interface GameState {
  selectedCategories: QuestionCategory[];
  pointsEnabled: boolean;
  players: Player[];
  currentPlayerIndex: number;
  seenQuestionIds: string[];
  currentQuestionId: string | null;
  // Propriétés dépréciées conservées pour rétrocompatibilité
  mode?: GameMode | null;
  intensity?: IntensityLevel | null;
}

const initialState: GameState = {
  selectedCategories: ALL_CATEGORIES,
  pointsEnabled: true,
  players: [],
  currentPlayerIndex: 0,
  seenQuestionIds: [],
  currentQuestionId: null,
  mode: null,
  intensity: null,
};

// ─── Actions ────────────────────────────────────────────────────────────────

type GameAction =
  | { type: 'SET_CATEGORIES'; payload: QuestionCategory[] }
  | { type: 'TOGGLE_CATEGORY'; payload: QuestionCategory }
  | { type: 'SET_POINTS_ENABLED'; payload: boolean }
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_CURRENT_QUESTION'; payload: string }
  | { type: 'NEXT_PLAYER' }
  | { type: 'MARK_QUESTION_SEEN'; payload: string }
  | { type: 'SET_SEEN_QUESTIONS'; payload: string[] }
  | { type: 'RESET_SEEN_QUESTIONS' }
  | { type: 'ADD_PLAYER_POINTS'; payload: { playerId: string; amount: number } }
  | { type: 'DEDUCT_PLAYER_POINTS'; payload: { playerId: string; amount: number } }
  | { type: 'RESET_SESSION' }
  | { type: 'SET_MODE'; payload: GameMode }
  | { type: 'SET_INTENSITY'; payload: IntensityLevel };

// ─── Reducer ────────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_CATEGORIES':
      return {
        ...state,
        selectedCategories: action.payload.length > 0 ? action.payload : ['fun'],
      };

    case 'TOGGLE_CATEGORY': {
      const exists = state.selectedCategories.includes(action.payload);
      if (exists) {
        // Empêcher d'avoir 0 catégorie
        if (state.selectedCategories.length <= 1) return state;
        return {
          ...state,
          selectedCategories: state.selectedCategories.filter((c) => c !== action.payload),
        };
      } else {
        return {
          ...state,
          selectedCategories: [...state.selectedCategories, action.payload],
        };
      }
    }

    case 'SET_POINTS_ENABLED':
      return {
        ...state,
        pointsEnabled: action.payload,
      };

    case 'SET_PLAYERS':
      return {
        ...state,
        players: action.payload.map((p) => ({ ...p, points: 0 })),
        currentPlayerIndex: 0,
      };

    case 'SET_CURRENT_QUESTION':
      return { ...state, currentQuestionId: action.payload };

    case 'NEXT_PLAYER':
      return {
        ...state,
        currentPlayerIndex:
          state.players.length > 0 ? (state.currentPlayerIndex + 1) % state.players.length : 0,
      };

    case 'SET_SEEN_QUESTIONS':
      return {
        ...state,
        seenQuestionIds: action.payload,
      };

    case 'RESET_SEEN_QUESTIONS':
      return {
        ...state,
        seenQuestionIds: [],
      };

    case 'MARK_QUESTION_SEEN':
      return {
        ...state,
        seenQuestionIds: state.seenQuestionIds.includes(action.payload)
          ? state.seenQuestionIds
          : [...state.seenQuestionIds, action.payload],
      };

    case 'ADD_PLAYER_POINTS':
      if (!state.pointsEnabled) return state;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.playerId
            ? { ...p, points: (p.points ?? 0) + action.payload.amount }
            : p
        ),
      };

    case 'DEDUCT_PLAYER_POINTS':
      if (!state.pointsEnabled) return state;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.playerId
            ? { ...p, points: Math.max(0, (p.points ?? 0) - action.payload.amount) }
            : p
        ),
      };

    case 'RESET_SESSION':
      return {
        ...initialState,
        seenQuestionIds: state.seenQuestionIds,
      };

    // Rétrocompatibilité
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'SET_INTENSITY':
      return { ...state, intensity: action.payload };

    default:
      return state;
  }
}

// ─── Contexte ───────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState;
  currentPlayer: Player | undefined;
  setSelectedCategories: (categories: QuestionCategory[]) => void;
  toggleCategory: (category: QuestionCategory) => void;
  setPointsEnabled: (enabled: boolean) => void;
  setPlayers: (players: Player[]) => void;
  setCurrentQuestion: (id: string) => void;
  nextPlayer: () => void;
  markQuestionSeen: (id: string) => Promise<void>;
  resetSeenQuestions: () => Promise<void>;
  addPlayerPoints: (playerId: string, amount: number) => void;
  deductPlayerPoints: (playerId: string, amount: number) => void;
  resetSession: () => void;
  // Fonctions dépréciées rétrocompatibles
  setMode: (mode: GameMode) => void;
  setIntensity: (intensity: IntensityLevel) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Charger les questions déjà vues depuis AsyncStorage au montage
  useEffect(() => {
    async function loadSeenQuestions() {
      const seenIds = await seenQuestionsService.getSeenIds();
      dispatch({ type: 'SET_SEEN_QUESTIONS', payload: seenIds });
    }
    loadSeenQuestions();
  }, []);

  const currentPlayer = state.players[state.currentPlayerIndex];

  const setSelectedCategories = (categories: QuestionCategory[]) => {
    dispatch({ type: 'SET_CATEGORIES', payload: categories });
  };

  const toggleCategory = (category: QuestionCategory) => {
    dispatch({ type: 'TOGGLE_CATEGORY', payload: category });
  };

  const setPointsEnabled = (enabled: boolean) => {
    dispatch({ type: 'SET_POINTS_ENABLED', payload: enabled });
  };

  const setPlayers = (players: Player[]) => {
    dispatch({ type: 'SET_PLAYERS', payload: players });
  };

  const setCurrentQuestion = (id: string) => {
    dispatch({ type: 'SET_CURRENT_QUESTION', payload: id });
  };

  const nextPlayer = () => {
    dispatch({ type: 'NEXT_PLAYER' });
  };

  const markQuestionSeen = async (id: string) => {
    dispatch({ type: 'MARK_QUESTION_SEEN', payload: id });
    await seenQuestionsService.markSeen(id);
  };

  const resetSeenQuestions = async () => {
    dispatch({ type: 'RESET_SEEN_QUESTIONS' });
    await seenQuestionsService.resetSeen();
  };

  const addPlayerPoints = (playerId: string, amount: number) => {
    dispatch({ type: 'ADD_PLAYER_POINTS', payload: { playerId, amount } });
  };

  const deductPlayerPoints = (playerId: string, amount: number) => {
    dispatch({ type: 'DEDUCT_PLAYER_POINTS', payload: { playerId, amount } });
  };

  const resetSession = () => {
    dispatch({ type: 'RESET_SESSION' });
  };

  const setMode = (mode: GameMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  };

  const setIntensity = (intensity: IntensityLevel) => {
    dispatch({ type: 'SET_INTENSITY', payload: intensity });
  };

  return (
    <GameContext.Provider
      value={{
        state,
        currentPlayer,
        setSelectedCategories,
        toggleCategory,
        setPointsEnabled,
        setPlayers,
        setCurrentQuestion,
        nextPlayer,
        markQuestionSeen,
        resetSeenQuestions,
        addPlayerPoints,
        deductPlayerPoints,
        resetSession,
        setMode,
        setIntensity,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame doit être utilisé à l\'intérieur d\'un GameProvider');
  }
  return context;
}
