// app/index.tsx
// Écran d'accueil chaleureux, friendly et moderne pour Dit-Paulo ?

import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { questions } from '../data/questions';
import { customCardsService } from '../services/customCardsService';
import { flaggedQuestionsService } from '../services/flaggedQuestionsService';
import { tinderSortService } from '../services/tinderSortService';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { state, resetSeenQuestions } = useGame();
  const seenCount = state.seenQuestionIds.length;

  const [showResetModal, setShowResetModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tinderStats, setTinderStats] = useState({ kept: 0, rejected: 0 });
  const [customCardsCount, setCustomCardsCount] = useState(0);
  const [flaggedCount, setFlaggedCount] = useState(0);

  useEffect(() => {
    tinderSortService.getSortState().then((s) => {
      setTinderStats({ kept: s.keptIds.length, rejected: s.rejectedIds.length });
    });
    const unsubTinder = tinderSortService.subscribe((s) => {
      setTinderStats({ kept: s.keptIds.length, rejected: s.rejectedIds.length });
    });

    customCardsService.getCustomCards().then((c) => setCustomCardsCount(c.length));
    const unsubCards = customCardsService.subscribe((c) => setCustomCardsCount(c.length));

    flaggedQuestionsService.getFlaggedQuestions().then((list) => setFlaggedCount(list.length));
    const unsubFlagged = flaggedQuestionsService.subscribe((list) => setFlaggedCount(list.length));

    return () => {
      unsubTinder();
      unsubCards();
      unsubFlagged();
    };
  }, []);

  // Animation d'entrée douce
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Légère pulsation accueillante sur le bouton principal
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, []);

  const handleConfirmReset = async () => {
    await resetSeenQuestions();
    setShowResetModal(false);
    setToastMessage('✨ Le paquet a été rebattu ! Toutes les cartes sont prêtes.');
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const totalSorted = tinderStats.kept + tinderStats.rejected;
  const seenPercentage = questions.length > 0 ? Math.round((seenCount / questions.length) * 100) : 0;

  return (
    <ScreenContainer noPadding>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Toast amical de confirmation */}
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        <Animated.View
          style={[
            styles.mainWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* ─── Hero Header Chaleureux ──────────────────────────────────── */}
          <View style={styles.hero}>
            <View style={[styles.badgePill, { backgroundColor: theme.colors.accentMuted, borderColor: theme.colors.accent }]}>
              <Text style={[styles.badgePillText, { color: theme.colors.accentLight }]}>
                👋 BIENVENUE SUR DIT-PAULO !
              </Text>
            </View>

            <View style={[styles.logoCircle, { borderColor: theme.colors.accent, shadowColor: theme.colors.accent }]}>
              <Text style={styles.logoEmoji}>💬</Text>
            </View>

            <Text style={styles.title}>Dit-Paulo ?</Text>
            <Text style={styles.tagline}>
              Le jeu convivial pour briser la glace, rire et partager de vraies conversations ✨
            </Text>
          </View>

          {/* ─── Bouton Principal Lancer la partie ──────────────────────── */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
            <TouchableOpacity
              onPress={() => router.push('/setup/categories')}
              style={[
                styles.startMainCard,
                {
                  backgroundColor: theme.colors.accent,
                  shadowColor: theme.colors.accent,
                },
              ]}
              activeOpacity={0.88}
              accessibilityLabel="Lancer une nouvelle partie"
            >
              <View style={styles.startCardLeft}>
                <View style={styles.startIconCircle}>
                  <Text style={styles.startCardIcon}>🚀</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.startCardTitle}>LANCER UNE PARTIE</Text>
                  <Text style={styles.startCardSubtitle}>
                    {state.selectedCategories.length} thèmes prêts • En famille, potes ou couple
                  </Text>
                </View>
              </View>
              <View style={styles.arrowCircle}>
                <Text style={styles.startCardArrow}>➔</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* ─── Grille 2x2 : Explorer & Outils ───────────────────────────── */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionHeaderTitle}>EXPLORER & PERSONNALISER</Text>
          </View>

          <View style={styles.gridRow}>
            {/* Galerie */}
            <TouchableOpacity
              onPress={() => router.push('/cards')}
              style={styles.gridCard}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(255, 140, 66, 0.15)' }]}>
                <Text style={styles.gridCardEmoji}>🃏</Text>
              </View>
              <Text style={styles.gridCardTitle}>Galerie des Cartes</Text>
              <Text style={styles.gridCardDesc}>{questions.length} questions prêtes</Text>
            </TouchableOpacity>

            {/* Mes Cartes */}
            <TouchableOpacity
              onPress={() => router.push('/custom-cards')}
              style={[
                styles.gridCard,
                { borderColor: 'rgba(255, 215, 0, 0.4)', backgroundColor: 'rgba(255, 215, 0, 0.05)' },
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                <Text style={styles.gridCardEmoji}>⭐</Text>
              </View>
              <Text style={[styles.gridCardTitle, { color: '#FFD700' }]}>Mes Cartes</Text>
              <Text style={styles.gridCardDesc}>
                {customCardsCount > 0 ? `${customCardsCount} carte${customCardsCount > 1 ? 's' : ''} créées` : 'Ajoute tes questions'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            {/* Tri Tinder */}
            <TouchableOpacity
              onPress={() => router.push('/tinder-sort')}
              style={[
                styles.gridCard,
                { borderColor: 'rgba(255, 45, 85, 0.4)', backgroundColor: 'rgba(255, 45, 85, 0.05)' },
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(255, 45, 85, 0.15)' }]}>
                <Text style={styles.gridCardEmoji}>🔥</Text>
              </View>
              <Text style={[styles.gridCardTitle, { color: '#FF2D55' }]}>Tri des Cartes</Text>
              <Text style={styles.gridCardDesc}>
                {totalSorted > 0 ? `${totalSorted} triées (${tinderStats.rejected} exclues)` : 'Swipe pour filtrer'}
              </Text>
            </TouchableOpacity>

            {/* Cartes Gages */}
            <TouchableOpacity
              onPress={() => router.push('/gages')}
              style={[
                styles.gridCard,
                { borderColor: 'rgba(255, 159, 10, 0.4)', backgroundColor: 'rgba(255, 159, 10, 0.05)' },
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
                <Text style={styles.gridCardEmoji}>⏱️</Text>
              </View>
              <Text style={[styles.gridCardTitle, { color: '#FF9F0A' }]}>Cartes Gages</Text>
              <Text style={styles.gridCardDesc}>Patate Chaude & Défis</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            {/* Liste complète */}
            <TouchableOpacity
              onPress={() => router.push('/questions-list')}
              style={[styles.gridCard, { flex: 1 }]}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(100, 210, 255, 0.15)' }]}>
                <Text style={styles.gridCardEmoji}>📋</Text>
              </View>
              <Text style={styles.gridCardTitle}>Toutes les Questions</Text>
              <Text style={styles.gridCardDesc}>Vue détaillée par thème</Text>
            </TouchableOpacity>
          </View>

          {/* ─── Préférences & Ambiance ──────────────────────────────────── */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionHeaderTitle}>RÉGLAGES & STYLE</Text>
          </View>

          <View style={styles.gridRow}>
            <TouchableOpacity
              onPress={() => router.push('/favorites')}
              style={styles.actionPillCard}
              activeOpacity={0.8}
            >
              <Text style={styles.actionPillEmoji}>❤️</Text>
              <Text style={styles.actionPillTitle}>Mes Coups de Cœur</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.actionPillCard}
              activeOpacity={0.8}
            >
              <Text style={styles.actionPillEmoji}>🎨</Text>
              <Text style={styles.actionPillTitle}>Thèmes ({theme.name.split(' ')[0]})</Text>
            </TouchableOpacity>
          </View>

          {/* Bandeau discret si des questions ont été signalées pendant une partie */}
          {flaggedCount > 0 && (
            <TouchableOpacity
              onPress={() => router.push('/flagged-questions')}
              style={[
                styles.flaggedNoticeCard,
                {
                  borderColor: 'rgba(255, 59, 48, 0.45)',
                  backgroundColor: 'rgba(255, 59, 48, 0.08)',
                },
              ]}
              activeOpacity={0.8}
              accessibilityLabel="Voir les questions à modifier"
            >
              <View style={styles.flaggedNoticeLeft}>
                <Text style={styles.flaggedNoticeEmoji}>🚩</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.flaggedNoticeTitle}>
                    {flaggedCount} question{flaggedCount > 1 ? 's' : ''} signalée{flaggedCount > 1 ? 's' : ''} à modifier
                  </Text>
                  <Text style={styles.flaggedNoticeSubtitle}>
                    Touchez pour relire, modifier ou exporter le code
                  </Text>
                </View>
              </View>
              <Text style={styles.flaggedNoticeArrow}>➔</Text>
            </TouchableOpacity>
          )}

          {/* ─── État du Paquet de Cartes ────────────────────────────────── */}
          <View style={styles.statsCard}>
            <View style={styles.statsHeaderRow}>
              <View style={styles.statsHeaderLeft}>
                <Text style={styles.statsIcon}>🎴</Text>
                <View>
                  <Text style={styles.statsTitle}>Progression de la Pioche</Text>
                  <Text style={styles.statsSubtitle}>Découvre de nouvelles questions à chaque tour</Text>
                </View>
              </View>
              <Text style={[styles.statsRatio, { color: theme.colors.accentLight }]}>
                {seenCount} / {questions.length} ({seenPercentage}%)
              </Text>
            </View>

            {/* Jauge de progression */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, Math.max(2, seenPercentage))}%`,
                    backgroundColor: theme.colors.accent,
                  },
                ]}
              />
            </View>

            {seenCount > 0 ? (
              <TouchableOpacity
                onPress={() => setShowResetModal(true)}
                style={styles.resetBtn}
                activeOpacity={0.75}
              >
                <Text style={styles.resetBtnText}>🔄 Rebattre les cartes (repartir de 0)</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.freshDeckText}>✨ Le paquet est tout frais, toutes les cartes sont prêtes !</Text>
            )}
          </View>
        </Animated.View>

        {/* Modal chaleureuse : Rebattre les cartes */}
        <Modal
          visible={showResetModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowResetModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconCircle}>
                <Text style={styles.modalEmoji}>🔄</Text>
              </View>
              <Text style={styles.modalTitle}>Rebattre le paquet ?</Text>
              <Text style={styles.modalMessage}>
                {seenCount > 0
                  ? `Vous avez déjà découvert ${seenCount} question${seenCount > 1 ? 's' : ''} sur ${questions.length}.\n\nEn remettant à zéro, toutes les cartes redeviendront piochables immédiatement pour une nouvelle session !`
                  : `Toutes les questions sont déjà prêtes dans la pioche.\n\nVeux-tu réinitialiser quand même ?`}
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={handleConfirmReset}
                  style={[styles.modalActionBtn, { backgroundColor: theme.colors.accent }]}
                >
                  <Text style={styles.modalActionBtnText}>Oui, rebattre le paquet ✨</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowResetModal(false)}
                  style={[styles.modalActionBtn, styles.modalCancelBtn]}
                >
                  <Text style={styles.modalCancelBtnText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + 40,
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 620,
  },
  toastContainer: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderColor: colors.success,
    borderWidth: 1.5,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    zIndex: 999,
    ...shadows.md,
  },
  toastText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  badgePill: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    marginBottom: spacing.md,
  },
  badgePillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  logoEmoji: {
    fontSize: 42,
  },
  title: {
    fontSize: 34,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  startMainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.lg,
    elevation: 8,
  },
  startCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  startIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startCardIcon: {
    fontSize: 24,
  },
  startCardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  startCardSubtitle: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    fontWeight: typography.weights.medium,
  },
  arrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  startCardArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  sectionHeaderWrap: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionHeaderTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textTertiary,
    letterSpacing: 1.2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    width: '100%',
  },
  gridCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    ...shadows.sm,
  },
  gridIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  gridCardEmoji: {
    fontSize: 22,
  },
  gridCardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  gridCardDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionPillCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    gap: spacing.sm,
    ...shadows.sm,
  },
  actionPillEmoji: {
    fontSize: 18,
  },
  actionPillTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    marginTop: spacing.sm,
    width: '100%',
    ...shadows.sm,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statsIcon: {
    fontSize: 24,
  },
  statsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statsSubtitle: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 1,
  },
  statsRatio: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  progressTrack: {
    height: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radii.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  resetBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  resetBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  freshDeckText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    ...shadows.lg,
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modalEmoji: {
    fontSize: 28,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.xl,
  },
  modalActions: {
    width: '100%',
    gap: spacing.sm,
  },
  modalActionBtn: {
    width: '100%',
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
  modalCancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
  },
  modalCancelBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  flaggedNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  flaggedNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  flaggedNoticeEmoji: {
    fontSize: 20,
  },
  flaggedNoticeTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#FF3B30',
  },
  flaggedNoticeSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  flaggedNoticeArrow: {
    fontSize: typography.sizes.md,
    color: '#FF3B30',
    fontWeight: typography.weights.bold,
  },
});
