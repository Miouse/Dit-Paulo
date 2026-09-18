// services/themeService.ts
// Gestionnaire persistant du thème visuel d'ambiance de l'application (AsyncStorage)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyThemeColors } from '../constants/theme';
import { APP_THEMES, type AppThemeConfig, type ThemeId } from '../types/theme';

const THEME_STORAGE_KEY = '@dit_paulo_app_theme_v1';
const DEFAULT_THEME_ID: ThemeId = 'neon_purple';

let currentThemeId: ThemeId = DEFAULT_THEME_ID;
let listeners: Array<(theme: AppThemeConfig) => void> = [];

export const themeService = {
  /**
   * S'abonner aux changements de thème
   */
  subscribe(listener: (theme: AppThemeConfig) => void) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  notifyListeners(theme: AppThemeConfig) {
    listeners.forEach((l) => {
      try {
        l(theme);
      } catch (err) {
        console.error('Error in themeService listener', err);
      }
    });
  },

  /**
   * Récupère la configuration du thème actif
   */
  getCurrentTheme(): AppThemeConfig {
    return APP_THEMES[currentThemeId] || APP_THEMES[DEFAULT_THEME_ID];
  },

  /**
   * Initialise le thème au démarrage depuis le stockage local
   */
  async initTheme(): Promise<AppThemeConfig> {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && saved in APP_THEMES) {
        currentThemeId = saved as ThemeId;
      } else {
        currentThemeId = DEFAULT_THEME_ID;
      }
    } catch (e) {
      console.error('Erreur lors du chargement du thème:', e);
      currentThemeId = DEFAULT_THEME_ID;
    }

    const config = this.getCurrentTheme();
    applyThemeColors(config.colors);
    return config;
  },

  /**
   * Change le thème visuel et persiste le choix
   */
  async setTheme(themeId: ThemeId): Promise<AppThemeConfig> {
    if (!(themeId in APP_THEMES)) {
      themeId = DEFAULT_THEME_ID;
    }
    currentThemeId = themeId;
    const config = this.getCurrentTheme();

    applyThemeColors(config.colors);

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch (e) {
      console.error("Erreur lors de l'enregistrement du thème:", e);
    }

    this.notifyListeners(config);
    return config;
  },
};
