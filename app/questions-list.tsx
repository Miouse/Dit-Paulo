// app/questions-list.tsx
// Liste complète de toutes les questions, triées par catégorie — vue admin / debug

import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '../constants/theme';
import { questions } from '../data/questions';
import { INTENSITY_CONFIGS, MODE_CONFIGS, type GameMode, type IntensityLevel } from '../types/game';
import type { QuestionCategory } from '../types/question';

// Hauteur du header fixe (titre + retour)
const HEADER_HEIGHT = 72;

// ─── Labels & meta par catégorie ──────────────────────────────────────────────
const CATEGORY_META: Record<QuestionCategory, { label: string; emoji: string; color: string }> = {
  fun:           { label: 'Fun',           emoji: '🥳', color: '#FF8C42' },
  future:        { label: 'Avenir',        emoji: '🔮', color: '#AF52DE' },
  personality:   { label: 'Personnalité',  emoji: '👤', color: '#30D158' },
  relationships: { label: 'Relations',     emoji: '🤝', color: '#FF6B9D' },
  hypothetical:  { label: 'Dilemme',       emoji: '🌀', color: '#64D2FF' },
  debate:        { label: 'Débat',         emoji: '⚖️',  color: '#FFD60A' },
  memories:      { label: 'Souvenirs',     emoji: '📜', color: '#FF9F0A' },
  dreams:        { label: 'Rêves',         emoji: '🌟', color: '#BF5AF2' },
  flirt:         { label: 'Flirt',         emoji: '😏', color: '#FF2D55' },
  lifestyle:     { label: 'Mode de vie',   emoji: '🌿', color: '#34C759' },
  gossip:        { label: 'Potin Extrême', emoji: '🔥', color: '#FF3B30' },
  philosophy:    { label: 'Philosophie',   emoji: '🧠', color: '#7B61FF' },
  hot:           { label: 'Hot',           emoji: '🌶️', color: '#FF2D55' },
};

const INTENSITY_COLORS: Record<number, string> = {
  1: '#48cae4',
  2: '#90be6d',
  3: '#f9c74f',
  4: '#f8961e',
  5: '#f3722c',
  6: '#FFD700',
};

// ─── Ordre des catégories ──────────────────────────────────────────────────────
const CATEGORY_ORDER: QuestionCategory[] = [
  'fun', 'lifestyle', 'flirt', 'relationships', 'personality', 'memories',
  'future', 'dreams', 'hypothetical', 'debate', 'philosophy', 'hot', 'gossip',
];

// ─── Composant ligne question ──────────────────────────────────────────────────
type QuestionRowProps = {
  index: number;
  id: string;
  text: string;
  intensity: number;
  modes: string[];
};

const QuestionRow = React.memo(({ index, id, text, intensity, modes }: QuestionRowProps) => {
  const intensityColor = INTENSITY_COLORS[intensity] ?? '#888';
  const isGold = intensity === 6;

  return (
    <View style={[styles.row, isGold && styles.rowGold]}>
      {/* Numéro */}
      <Text style={styles.rowIndex}>{index}</Text>

      {/* Badge intensité */}
      <View style={[styles.intensityBadge, { backgroundColor: intensityColor + '22', borderColor: intensityColor + '55' }]}>
        <Text style={[styles.intensityText, { color: intensityColor }]}>
          {INTENSITY_CONFIGS[intensity as IntensityLevel]?.emoji ?? '?'} {intensity}
        </Text>
      </View>

      {/* Texte question */}
      <Text style={[styles.questionText, isGold && styles.questionTextGold]} numberOfLines={3}>
        {text}
      </Text>

      {/* Modes */}
      <View style={styles.modesRow}>
        {modes.slice(0, 3).map((m) => {
          const modeColor = (colors.modes as Record<string, { primary: string }>)[m]?.primary ?? '#888';
          return (
            <View key={m} style={[styles.modePill, { backgroundColor: modeColor + '22' }]}>
              <Text style={[styles.modePillText, { color: modeColor }]}>
                {MODE_CONFIGS[m as GameMode]?.emoji ?? m}
              </Text>
            </View>
          );
        })}
        {modes.length > 3 && (
          <Text style={styles.moreModesText}>+{modes.length - 3}</Text>
        )}
      </View>

      {/* ID */}
      <Text style={styles.idText}>{id}</Text>
    </View>
  );
});

// ─── En-tête de section catégorie ─────────────────────────────────────────────
type SectionHeaderProps = {
  category: QuestionCategory;
  count: number;
  isCollapsed: boolean;
  onToggle: () => void;
};

const SectionHeader = ({ category, count, isCollapsed, onToggle }: SectionHeaderProps) => {
  const meta = CATEGORY_META[category] ?? { label: category, emoji: '💬', color: colors.accent };
  return (
    <TouchableOpacity
      style={[styles.sectionHeader, { borderLeftColor: meta.color }]}
      onPress={onToggle}
      activeOpacity={0.75}
    >
      <Text style={styles.sectionEmoji}>{meta.emoji}</Text>
      <View style={styles.sectionLabelWrap}>
        <Text style={[styles.sectionLabel, { color: meta.color }]}>{meta.label}</Text>
        <Text style={styles.sectionCount}>{count} question{count > 1 ? 's' : ''}</Text>
      </View>
      <Text style={[styles.chevron, { color: meta.color }]}>{isCollapsed ? '▶' : '▼'}</Text>
    </TouchableOpacity>
  );
};

// ─── Écran principal ───────────────────────────────────────────────────────────
export default function QuestionsListScreen() {
  const [search, setSearch] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode | 'all'>('all');
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel | 'all'>('all');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // ── Hide-on-scroll ──
  const headerAnim = useRef(new Animated.Value(0)).current; // 0 = visible, -HEADER_HEIGHT = caché
  const lastScrollY = useRef(0);
  const isHeaderVisible = useRef(true);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = e.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      // Scroll vers le bas ET assez loin du haut → cacher
      if (diff > 4 && currentY > HEADER_HEIGHT && isHeaderVisible.current) {
        isHeaderVisible.current = false;
        Animated.timing(headerAnim, {
          toValue: -HEADER_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
      // Scroll vers le haut → montrer
      else if (diff < -4 && !isHeaderVisible.current) {
        isHeaderVisible.current = true;
        Animated.timing(headerAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
    [headerAnim]
  );

  const toggleCollapse = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // ── Filtrage ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return questions.filter((item) => {
      if (selectedMode !== 'all' && !item.modes.includes(selectedMode)) return false;
      if (selectedIntensity !== 'all' && item.intensity !== selectedIntensity) return false;
      if (q.length > 0) {
        const match =
          item.text.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          CATEGORY_META[item.category]?.label.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [search, selectedMode, selectedIntensity]);

  // ── Groupement par catégorie ──
  const sections = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const q of filtered) {
      if (!groups[q.category]) groups[q.category] = [];
      groups[q.category].push(q);
    }

    return CATEGORY_ORDER
      .filter((cat) => groups[cat]?.length > 0)
      .map((cat) => ({
        category: cat as QuestionCategory,
        data: collapsed[cat] ? [] : (groups[cat] ?? []),
        totalCount: groups[cat]?.length ?? 0,
      }));
  }, [filtered, collapsed]);

  const totalVisible = filtered.length;

  // ── Contenu de l'en-tête de la liste (filtres + collapse) ──
  const ListHeader = useMemo(() => (
    <View>
      {/* Barre de recherche */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une question..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filtres mode */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedMode === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedMode('all')}
        >
          <Text style={[styles.filterChipText, selectedMode === 'all' && styles.filterChipTextActive]}>
            Tous les modes
          </Text>
        </TouchableOpacity>
        {Object.values(MODE_CONFIGS).map((m) => {
          const mColor = (colors.modes as Record<string, { primary: string }>)[m.id]?.primary ?? '#888';
          const active = selectedMode === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.filterChip,
                active && { borderColor: mColor, backgroundColor: mColor + '22' },
              ]}
              onPress={() => setSelectedMode(active ? 'all' : m.id)}
            >
              <Text style={[styles.filterChipText, active && { color: mColor }]}>
                {m.emoji} {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filtres intensité */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedIntensity === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedIntensity('all')}
        >
          <Text style={[styles.filterChipText, selectedIntensity === 'all' && styles.filterChipTextActive]}>
            Toutes intensités
          </Text>
        </TouchableOpacity>
        {([1, 2, 3, 4, 5, 6] as IntensityLevel[]).map((lvl) => {
          const cfg = INTENSITY_CONFIGS[lvl];
          const iColor = INTENSITY_COLORS[lvl];
          const active = selectedIntensity === lvl;
          return (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.filterChip,
                active && { borderColor: iColor, backgroundColor: iColor + '22' },
              ]}
              onPress={() => setSelectedIntensity(active ? 'all' : lvl)}
            >
              <Text style={[styles.filterChipText, active && { color: iColor }]}>
                {cfg.emoji} {cfg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Boutons collapse */}
      <View style={styles.collapseRow}>
        <TouchableOpacity
          style={styles.collapseBtn}
          onPress={() => {
            const all: Record<string, boolean> = {};
            CATEGORY_ORDER.forEach((c) => { all[c] = false; });
            setCollapsed(all);
          }}
        >
          <Text style={styles.collapseBtnText}>▼ Tout déplier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.collapseBtn}
          onPress={() => {
            const all: Record<string, boolean> = {};
            CATEGORY_ORDER.forEach((c) => { all[c] = true; });
            setCollapsed(all);
          }}
        >
          <Text style={styles.collapseBtnText}>▶ Tout plier</Text>
        </TouchableOpacity>
      </View>
    </View>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [search, selectedMode, selectedIntensity]);

  return (
    <View style={styles.container}>
      {/* ── Header animé hide-on-scroll ── */}
      <Animated.View
        style={[
          styles.header,
          { transform: [{ translateY: headerAnim }] },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>📋 Liste des questions</Text>
          <Text style={styles.headerSubtitle}>{totalVisible} / {questions.length} questions</Text>
        </View>
      </Animated.View>

      {/* ── Liste avec les filtres en ListHeaderComponent ── */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingTop: HEADER_HEIGHT }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={ListHeader}
        renderSectionHeader={({ section }) => (
          <SectionHeader
            category={section.category}
            count={section.totalCount}
            isCollapsed={!!collapsed[section.category]}
            onToggle={() => toggleCollapse(section.category)}
          />
        )}
        renderItem={({ item, index }) => (
          <QuestionRow
            index={index + 1}
            id={item.id}
            text={item.text}
            intensity={item.intensity}
            modes={item.modes}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>Aucune question trouvée</Text>
            <Text style={styles.emptyHint}>Essaie de modifier tes filtres</Text>
          </View>
        }
        renderSectionFooter={() => <View style={styles.sectionSeparator} />}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Header (position absolute pour slide hide-on-scroll)
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    gap: spacing.sm,
  },
  backBtn: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  backText: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },

  // ── Recherche
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    paddingVertical: spacing.sm,
    height: 42,
  },

  // ── Filtres
  filterScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceElevated,
    marginRight: spacing.xs,
  },
  filterChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  filterChipTextActive: {
    color: colors.accent,
  },

  // ── Boutons collapse
  collapseRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  collapseBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  collapseBtnText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },

  // ── Liste
  listContent: {
    paddingBottom: spacing.xxl,
  },

  // ── Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    gap: spacing.sm,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionLabelWrap: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  sectionCount: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: 1,
  },
  chevron: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  sectionSeparator: {
    height: spacing.sm,
    backgroundColor: colors.background,
  },

  // ── Ligne question
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder + '66',
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  rowGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.04)',
  },
  rowIndex: {
    color: colors.textTertiary,
    fontSize: 10,
    width: 24,
    textAlign: 'right',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  intensityBadge: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  intensityText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  questionText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.5,
  },
  questionTextGold: {
    color: '#FFD700',
  },
  modesRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 3,
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  modePill: {
    borderRadius: radii.full,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  modePillText: {
    fontSize: 11,
  },
  moreModesText: {
    color: colors.textTertiary,
    fontSize: 10,
    paddingTop: 3,
  },
  idText: {
    color: colors.textTertiary,
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 3,
    width: 64,
    textAlign: 'right',
  },

  // ── Vide
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
});
