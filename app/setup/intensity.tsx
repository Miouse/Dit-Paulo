// app/setup/intensity.tsx
// Écran de sélection de l'intensité des questions

import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IntensitySelector } from '../../components/IntensitySelector';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors, spacing, typography } from '../../constants/theme';
import { useGame } from '../../context/GameContext';
import { questionEngine } from '../../services/questionEngine';
import { MODE_CONFIGS, type IntensityLevel } from '../../types/game';

export default function IntensityScreen() {
  const { setIntensity, setCurrentQuestion, markQuestionSeen, state } = useGame();

  const currentModeConfig = state.mode ? MODE_CONFIGS[state.mode] : MODE_CONFIGS.friends;
  const availableIntensities = currentModeConfig.availableIntensities;

  // Sélectionner l'intensité précédente si elle est valide pour ce mode, sinon la plus élevée disponible
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel>(() => {
    if (state.intensity && availableIntensities.includes(state.intensity)) {
      return state.intensity;
    }
    return availableIntensities[availableIntensities.length - 1] ?? 3;
  });

  const handleStartGame = () => {
    if (!state.mode) return;

    setIntensity(selectedIntensity);

    // Tirer la première question en évitant toutes les questions déjà vues
    const firstQuestion = questionEngine.getNextQuestion({
      mode: state.mode,
      intensity: selectedIntensity,
      playerCount: state.players.length,
      seenQuestionIds: state.seenQuestionIds,
    });

    if (firstQuestion) {
      setCurrentQuestion(firstQuestion.id);
      markQuestionSeen(firstQuestion.id);
    }

    router.push('/game');
  };

  return (
    <ScreenContainer noPadding>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Retour à la liste des joueurs"
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>On va jusqu'où ?</Text>
        <Text style={styles.subtitle}>
          Adapté au mode {currentModeConfig.emoji} {currentModeConfig.label}
        </Text>
      </View>

      {/* Liste des intensités disponibles */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {availableIntensities.map((level) => (
          <IntensitySelector
            key={level}
            level={level}
            isSelected={selectedIntensity === level}
            onSelect={setSelectedIntensity}
          />
        ))}
      </ScrollView>

      {/* Bouton Lancer la partie */}
      <View style={styles.footer}>
        <PrimaryButton
          label="COMMENCER LA PARTIE"
          onPress={handleStartGame}
          accessibilityLabel="Lancer la partie maintenant"
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
