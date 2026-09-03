// context/GameContext.tsx
// État global de la session de jeu — React Context avec gestion des points et des joueurs

import React, { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { seenQuestionsService } from '../services/seenQuestionsService';
import type { GameMode, IntensityLevel, Player } from '../types/game';

// ─── État ───────────────────────────────────────────────────────────────────

interface GameState {
  mode: GameMode | null;
  players: Player[];
  intensity: IntensityLevel | null;
  currentPlayerIndex: number;
  seenQuestionIds: string[];
  currentQuestionId: string | null;
}

const initialState: GameState = {
  mode: null,
  players: [],
  intensity: null,
  currentPlayerIndex: 0,
  seenQuestionIds: [],
  currentQuestionId: null,
};

// ─── Actions ────────────────────────────────────────────────────────────────

type GameAction =
  | { type: 'SET_MODE'; payload: GameMode }
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_INTENSITY'; payload: IntensityLevel }
  | { type: 'SET_CURRENT_QUESTION'; payload: string }
  | { type: 'NEXT_PLAYER' }
  | { type: 'MARK_QUESTION_SEEN'; payload: string }
  | { type: 'SET_SEEN_QUESTIONS'; payload: string[] }
  | { type: 'RESET_SEEN_QUESTIONS' }
  | { type: 'ADD_PLAYER_POINTS'; payload: { playerId: string; amount: number } }
  | { type: 'DEDUCT_PLAYER_POINTS'; payload: { playerId: string; amount: number } }
  | { type: 'RESET_SESSION' };

// ─── Reducer ────────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };

    case 'SET_PLAYERS':
      return {
        ...state,
        players: action.payload.map((p) => ({ ...p, points: 0 })),
        currentPlayerIndex: 0,
      };

    case 'SET_INTENSITY':
      return { ...state, intensity: action.payload };

    case 'SET_CURRENT_QUESTION':
      return { ...state, currentQuestionId: action.payload };

    case 'NEXT_PLAYER':
      return {
        ...state,
        currentPlayerIndex: state.players.length > 0 ? (state.currentPlayerIndex + 1) % state.players.length : 0,
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
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.playerId
            ? { ...p, points: (p.points ?? 0) + action.payload.amount }
            : p
        ),
      };

    case 'DEDUCT_PLAYER_POINTS':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.playerId
            ? { ...p, points: Math.max(0, (p.points ?? 0) - action.payload.amount) }
            : p
        ),
      };

    case 'RESET_SESSION':
      // Réinitialise la partie en cours sans effacer l'historique des questions déjà vues
      return {
        ...initialState,
        seenQuestionIds: state.seenQuestionIds,
      };

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState;
  setMode: (mode: GameMode) => void;
  setPlayers: (players: Player[]) => void;
  setIntensity: (intensity: IntensityLevel) => void;
  setCurrentQuestion: (id: string) => void;
  nextPlayer: () => void;
  markQuestionSeen: (id: string) => void;
  resetSeenQuestions: () => Promise<void>;
  addPlayerPoints: (playerId: string, amount: number) => void;
  deductPlayerPoints: (playerId: string, amount: number) => void;
  resetSession: () => void;
  currentPlayer: Player | null;
}

const GameContext = createContext<GameContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Charger l'historique des questions déjà vues au démarrage
  useEffect(() => {
    async function loadSeen() {
      const seenIds = await seenQuestionsService.getSeenQuestionIds();
      if (seenIds.length > 0) {
        dispatch({ type: 'SET_SEEN_QUESTIONS', payload: seenIds });
      }
    }
    loadSeen();
  }, []);

  const currentPlayer = state.players[state.currentPlayerIndex] ?? null;

  const markQuestionSeen = (id: string) => {
    dispatch({ type: 'MARK_QUESTION_SEEN', payload: id });
    seenQuestionsService.markQuestionSeen(id);
  };

  const resetSeenQuestions = async () => {
    await seenQuestionsService.resetAllSeenQuestions();
    dispatch({ type: 'RESET_SEEN_QUESTIONS' });
  };

  return (
    <GameContext.Provider
      value={{
        state,
        currentPlayer,
        setMode: (mode) => dispatch({ type: 'SET_MODE', payload: mode }),
        setPlayers: (players) => dispatch({ type: 'SET_PLAYERS', payload: players }),
        setIntensity: (intensity) => dispatch({ type: 'SET_INTENSITY', payload: intensity }),
        setCurrentQuestion: (id) => dispatch({ type: 'SET_CURRENT_QUESTION', payload: id }),
        nextPlayer: () => dispatch({ type: 'NEXT_PLAYER' }),
        markQuestionSeen,
        resetSeenQuestions,
        addPlayerPoints: (playerId, amount) =>
          dispatch({ type: 'ADD_PLAYER_POINTS', payload: { playerId, amount } }),
        deductPlayerPoints: (playerId, amount) =>
          dispatch({ type: 'DEDUCT_PLAYER_POINTS', payload: { playerId, amount } }),
        resetSession: () => dispatch({ type: 'RESET_SESSION' }),
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
    throw new Error('useGame doit être utilisé à l\'intérieur de GameProvider');
  }
  return context;
}
