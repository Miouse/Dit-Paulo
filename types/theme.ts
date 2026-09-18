// types/theme.ts
// Définitions des thèmes visuels d'ambiance pour Dit-Paulo ?

export type ThemeId =
  | 'neon_purple'
  | 'cyber_pink'
  | 'sunset_gold'
  | 'emerald_matrix'
  | 'electric_cyan';

export interface ThemeColors {
  accent: string;
  accentLight: string;
  accentDark: string;
  accentMuted: string;
}

export interface AppThemeConfig {
  id: ThemeId;
  name: string;
  emoji: string;
  description: string;
  previewColor: string;
  colors: ThemeColors;
}

export const APP_THEMES: Record<ThemeId, AppThemeConfig> = {
  neon_purple: {
    id: 'neon_purple',
    name: 'Néon Violet (Défaut)',
    emoji: '🌌',
    description: 'Ambiance mystique et feutrée violette, signature Dit-Paulo',
    previewColor: '#7B61FF',
    colors: {
      accent: '#7B61FF',
      accentLight: '#9B85FF',
      accentDark: '#5A3FE0',
      accentMuted: 'rgba(123, 97, 255, 0.15)',
    },
  },
  cyber_pink: {
    id: 'cyber_pink',
    name: 'Rose Cyberpunk',
    emoji: '🍸',
    description: 'Énergie électrique, clubbing et soirées sans filtre',
    previewColor: '#FF2D55',
    colors: {
      accent: '#FF2D55',
      accentLight: '#FF5A7A',
      accentDark: '#D81B43',
      accentMuted: 'rgba(255, 45, 85, 0.15)',
    },
  },
  sunset_gold: {
    id: 'sunset_gold',
    name: 'Sunset Gold',
    emoji: '🌅',
    description: 'Chaleur dorée, coucher de soleil d’été et ambiance festive',
    previewColor: '#FF9F0A',
    colors: {
      accent: '#FF9F0A',
      accentLight: '#FFB340',
      accentDark: '#D97E00',
      accentMuted: 'rgba(255, 159, 10, 0.15)',
    },
  },
  emerald_matrix: {
    id: 'emerald_matrix',
    name: 'Casino Émeraude',
    emoji: '🌲',
    description: 'Tapis vert feutré, élégance et jeu de cartes luxueux',
    previewColor: '#30D158',
    colors: {
      accent: '#30D158',
      accentLight: '#5CE07D',
      accentDark: '#24A843',
      accentMuted: 'rgba(48, 209, 88, 0.15)',
    },
  },
  electric_cyan: {
    id: 'electric_cyan',
    name: 'Bleu Électrique',
    emoji: '🌊',
    description: 'Bleu nuit cristallin, clarté et discussions profondes',
    previewColor: '#0A84FF',
    colors: {
      accent: '#0A84FF',
      accentLight: '#409CFF',
      accentDark: '#0066CC',
      accentMuted: 'rgba(10, 132, 255, 0.15)',
    },
  },
};
