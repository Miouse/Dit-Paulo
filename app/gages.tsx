// app/gages.tsx
// Écran de consultation et de création des cartes gages pour le mode Patate Chaude

import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import type { Gage } from '../data/gages';
import { gagesService } from '../services/gagesService';

type FilterCategory = 'all' | 'custom' | 'defi' | 'smartphone' | 'verite' | 'soiree';

const CATEGORY_LABELS: Record<Gage['category'], { label: string; color: string; bg: string }> = {
  defi: { label: 'Défi & Rôle', color: '#FF9F0A', bg: 'rgba(255, 159, 10, 0.15)' },
  smartphone: { label: 'Smartphone', color: '#64D2FF', bg: 'rgba(100, 210, 255, 0.15)' },
  verite: { label: 'Vérité Cash', color: '#FF375F', bg: 'rgba(255, 55, 95, 0.15)' },
  soiree: { label: 'Ambiance Soirée', color: '#BF5AF2', bg: 'rgba(191, 90, 242, 0.15)' },
};

export default function GagesScreen() {
  const [allGages, setAllGages] = useState<Array<Gage & { isEnabled: boolean }>>([]);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Formulaire d'ajout
  const [showAddForm, setShowAddForm] = useState(false);
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<Gage['category']>('defi');
  const [formError, setFormError] = useState('');

  // Aperçu / Tirage au sort
  const [previewGage, setPreviewGage] = useState<Gage | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const loadGages = async () => {
    const list = await gagesService.getAllGagesWithStatus();
    setAllGages(list);
  };

  useEffect(() => {
    loadGages();
    const unsub = gagesService.subscribe(() => {
      loadGages();
    });
    return unsub;
  }, []);

  // Filtrage et recherche
  const filteredGages = useMemo(() => {
    return allGages.filter((gage) => {
      // Filtre catégorie / type
      if (activeFilter === 'custom' && !gage.isCustom) return false;
      if (activeFilter !== 'all' && activeFilter !== 'custom' && gage.category !== activeFilter) {
        return false;
      }
      // Filtre recherche textuelle
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return gage.text.toLowerCase().includes(query);
      }
      return true;
    });
  }, [allGages, activeFilter, searchQuery]);

  const activeCount = useMemo(() => allGages.filter((g) => g.isEnabled).length, [allGages]);
  const customCount = useMemo(() => allGages.filter((g) => g.isCustom).length, [allGages]);

  // Ajouter un gage personnalisé
  const handleAddGage = async () => {
    if (!newText.trim()) {
      setFormError('Veuillez saisir le texte du gage.');
      return;
    }
    setFormError('');
    await gagesService.addCustomGage(newText.trim(), newCategory);
    setNewText('');
    setShowAddForm(false);
  };

  // Supprimer un custom ou masquer un gage de base
  const handleToggleOrDelete = async (item: Gage & { isEnabled: boolean }) => {
    if (item.isCustom) {
      await gagesService.removeOrDisableGage(item.id);
    } else {
      if (item.isEnabled) {
        await gagesService.removeOrDisableGage(item.id);
      } else {
        await gagesService.reenableDefaultGage(item.id);
      }
    }
  };

  // Tirer un gage au sort en démo
  const handleDrawRandomGage = async () => {
    const drawn = await gagesService.getRandomGage();
    if (drawn) {
      setPreviewGage(drawn);
      setShowPreviewModal(true);
    }
  };

  return (
    <ScreenContainer noPadding>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Retour"
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Cartes Gages</Text>
        <Text style={styles.subtitle}>
          {activeCount} gages actifs ({customCount} créés par toi)
        </Text>
      </View>

      {/* Barre d'actions rapides */}
      <View style={styles.topActionsContainer}>
        <TouchableOpacity
          onPress={() => setShowAddForm(!showAddForm)}
          style={[styles.actionBtn, styles.addBtn]}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>
            {showAddForm ? '✕ Fermer le formulaire' : '+ Créer un gage'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDrawRandomGage}
          style={[styles.actionBtn, styles.drawBtn]}
          activeOpacity={0.8}
        >
          <Text style={styles.drawBtnText}>🎲 Tirer un gage au sort</Text>
        </TouchableOpacity>
      </View>

      {/* Formulaire d'ajout dépliable */}
      {showAddForm && (
        <View style={styles.addFormContainer}>
          <Text style={styles.formTitle}>Nouveau gage personnalisé</Text>

          <TextInput
            style={styles.input}
            placeholder="Ex : Fais une déclaration d'amour théâtrale à ton voisin de droite..."
            placeholderTextColor={colors.textTertiary}
            value={newText}
            onChangeText={(t) => {
              setNewText(t);
              if (formError) setFormError('');
            }}
            multiline
            numberOfLines={3}
          />

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          {/* Choix de catégorie */}
          <Text style={styles.fieldLabel}>Catégorie du gage :</Text>
          <View style={styles.categoryPickerRow}>
            {(['defi', 'smartphone', 'verite', 'soiree'] as Array<Gage['category']>).map((cat) => {
              const meta = CATEGORY_LABELS[cat];
              const isSelected = newCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setNewCategory(cat)}
                  style={[
                    styles.catChoiceBtn,
                    isSelected && { borderColor: meta.color, backgroundColor: meta.bg },
                  ]}
                >
                  <Text style={[styles.catChoiceText, isSelected && { color: meta.color }]}>
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.formButtonsRow}>
            <PrimaryButton
              label="Enregistrer le gage"
              onPress={handleAddGage}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      {/* Barre de recherche */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un gage..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filtres par catégories */}
      <View style={styles.filterScrollWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { id: 'all', label: `Tous (${activeCount})` },
            { id: 'custom', label: `Mes Gages (${customCount})` },
            { id: 'defi', label: 'Défis' },
            { id: 'smartphone', label: 'Smartphone' },
            { id: 'verite', label: 'Vérités' },
            { id: 'soiree', label: 'Soirée' },
          ]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterListContainer}
          renderItem={({ item }) => {
            const isSelected = activeFilter === item.id;
            return (
              <TouchableOpacity
                onPress={() => setActiveFilter(item.id as FilterCategory)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Liste des cartes gages */}
      <FlatList
        data={filteredGages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun gage ne correspond à votre recherche.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.defi;
          const isDeactivated = !item.isEnabled;

          return (
            <View
              style={[
                styles.gageCard,
                isDeactivated && styles.gageCardDisabled,
                item.isCustom && styles.gageCardCustom,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.categoryBadgeText, { color: meta.color }]}>
                    {meta.label}
                  </Text>
                </View>

                {item.isCustom ? (
                  <View style={styles.customBadge}>
                    <Text style={styles.customBadgeText}>Créé par toi</Text>
                  </View>
                ) : isDeactivated ? (
                  <View style={styles.disabledBadge}>
                    <Text style={styles.disabledBadgeText}>Masqué du jeu</Text>
                  </View>
                ) : null}
              </View>

              <Text
                style={[
                  styles.gageCardText,
                  isDeactivated && styles.gageCardTextDisabled,
                ]}
              >
                {item.text}
              </Text>

              <View style={styles.cardFooter}>
                {item.isCustom ? (
                  <TouchableOpacity
                    onPress={() => handleToggleOrDelete(item)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>Supprimer ce gage</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleToggleOrDelete(item)}
                    style={[
                      styles.toggleButton,
                      isDeactivated ? styles.reactivateButton : styles.hideButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.toggleButtonText,
                        isDeactivated ? styles.reactivateText : styles.hideText,
                      ]}
                    >
                      {isDeactivated ? 'Réactiver dans le jeu' : 'Masquer ce gage'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Modal d'aperçu d'un gage aléatoire */}
      <Modal visible={showPreviewModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeaderEmoji}>⏱️</Text>
            <Text style={styles.modalTitle}>TIRAGE AU SORT</Text>
            <Text style={styles.modalSubtitle}>Voici le gage que le joueur devrait réaliser :</Text>

            {previewGage && (
              <View style={styles.modalGageBox}>
                <Text style={styles.modalGageText}>{previewGage.text}</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <PrimaryButton
                label="Tirer un autre gage"
                onPress={handleDrawRandomGage}
                style={{ width: '100%', marginBottom: spacing.sm }}
              />
              <TouchableOpacity
                onPress={() => setShowPreviewModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
    paddingVertical: spacing.xs,
  },
  backText: {
    color: colors.accent,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xxl,
  },
  subtitle: {
    color: colors.textSecondary,
    fontWeight: typography.weights.regular,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  topActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.4)',
  },
  addBtnText: {
    color: colors.accent,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  drawBtn: {
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.4)',
  },
  drawBtnText: {
    color: '#FF9F0A',
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  addFormContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
    ...shadows.md,
  },
  formTitle: {
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.regular,
    fontSize: typography.sizes.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    marginTop: 4,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  catChoiceBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceElevated,
  },
  catChoiceText: {
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.xs,
  },
  formButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontWeight: typography.weights.regular,
    fontSize: typography.sizes.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  filterScrollWrapper: {
    marginTop: spacing.sm,
  },
  filterListContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.xs,
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: 60,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontWeight: typography.weights.regular,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  gageCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.md,
  },
  gageCardDisabled: {
    opacity: 0.5,
    borderColor: 'transparent',
  },
  gageCardCustom: {
    borderColor: 'rgba(255, 215, 0, 0.4)',
    backgroundColor: 'rgba(255, 215, 0, 0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.full,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  customBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  customBadgeText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: typography.weights.bold,
  },
  disabledBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
  },
  disabledBadgeText: {
    fontSize: 10,
    color: colors.danger,
    fontWeight: typography.weights.medium,
  },
  gageCardText: {
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.md,
    lineHeight: 22,
    marginVertical: spacing.xs,
  },
  gageCardTextDisabled: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  deleteButtonText: {
    color: colors.danger,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.xs,
  },
  toggleButton: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  hideButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  reactivateButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  toggleButtonText: {
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.xs,
  },
  hideText: {
    color: colors.textSecondary,
  },
  reactivateText: {
    color: colors.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.4)',
    ...shadows.md,
  },
  modalHeaderEmoji: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  modalTitle: {
    color: '#FF9F0A',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.lg,
    letterSpacing: 1,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontWeight: typography.weights.regular,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.md,
  },
  modalGageBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 159, 10, 0.08)',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.3)',
    marginBottom: spacing.lg,
  },
  modalGageText: {
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.lg,
    textAlign: 'center',
    lineHeight: 26,
  },
  modalActions: {
    width: '100%',
    alignItems: 'center',
  },
  modalCloseButton: {
    paddingVertical: spacing.xs,
  },
  modalCloseText: {
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.sm,
  },
});
