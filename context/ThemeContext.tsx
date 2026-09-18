// context/ThemeContext.tsx
// Fournisseur d'état React Context pour le thème visuel de l'application

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { themeService } from '../services/themeService';
import { APP_THEMES, type AppThemeConfig, type ThemeId } from '../types/theme';

interface ThemeContextValue {
  theme: AppThemeConfig;
  setTheme: (themeId: ThemeId) => Promise<void>;
  availableThemes: AppThemeConfig[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setInternalTheme] = useState<AppThemeConfig>(themeService.getCurrentTheme());

  useEffect(() => {
    themeService.initTheme().then((t) => setInternalTheme(t));
    const unsubscribe = themeService.subscribe((updatedTheme) => {
      setInternalTheme({ ...updatedTheme });
    });
    return () => unsubscribe();
  }, []);

  const handleSetTheme = async (themeId: ThemeId) => {
    const updated = await themeService.setTheme(themeId);
    setInternalTheme({ ...updated });
  };

  const availableThemes = Object.values(APP_THEMES);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: handleSetTheme,
        availableThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé à l\'intérieur d\'un ThemeProvider');
  }
  return context;
}
