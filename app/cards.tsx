// app/cards.tsx
// Galerie complète des cartes du jeu en grille responsive par Catégorie

import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import { questions } from '../data/questions';
import { CATEGORY_CONFIGS, type QuestionCategory } from '../types/game';
import type { Question } from '../types/question';

export default function CardsGalleryScreen() {
  const { width: windowWidth } = useWindowDimensions();

  // Calculer le nombre de colonnes dynamique
  const numColumns = useMemo(() => {
    if (windowWidth >= 1300) return 5;
    if (windowWidth >= 960) return 4;
    if (windowWidth >= 640) return 3;
    return 2;
  }, [windowWidth]);

  // Filtres
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allCategories = Object.keys(CATEGORY_CONFIGS) as QuestionCategory[];

  // Cartes filtrées
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Filtre catégorie
      if (selectedCategory !== 'all' && q.category !== selectedCategory) {
        return false;
      }
      // Filtre recherche textuelle
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const textMatch = q.text.toLowerCase().includes(query);
        const catConfig = CATEGORY_CONFIGS[q.category];
        const categoryMatch = (catConfig?.label ?? q.category).toLowerCase().includes(query);
        return textMatch || categoryMatch || q.id.toLowerCase().includes(query);
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const renderCardItem = ({ item }: { item: Question }) => {
    const catConfig = CATEGORY_CONFIGS[item.category] || CATEGORY_CONFIGS.fun;

    return (
      <View style={[styles.cardContainer, { width: `${100 / numColumns}%` as any }]}>
        <View style={[styles.miniCard, { borderColor: catConfig.color }]}>
          {/* Motifs filigranes */}
          <Text style={[styles.cornerMotif, styles.topLeft]}>♠ ♥</Text>
          <Text style={[styles.cornerMotif, styles.topRight]}>♦ ♣</Text>

          {/* Badges d'en-tête */}
          <View style={styles.badgeRow}>
            <View style={[styles.categoryBadge, { borderColor: catConfig.color, backgroundColor: catConfig.badgeBg }]}>
              <Text style={[styles.categoryBadgeText, { color: catConfig.color }]}>
                {catConfig.emoji} {catConfig.label}
              </Text>
            </View>
            <Text style={styles.idBadge}>#{item.id}</Text>
          </View>

          {/* Corps de la question */}
          <Text style={styles.questionSnippet} numberOfLines={6}>
            {item.text}
          </Text>

          {/* Pied de mini carte */}
          <View style={styles.cardFooter}>
            <Text style={styles.categorySubtext}>
              {catConfig.label}
            </Text>
            <Text style={styles.playersBadge}>
              👥 {item.minPlayers}+
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer noPadding>
      {/* Grille des cartes avec En-tête défilant */}
      <FlatList
        key={`grid-${numColumns}`}
        data={filteredQuestions}
        keyExtractor={(item) => item.id}
        renderItem={renderCardItem}
        numColumns={numColumns}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                accessibilityLabel="Retour à l'écran précédent"
              >
                <Text style={styles.backText}>← Retour</Text>
              </TouchableOpacity>

              <Text style={styles.countBadge}>
                {filteredQuestions.length} / {questions.length} cartes
              </Text>
            </View>

            <Text style={styles.title}>Galerie des Cartes 🃏</Text>
            <Text style={styles.subtitle}>
              Explorez les {questions.length} cartes du jeu classées par thématique ou recherchez par mot-clé.
            </Text>

            {/* Champ de recherche */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher une question ou un thème..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filtre par Catégorie */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                onPress={() => setSelectedCategory('all')}
                style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, selectedCategory === 'all' && styles.filterChipTextActive]}>
                  Toutes ({questions.length})
                </Text>
              </TouchableOpacity>

              {allCategories.map((catId) => {
                const config = CATEGORY_CONFIGS[catId];
                const isActive = selectedCategory === catId;
                const catCount = questions.filter((q) => q.category === catId).length;

                return (
                  <TouchableOpacity
                    key={catId}
                    onPress={() => setSelectedCategory(catId)}
                    style={[
                      styles.filterChip,
                      isActive && {
                        borderColor: config.color,
                        backgroundColor: config.badgeBg,
                      },
                    ]}
                  >
                    <Text style={[styles.filterChipText, isActive && { color: config.color, fontWeight: '700' }]}>
                      {config.emoji} {config.label} ({catCount})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  backText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  countBadge: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * 1.4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    paddingVertical: 8,
  },
  clearSearch: {
    color: colors.textTertiary,
    fontSize: 14,
    padding: spacing.xs,
  },
  filterScroll: {
    flexDirection: 'row',
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    marginVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: spacing.xs,
  },
  filterChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  filterChipTextActive: {
    color: colors.accentLight,
    fontWeight: typography.weights.bold,
  },
  cardContainer: {
    padding: spacing.xs,
  },
  miniCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    minHeight: 170,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.sm,
  },
  cornerMotif: {
    position: 'absolute',
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.1)',
  },
  topLeft: { top: 6, left: 8 },
  topRight: { top: 6, right: 8 },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  idBadge: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: 'monospace',
  },
  questionSnippet: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    fontWeight: typography.weights.medium,
    marginVertical: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: spacing.xs,
  },
  categorySubtext: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  playersBadge: {
    fontSize: 10,
    color: colors.textTertiary,
  },
});
