// components/ModeCard.tsx
// Carte de sélection d'un mode de jeu

import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import type { GameMode, ModeConfig } from '../types/game';

interface ModeCardProps {
  config: ModeConfig;
  isSelected: boolean;
  onPress: (mode: GameMode) => void;
}

export function ModeCard({ config, isSelected, onPress }: ModeCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const modeColor = colors.modes[config.id];

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => onPress(config.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Mode ${config.label} — ${config.description}`}
      accessibilityState={{ selected: isSelected }}
    >
      <Animated.View
        style={[
          styles.card,
          isSelected && { borderColor: modeColor.primary, backgroundColor: modeColor.muted },
          { transform: [{ scale }] },
        ]}
      >
        {/* Indicateur de sélection */}
        {isSelected && (
          <View style={[styles.selectedDot, { backgroundColor: modeColor.primary }]} />
        )}

        {/* Contenu */}
        <Text style={styles.emoji}>{config.emoji}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.label, isSelected && { color: modeColor.primary }]}>
            {config.label}
          </Text>
          <Text style={styles.description}>{config.description}</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  selectedDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  emoji: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
});
