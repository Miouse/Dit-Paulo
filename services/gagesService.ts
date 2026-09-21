// services/gagesService.ts
// Gestionnaire des gages de Dit-Paulo ? (Gages par défaut, gages personnalisés et tirage aléatoire)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_GAGES, type Gage } from '../data/gages';

const CUSTOM_GAGES_STORAGE_KEY = '@dit_paulo_custom_gages_v1';
const DISABLED_GAGES_STORAGE_KEY = '@dit_paulo_disabled_gages_v1';

let lastDrawnGageId: string | null = null;
let listeners: Array<() => void> = [];

export const gagesService = {
  /**
   * S'abonner aux changements de la liste des gages
   */
  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  notifyListeners() {
    listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Erreur dans le listener de gagesService', err);
      }
    });
  },

  /**
   * Récupère les gages personnalisés créés par l'utilisateur
   */
  async getCustomGages(): Promise<Gage[]> {
    try {
      const raw = await AsyncStorage.getItem(CUSTOM_GAGES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Erreur lors de la lecture des gages custom', e);
      return [];
    }
  },

  /**
   * Récupère les IDs des gages de base désactivés/supprimés par l'utilisateur
   */
  async getDisabledGageIds(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(DISABLED_GAGES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Erreur lors de la lecture des gages désactivés', e);
      return [];
    }
  },

  /**
   * Récupère la liste complète des gages actifs (défaut non désactivés + personnalisés)
   */
  async getAllActiveGages(): Promise<Gage[]> {
    const [customGages, disabledIds] = await Promise.all([
      this.getCustomGages(),
      this.getDisabledGageIds(),
    ]);

    const disabledSet = new Set(disabledIds);
    const activeDefaults = DEFAULT_GAGES.filter((g) => !disabledSet.has(g.id));

    return [...activeDefaults, ...customGages];
  },

  /**
   * Récupère TOUS les gages (pour l'écran d'administration/visualisation)
   * avec leur statut actif/désactivé
   */
  async getAllGagesWithStatus(): Promise<Array<Gage & { isEnabled: boolean }>> {
    const [customGages, disabledIds] = await Promise.all([
      this.getCustomGages(),
      this.getDisabledGageIds(),
    ]);

    const disabledSet = new Set(disabledIds);

    const defaultWithStatus = DEFAULT_GAGES.map((g) => ({
      ...g,
      isEnabled: !disabledSet.has(g.id),
      isCustom: false,
    }));

    const customWithStatus = customGages.map((g) => ({
      ...g,
      isEnabled: true,
      isCustom: true,
    }));

    return [...customWithStatus, ...defaultWithStatus];
  },

  /**
   * Tire un gage aléatoire parmi les gages actifs
   */
  async getRandomGage(): Promise<Gage | null> {
    const active = await this.getAllActiveGages();
    if (active.length === 0) {
      return {
        id: 'fallback_gage',
        text: 'Le groupe t’invente un gage personnalisé à réaliser immédiatement !',
        category: 'defi',
      };
    }

    if (active.length === 1) {
      return active[0];
    }

    // Éviter de retaper deux fois d'affilée sur le même gage si possible
    const candidates = active.filter((g) => g.id !== lastDrawnGageId);
    const pool = candidates.length > 0 ? candidates : active;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex];
    lastDrawnGageId = chosen.id;
    return chosen;
  },

  /**
   * Ajoute un nouveau gage personnalisé
   */
  async addCustomGage(text: string, category: Gage['category'] = 'defi'): Promise<Gage> {
    const cleanText = text.trim();
    if (!cleanText) throw new Error('Le texte du gage ne peut pas être vide.');

    const customs = await this.getCustomGages();
    const newGage: Gage = {
      id: `custom_gage_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      text: cleanText,
      category,
      isCustom: true,
    };

    const updated = [newGage, ...customs];
    await AsyncStorage.setItem(CUSTOM_GAGES_STORAGE_KEY, JSON.stringify(updated));
    this.notifyListeners();
    return newGage;
  },

  /**
   * Supprime un gage personnalisé, ou désactive un gage de base
   */
  async removeOrDisableGage(gageId: string): Promise<void> {
    const isCustom = gageId.startsWith('custom_gage_');

    if (isCustom) {
      const customs = await this.getCustomGages();
      const updated = customs.filter((g) => g.id !== gageId);
      await AsyncStorage.setItem(CUSTOM_GAGES_STORAGE_KEY, JSON.stringify(updated));
    } else {
      const disabled = await this.getDisabledGageIds();
      if (!disabled.includes(gageId)) {
        const updated = [...disabled, gageId];
        await AsyncStorage.setItem(DISABLED_GAGES_STORAGE_KEY, JSON.stringify(updated));
      }
    }

    this.notifyListeners();
  },

  /**
   * Réactive un gage de base qui avait été masqué
   */
  async reenableDefaultGage(gageId: string): Promise<void> {
    const disabled = await this.getDisabledGageIds();
    const updated = disabled.filter((id) => id !== gageId);
    await AsyncStorage.setItem(DISABLED_GAGES_STORAGE_KEY, JSON.stringify(updated));
    this.notifyListeners();
  },

  /**
   * Réinitialise tous les gages par défaut
   */
  async resetGages(): Promise<void> {
    await AsyncStorage.removeItem(DISABLED_GAGES_STORAGE_KEY);
    this.notifyListeners();
  },
};
