// app/index.tsx
// Écran d'accueil — premier écran vu par l'utilisateur

import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import { useGame } from '../context/GameContext';
import { questions } from '../data/questions';

export default function HomeScreen() {
  const { state, resetSeenQuestions } = useGame();
  const seenCount = state.seenQuestionIds.length;

  const [showResetModal, setShowResetModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animation d'entrée
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
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

  return (
    <ScreenContainer>
      {/* Toast de confirmation */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Zone du haut : logo et accroche */}
      <Animated.View
        style={[
          styles.hero,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Emblème */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>💬</Text>
        </View>

        {/* Nom de l'app */}
        <Text style={styles.title}>Dit-Paulo ?</Text>

        {/* Accroche */}
        <Text style={styles.tagline}>
          Les meilleures conversations{'\n'}commencent parfois par une question.
        </Text>
      </Animated.View>

      {/* Zone du bas : actions */}
      <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
        {/* CTA principal */}
        <PrimaryButton
          label="COMMENCER"
          onPress={() => router.push('/setup/mode')}
          accessibilityLabel="Commencer une nouvelle partie"
          style={styles.mainButton}
        />

        {/* Actions secondaires */}
        <View style={styles.secondaryActions}>
          <PrimaryButton
            label="❤️  Favoris"
            onPress={() => router.push('/favorites')}
            variant="secondary"
            style={styles.secondaryButton}
            accessibilityLabel="Voir mes questions favorites"
          />
          <PrimaryButton
            label="⚙️  Paramètres"
            onPress={() => router.push('/settings')}
            variant="secondary"
            style={styles.secondaryButton}
            accessibilityLabel="Ouvrir les paramètres"
          />
        </View>

        {/* Bouton Galerie complète des cartes */}
        <PrimaryButton
          label={`🃏  Galerie des Cartes (${questions.length})`}
          onPress={() => router.push('/cards')}
          variant="secondary"
          style={styles.mainButton}
          accessibilityLabel="Explorer toutes les cartes du jeu en grille"
        />

        {/* Bouton Liste des questions par catégorie */}
        <PrimaryButton
          label="📋  Liste des Questions"
          onPress={() => router.push('/questions-list')}
          variant="secondary"
          style={styles.mainButton}
          accessibilityLabel="Voir toutes les questions listées par catégorie"
        />

        {/* Bouton Repartir de 0 (réinitialisation de la pioche) */}
        <PrimaryButton
          label={seenCount > 0 ? `🔄  Repartir de 0 (${seenCount} vue${seenCount > 1 ? 's' : ''})` : '🔄  Repartir de 0'}
          onPress={() => setShowResetModal(true)}
          variant="secondary"
          style={seenCount > 0 ? { ...styles.mainButton, ...styles.resetButtonActive } : styles.mainButton}
          accessibilityLabel="Remettre à zéro l'historique des questions déjà tirées"
        />
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
                ? `Tu as déjà joué ${seenCount} question${seenCount > 1 ? 's' : ''} sur ${questions.length}.\n\nEn remettant à zéro, toutes les questions redeviendront piochables comme au premier jour.`
                : `Toutes les questions sont déjà disponibles dans la pioche.\n\nVeux-tu réinitialiser quand même ?`}
            </Text>

            <View style={styles.modalActions}>
              <PrimaryButton
                label="Oui, remettre à 0"
                onPress={handleConfirmReset}
                variant="primary"
                style={{ ...styles.modalBtn, backgroundColor: colors.danger, borderColor: colors.danger }}
              />
              <PrimaryButton
                label="Annuler"
                onPress={() => setShowResetModal(false)}
                variant="secondary"
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    paddingHorizontal: spacing.xl,
  },
  actions: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  mainButton: {
    width: '100%',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
  },
  resetButtonActive: {
    borderColor: 'rgba(255, 69, 58, 0.4)',
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
  },
  toastContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    zIndex: 999,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.success,
    borderWidth: 1.5,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.md,
  },
  toastText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
  modalBtn: {
    width: '100%',
  },
});
