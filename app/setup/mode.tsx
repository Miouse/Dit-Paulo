// app/setup/mode.tsx
// Écran de sélection du mode de jeu

import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ModeCard } from '../../components/ModeCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors, spacing, typography } from '../../constants/theme';
import { useGame } from '../../context/GameContext';
import { MODE_CONFIGS } from '../../types/game';
import type { GameMode } from '../../types/game';

const MODES_ORDER: GameMode[] = ['friends', 'date', 'couple', 'deep', 'party', 'nofilter'];

export default function ModeScreen() {
  const { setMode, state } = useGame();
  const [selected, setSelected] = useState<GameMode | null>(state.mode);

  const handleSelect = (mode: GameMode) => {
    setSelected(mode);
  };

  const handleContinue = () => {
    if (!selected) return;
    setMode(selected);
    router.push('/setup/players');
  };

  return (
    <ScreenContainer noPadding>
      {/* En-tête */}
      <View style={styles.header}>
        {/* Bouton retour */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Retour à l'accueil"
          accessibilityRole="button"
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Vous jouez{'\n'}comment ?</Text>
        <Text style={styles.subtitle}>Choisissez l'ambiance de la partie</Text>
      </View>

      {/* Liste des modes */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {MODES_ORDER.map((modeId) => (
          <ModeCard
            key={modeId}
            config={MODE_CONFIGS[modeId]}
            isSelected={selected === modeId}
            onPress={handleSelect}
          />
        ))}
      </ScrollView>

      {/* Bouton Continuer */}
      <View style={styles.footer}>
        <PrimaryButton
          label="Continuer"
          onPress={handleContinue}
          disabled={!selected}
          accessibilityLabel="Continuer vers la sélection des joueurs"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    fontWeight: typography.weights.medium,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  footer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(13, 13, 18, 0.85)',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    alignItems: 'center',
  },
});
