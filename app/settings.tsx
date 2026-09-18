// app/settings.tsx
// Écran des paramètres de l'application Dit-Paulo ? — Option & Gestion des Codes Blagues 🎭

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, radii, spacing, typography } from '../constants/theme';
import { useGame } from '../context/GameContext';
import { questions } from '../data/questions';
import { jokeEngine, type JokeEffect } from '../services/jokeEngine';
import { tinderSortService } from '../services/tinderSortService';

export default function SettingsScreen() {
  const { state, resetSession, resetSeenQuestions } = useGame();
  const [resetFeedback, setResetFeedback] = useState(false);

  const [jokesEnabled, setJokesEnabled] = useState(true);
  const [jokesList, setJokesList] = useState<JokeEffect[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // État Tri Tinder
  const [tinderStats, setTinderStats] = useState({ kept: 0, rejected: 0 });
  const [tinderFeedback, setTinderFeedback] = useState<string | null>(null);

  // Formulaire nouvelle blague
  const [newTriggerName, setNewTriggerName] = useState('');
  const [newTimerSeconds, setNewTimerSeconds] = useState('8');
  const [newMessage, setNewMessage] = useState('');
  const [newTitle, setNewTitle] = useState('GAME OVER 💀');
  const [newEmoji, setNewEmoji] = useState('💥');

  useEffect(() => {
    loadSettings();
    const unsub = tinderSortService.subscribe((s) => {
      setTinderStats({ kept: s.keptIds.length, rejected: s.rejectedIds.length });
    });
    return () => unsub();
  }, []);

  const loadSettings = async () => {
    const enabled = await jokeEngine.isJokesEnabled();
    setJokesEnabled(enabled);
    const list = await jokeEngine.getAllJokes();
    setJokesList(list);

    const sortState = await tinderSortService.getSortState();
    setTinderStats({ kept: sortState.keptIds.length, rejected: sortState.rejectedIds.length });
  };

  const handleToggleJokes = async (val: boolean) => {
    setJokesEnabled(val);
    await jokeEngine.setJokesEnabled(val);
  };

  const handleAddJoke = async () => {
    if (!newTriggerName.trim() || !newMessage.trim()) return;

    const timerSec = parseInt(newTimerSeconds, 10) || 8;

    const updated = await jokeEngine.addJoke({
      triggerName: newTriggerName.trim(),
      type: 'GAME_OVER',
      timerSeconds: timerSec,
      title: newTitle.trim() || 'GAME OVER 💀',
      message: newMessage.trim(),
      emoji: newEmoji.trim() || '💥',
    });

    setJokesList(updated);
    setNewTriggerName('');
    setNewMessage('');
    setShowAddForm(false);
  };

  const handleDeleteJoke = async (id: string) => {
    const updated = await jokeEngine.deleteJoke(id);
    setJokesList(updated);
  };

  const handleReset = () => {
    resetSession();
    router.replace('/');
  };

  return (
    <ScreenContainer noPadding>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Retour à l'accueil"
          >
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Paramètres ⚙️</Text>
        </View>

        <View style={styles.content}>
          {/* Section Codes Blagues */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CODES BLAGUES & EASTER EGGS 🎭</Text>

            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.rowLabelGroup}>
                  <Text style={styles.labelBold}>Activer les codes blagues</Text>
                  <Text style={styles.sublabel}>
                    Déclenche un Game Over humoristique lorsqu'un prénom piège est tiré
                  </Text>
                </View>

                <Switch
                  value={jokesEnabled}
                  onValueChange={handleToggleJokes}
                  trackColor={{ false: colors.surfaceBorder, true: colors.accent }}
                  thumbColor={colors.textPrimary}
                />
              </View>
            </View>

            {/* Liste des pièges activés */}
            {jokesEnabled && (
              <View style={styles.jokesSection}>
                <View style={styles.rowBetween}>
                  <Text style={styles.subTitle}>Prénoms pièges enregistrés :</Text>
                  <TouchableOpacity
                    onPress={() => setShowAddForm(!showAddForm)}
                    style={styles.addTriggerBtn}
                  >
                    <Text style={styles.addTriggerBtnText}>
                      {showAddForm ? '✕ Annuler' : '＋ Ajouter un piège'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Formulaire d'ajout rapide */}
                {showAddForm && (
                  <View style={styles.addFormCard}>
                    <Text style={styles.formTitle}>Créer un piège personnalisé</Text>

                    <TextInput
                      style={styles.input}
                      placeholder="Prénom du joueur piège (ex: Paul, Sam)"
                      placeholderTextColor={colors.textTertiary}
                      value={newTriggerName}
                      onChangeText={setNewTriggerName}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="Délai avant piège (secondes, ex: 8)"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                      value={newTimerSeconds}
                      onChangeText={setNewTimerSeconds}
                    />

                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Message personnalisé du Game Over"
                      placeholderTextColor={colors.textTertiary}
                      multiline
                      value={newMessage}
                      onChangeText={setNewMessage}
                    />

                    <TouchableOpacity onPress={handleAddJoke} style={styles.saveJokeBtn}>
                      <Text style={styles.saveJokeBtnText}>💾 Enregistrer ce piège</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Liste des cartes de pièges */}
                {jokesList.map((joke) => (
                  <View key={joke.id} style={styles.jokeItemCard}>
                    <View style={styles.jokeItemLeft}>
                      <Text style={styles.jokeEmoji}>{joke.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.jokeTriggerName}>
                          Prénom : <Text style={{ color: colors.accentLight }}>"{joke.triggerName}"</Text> ({joke.timerSeconds}s)
                        </Text>
                        <Text style={styles.jokeMessageText}>{joke.message}</Text>
                      </View>
                    </View>

                    {joke.isCustom && (
                      <TouchableOpacity
                        onPress={() => handleDeleteJoke(joke.id)}
                        style={styles.deleteBtn}
                      >
                        <Text style={styles.deleteBtnText}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Section Tri Tinder & Cartes Exclues */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TRI TINDER & CARTES EXCLUES 🔥</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Cartes exclues du jeu</Text>
                <Text style={[styles.value, { color: tinderStats.rejected > 0 ? colors.danger : colors.textPrimary, fontWeight: '700' }]}>
                  {tinderStats.rejected} / {questions.length}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>Cartes validées (gardées)</Text>
                <Text style={[styles.value, { color: colors.success, fontWeight: '700' }]}>
                  {tinderStats.kept}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/tinder-sort')}
              style={[styles.dangerCard, { marginBottom: spacing.sm, borderColor: '#FF2D55', backgroundColor: 'rgba(255, 45, 85, 0.1)' }]}
            >
              <Text style={[styles.dangerText, { color: '#FF2D55' }]}>
                🔥 Ouvrir le Tri des Cartes (Mode Tinder)
              </Text>
            </TouchableOpacity>

            {tinderStats.rejected > 0 && (
              <TouchableOpacity
                onPress={async () => {
                  await tinderSortService.resetSortState();
                  setTinderFeedback('✅ Toutes les cartes exclues ont été réintégrées !');
                  setTimeout(() => setTinderFeedback(null), 3000);
                }}
                style={[styles.dangerCard, { borderColor: colors.surfaceBorder }]}
              >
                <Text style={[styles.dangerText, { color: colors.textSecondary }]}>
                  {tinderFeedback ?? '🔄 Réintégrer toutes les cartes exclues au jeu'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Card À propos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À PROPOS</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Application</Text>
                <Text style={styles.value}>Dit-Paulo ?</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>Version</Text>
                <Text style={styles.value}>1.0.0</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>Questions déjà jouées</Text>
                <Text style={styles.value}>{state.seenQuestionIds.length} / {questions.length}</Text>
              </View>
            </View>
          </View>

          {/* Recommencer la partie */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HISTORIQUE & SESSION</Text>
            <TouchableOpacity
              onPress={async () => {
                await resetSeenQuestions();
                setResetFeedback(true);
                setTimeout(() => setResetFeedback(false), 2500);
              }}
              style={[styles.dangerCard, { marginBottom: spacing.sm, borderColor: colors.accent }]}
            >
              <Text style={[styles.dangerText, { color: colors.accentLight }]}>
                {resetFeedback ? '✅ Pioche remise à 0 !' : '🔄 Repartir de 0 (Vider l\'historique des questions)'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset} style={styles.dangerCard}>
              <Text style={styles.dangerText}>Réinitialiser la session en cours</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
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
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginLeft: spacing.xs,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowLabelGroup: {
    flex: 1,
  },
  labelBold: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  sublabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  jokesSection: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  subTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  addTriggerBtn: {
    backgroundColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  addTriggerBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.accentLight,
  },
  addFormCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    gap: spacing.sm,
  },
  formTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.accentLight,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  saveJokeBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  saveJokeBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  jokeItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
    gap: spacing.md,
  },
  jokeItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  jokeEmoji: {
    fontSize: 28,
  },
  jokeTriggerName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  jokeMessageText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  deleteBtnText: {
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  value: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
  },
  dangerCard: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
    alignItems: 'center',
  },
  dangerText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.danger,
  },
});
