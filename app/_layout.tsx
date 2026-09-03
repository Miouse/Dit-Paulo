// app/_layout.tsx
// Layout racine de l'application — configure Expo Router et le GameProvider global

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GameProvider } from '../context/GameContext';

export default function RootLayout() {
  return (
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
  );
}
