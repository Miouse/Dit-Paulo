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
import { CATEGORY_CONFIGS, type QuestionCategory } from '../types/question';

// Hauteur du header fixe (titre + retour)
const HEADER_HEIGHT = 72;

// ─── Ordre des catégories ──────────────────────────────────────────────────────
const CATEGORY_ORDER: QuestionCategory[] = [
  'fun', 'lifestyle', 'flirt', 'situationship', 'relationships', 'personality', 'memories',
  'future', 'dreams', 'hypothetical', 'debate', 'philosophy', 'hot', 'gossip',
];

// ─── Composant ligne question ──────────────────────────────────────────────────
type QuestionRowProps = {
  index: number;
  id: string;
  text: string;
  category: QuestionCategory;
};

const QuestionRow = React.memo(({ index, id, text, category }: QuestionRowProps) => {
  const meta = CATEGORY_CONFIGS[category] ?? { label: category, emoji: '💬', color: colors.accent };

  return (
    <View style={styles.row}>
      {/* Numéro */}
      <Text style={styles.rowIndex}>{index}</Text>

      {/* Badge Catégorie */}
      <View style={[styles.categoryBadge, { backgroundColor: meta.badgeBg || meta.color + '22', borderColor: meta.color + '55' }]}>
        <Text style={[styles.categoryBadgeText, { color: meta.color }]}>
          {meta.emoji ? `${meta.emoji} ` : ''}{meta.label}
        </Text>
      </View>

      {/* Texte question */}
      <Text style={styles.questionText} numberOfLines={3}>
        {text}
      </Text>

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
  const meta = CATEGORY_CONFIGS[category] ?? { label: category, emoji: '💬', color: colors.accent };

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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<QuestionCategory | 'all'>('all');
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
      if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) return false;
      if (q.length > 0) {
        const match =
          item.text.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          CATEGORY_CONFIGS[item.category]?.label.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [search, selectedCategoryFilter]);

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
        category: cat,
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
          placeholder="Rechercher une question ou catégorie..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filtres Catégories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedCategoryFilter === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedCategoryFilter('all')}
        >
          <Text style={[styles.filterChipText, selectedCategoryFilter === 'all' && styles.filterChipTextActive]}>
            Toutes ({questions.length})
          </Text>
        </TouchableOpacity>
        {CATEGORY_ORDER.map((cat) => {
          const cfg = CATEGORY_CONFIGS[cat];
          const active = selectedCategoryFilter === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                active && { borderColor: cfg.color, backgroundColor: cfg.color + '22' },
              ]}
              onPress={() => setSelectedCategoryFilter(active ? 'all' : cat)}
            >
              <Text style={[styles.filterChipText, active && { color: cfg.color }]}>
                {cfg.emoji ? `${cfg.emoji} ` : ''}{cfg.label}
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
  ), [search, selectedCategoryFilter]);

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
        <TouchableOpacity
          onPress={() => router.push('/tinder-sort')}
          style={[styles.backBtn, { borderColor: '#FF2D55', backgroundColor: 'rgba(255, 45, 85, 0.15)' }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.backText, { color: '#FF6B9D' }]}>🔥 Tri Tinder</Text>
        </TouchableOpacity>
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
            category={item.category}
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
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
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
  rowIndex: {
    color: colors.textTertiary,
    fontSize: 10,
    width: 24,
    textAlign: 'right',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  questionText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.5,
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
