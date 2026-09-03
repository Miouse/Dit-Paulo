// components/IntensitySelector.tsx
// Carte/Bouton de sélection du niveau d'intensité

import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import { INTENSITY_CONFIGS, type IntensityLevel } from '../types/game';

interface IntensitySelectorProps {
  level: IntensityLevel;
  isSelected: boolean;
  onSelect: (level: IntensityLevel) => void;
}

export function IntensitySelector({
  level,
  isSelected,
  onSelect,
}: IntensitySelectorProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const config = INTENSITY_CONFIGS[level];

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
      onPress={() => onSelect(level)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Niveau ${level} ${config.label} — ${config.description}`}
      accessibilityState={{ selected: isSelected }}
    >
      <Animated.View
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={styles.emoji}>{config.emoji}</Text>
        <View style={styles.info}>
          <View style={styles.row}>
            <Text style={[styles.label, isSelected && styles.textSelected]}>
              Niveau {level} — {config.label}
            </Text>
          </View>
          <Text style={styles.description}>{config.description}</Text>
        </View>
        {isSelected && <View style={styles.checkDot} />}
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  textSelected: {
    color: colors.accentLight,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  checkDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
  },
});
