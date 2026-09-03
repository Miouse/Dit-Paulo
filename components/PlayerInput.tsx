// components/PlayerInput.tsx
// Composant de saisie du prénom d'un joueur

import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing, typography } from '../constants/theme';

interface PlayerInputProps {
  index: number;
  name: string;
  onChangeName: (text: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function PlayerInput({
  index,
  name,
  onChangeName,
  onRemove,
  canRemove,
}: PlayerInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>P{index + 1}</Text>
      </View>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={onChangeName}
        placeholder={`Joueur ${index + 1}`}
        placeholderTextColor={colors.textTertiary}
        maxLength={20}
        autoCorrect={false}
      />

      {canRemove && (
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeButton}
          accessibilityLabel={`Supprimer ${name || 'le joueur'}`}
        >
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.accent,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  removeButton: {
    padding: spacing.sm,
  },
  removeText: {
    fontSize: typography.sizes.md,
    color: colors.textTertiary,
    fontWeight: typography.weights.bold,
  },
});
