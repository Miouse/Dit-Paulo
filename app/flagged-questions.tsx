// app/flagged-questions.tsx
// Écran complet de gestion, modification et export des questions signalées à modifier 🚩

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { flaggedQuestionsService, type FlaggedQuestion } from '../services/flaggedQuestionsService';
import { CATEGORY_CONFIGS } from '../types/game';

export default function FlaggedQuestionsScreen() {
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 700;

  const [flaggedList, setFlaggedList] = useState<FlaggedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'modified'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // État du modal d'édition
  const [editingItem, setEditingItem] = useState<FlaggedQuestion | null>(null);
  const [editText, setEditText] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Modal d'export du code
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCode, setExportCode] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  useEffect(() => {
    flaggedQuestionsService.getFlaggedQuestions().then((list) => {
      setFlaggedList(list);
      setLoading(false);
    });

    const unsub = flaggedQuestionsService.subscribe((list) => {
      setFlaggedList(list);
    });

    return () => unsub();
  }, []);

  const handleStartEdit = (item: FlaggedQuestion) => {
    setEditingItem(item);
    setEditText(item.modifiedText ?? item.originalText);
    setEditNotes(item.notes ?? '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    const trimmedText = editText.trim();
    if (!trimmedText) {
      Alert.alert('Texte vide', 'Le texte de la question ne peut pas être vide.');
      return;
    }

    await flaggedQuestionsService.updateFlaggedQuestion(editingItem.id, {
      modifiedText: trimmedText !== editingItem.originalText ? trimmedText : undefined,
      notes: editNotes.trim() || undefined,
    });

    setEditingItem(null);
    showToast('✅ Modifications enregistrées pour la question !');
  };

  const handleUnflag = async (id: string) => {
    await flaggedQuestionsService.unflag(id);
    showToast('🏳️ Signalement retiré de la liste');
  };

  const handleClearAll = () => {
    const proceed = async () => {
      await flaggedQuestionsService.clearAll();
      showToast('🗑️ Toutes les questions signalées ont été retirées');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous vraiment vider toute la liste des questions à modifier ?')) {
        proceed();
      }
    } else {
      Alert.alert(
        'Vider la liste',
        'Voulez-vous vraiment retirer toutes les questions de la liste ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Tout effacer', style: 'destructive', onPress: proceed },
        ]
      );
    }
  };

  const copyToClipboard = async (text: string, successMsg: string) => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        showToast(successMsg);
      } else {
        await Share.share({
          message: text,
          title: 'Export questions Dit-Paulo',
        });
        showToast(successMsg);
      }
    } catch {
      showToast('Presse-papier non disponible');
    }
  };

  const handleCopySingleQuestionCode = (item: FlaggedQuestion) => {
    const textToCopy = item.modifiedText?.trim() || item.originalText;
    const noteLine = item.notes?.trim() ? `  // Note: ${item.notes.trim()}\n` : '';
    const snippet = `${noteLine}{\n  id: '${item.id}',\n  category: '${item.category}',\n  text: ${JSON.stringify(textToCopy)},\n},`;
    copyToClipboard(snippet, `📋 Code de la question #${item.id} copié !`);
  };

  const handleOpenExportModal = () => {
    const code = flaggedQuestionsService.generateCodeExport();
    setExportCode(code);
    setShowExportModal(true);
  };

  // Filtrage
  const filteredList = flaggedList.filter((item) => {
    const isModified = !!item.modifiedText?.trim() && item.modifiedText.trim() !== item.originalText;
    if (filterMode === 'modified') return isModified;
    if (filterMode === 'pending') return !isModified;
    return true;
  });

  const modifiedCount = flaggedList.filter(
    (item) => !!item.modifiedText?.trim() && item.modifiedText.trim() !== item.originalText
  ).length;

  return (
    <ScreenContainer noPadding>
      {/* Toast amical */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Retour"
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Questions à modifier 🚩</Text>
          <View style={[styles.countBadge, { backgroundColor: theme.colors.accentMuted, borderColor: theme.colors.accent }]}>
            <Text style={[styles.countBadgeText, { color: theme.colors.accentLight }]}>
              {flaggedList.length}
            </Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Marquées pendant la partie avec le drapeau 🚩 pour être corrigées ou reformulées.
        </Text>

        {/* Barre d'actions globale si liste non vide */}
        {flaggedList.length > 0 && (
          <View style={styles.globalActionsRow}>
            <TouchableOpacity
              onPress={handleOpenExportModal}
              style={[styles.globalActionBtn, { backgroundColor: theme.colors.accentMuted, borderColor: theme.colors.accent }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.globalActionText, { color: theme.colors.accentLight }]}>
                📋 Exporter le code (TypeScript)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClearAll}
              style={[styles.globalActionBtn, styles.clearAllBtn]}
              activeOpacity={0.8}
            >
              <Text style={styles.clearAllText}>🗑️ Tout vider</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filtres par état */}
        {flaggedList.length > 0 && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              onPress={() => setFilterMode('all')}
              style={[styles.filterChip, filterMode === 'all' && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filterMode === 'all' && styles.filterChipTextActive]}>
                Toutes ({flaggedList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterMode('pending')}
              style={[styles.filterChip, filterMode === 'pending' && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filterMode === 'pending' && styles.filterChipTextActive]}>
                ⏳ En attente ({flaggedList.length - modifiedCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterMode('modified')}
              style={[styles.filterChip, filterMode === 'modified' && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filterMode === 'modified' && styles.filterChipTextActive]}>
                ✅ Modifiées ({modifiedCount})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Liste des questions */}
      {!loading && filteredList.length > 0 ? (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, isDesktop && styles.desktopListContent]}
          renderItem={({ item }) => {
            const catConfig = CATEGORY_CONFIGS[item.category as keyof typeof CATEGORY_CONFIGS] || CATEGORY_CONFIGS.fun;
            const isModified = !!item.modifiedText?.trim() && item.modifiedText.trim() !== item.originalText;

            return (
              <View style={[styles.card, isModified && styles.cardModified]}>
                {/* En-tête de la carte */}
                <View style={styles.cardHeader}>
                  <View style={styles.badgesGroup}>
                    <View style={[styles.catBadge, { backgroundColor: catConfig.badgeBg, borderColor: catConfig.color }]}>
                      <Text style={[styles.catBadgeText, { color: catConfig.color }]}>
                        {catConfig.emoji} {catConfig.label}
                      </Text>
                    </View>
                    <View style={styles.idBadge}>
                      <Text style={styles.idBadgeText}>#{item.id}</Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, isModified ? styles.statusBadgeModified : styles.statusBadgePending]}>
                    <Text style={[styles.statusBadgeText, isModified ? styles.statusTextModified : styles.statusTextPending]}>
                      {isModified ? 'Modifiée en jeu ✅' : 'À retravailler ⏳'}
                    </Text>
                  </View>
                </View>

                {/* Texte d'origine */}
                <View style={styles.textBox}>
                  <Text style={styles.fieldLabel}>Question originale :</Text>
                  <Text style={[styles.originalText, isModified && styles.originalTextStriked]}>
                    {item.originalText}
                  </Text>
                </View>

                {/* Texte modifié si existant */}
                {isModified && (
                  <View style={[styles.textBox, styles.modifiedBox]}>
                    <Text style={styles.modifiedFieldLabel}>✨ Nouvelle version active en jeu :</Text>
                    <Text style={styles.modifiedText}>{item.modifiedText}</Text>
                  </View>
                )}

                {/* Notes de l'utilisateur si existantes */}
                {item.notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>📝 Note de modification :</Text>
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                ) : null}

                {/* Boutons d'actions par carte */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    onPress={() => handleStartEdit(item)}
                    style={[styles.itemActionBtn, styles.editBtn]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editBtnText}>
                      {isModified ? '✏️ Réajuster' : '✏️ Modifier le texte'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleCopySingleQuestionCode(item)}
                    style={[styles.itemActionBtn, styles.copyBtn]}
                    activeOpacity={0.7}
                    accessibilityLabel="Copier l'objet TypeScript pour data/questions.ts"
                  >
                    <Text style={styles.copyBtnText}>📋 Copier code</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleUnflag(item.id)}
                    style={[styles.itemActionBtn, styles.unflagBtn]}
                    activeOpacity={0.7}
                    accessibilityLabel="Retirer le drapeau"
                  >
                    <Text style={styles.unflagBtnText}>🏳️ Retirer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      ) : !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🚩</Text>
          <Text style={styles.emptyTitle}>
            {flaggedList.length === 0 ? 'Aucune question signalée' : 'Aucune question dans ce filtre'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {flaggedList.length === 0
              ? 'Pendant tes parties, clique sur le drapeau 🚩 sur une carte pour la retrouver ici et la reformuler tranquillement.'
              : 'Essaie de changer de filtre pour voir toutes tes questions signalées.'}
          </Text>

          <PrimaryButton
            label="Lancer une partie 🚀"
            onPress={() => router.push('/setup/categories')}
            style={{ width: '100%', maxWidth: 360, marginBottom: spacing.sm }}
          />

          <PrimaryButton
            label="Voir toutes les questions 📋"
            variant="secondary"
            onPress={() => router.push('/questions-list')}
            style={{ width: '100%', maxWidth: 360 }}
          />
        </View>
      ) : null}

      {/* Modal d'édition d'une question */}
      <Modal
        visible={!!editingItem}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, isDesktop && styles.desktopModalCard]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier la question ✏️</Text>
              <TouchableOpacity onPress={() => setEditingItem(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Texte de la question :</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={editText}
                onChangeText={setEditText}
                multiline
                numberOfLines={4}
                placeholder="Nouvelle formulation de la question..."
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={styles.inputLabel}>Note personnelle / rappel (optionnel) :</Text>
              <TextInput
                style={styles.modalInput}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Ex: corriger la fin, faute de frappe, trop osée..."
                placeholderTextColor={colors.textTertiary}
              />

              <View style={styles.tipBox}>
                <Text style={styles.tipText}>
                  💡 <Text style={{ fontWeight: 'bold' }}>Astuce :</Text> Tu peux utiliser{' '}
                  <Text style={{ color: theme.colors.accentLight }}>{'{player}'}</Text> et{' '}
                  <Text style={{ color: theme.colors.accentLight }}>{'{otherPlayer}'}</Text> pour que le prénom des joueurs soit inséré automatiquement !
                </Text>
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  onPress={() => setEditingItem(null)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveEdit}
                  style={[styles.saveBtn, { backgroundColor: theme.colors.accent }]}
                >
                  <Text style={styles.saveBtnText}>💾 Sauvegarder</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal d'exportation TypeScript */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, isDesktop && styles.desktopModalCard]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Exporter pour data/questions.ts 📋</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Voici le code prêt à copier/coller dans ton fichier source sur ton PC :
            </Text>

            <TextInput
              style={[styles.modalInput, styles.codeExportArea]}
              value={exportCode}
              editable={false}
              multiline
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                onPress={() => setShowExportModal(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Fermer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => copyToClipboard(exportCode, '📋 Tout le code copié dans le presse-papier !')}
                style={[styles.saveBtn, { backgroundColor: theme.colors.accent }]}
              >
                <Text style={styles.saveBtnText}>📋 Copier tout le code</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    backgroundColor: 'rgba(25, 25, 35, 0.95)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#FF3B30',
    zIndex: 999,
    ...shadows.lg,
  },
  toastText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    fontWeight: typography.weights.medium,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  globalActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  globalActionBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globalActionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  clearAllBtn: {
    flex: 0.4,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
  },
  clearAllText: {
    color: '#FF3B30',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  filterChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  desktopListContent: {
    maxWidth: 820,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardModified: {
    borderColor: 'rgba(52, 199, 89, 0.4)',
    backgroundColor: 'rgba(52, 199, 89, 0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  idBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  idBadgeText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  statusBadgePending: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  statusBadgeModified: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  statusTextPending: {
    color: '#FF9500',
  },
  statusTextModified: {
    color: '#34C759',
  },
  textBox: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  originalText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  originalTextStriked: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  modifiedBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftWidth: 3,
    borderLeftColor: '#34C759',
    paddingLeft: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  modifiedFieldLabel: {
    fontSize: 11,
    color: '#34C759',
    fontWeight: typography.weights.bold,
  },
  modifiedText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
    lineHeight: 22,
  },
  notesBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.18)',
    gap: 2,
  },
  notesLabel: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: typography.weights.bold,
  },
  notesText: {
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  itemActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    flex: 1.2,
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
  },
  editBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  copyBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: colors.surfaceBorder,
  },
  copyBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  unflagBtn: {
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderColor: 'rgba(255, 59, 48, 0.25)',
  },
  unflagBtnText: {
    fontSize: typography.sizes.xs,
    color: '#FF3B30',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
    maxWidth: 340,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.lg,
  },
  desktopModalCard: {
    maxWidth: 580,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
  },
  modalCloseText: {
    fontSize: 18,
    color: colors.textSecondary,
    padding: 4,
  },
  modalSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.md,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  modalTextArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  codeExportArea: {
    minHeight: 220,
    maxHeight: 340,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  tipBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  tipText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
});
