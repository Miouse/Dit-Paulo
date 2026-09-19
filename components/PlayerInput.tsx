// components/PlayerInput.tsx
// Composant de saisie du prénom d'un joueur, chaleureux et ludique avec avatars

import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing, typography } from '../constants/theme';

const AVATAR_EMOJIS = ['🦊', '🐼', '🦁', '🐯', '🦄', '🐸', '🐶', '🐱', '🐻', '🐨', '🐙', '🦋'];

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
  const avatar = AVATAR_EMOJIS[index % AVATAR_EMOJIS.length];

  return (
    <View style={styles.container}>
      {/* Avatar ludique */}
      <View style={styles.avatarBadge}>
        <Text style={styles.avatarText}>{avatar}</Text>
      </View>

      {/* Champ de saisie du prénom */}
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={onChangeName}
        placeholder={`Joueur ${index + 1} (ex: Alex, Camille...)`}
        placeholderTextColor={colors.textTertiary}
        maxLength={20}
        autoCorrect={false}
      />

      {/* Numéro de joueur discret */}
      <Text style={styles.playerIndexText}>#{index + 1}</Text>

      {/* Bouton de suppression */}
      {canRemove && (
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeButton}
          activeOpacity={0.7}
          accessibilityLabel={`Supprimer ${name || 'ce joueur'}`}
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
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  avatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    fontWeight: '500',
  },
  playerIndexText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    fontWeight: '600',
    marginRight: 2,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: typography.weights.bold,
  },
});
