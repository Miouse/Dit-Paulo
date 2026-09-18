// app/index.tsx
// Écran d'accueil moderne, aéré et élégant pour Dit-Paulo ?

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
import { tinderSortService } from '../services/tinderSortService';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { state, resetSeenQuestions } = useGame();
  const seenCount = state.seenQuestionIds.length;

  const [showResetModal, setShowResetModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tinderStats, setTinderStats] = useState({ kept: 0, rejected: 0 });
  const [customCardsCount, setCustomCardsCount] = useState(0);

  useEffect(() => {
    tinderSortService.getSortState().then((s) => {
      setTinderStats({ kept: s.keptIds.length, rejected: s.rejectedIds.length });
    });
    const unsubTinder = tinderSortService.subscribe((s) => {
      setTinderStats({ kept: s.keptIds.length, rejected: s.rejectedIds.length });
    });

    customCardsService.getCustomCards().then((c) => setCustomCardsCount(c.length));
    const unsubCards = customCardsService.subscribe((c) => setCustomCardsCount(c.length));

    return () => {
      unsubTinder();
      unsubCards();
    };
  }, []);

  // Animation d'entrée
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleConfirmReset = async () => {
    await resetSeenQuestions();
    setShowResetModal(false);
    setToastMessage('✅ Pioche remise à zéro (0 carte vue) !');
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
        {/* Toast de confirmation */}
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
          {/* ─── Hero Header ─────────────────────────────────────────────── */}
          <View style={styles.hero}>
            <View style={[styles.badgePill, { backgroundColor: theme.colors.accentMuted, borderColor: theme.colors.accent }]}>
              <Text style={[styles.badgePillText, { color: theme.colors.accentLight }]}>
                ✨ JEU DE CARTES & CONVERSATIONS
              </Text>
            </View>

            <View style={[styles.logoCircle, { borderColor: theme.colors.accent, shadowColor: theme.colors.accent }]}>
              <Text style={styles.logoEmoji}>💬</Text>
            </View>

            <Text style={styles.title}>Dit-Paulo ?</Text>
            <Text style={styles.tagline}>
              Les meilleures conversations commencent souvent par une question.
            </Text>
          </View>

          {/* ─── Bouton Principal COMMENCER ─────────────────────────────── */}
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
            accessibilityLabel="Commencer une nouvelle partie"
          >
            <View style={styles.startCardLeft}>
              <Text style={styles.startCardIcon}>🎮</Text>
              <View>
                <Text style={styles.startCardTitle}>COMMENCER UNE PARTIE</Text>
                <Text style={styles.startCardSubtitle}>
                  {state.selectedCategories.length} catégories sélectionnées • Prêt à jouer
                </Text>
              </View>
            </View>
            <Text style={styles.startCardArrow}>➔</Text>
          </TouchableOpacity>

          {/* ─── Grille 2x2 : Cartes & Outils ────────────────────────────── */}
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
              <Text style={styles.gridCardEmoji}>🃏</Text>
              <Text style={styles.gridCardTitle}>Galerie des Cartes</Text>
              <Text style={styles.gridCardDesc}>{questions.length} cartes au total</Text>
            </TouchableOpacity>

            {/* Mes Cartes */}
            <TouchableOpacity
              onPress={() => router.push('/custom-cards')}
              style={[
                styles.gridCard,
                { borderColor: 'rgba(255, 215, 0, 0.4)', backgroundColor: 'rgba(255, 215, 0, 0.06)' },
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.gridCardEmoji}>⭐</Text>
              <Text style={[styles.gridCardTitle, { color: '#FFD700' }]}>Mes Cartes</Text>
              <Text style={styles.gridCardDesc}>
                {customCardsCount > 0 ? `${customCardsCount} carte${customCardsCount > 1 ? 's' : ''} créées` : 'Créer mes cartes'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            {/* Tri Tinder */}
            <TouchableOpacity
              onPress={() => router.push('/tinder-sort')}
              style={[
                styles.gridCard,
                { borderColor: 'rgba(255, 45, 85, 0.4)', backgroundColor: 'rgba(255, 45, 85, 0.06)' },
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.gridCardEmoji}>🔥</Text>
              <Text style={[styles.gridCardTitle, { color: '#FF2D55' }]}>Tri Tinder</Text>
              <Text style={styles.gridCardDesc}>
                {totalSorted > 0 ? `${totalSorted} triées (${tinderStats.rejected} exclues)` : 'Trier les questions'}
              </Text>
            </TouchableOpacity>

            {/* Liste complète */}
            <TouchableOpacity
              onPress={() => router.push('/questions-list')}
              style={styles.gridCard}
              activeOpacity={0.8}
            >
              <Text style={styles.gridCardEmoji}>📋</Text>
              <Text style={styles.gridCardTitle}>Toutes les Questions</Text>
              <Text style={styles.gridCardDesc}>Vue par thématiques</Text>
            </TouchableOpacity>
          </View>

          {/* ─── Navigation : Favoris & Paramètres ──────────────────────── */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionHeaderTitle}>PREFERENCES & THEMES</Text>
          </View>

          <View style={styles.gridRow}>
            <TouchableOpacity
              onPress={() => router.push('/favorites')}
              style={styles.actionPillCard}
              activeOpacity={0.8}
            >
              <Text style={styles.actionPillEmoji}>❤️</Text>
              <Text style={styles.actionPillTitle}>Favoris</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.actionPillCard}
              activeOpacity={0.8}
            >
              <Text style={styles.actionPillEmoji}>⚙️</Text>
              <Text style={styles.actionPillTitle}>Paramètres & Thème ({theme.name.split(' ')[0]})</Text>
            </TouchableOpacity>
          </View>

          {/* ─── Statut Pioche & Reset ─────────────────────────────────── */}
          <View style={styles.statsCard}>
            <View style={styles.statsHeaderRow}>
              <View style={styles.statsHeaderLeft}>
                <Text style={styles.statsIcon}>🎴</Text>
                <Text style={styles.statsTitle}>État de la Pioche</Text>
              </View>
              <Text style={[styles.statsRatio, { color: theme.colors.accentLight }]}>
                {seenCount} / {questions.length} cartes vues ({seenPercentage}%)
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
                <Text style={styles.resetBtnText}>🔄 Remettre la pioche à zéro</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.freshDeckText}>✨ Toutes les questions sont disponibles dans la pioche.</Text>
            )}
          </View>
        </Animated.View>

        {/* Modal de confirmation : Repartir de 0 */}
        <Modal
          visible={showResetModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowResetModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalEmoji}>🔄</Text>
              <Text style={styles.modalTitle}>Repartir de 0 ?</Text>
              <Text style={styles.modalMessage}>
                {seenCount > 0
                  ? `Tu as déjà joué ${seenCount} question${seenCount > 1 ? 's' : ''} sur ${questions.length}.\n\nEn réinitialisant, toutes les cartes redeviendront piochables immédiatement.`
                  : `Toutes les questions sont déjà disponibles.\n\nVeux-tu réinitialiser quand même ?`}
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={handleConfirmReset}
                  style={[styles.modalActionBtn, { backgroundColor: colors.danger }]}
                >
                  <Text style={styles.modalActionBtnText}>Oui, remettre à 0</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowResetModal(false)}
                  style={[styles.modalActionBtn, styles.modalCancelBtn]}
                >
                  <Text style={[styles.modalActionBtnText, { color: colors.textSecondary }]}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  badgePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
    elevation: 8,
    marginBottom: 4,
  },
  logoEmoji: {
    fontSize: 40,
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
    lineHeight: typography.sizes.sm * 1.45,
    maxWidth: 340,
  },
  startMainCard: {
    borderRadius: radii.xxl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.lg,
    elevation: 8,
  },
  startCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  startCardIcon: {
    fontSize: 32,
  },
  startCardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  startCardSubtitle: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  startCardArrow: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
  },
  sectionHeaderWrap: {
    marginTop: spacing.xs,
    marginBottom: -spacing.xs,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridCard: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
    gap: 4,
    ...shadows.sm,
  },
  gridCardEmoji: {
    fontSize: 26,
    marginBottom: 2,
  },
  gridCardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  gridCardDesc: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  actionPillCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  actionPillEmoji: {
    fontSize: 20,
  },
  actionPillTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  statsCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsIcon: {
    fontSize: 16,
  },
  statsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statsRatio: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceBorder,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  resetBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  resetBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  freshDeckText: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  toastContainer: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    zIndex: 999,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.success,
    borderWidth: 1.5,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.lg,
  },
  toastText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xxl,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.lg,
  },
  modalEmoji: {
    fontSize: 48,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * 1.5,
  },
  modalActions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalActionBtn: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  modalActionBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
});
