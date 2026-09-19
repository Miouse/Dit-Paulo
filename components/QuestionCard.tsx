// components/QuestionCard.tsx
// Carte principale de jeu adaptative, responsive, chaleureuse et animée (3D Flip + Slide)
// Stylisation dynamique par Catégorie de question avec mise en valeur conviviale du joueur

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import { questionEngine } from '../services/questionEngine';
import { CATEGORY_CONFIGS } from '../types/game';
import type { Question } from '../types/question';

interface QuestionCardProps {
  question: Question;
  currentPlayerName?: string;
  currentPlayerPoints?: number;
  allPlayers?: { id: string; name: string }[];
  pointsEnabled?: boolean;
}

export function QuestionCard({
  question,
  currentPlayerName,
  currentPlayerPoints,
  allPlayers,
  pointsEnabled = true,
}: QuestionCardProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = windowWidth >= 700;

  // Hauteur dynamique de la carte selon la taille d'écran
  const cardHeight = isDesktop
    ? 460
    : Math.min(380, Math.max(260, Math.floor(windowHeight * 0.42)));

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
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [question.id, currentPlayerName, slideOffset]);

  // Interpolations pour l'effet de rotation physique
  const rotateY = animatedValue.interpolate({
    inputRange: [0, 90],
    outputRange: ['0deg', '90deg'],
  });

  const rotateZ = transX.interpolate({
    inputRange: [-slideOffset, 0, slideOffset],
    outputRange: ['-6deg', '0deg', '6deg'],
  });

  // Configuration visuelle de la catégorie
  const catConfig =
    CATEGORY_CONFIGS[displayedQuestion.category] || CATEGORY_CONFIGS.fun;
  const themeColor = catConfig.color;

  // Formatage du texte de la question avec les prénoms des joueurs
  const formattedText = React.useMemo(() => {
    return questionEngine.formatQuestionText(
      displayedQuestion.text,
      displayedPlayer,
      allPlayers
    );
  }, [displayedQuestion.id, displayedQuestion.text, displayedPlayer, allPlayers]);

  return (
    <View style={styles.outerContainer}>
      <Animated.View
        style={[
          styles.card,
          {
            maxWidth: isDesktop ? 400 : '100%',
            height: cardHeight,
            borderColor: themeColor,
            shadowColor: themeColor,
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
        {/* Motifs discrets aux coins */}
        <Text style={[styles.cornerMotif, styles.topLeft]}>✨</Text>
        <Text style={[styles.cornerMotif, styles.topRight]}>✨</Text>
        <Text style={[styles.cornerMotif, styles.bottomLeft]}>✨</Text>
        <Text style={[styles.cornerMotif, styles.bottomRight]}>✨</Text>

        {/* Bordure intérieure chaleureuse */}
        <View
          style={[
            styles.innerFrame,
            !isDesktop && styles.innerFrameMobile,
            { borderColor: catConfig.badgeBg },
          ]}
        >
          {/* En-tête : Badge thématique convivial */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { borderColor: themeColor, backgroundColor: catConfig.badgeBg }]}>
              <Text style={[styles.badgeText, { color: themeColor }]}>
                {catConfig.emoji} {catConfig.label}
              </Text>
            </View>

            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>#{displayedQuestion.id}</Text>
            </View>
          </View>

          {/* Corps de la carte : Question centrale */}
          <View style={styles.contentContainer}>
            <Text
              style={[
                styles.questionText,
                !isDesktop && styles.mobileQuestionText,
                displayedQuestion.text.length > 90 &&
                  (isDesktop ? styles.smallQuestionText : styles.mobileSmallQuestionText),
              ]}
            >
              {formattedText}
            </Text>
          </View>

          {/* Pied de carte : Invitation amicale au joueur */}
          <View style={[styles.playerTagContainer, !isDesktop && styles.playerTagContainerMobile]}>
            {displayedPlayer ? (
              <View style={styles.playerCallout}>
                <Text style={styles.playerEmoji}>🎤</Text>
                <Text style={[styles.playerLabel, !isDesktop && styles.playerLabelMobile]}>
                  À toi la parole,{' '}
                  <Text style={[styles.playerNameHighlight, { color: themeColor }]}>
                    {displayedPlayer}
                  </Text>
                  {' '}! ✨
                  {pointsEnabled && currentPlayerPoints !== undefined && (
                    <Text style={styles.playerPointsText}>
                      {' '}({currentPlayerPoints} Pt{currentPlayerPoints > 1 ? 's' : ''})
                    </Text>
                  )}
                </Text>
              </View>
            ) : (
              <View style={styles.playerCallout}>
                <Text style={styles.playerEmoji}>💬</Text>
                <Text style={[styles.playerLabel, !isDesktop && styles.playerLabelMobile]}>
                  Question ouverte pour tout le groupe ! ✨
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 30,
    borderWidth: 2,
    padding: spacing.md,
    justifyContent: 'space-between',
    ...shadows.lg,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  innerFrame: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 22,
    padding: spacing.lg,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  innerFrameMobile: {
    padding: spacing.md,
  },
  cornerMotif: {
    position: 'absolute',
    fontSize: 10,
    opacity: 0.25,
  },
  topLeft: { top: 12, left: 14 },
  topRight: { top: 12, right: 14 },
  bottomLeft: { bottom: 12, left: 14 },
  bottomRight: { bottom: 12, right: 14 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1.5,
    backgroundColor: colors.surfaceElevated,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.3,
  },
  idBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  idBadgeText: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: 'monospace',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  questionText: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  smallQuestionText: {
    fontSize: 18,
    lineHeight: 28,
  },
  mobileQuestionText: {
    fontSize: 18,
    lineHeight: 27,
  },
  mobileSmallQuestionText: {
    fontSize: 15,
    lineHeight: 23,
  },
  playerTagContainer: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  playerTagContainerMobile: {
    paddingTop: 6,
  },
  playerCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  playerEmoji: {
    fontSize: 14,
  },
  playerLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  playerLabelMobile: {
    fontSize: typography.sizes.xs,
  },
  playerNameHighlight: {
    fontWeight: typography.weights.heavy,
  },
  playerPointsText: {
    fontSize: typography.sizes.xs,
    color: '#FFD700',
    fontWeight: '700',
  },
});
