// app/_layout.tsx
// Layout racine de l'application — configure Expo Router, ThemeProvider et le GameProvider global

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GameProvider } from '../context/GameContext';
import { ThemeProvider } from '../context/ThemeContext';
import { customCardsService } from '../services/customCardsService';

export default function RootLayout() {
  useEffect(() => {
    customCardsService.initCustomCards();
  }, []);

  return (
    <ThemeProvider>
      <GameProvider>
        {/* Barre de statut claire sur fond sombre */}
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            // Fond sombre pour toutes les transitions
            contentStyle: { backgroundColor: '#0D0D0F' },
            headerShown: false,
            // Animation fluide entre les écrans
            animation: 'fade_from_bottom',
          }}
        />
      </GameProvider>
    </ThemeProvider>
  );
}
