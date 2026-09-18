// components/ScreenContainer.tsx
// Conteneur de base pour chaque écran : SafeArea + Fond d'écran Mosaïque + Voile d'assombrissement + Padding

import React from 'react';
import { ImageBackground, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/theme';

const backgroundImage = require('../assets/background.jpg');

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  // Désactiver le padding horizontal (ex : pour des éléments pleine largeur)
  noPadding?: boolean;
}

export function ScreenContainer({ children, style, noPadding = false }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ImageBackground
        source={backgroundImage}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
        resizeMode="cover"
      >
        {/* Overlay sombre semi-transparent pour préserver la lisibilité parfaite des textes et des cartes */}
        <View style={styles.darkOverlay}>
          <View style={[styles.container, noPadding ? undefined : styles.padding, style]}>
            {children}
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    opacity: 0.55,
  },
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 11, 15, 0.86)',
  },
  container: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: spacing.lg,
  },
});
