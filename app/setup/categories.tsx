// app/setup/categories.tsx
// Sélection libre des catégories de questions et option du système de points

import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors, radii, shadows, spacing, typography } from '../../constants/theme';
import { useGame } from '../../context/GameContext';
import { questions } from '../../data/questions';
import { questionEngine } from '../../services/questionEngine';
import {
  CATEGORY_CONFIGS,
  CATEGORY_PRESETS,
  type CategoryPreset,
  type QuestionCategory,
} from '../../types/game';

export default function SetupCategoriesScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 768;

  const { state, setSelectedCategories, toggleCategory, setPointsEnabled } = useGame();

  // Nombre de colonnes pour la grille de catégories
  const numColumns = isDesktop ? 3 : 2;

  // Compter le nombre de questions actives par catégorie (hors cartes rejetées dans le tri Tinder)
  const excludedIds = questionEngine.getExcludedIds();
  const activeQuestionsCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach((q) => {
      if (!excludedIds.includes(q.id)) {
        counts[q.category] = (counts[q.category] || 0) + 1;
      }
    });
    return counts;
  }, [excludedIds]);

  // Nombre total de cartes éligibles avec la sélection actuelle
  const totalSelectedQuestionsCount = useMemo(() => {
    return questions.filter(
      (q) => state.selectedCategories.includes(q.category) && !excludedIds.includes(q.id)
    ).length;
  }, [state.selectedCategories, excludedIds]);

  // Appliquer un préréglage d'ambiance
  const handleApplyPreset = (preset: CategoryPreset) => {
    setSelectedCategories(preset.categories);
  };

  const handleNext = () => {
    if (state.selectedCategories.length === 0) return;
    router.push('/setup/players');
  };

  const allCategories = Object.keys(CATEGORY_CONFIGS) as QuestionCategory[];

  return (
    <ScreenContainer noPadding>
      {/* En-tête fixe */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Retour à l'accueil"
        >
          <Text style={styles.backButtonText}>← Accueil</Text>
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>Choisis tes Thèmes 🗂️</Text>
          <Text style={styles.subtitle}>Coche les catégories que tu veux pour cette partie</Text>
        </View>

        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Préréglages d'ambiance en 1 clic */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚡ AMBIANCES PRÊTES À L'EMPLOI</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsScroll}
        >
          {CATEGORY_PRESETS.map((preset) => {
            const isFullyActive =
              preset.categories.length === state.selectedCategories.length &&
              preset.categories.every((c) => state.selectedCategories.includes(c));

            return (
              <TouchableOpacity
                key={preset.id}
                style={[styles.presetCard, isFullyActive && styles.presetCardActive]}
                onPress={() => handleApplyPreset(preset)}
                activeOpacity={0.8}
              >
                <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                <Text style={[styles.presetLabel, isFullyActive && styles.presetLabelActive]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Option du Système de Points */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏆 RÈGLE DU JEU & POINTS</Text>
        </View>

        <View style={styles.pointsOptionCard}>
          <View style={styles.pointsOptionTextWrap}>
            <View style={styles.pointsTitleRow}>
              <Text style={styles.pointsOptionTitle}>Compter les points (+1 Pt)</Text>
              <View style={[styles.modeBadge, { backgroundColor: state.pointsEnabled ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.06)' }]}>
                <Text style={[styles.modeBadgeText, { color: state.pointsEnabled ? '#FFD700' : colors.textSecondary }]}>
                  {state.pointsEnabled ? 'Mode Compétition 🥇' : 'Mode Chill ☕'}
                </Text>
              </View>
            </View>
            <Text style={styles.pointsOptionDescription}>
              {state.pointsEnabled
                ? 'Le groupe vote après chaque question pour valider (+1 Pt) ou pénaliser la langue de bois. Podium final en fin de partie !'
                : 'Pas de décompte de points. Les questions s\'enchaînent librement pour discuter sans pression.'}
            </Text>
          </View>

          <Switch
            value={state.pointsEnabled}
            onValueChange={setPointsEnabled}
            trackColor={{ false: colors.surfaceBorder, true: colors.accent }}
            thumbColor={colors.textPrimary}
          />
        </View>

        {/* Liste des Catégories en Grille */}
        <View style={styles.sectionHeader}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>
              🃏 CATÉGORIES ({state.selectedCategories.length} / {allCategories.length})
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (state.selectedCategories.length === allCategories.length) {
                  setSelectedCategories(['fun']);
                } else {
                  setSelectedCategories(allCategories);
                }
              }}
            >
              <Text style={styles.toggleAllText}>
                {state.selectedCategories.length === allCategories.length ? 'Désélectionner' : 'Tout cocher'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.categoriesGrid}>
          {allCategories.map((catId) => {
            const config = CATEGORY_CONFIGS[catId];
            const isSelected = state.selectedCategories.includes(catId);
            const cardCount = activeQuestionsCountByCategory[catId] || 0;

            return (
              <TouchableOpacity
                key={catId}
                style={[
                  styles.categoryCard,
                  { width: isDesktop ? '31.8%' : '48%' },
                  isSelected && {
                    borderColor: config.color,
                    backgroundColor: 'rgba(22, 22, 26, 0.95)',
                    shadowColor: config.color,
                    shadowOpacity: 0.35,
                  },
                ]}
                onPress={() => toggleCategory(catId)}
                activeOpacity={0.75}
              >
                {/* Indicateur de coche */}
                <View
                  style={[
                    styles.checkBadge,
                    isSelected && { backgroundColor: config.color, borderColor: config.color },
                  ]}
                >
                  <Text style={styles.checkText}>{isSelected ? '✓' : ''}</Text>
                </View>

                {/* Emoji & Nombre de cartes */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.categoryEmoji}>{config.emoji}</Text>
                  <View style={[styles.countPill, { backgroundColor: isSelected ? config.badgeBg : 'rgba(255, 255, 255, 0.05)' }]}>
                    <Text style={[styles.countPillText, isSelected && { color: config.color }]}>
                      {cardCount} cartes
                    </Text>
                  </View>
                </View>

                {/* Titre & Description */}
                <Text style={[styles.categoryLabel, isSelected && { color: colors.textPrimary }]}>
                  {config.label}
                </Text>
                <Text style={styles.categoryDescription} numberOfLines={2}>
                  {config.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Barre d'action fixe inférieure */}
      <View style={styles.footer}>
        <View style={styles.footerStats}>
          <Text style={styles.footerStatsCount}>
            {totalSelectedQuestionsCount} questions sélectionnées
          </Text>
          <Text style={styles.footerStatsSub}>
            sur {state.selectedCategories.length} thème{state.selectedCategories.length > 1 ? 's' : ''}
          </Text>
        </View>

        <PrimaryButton
          label="CONTINUER (Joueurs) ➔"
          onPress={handleNext}
          disabled={state.selectedCategories.length === 0}
          accessibilityLabel="Passer à la sélection des joueurs"
          style={styles.continueBtn}
        />
      </View>
    </ScreenContainer>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  backButtonText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  titleWrap: {
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleAllText: {
    fontSize: typography.sizes.xs,
    color: colors.accentLight,
    fontWeight: typography.weights.semibold,
  },
  presetsScroll: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 8,
  },
  presetCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  presetEmoji: {
    fontSize: 16,
  },
  presetLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  presetLabelActive: {
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
  },
  pointsOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    gap: spacing.md,
  },
  pointsOptionTextWrap: {
    flex: 1,
  },
  pointsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pointsOptionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  pointsOptionDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    position: 'relative',
    gap: 6,
    ...shadows.sm,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  countPillText: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  categoryLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryDescription: {
    fontSize: 10,
    color: colors.textTertiary,
    lineHeight: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13, 13, 15, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  footerStats: {
    flex: 1,
  },
  footerStatsCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  footerStatsSub: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  continueBtn: {
    flex: 1,
    maxWidth: 240,
  },
});
