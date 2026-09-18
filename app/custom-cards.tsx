// app/custom-cards.tsx
// Écran de création et de gestion des cartes personnalisées pour Dit-Paulo ?

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { customCardsService } from '../services/customCardsService';
import { CATEGORY_CONFIGS, type Question, type QuestionCategory } from '../types/question';

export default function CustomCardsScreen() {
  const { theme } = useTheme();
  const [cards, setCards] = useState<Question[]>([]);
  const [text, setText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory>('fun');
  const [minPlayers, setMinPlayers] = useState<number>(2);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

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
                  Rédige ta première question dans le formulaire ci-dessus pour la faire apparaître dès votre prochaine partie !
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
});
