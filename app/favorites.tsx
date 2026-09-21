// app/favorites.tsx
// Écran d'affichage des questions mises en favoris

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, radii, spacing, typography } from '../constants/theme';
import { favoritesService } from '../services/favoritesService';
import { questionEngine } from '../services/questionEngine';
import type { Question } from '../types/question';

export default function FavoritesScreen() {
  const [favoriteQuestions, setFavoriteQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    setLoading(true);
    const ids = await favoritesService.getFavoriteIds();
    const list = ids
      .map((id) => questionEngine.getQuestionById(id))
      .filter((q): q is Question => q !== undefined);
    setFavoriteQuestions(list);
    setLoading(false);
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemoveFavorite = async (id: string) => {
    await favoritesService.removeFavorite(id);
    setFavoriteQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <ScreenContainer noPadding>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Retour à l'accueil"
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Mes favoris ❤️</Text>
        <Text style={styles.subtitle}>
          {favoriteQuestions.length} question(s) enregistrée(s)
        </Text>
      </View>

      {/* Liste des favoris */}
      {!loading && favoriteQuestions.length > 0 ? (
        <FlatList
          data={favoriteQuestions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.questionText}>{item.text}</Text>

              <TouchableOpacity
                onPress={() => handleRemoveFavorite(item.id)}
                style={styles.removeButton}
                accessibilityLabel="Retirer des favoris"
              >
                <Text style={styles.removeText}>Retirer 💔</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>❤️</Text>
          <Text style={styles.emptyTitle}>Aucun favori pour l'instant</Text>
          <Text style={styles.emptySubtitle}>
            Pendant une partie, touche l'icône ❤️ sur une question pour l'enregistrer ici.
          </Text>
          <PrimaryButton
            label="Lancer une partie 🚀"
            onPress={() => router.push('/setup/categories')}
            style={{ width: '100%', marginBottom: spacing.sm }}
          />
          <PrimaryButton
            label="Explorer la galerie de cartes 🃏"
            variant="secondary"
            onPress={() => router.push('/cards')}
            style={{ width: '100%' }}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    fontWeight: typography.weights.medium,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    gap: spacing.md,
  },
  questionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
  },
  removeButton: {
    alignSelf: 'flex-end',
  },
  removeText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    fontWeight: typography.weights.semibold,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
    marginBottom: spacing.md,
  },
});
