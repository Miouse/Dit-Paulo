// app/custom-cards.tsx
// Écran de création et de gestion des cartes personnalisées pour Dit-Paulo ?
// Support complet de l'Exportation et de l'Importation de decks communautaires entre collègues (Web & Mobile)

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import {
  customCardsService,
  type CustomDeckExport,
} from '../services/customCardsService';
import { CATEGORY_CONFIGS, type Question, type QuestionCategory } from '../types/question';

export default function CustomCardsScreen() {
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 700;

  const [cards, setCards] = useState<Question[]>([]);
  const [text, setText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory>('fun');
  const [minPlayers, setMinPlayers] = useState<number>(2);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  // ─── Modals Export & Import ──────────────────────────────────────────────
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // État du formulaire d'export
  const [exportDeckName, setExportDeckName] = useState('Mon Deck de Soirée');
  const [exportAuthor, setExportAuthor] = useState('');
  const [exportDescription, setExportDescription] = useState('');
  const [exportJsonPreview, setExportJsonPreview] = useState('');
  const [exportCopied, setExportCopied] = useState(false);

  // État du formulaire d'import
  const [importRawJson, setImportRawJson] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [validatedDeck, setValidatedDeck] = useState<CustomDeckExport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    customCardsService.getCustomCards().then(setCards);
    const unsub = customCardsService.subscribe(setCards);
    return () => unsub();
  }, []);

  const handleAddCard = async () => {
    if (!text.trim()) {
      Alert.alert('Texte requis', 'Veuillez rédiger le texte de votre question.');
      return;
    }

    await customCardsService.addCustomCard({
      text: text.trim(),
      category: selectedCategory,
      minPlayers,
    });

    setText('');
    setFeedback('✅ Carte ajoutée avec succès à la pioche du jeu !');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDeleteCard = (card: Question) => {
    Alert.alert(
      'Supprimer la carte',
      `Es-tu sûr(e) de vouloir supprimer définitivement cette carte ?\n\n"${card.text.substring(0, 60)}..."`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await customCardsService.deleteCustomCard(card.id);
          },
        },
      ]
    );
  };

  // ─── Gestion de l'Export ──────────────────────────────────────────────────
  const handleOpenExport = async () => {
    if (cards.length === 0) {
      Alert.alert(
        'Aucune carte',
        'Tu dois avoir créé au moins une carte personnalisée pour pouvoir exporter un deck.'
      );
      return;
    }
    const currentName = exportDeckName.trim() || 'Mon Deck Dit-Paulo';
    const { jsonString } = await customCardsService.exportDeck({
      deckName: currentName,
      author: exportAuthor,
      description: exportDescription,
    });
    setExportJsonPreview(jsonString);
    setExportCopied(false);
    setShowExportModal(true);
  };

  const handleUpdateExportDeck = async (name: string, author: string, desc: string) => {
    setExportDeckName(name);
    setExportAuthor(author);
    setExportDescription(desc);
    const { jsonString } = await customCardsService.exportDeck({
      deckName: name.trim() || 'Mon Deck Dit-Paulo',
      author: author.trim() || undefined,
      description: desc.trim() || undefined,
    });
    setExportJsonPreview(jsonString);
  };

  const handleCopyExportJson = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(exportJsonPreview);
      } else {
        await Share.share({
          message: exportJsonPreview,
          title: exportDeckName || 'Deck Dit-Paulo',
        });
      }
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 3000);
    } catch {
      Alert.alert('Info', 'Tu peux copier manuellement le texte du deck affiché dans l\'aperçu.');
    }
  };

  const handleDownloadExportJson = async () => {
    const filename = `${(exportDeckName || 'deck-dit-paulo')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .toLowerCase()}.json`;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([exportJsonPreview], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      await Share.share({
        message: exportJsonPreview,
        title: exportDeckName || 'Deck Dit-Paulo',
      });
    }
  };

  const handleShareNative = async () => {
    try {
      await Share.share({
        message: exportJsonPreview,
        title: exportDeckName || 'Deck Dit-Paulo',
      });
    } catch {
      // annulé
    }
  };

  // ─── Gestion de l'Import ──────────────────────────────────────────────────
  const handleOpenImport = () => {
    setImportRawJson('');
    setValidatedDeck(null);
    setImportError(null);
    setShowImportModal(true);
  };

  const handleValidateImportText = (raw: string) => {
    setImportRawJson(raw);
    if (!raw.trim()) {
      setValidatedDeck(null);
      setImportError(null);
      return;
    }
    const result = customCardsService.parseAndValidateDeck(raw);
    if (result.valid && result.deck) {
      setValidatedDeck(result.deck);
      setImportError(null);
    } else {
      setValidatedDeck(null);
      setImportError(result.error || 'Données invalides.');
    }
  };

  const handlePickJsonFile = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
              handleValidateImportText(content);
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    } else {
      Alert.alert(
        'Import sur mobile',
        'Sur mobile, colle directement le texte du deck partagé par ton collègue dans la zone prévue.'
      );
    }
  };

  const handleConfirmImport = async () => {
    if (!validatedDeck) {
      Alert.alert('Import impossible', 'Veuillez renseigner un deck valide avant de valider.');
      return;
    }

    const result = await customCardsService.importDeck(validatedDeck, importMode);
    setShowImportModal(false);
    setImportRawJson('');
    setValidatedDeck(null);

    let msg = `✅ ${result.importedCount} carte${result.importedCount > 1 ? 's' : ''} importée${result.importedCount > 1 ? 's' : ''} depuis « ${result.deckName} » !`;
    if (result.duplicateCount > 0) {
      msg += ` (${result.duplicateCount} doublon${result.duplicateCount > 1 ? 's' : ''} ignoré${result.duplicateCount > 1 ? 's' : ''})`;
    }
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 5000);
  };

  const categories = Object.values(CATEGORY_CONFIGS);

  return (
    <ScreenContainer noPadding>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Retour"
          >
            <Text style={[styles.backText, { color: theme.colors.accentLight }]}>← Retour</Text>
          </TouchableOpacity>

          <View style={styles.titleRow}>
            <Text style={styles.title}>Mes Cartes Personnalisées ⭐</Text>
            <View style={[styles.countBadge, { backgroundColor: theme.colors.accentMuted, borderColor: theme.colors.accent }]}>
              <Text style={[styles.countBadgeText, { color: theme.colors.accentLight }]}>
                {cards.length} carte{cards.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Crée tes propres questions décalées, vérités et dilemmes. Elles seront automatiquement intégrées dans les parties !
          </Text>

          {/* Barre d'actions Partage & Communauté */}
          <View style={styles.shareToolbar}>
            <TouchableOpacity
              onPress={handleOpenExport}
              style={[
                styles.toolbarBtn,
                styles.toolbarBtnPrimary,
                cards.length === 0 && styles.toolbarBtnDisabled,
              ]}
              disabled={cards.length === 0}
            >
              <Text style={styles.toolbarBtnIcon}>📤</Text>
              <Text style={styles.toolbarBtnText}>Exporter le Deck</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenImport}
              style={[styles.toolbarBtn, styles.toolbarBtnSecondary]}
            >
              <Text style={styles.toolbarBtnIcon}>📥</Text>
              <Text style={styles.toolbarBtnTextSecondary}>Importer un Deck</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Bannière de feedback */}
          {feedback && (
            <View style={[styles.feedbackCard, { borderColor: colors.success }]}>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          )}

          {/* Formulaire de création */}
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => setShowForm(!showForm)}
              style={styles.toggleFormHeader}
            >
              <Text style={styles.sectionTitle}>
                {showForm ? '▼ CRÉER UNE NOUVELLE CARTE' : '▶ CRÉER UNE NOUVELLE CARTE'}
              </Text>
              <Text style={[styles.toggleFormLink, { color: theme.colors.accentLight }]}>
                {showForm ? 'Masquer' : '＋ Ouvrir le formulaire'}
              </Text>
            </TouchableOpacity>

            {showForm && (
              <View style={[styles.formCard, { borderColor: theme.colors.accent }]}>
                <Text style={styles.formLabel}>Texte de la question / défi :</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ex : {player}, quelle est la pire chose que tu as faite par fierté devant {otherPlayer} ?"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  value={text}
                  onChangeText={setText}
                />

                {/* Astuce sur les balises */}
                <View style={styles.tipBox}>
                  <Text style={styles.tipTitle}>💡 Astuce balises de prénom :</Text>
                  <Text style={styles.tipText}>
                    Utilise <Text style={styles.tipCode}>{'{player}'}</Text> pour désigner le joueur dont c'est le tour, et <Text style={styles.tipCode}>{'{otherPlayer}'}</Text> pour désigner un autre joueur tiré au sort.
                  </Text>
                </View>

                {/* Sélecteur de catégorie */}
                <Text style={styles.formLabel}>Choisir la catégorie :</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setSelectedCategory(cat.id)}
                        style={[
                          styles.catChip,
                          isSelected && { borderColor: cat.color, backgroundColor: cat.badgeBg },
                        ]}
                      >
                        <Text style={styles.catChipEmoji}>{cat.emoji}</Text>
                        <Text
                          style={[
                            styles.catChipLabel,
                            isSelected && { color: cat.color, fontWeight: '700' },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Nombre de joueurs */}
                <View style={styles.playersRow}>
                  <Text style={styles.formLabel}>Joueurs minimum :</Text>
                  <View style={styles.minPlayersSelector}>
                    {[2, 3, 4].map((num) => (
                      <TouchableOpacity
                        key={num}
                        onPress={() => setMinPlayers(num)}
                        style={[
                          styles.minPlayerBtn,
                          minPlayers === num && {
                            backgroundColor: theme.colors.accent,
                            borderColor: theme.colors.accentLight,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.minPlayerBtnText,
                            minPlayers === num && { color: colors.textPrimary, fontWeight: '700' },
                          ]}
                        >
                          {num} pers.
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Bouton de soumission */}
                <TouchableOpacity
                  onPress={handleAddCard}
                  style={[styles.submitButton, { backgroundColor: theme.colors.accent }]}
                >
                  <Text style={styles.submitButtonText}>＋ Ajouter à la pioche du jeu</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Liste des cartes existantes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CARTES PERSONNALISÉES EN JEU ({cards.length})</Text>

            {cards.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🃏</Text>
                <Text style={styles.emptyTitle}>Aucune carte personnalisée pour le moment</Text>
                <Text style={styles.emptyText}>
                  Rédige ta première question ci-dessus ou clique sur "Importer un Deck" pour intégrer les cartes d'un collègue !
                </Text>
              </View>
            ) : (
              cards.map((card, idx) => {
                const catMeta = CATEGORY_CONFIGS[card.category] || CATEGORY_CONFIGS.fun;
                return (
                  <View key={card.id} style={styles.cardItem}>
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.cardBadge,
                          { backgroundColor: catMeta.badgeBg, borderColor: catMeta.color },
                        ]}
                      >
                        <Text style={[styles.cardBadgeText, { color: catMeta.color }]}>
                          {catMeta.emoji} {catMeta.label}
                        </Text>
                      </View>

                      <View style={styles.cardRightMeta}>
                        <Text style={styles.cardPlayerMeta}>👥 Min {card.minPlayers} joueurs</Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteCard(card)}
                          style={styles.deleteBtn}
                          accessibilityLabel="Supprimer cette carte"
                        >
                          <Text style={styles.deleteBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.cardQuestionText}>{card.text}</Text>

                    <View style={styles.cardFooter}>
                      <Text style={styles.cardIdText}>#{card.id}</Text>
                      <Text style={[styles.cardCustomTag, { color: theme.colors.accentLight }]}>
                        ⭐ Personnalisée ({idx + 1}/{cards.length})
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* ─── MODAL D'EXPORTATION ────────────────────────────────────────────── */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, isDesktop && styles.modalBoxDesktop]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📤 EXPORTER MON DECK</Text>
              <TouchableOpacity
                onPress={() => setShowExportModal(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.shieldNotice}>
                <Text style={styles.shieldIcon}>🛡️</Text>
                <Text style={styles.shieldText}>
                  Sécurisé : aucun identifiant interne n'est exporté. De nouveaux IDs seront générés chez celui qui importe le deck pour éviter toute collision.
                </Text>
              </View>

              <Text style={styles.fieldLabel}>Nom du Deck :</Text>
              <TextInput
                style={styles.modalInput}
                value={exportDeckName}
                onChangeText={(v) => handleUpdateExportDeck(v, exportAuthor, exportDescription)}
                placeholder="Ex : 🌌 Questions existentielles"
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={styles.fieldLabel}>Créateur / Auteur (optionnel) :</Text>
              <TextInput
                style={styles.modalInput}
                value={exportAuthor}
                onChangeText={(v) => handleUpdateExportDeck(exportDeckName, v, exportDescription)}
                placeholder="Ex : Alex, L'équipe Dev..."
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={styles.fieldLabel}>Description (optionnel) :</Text>
              <TextInput
                style={styles.modalInput}
                value={exportDescription}
                onChangeText={(v) => handleUpdateExportDeck(exportDeckName, exportAuthor, v)}
                placeholder="Ex : Spécial soirées au coin du feu..."
                placeholderTextColor={colors.textTertiary}
              />

              <View style={styles.exportStatsRow}>
                <Text style={styles.exportStatsText}>
                  📦 Deck prêt : <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{cards.length} carte{cards.length > 1 ? 's' : ''}</Text>
                </Text>
                {exportCopied && (
                  <Text style={styles.copiedBadge}>✅ Copié !</Text>
                )}
              </View>

              <View style={styles.exportActionsGrid}>
                <TouchableOpacity
                  onPress={handleCopyExportJson}
                  style={[styles.actionBtn, { backgroundColor: theme.colors.accent }]}
                >
                  <Text style={styles.actionBtnText}>
                    {exportCopied ? '✅ Copié dans le presse-papier' : '📋 Copier le code (JSON)'}
                  </Text>
                </TouchableOpacity>

                {Platform.OS === 'web' ? (
                  <TouchableOpacity
                    onPress={handleDownloadExportJson}
                    style={[styles.actionBtn, styles.actionBtnOutline]}
                  >
                    <Text style={styles.actionBtnTextOutline}>💾 Télécharger le fichier .json</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleShareNative}
                    style={[styles.actionBtn, styles.actionBtnOutline]}
                  >
                    <Text style={styles.actionBtnTextOutline}>📲 Partager via une appli</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Aperçu du contenu partagé :</Text>
              <View style={styles.jsonPreviewBox}>
                <Text style={styles.jsonPreviewText} numberOfLines={8}>
                  {exportJsonPreview}
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowExportModal(false)}
              style={styles.modalDismissBtn}
            >
              <Text style={styles.modalDismissText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL D'IMPORTATION ────────────────────────────────────────────── */}
      <Modal
        visible={showImportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, isDesktop && styles.modalBoxDesktop]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📥 IMPORTER UN DECK</Text>
              <TouchableOpacity
                onPress={() => setShowImportModal(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalHelpText}>
                Colle ici le texte JSON partagé par ton collègue, ou charge directement le fichier .json reçu.
              </Text>

              {Platform.OS === 'web' && (
                <TouchableOpacity
                  onPress={handlePickJsonFile}
                  style={styles.filePickerBtn}
                >
                  <Text style={styles.filePickerBtnText}>📁 Choisir un fichier .json sur mon ordinateur</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.fieldLabel}>Code du deck (JSON) :</Text>
              <TextInput
                style={[styles.modalInput, styles.importTextArea]}
                multiline
                placeholder='Colle ici le JSON (ex : {"deckName": "...", "cards": [...]})'
                placeholderTextColor={colors.textTertiary}
                value={importRawJson}
                onChangeText={handleValidateImportText}
              />

              {/* Message d'erreur si JSON invalide */}
              {importError && (
                <View style={styles.errorNotice}>
                  <Text style={styles.errorText}>⚠️ {importError}</Text>
                </View>
              )}

              {/* Aperçu du deck détecté */}
              {validatedDeck && (
                <View style={styles.deckPreviewCard}>
                  <View style={styles.deckPreviewHeader}>
                    <Text style={styles.deckPreviewEmoji}>🎁</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deckPreviewName}>{validatedDeck.deckName}</Text>
                      {validatedDeck.author && (
                        <Text style={styles.deckPreviewAuthor}>Créé par {validatedDeck.author}</Text>
                      )}
                    </View>
                    <View style={styles.deckPreviewCountBadge}>
                      <Text style={styles.deckPreviewCountText}>
                        {validatedDeck.cards.length} carte{validatedDeck.cards.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  {validatedDeck.description && (
                    <Text style={styles.deckPreviewDesc}>{validatedDeck.description}</Text>
                  )}
                </View>
              )}

              {/* Choix du mode d'importation */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Mode d'importation :</Text>
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  onPress={() => setImportMode('merge')}
                  style={[
                    styles.modeOption,
                    importMode === 'merge' && { borderColor: theme.colors.accent, backgroundColor: 'rgba(255, 255, 255, 0.06)' },
                  ]}
                >
                  <View style={styles.modeOptionRadio}>
                    {importMode === 'merge' && <View style={[styles.radioDot, { backgroundColor: theme.colors.accent }]} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modeOptionTitle}>➕ Fusionner (Recommandé)</Text>
                    <Text style={styles.modeOptionDesc}>
                      Ajoute les nouvelles cartes en ignorant automatiquement les doublons grâce à la normalisation de texte.
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setImportMode('replace')}
                  style={[
                    styles.modeOption,
                    importMode === 'replace' && { borderColor: colors.warning, backgroundColor: 'rgba(255, 159, 10, 0.08)' },
                  ]}
                >
                  <View style={styles.modeOptionRadio}>
                    {importMode === 'replace' && <View style={[styles.radioDot, { backgroundColor: colors.warning }]} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modeOptionTitle, importMode === 'replace' && { color: colors.warning }]}>
                      🔄 Remplacer tout
                    </Text>
                    <Text style={styles.modeOptionDesc}>
                      Écrase tes cartes personnalisées actuelles pour installer uniquement ce deck.
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                onPress={handleConfirmImport}
                disabled={!validatedDeck}
                style={[
                  styles.confirmImportBtn,
                  { backgroundColor: validatedDeck ? theme.colors.accent : colors.surfaceBorder },
                ]}
              >
                <Text
                  style={[
                    styles.confirmImportBtnText,
                    !validatedDeck && { color: colors.textTertiary },
                  ]}
                >
                  📥 Importer {validatedDeck ? `(${validatedDeck.cards.length} cartes)` : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowImportModal(false)}
                style={styles.modalDismissBtn}
              >
                <Text style={styles.modalDismissText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  backText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
    lineHeight: typography.sizes.sm * 1.4,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  feedbackCard: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  feedbackText: {
    color: colors.success,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  section: {
    gap: spacing.sm,
  },
  toggleFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  toggleFormLink: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  formCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  formLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
  },
  textArea: {
    minHeight: 85,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  tipBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radii.md,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    gap: 4,
  },
  tipTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.warning,
  },
  tipText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  tipCode: {
    color: colors.textPrimary,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  catScroll: {
    flexDirection: 'row',
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: spacing.sm,
  },
  catChipEmoji: {
    fontSize: 16,
  },
  catChipLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  minPlayersSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  minPlayerBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  minPlayerBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  submitButton: {
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  submitButtonText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.heavy,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  cardItem: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  cardRightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardPlayerMeta: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  cardQuestionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: spacing.xs,
  },
  cardIdText: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: 'monospace',
  },
  cardCustomTag: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },

  // ─── Styles Toolbar Partage ───────────────────────────────────────────────
  shareToolbar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  toolbarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
  },
  toolbarBtnPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  toolbarBtnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolbarBtnDisabled: {
    opacity: 0.4,
  },
  toolbarBtnIcon: {
    fontSize: 15,
  },
  toolbarBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  toolbarBtnTextSecondary: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },

  // ─── Styles Modals ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalBox: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.lg,
  },
  modalBoxDesktop: {
    maxWidth: 560,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  modalCloseBtn: {
    padding: spacing.xs,
  },
  modalCloseText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  modalScroll: {
    maxHeight: 520,
    marginBottom: spacing.md,
  },
  shieldNotice: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  shieldIcon: {
    fontSize: 20,
  },
  shieldText: {
    flex: 1,
    fontSize: 11,
    color: '#30D158',
    lineHeight: 16,
  },
  fieldLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: spacing.xs,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  exportStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  exportStatsText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  copiedBadge: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  exportActionsGrid: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actionBtn: {
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  actionBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  actionBtnTextOutline: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  jsonPreviewBox: {
    backgroundColor: '#0a0a0c',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.sm,
    marginTop: 4,
  },
  jsonPreviewText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: colors.textTertiary,
    lineHeight: 14,
  },
  modalDismissBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  modalDismissText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  modalHelpText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  filePickerBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  filePickerBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },
  importTextArea: {
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  errorNotice: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.25)',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
    fontWeight: typography.weights.semibold,
  },
  deckPreviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  deckPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deckPreviewEmoji: {
    fontSize: 24,
  },
  deckPreviewName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  deckPreviewAuthor: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  deckPreviewCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  deckPreviewCountText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  deckPreviewDesc: {
    fontSize: 11,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  modeSelector: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  modeOptionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modeOptionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  modeOptionDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  modalFooterActions: {
    gap: spacing.xs,
  },
  confirmImportBtn: {
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  confirmImportBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
  },
});

