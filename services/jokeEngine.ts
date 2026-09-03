// services/jokeEngine.ts
// Gestionnaire centralisé des "Codes Blagues" et Easter Eggs de Dit-Paulo ?

import AsyncStorage from '@react-native-async-storage/async-storage';

const JOKES_ENABLED_KEY = '@dit_paul_jokes_enabled';
const CUSTOM_JOKES_KEY = '@dit_paul_custom_jokes';

export interface JokeEffect {
  id: string;
  triggerName: string;
  type: 'GAME_OVER' | 'SPICY_ALERT' | 'CONFETTI';
  timerSeconds: number;
  title: string;
  message: string;
  emoji: string;
  isCustom?: boolean;
}

// Blagues intégrées par défaut
export const DEFAULT_JOKE_CODES: JokeEffect[] = [
  {
    id: 'sam_game_over',
    triggerName: 'sam',
    type: 'GAME_OVER',
    timerSeconds: 8,
    title: 'GAME OVER 💀',
    message: 'Sam est tombé sur cette carte... La partie a été détruite ! Le Dev du jeu te salue ;)',
    emoji: '💥',
  },
];

// Cache mémoire simple pour éviter les appels AsyncStorage répétés à chaque re-render
let _playerJokeCache: { name: string | null; result: JokeEffect | null; ts: number } = {
  name: null,
  result: null,
  ts: 0,
};
const JOKE_CACHE_TTL_MS = 3000; // 3 secondes

export const jokeEngine = {
  /**
   * Vérifie si l'option des codes blagues est activée
   */
  async isJokesEnabled(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(JOKES_ENABLED_KEY);
      return val !== null ? JSON.parse(val) : true;
    } catch {
      return true;
    }
  },

  /**
   * Activer ou désactiver les codes blagues
   */
  async setJokesEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(JOKES_ENABLED_KEY, JSON.stringify(enabled));
    } catch (e) {
      console.error('Erreur lors de la sauvegarde du statut des blagues', e);
    }
  },

  /**
   * Récupère la liste de toutes les blagues (défaut + personnalisées)
   */
  async getAllJokes(): Promise<JokeEffect[]> {
    try {
      const json = await AsyncStorage.getItem(CUSTOM_JOKES_KEY);
      const customJokes: JokeEffect[] = json ? JSON.parse(json) : [];
      return [...DEFAULT_JOKE_CODES, ...customJokes];
    } catch {
      return DEFAULT_JOKE_CODES;
    }
  },

  /**
   * Ajouter une blague personnalisée
   */
  async addJoke(newJoke: Omit<JokeEffect, 'id' | 'isCustom'>): Promise<JokeEffect[]> {
    try {
      const currentJokes = await this.getAllJokes();
      const customOnly = currentJokes.filter((j) => j.isCustom);

      const jokeToAdd: JokeEffect = {
        ...newJoke,
        id: `custom_${Date.now()}`,
        isCustom: true,
        triggerName: newJoke.triggerName.trim().toLowerCase(),
      };

      const updatedCustom = [...customOnly, jokeToAdd];
      await AsyncStorage.setItem(CUSTOM_JOKES_KEY, JSON.stringify(updatedCustom));
      _playerJokeCache = { name: null, result: null, ts: 0 }; // Invalider le cache
      return [...DEFAULT_JOKE_CODES, ...updatedCustom];
    } catch (e) {
      console.error("Erreur lors de l'ajout de la blague", e);
      return DEFAULT_JOKE_CODES;
    }
  },

  /**
   * Supprimer une blague personnalisée par ID
   */
  async deleteJoke(id: string): Promise<JokeEffect[]> {
    try {
      const currentJokes = await this.getAllJokes();
      const updatedCustom = currentJokes
        .filter((j) => j.isCustom && j.id !== id);

      await AsyncStorage.setItem(CUSTOM_JOKES_KEY, JSON.stringify(updatedCustom));
      _playerJokeCache = { name: null, result: null, ts: 0 }; // Invalider le cache
      return [...DEFAULT_JOKE_CODES, ...updatedCustom];
    } catch (e) {
      console.error('Erreur lors de la suppression de la blague', e);
      return DEFAULT_JOKE_CODES;
    }
  },

  /**
   * Vérifie si le prénom d'un joueur déclenche une blague (si l'option est activée).
   * Utilise un cache mémoire de 3s pour éviter les appels AsyncStorage répétés.
   */
  async getJokeForPlayer(playerName: string | null | undefined): Promise<JokeEffect | null> {
    if (!playerName) return null;

    const normalized = playerName.trim().toLowerCase();
    const now = Date.now();

    // Retourner depuis le cache si le prénom est identique et récent
    if (_playerJokeCache.name === normalized && now - _playerJokeCache.ts < JOKE_CACHE_TTL_MS) {
      return _playerJokeCache.result;
    }

    const enabled = await this.isJokesEnabled();
    if (!enabled) {
      _playerJokeCache = { name: normalized, result: null, ts: now };
      return null;
    }

    const allJokes = await this.getAllJokes();
    const match = allJokes.find((joke) =>
      normalized === joke.triggerName || normalized.includes(joke.triggerName)
    ) ?? null;

    _playerJokeCache = { name: normalized, result: match, ts: now };
    return match;
  },
};

