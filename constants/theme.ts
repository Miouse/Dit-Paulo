// constants/theme.ts
// Système de design centralisé pour Dit-Paul ?
// Modifier ces valeurs pour changer l'apparence de toute l'application

export const colors = {
  // Fonds
  background: '#0D0D0F',
  surface: '#16161A',
  surfaceElevated: '#1E1E24',
  surfaceBorder: '#2A2A35',

  // Textes
  textPrimary: '#F2F2F7',
  textSecondary: '#8E8EA0',
  textTertiary: '#5A5A72',

  // Accent principal — violet doux
  accent: '#7B61FF',
  accentLight: '#9B85FF',
  accentDark: '#5A3FE0',
  accentMuted: 'rgba(123, 97, 255, 0.15)',

  // États
  success: '#30D158',
  danger: '#FF453A',
  warning: '#FFD60A',

  // Favoris
  favorite: '#FF6B9D',
  favoriteMuted: 'rgba(255, 107, 157, 0.15)',

  // Cartes de mode (couleurs uniques par mode)
  modes: {
    friends: { primary: '#FF8C42', muted: 'rgba(255, 140, 66, 0.12)' },
    date: { primary: '#FF6B9D', muted: 'rgba(255, 107, 157, 0.12)' },
    couple: { primary: '#FF453A', muted: 'rgba(255, 69, 58, 0.12)' },
    deep: { primary: '#7B61FF', muted: 'rgba(123, 97, 255, 0.12)' },
    party: { primary: '#30D158', muted: 'rgba(48, 209, 88, 0.12)' },
    nofilter: { primary: '#FF2D55', muted: 'rgba(255, 45, 85, 0.15)' },
  },

  // Transparences
  overlay: 'rgba(0, 0, 0, 0.6)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export function applyThemeColors(accentColors: {
  accent: string;
  accentLight: string;
  accentDark: string;
  accentMuted: string;
}) {
  colors.accent = accentColors.accent;
  colors.accentLight = accentColors.accentLight;
  colors.accentDark = accentColors.accentDark;
  colors.accentMuted = accentColors.accentMuted;
}

export const typography = {
  // Tailles de police
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },

  // Graisse
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },

  // Hauteurs de ligne
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;
