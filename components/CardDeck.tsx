// components/CardDeck.tsx
// Composant de paquet de cartes avec support responsive (Full 3D ou Compact Mobile)

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import type { GameMode } from '../types/game';

interface CardDeckProps {
  type: 'draw' | 'discard';
  count: number;
  mode?: GameMode | null;
  compact?: boolean;
}

export function CardDeck({ type, count, mode, compact = false }: CardDeckProps) {
  const isDraw = type === 'draw';
  const modeColor = mode && colors.modes[mode] ? colors.modes[mode] : null;

  const borderColor = isDraw
    ? (modeColor?.primary ?? '#FF453A')
    : '#0A84FF';
  const badgeColor = isDraw
    ? (modeColor?.muted ?? 'rgba(255, 69, 58, 0.15)')
    : 'rgba(10, 132, 255, 0.15)';

  const label = isDraw ? 'PIOCHE' : 'DÉFAUSSE';
  const emoji = isDraw ? '🎴' : '📥';

  // Mode Compact pour mobile
  if (compact) {
    return (
      <View style={[styles.compactBadge, { backgroundColor: badgeColor, borderColor }]}>
        <Text style={[styles.compactText, { color: borderColor }]}>
          {emoji} {label} : <Text style={styles.compactCount}>{count}</Text>
        </Text>
      </View>
    );
  }

  // Mode Full 3D Tabletop pour grand écran
  return (
    <View style={styles.container}>
      {/* Label d'en-tête du paquet */}
      <View style={[styles.headerBadge, { backgroundColor: badgeColor, borderColor }]}>
        <Text style={[styles.headerText, { color: borderColor }]}>
          {emoji} {label} ({count})
        </Text>
      </View>

      {/* Paquet de cartes physique 3D */}
      <View style={styles.deckStack}>
        {/* Carte de fond 2 */}
        <View
          style={[
            styles.stackCard,
            styles.stackCardBottom,
            { borderColor: colors.surfaceBorder },
          ]}
        />
        {/* Carte de fond 1 */}
        <View
          style={[
            styles.stackCard,
            styles.stackCardMiddle,
            { borderColor: colors.surfaceBorder },
          ]}
        />

        {/* Carte supérieure principale */}
        <View
          style={[
            styles.topCard,
            { borderColor, shadowColor: borderColor },
            !isDraw && styles.tiltedCard,
          ]}
        >
          {/* Motifs géométriques aux coins */}
          <Text style={[styles.cornerMotif, styles.topLeft]}>♠ ♥</Text>
          <Text style={[styles.cornerMotif, styles.topRight]}>♦ ♣</Text>
          <Text style={[styles.cornerMotif, styles.bottomLeft]}>♦ ♣</Text>
          <Text style={[styles.cornerMotif, styles.bottomRight]}>♠ ♥</Text>

          <View style={styles.cardInner}>
            <Text style={styles.logoEmoji}>💬</Text>
            <Text style={styles.logoText}>Dit-Paulo ?</Text>
            <View style={[styles.countPill, { borderColor }]}>
              <Text style={[styles.countPillText, { color: borderColor }]}>{count}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
  },
  compactBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1.5,
  },
  compactText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  compactCount: {
    color: colors.textPrimary,
    fontWeight: typography.weights.heavy,
  },
  headerBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  headerText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
    letterSpacing: 0.5,
  },
  deckStack: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stackCard: {
    position: 'absolute',
    width: '90%',
    height: '92%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
  },
  stackCardBottom: {
    transform: [{ translateY: 8 }, { rotate: '-4deg' }],
    opacity: 0.5,
  },
  stackCardMiddle: {
    transform: [{ translateY: 4 }, { rotate: '3deg' }],
    opacity: 0.8,
  },
  topCard: {
    width: '94%',
    height: '96%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 2,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  tiltedCard: {
    transform: [{ rotate: '-6deg' }],
  },
  cornerMotif: {
    position: 'absolute',
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.08)',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  topLeft: {
    top: 6,
    left: 8,
  },
  topRight: {
    top: 6,
    right: 8,
  },
  bottomLeft: {
    bottom: 6,
    left: 8,
  },
  bottomRight: {
    bottom: 6,
    right: 8,
  },
  cardInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  logoEmoji: {
    fontSize: 26,
  },
  logoText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  countPill: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  countPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
