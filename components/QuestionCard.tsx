// components/QuestionCard.tsx
// Carte principale de jeu adaptative, responsive et animée (3D Flip + Slide Pioche ➔ Centre ➔ Défausse)
// Support des cartes de Niveau 6 Dorées avec écriture noire intense !

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import { questionEngine } from '../services/questionEngine';
import { INTENSITY_CONFIGS, type GameMode, type IntensityLevel } from '../types/game';
import type { Question } from '../types/question';

interface QuestionCardProps {
  question: Question;
  currentPlayerName?: string;
  currentPlayerPoints?: number;
  allPlayers?: { id: string; name: string }[];
  mode?: GameMode | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  fun: 'Fun 🥳',
  future: 'Avenir 🔮',
  personality: 'Personnalité 👤',
  relationships: 'Relations 🤝',
  hypothetical: 'Dilemme 🌀',
  debate: 'Débat ⚖️',
  memories: 'Souvenir 📜',
  dreams: 'Rêve 🌟',
  flirt: 'Flirt 😏',
  lifestyle: 'Mode de vie 🌿',
  gossip: 'Extrême Potin 🔥',
  philosophy: 'Philosophie 🧠',
  hot: 'Hot 🌶️',
};

export function QuestionCard({ question, currentPlayerName, currentPlayerPoints, allPlayers, mode }: QuestionCardProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = windowWidth >= 700;

  // Hauteur dynamique de la carte selon la taille d'écran
  const cardHeight = isDesktop
    ? 460
    : Math.min(380, Math.max(260, Math.floor(windowHeight * 0.41)));

  const intensityConfig = INTENSITY_CONFIGS[question.intensity as IntensityLevel];
  const modeColor = mode && colors.modes[mode] ? colors.modes[mode] : colors.modes.deep;

  // Calculer dynamiquement le décalage de glissement selon la taille d'écran
  const slideOffset = isDesktop ? 260 : Math.min(180, Math.floor(windowWidth * 0.4));

  // Animation Values
  const transX = useRef(new Animated.Value(0)).current;
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Contenu affiché lors du retournement
  const [displayedQuestion, setDisplayedQuestion] = useState<Question>(question);
  const [displayedPlayer, setDisplayedPlayer] = useState<string | undefined>(currentPlayerName);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayedQuestion(question);
      setDisplayedPlayer(currentPlayerName);
      transX.setValue(0);
      return;
    }

    // Étape 1 : Glisser l'ancienne carte vers la Défausse (0 ➔ +slideOffset)
    Animated.parallel([
      Animated.timing(transX, {
        toValue: slideOffset,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 0.88,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Étape 2 : Mettre à jour la question au verso
      setDisplayedQuestion(question);
      setDisplayedPlayer(currentPlayerName);

      // Étape 3 : Repositionner sur la Pioche (-slideOffset)
      transX.setValue(-slideOffset);
      animatedValue.setValue(90);

      // Étape 4 : Glisser vers le Centre (-slideOffset ➔ 0px) avec retournement 3D
      Animated.parallel([
        Animated.spring(transX, {
          toValue: 0,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(animatedValue, {
          toValue: 0,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [question.id, currentPlayerName]);

  const rotateZ = transX.interpolate({
    inputRange: [-slideOffset, 0, slideOffset],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const rotateY = animatedValue.interpolate({
    inputRange: [-90, 0, 90],
    outputRange: ['-90deg', '0deg', '90deg'],
  });

  const formattedText = React.useMemo(() => {
    return questionEngine.formatQuestionText(
      displayedQuestion.text,
      displayedPlayer,
      allPlayers
    );
  }, [displayedQuestion.id, displayedQuestion.text, displayedPlayer, allPlayers]);

  // Est-ce une carte de Niveau 6 Mortel (Carte Dorée & Texte Noir) ?
  const isGoldCard = displayedQuestion.intensity === 6;

  return (
    <View style={styles.outerContainer}>
      <Animated.View
        style={[
          styles.card,
          isGoldCard && styles.goldCard,
          {
            maxWidth: isDesktop ? 380 : '100%',
            height: cardHeight,
            borderColor: isGoldCard ? '#B38F00' : modeColor.primary,
            shadowColor: isGoldCard ? '#FFD700' : modeColor.primary,
            transform: [
              { perspective: 1000 },
              { translateX: transX },
              { rotateZ },
              { rotateY },
              { scale: scaleValue },
            ],
          },
        ]}
      >
        {/* Motifs filigranes aux coins */}
        <Text style={[styles.cornerMotif, styles.topLeft, isGoldCard && styles.goldCornerMotif]}>♠ ♥</Text>
        <Text style={[styles.cornerMotif, styles.topRight, isGoldCard && styles.goldCornerMotif]}>♦ ♣</Text>
        <Text style={[styles.cornerMotif, styles.bottomLeft, isGoldCard && styles.goldCornerMotif]}>♦ ♣</Text>
        <Text style={[styles.cornerMotif, styles.bottomRight, isGoldCard && styles.goldCornerMotif]}>♠ ♥</Text>

        {/* Bordure intérieure */}
        <View style={[styles.innerFrame, !isDesktop && styles.innerFrameMobile, { borderColor: isGoldCard ? 'rgba(0, 0, 0, 0.25)' : modeColor.muted }]}>
          {/* En-tête : Badges de catégorie et d'intensité */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, isGoldCard ? styles.goldBadge : { borderColor: modeColor.primary }]}>
              <Text style={[styles.badgeText, isGoldCard ? styles.goldBadgeText : { color: modeColor.primary }]}>
                {CATEGORY_LABELS[displayedQuestion.category] ?? displayedQuestion.category}
              </Text>
            </View>
            {intensityConfig && !isGoldCard && (
              <View style={[styles.badge, styles.intensityBadge]}>
                <Text style={styles.badgeText}>
                  {intensityConfig.emoji} {intensityConfig.label}
                </Text>
              </View>
            )}
            {isGoldCard && (
              <View style={[styles.badge, styles.mortelBadge]}>
                <Text style={styles.mortelBadgeText}>💀 MORTEL (+10 Pts)</Text>
              </View>
            )}
          </View>

          {/* Corps de la carte : Question centrale */}
          <View style={styles.contentContainer}>
            <Text
              style={[
                styles.questionText,
                isGoldCard && styles.goldQuestionText,
                !isDesktop && styles.mobileQuestionText,
                displayedQuestion.text.length > 90 && (isDesktop ? styles.smallQuestionText : styles.mobileSmallQuestionText),
              ]}
            >
              {formattedText}
            </Text>
          </View>

          {/* Pied de carte : Tour du joueur et solde de points */}
          {displayedPlayer && (
            <View style={[styles.playerFooter, isGoldCard && styles.goldPlayerFooter]}>
              <Text style={[styles.playerLabel, isGoldCard && styles.goldPlayerLabel]}>
                À <Text style={[styles.playerName, { color: isGoldCard ? '#000000' : modeColor.primary }]}>{displayedPlayer}</Text> de répondre
                {currentPlayerPoints !== undefined && (
                  <Text style={[styles.pointsPill, isGoldCard && styles.goldPointsPill]}>
                    {` (Score : ${currentPlayerPoints} Pt${currentPlayerPoints > 1 ? 's' : ''})`}
                  </Text>
                )}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xxl,
    borderWidth: 2,
    padding: spacing.sm,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  goldCard: {
    backgroundColor: '#FFD700',
    borderColor: '#B38F00',
    shadowColor: '#FFD700',
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  innerFrame: {
    flex: 1,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  innerFrameMobile: {
    padding: spacing.sm,
  },
  cornerMotif: {
    position: 'absolute',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.08)',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  goldCornerMotif: {
    color: 'rgba(0, 0, 0, 0.25)',
  },
  topLeft: {
    top: 10,
    left: 12,
  },
  topRight: {
    top: 10,
    right: 12,
  },
  bottomLeft: {
    bottom: 10,
    left: 12,
  },
  bottomRight: {
    bottom: 10,
    right: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  badge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  goldBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderColor: '#000000',
  },
  goldBadgeText: {
    color: '#000000',
  },
  intensityBadge: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accentDark,
  },
  goldIntensityBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderColor: '#000000',
  },
  mortelBadge: {
    backgroundColor: '#0B0C10',
    borderColor: '#FFD700',
  },
  mortelBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
    color: '#FFD700',
  },
  pointsPill: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#FFD60A',
  },
  goldPointsPill: {
    color: '#000000',
    fontWeight: typography.weights.heavy,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  questionText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    lineHeight: typography.sizes.xl * 1.4,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  goldQuestionText: {
    color: '#0B0C10',
  },
  mobileQuestionText: {
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * 1.35,
  },
  smallQuestionText: {
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * 1.35,
  },
  mobileSmallQuestionText: {
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * 1.35,
  },
  playerFooter: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  goldPlayerFooter: {
    borderTopColor: 'rgba(0, 0, 0, 0.2)',
  },
  playerLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  goldPlayerLabel: {
    color: 'rgba(0, 0, 0, 0.75)',
  },
  playerName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
  },
});
