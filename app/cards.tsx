// app/cards.tsx
// Galerie complète des 539 cartes du jeu en grille responsive (4 à 5 colonnes sur grand écran)

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
import { INTENSITY_CONFIGS, INTENSITY_POINTS, MODE_CONFIGS, type GameMode, type IntensityLevel } from '../types/game';
import type { Question } from '../types/question';

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

export default function CardsGalleryScreen() {
  const { width: windowWidth } = useWindowDimensions();

  // Calculer le nombre de colonnes dynamique (5 sur très grand écran, 4 sur desktop, 3 sur tablette, 2 sur mobile)
  const numColumns = useMemo(() => {
    if (windowWidth >= 1300) return 5;
    if (windowWidth >= 960) return 4;
    if (windowWidth >= 640) return 3;
    return 2;
  }, [windowWidth]);

  // Filtres
  const [selectedMode, setSelectedMode] = useState<GameMode | 'all'>('all');
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cartes filtrées
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Filtre mode
      if (selectedMode !== 'all' && !q.modes.includes(selectedMode)) {
        return false;
      }
      // Filtre intensité
      if (selectedIntensity !== 'all' && q.intensity !== selectedIntensity) {
        return false;
      }
      // Filtre recherche textuelle
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const textMatch = q.text.toLowerCase().includes(query);
        const categoryMatch = (CATEGORY_LABELS[q.category] ?? q.category).toLowerCase().includes(query);
        return textMatch || categoryMatch;
      }
      return true;
    });
  }, [selectedMode, selectedIntensity, searchQuery]);

  const renderCardItem = ({ item }: { item: Question }) => {
    const isGoldCard = item.intensity === 6;
    const intensityConfig = INTENSITY_CONFIGS[item.intensity as IntensityLevel];
    const modeColor = item.modes[0] && colors.modes[item.modes[0]] ? colors.modes[item.modes[0]] : colors.modes.deep;

    return (
      <View
        style={[
          styles.cardContainer,
          { width: `${100 / numColumns}%` as any },
        ]}
      >
        <View
          style={[
            styles.miniCard,
            isGoldCard && styles.goldMiniCard,
            { borderColor: isGoldCard ? '#B38F00' : modeColor.primary },
          ]}
        >
          {/* Motifs filigranes */}
          <Text style={[styles.cornerMotif, styles.topLeft, isGoldCard && styles.goldMotif]}>♠ ♥</Text>
          <Text style={[styles.cornerMotif, styles.topRight, isGoldCard && styles.goldMotif]}>♦ ♣</Text>

          {/* Badges d'en-tête */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, isGoldCard ? styles.goldBadge : { borderColor: modeColor.primary }]}>
              <Text style={[styles.badgeText, isGoldCard ? styles.goldBadgeText : { color: modeColor.primary }]}>
                {CATEGORY_LABELS[item.category] ?? item.category}
              </Text>
            </View>
            {intensityConfig && (
              <View style={[styles.badge, styles.intensityBadge, isGoldCard && styles.goldBadge]}>
                <Text style={[styles.badgeText, isGoldCard && styles.goldBadgeText]}>
                  {intensityConfig.emoji} N.{item.intensity}
                </Text>
              </View>
            )}
          </View>

          {/* Texte de la question */}
          <Text
            style={[
              styles.questionText,
              isGoldCard && styles.goldQuestionText,
            ]}
            numberOfLines={6}
          >
            {item.text}
          </Text>

          {/* Pied de mini carte */}
          <View style={[styles.cardFooter, isGoldCard && styles.goldCardFooter]}>
            <Text style={[styles.modesLabel, isGoldCard && styles.goldModesLabel]}>
              {item.modes.map((m) => MODE_CONFIGS[m]?.emoji ?? m).join(' ')}
            </Text>
            <Text style={[styles.pointsBadge, isGoldCard && styles.goldPointsBadge]}>
              {(() => {
                const pts = INTENSITY_POINTS[item.intensity as IntensityLevel] ?? item.intensity;
                return `⭐ +${pts} Pt${pts > 1 ? 's' : ''}`;
              })()}
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
              Explorez l'ensemble des {questions.length} cartes du jeu par mode, intensité ou mot-clé.
            </Text>

            {/* Champ de recherche */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher une question ou mot-clé..."
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

            {/* Filtre par Mode */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                onPress={() => setSelectedMode('all')}
                style={[styles.filterChip, selectedMode === 'all' && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, selectedMode === 'all' && styles.filterChipTextActive]}>
                  Tous les modes
                </Text>
              </TouchableOpacity>
              {(Object.keys(MODE_CONFIGS) as GameMode[]).map((modeId) => {
                const config = MODE_CONFIGS[modeId];
                const isActive = selectedMode === modeId;
                return (
                  <TouchableOpacity
                    key={modeId}
                    onPress={() => setSelectedMode(modeId)}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {config.emoji} {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Filtre par Intensité */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                onPress={() => setSelectedIntensity('all')}
                style={[styles.filterChip, selectedIntensity === 'all' && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, selectedIntensity === 'all' && styles.filterChipTextActive]}>
                  Toutes intensités
                </Text>
              </TouchableOpacity>

              {([1, 2, 3, 4, 5, 6] as IntensityLevel[]).map((lvl) => {
                const config = INTENSITY_CONFIGS[lvl];
                const isActive = selectedIntensity === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    onPress={() => setSelectedIntensity(lvl)}
                    style={[
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                      lvl === 6 && styles.goldFilterChip,
                    ]}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive, lvl === 6 && styles.goldFilterChipText]}>
                      {config.emoji} Niv.{lvl}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>Aucune carte trouvée</Text>
            <Text style={styles.emptySubtitle}>
              Essayez de modifier vos filtres ou votre recherche textuelle.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  backButton: {
    paddingVertical: spacing.xs,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    fontWeight: typography.weights.medium,
  },
  countBadge: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    fontWeight: typography.weights.bold,
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  searchIcon: {
    fontSize: typography.sizes.md,
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
  },
  clearSearch: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    padding: spacing.xs,
  },
  filterScroll: {
    marginVertical: 2,
  },
  filterChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  goldFilterChip: {
    borderColor: '#FFD700',
  },
  goldFilterChipText: {
    color: '#FFD700',
    fontWeight: typography.weights.bold,
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  filterChipTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
  },
  gridContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  cardContainer: {
    padding: spacing.xs,
  },
  miniCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    padding: spacing.md,
    height: 220,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.sm,
  },
  goldMiniCard: {
    backgroundColor: '#FFD700',
    borderColor: '#B38F00',
  },
  cornerMotif: {
    position: 'absolute',
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.08)',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  goldMotif: {
    color: 'rgba(0, 0, 0, 0.25)',
  },
  topLeft: {
    top: 6,
    left: 8,
  },
  topRight: {
    top: 6,
    right: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
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
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  questionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    lineHeight: typography.sizes.sm * 1.35,
    marginVertical: spacing.xs,
  },
  goldQuestionText: {
    color: '#0B0C10',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: spacing.xs,
  },
  goldCardFooter: {
    borderTopColor: 'rgba(0, 0, 0, 0.2)',
  },
  modesLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  goldModesLabel: {
    color: 'rgba(0, 0, 0, 0.7)',
  },
  pointsBadge: {
    fontSize: 11,
    fontWeight: typography.weights.heavy,
    color: '#FFD60A',
  },
  goldPointsBadge: {
    color: '#000000',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
});
