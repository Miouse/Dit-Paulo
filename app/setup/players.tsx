// app/setup/players.tsx
// Écran de configuration des joueurs (prénoms/pseudos)

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PlayerInput } from '../../components/PlayerInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors, radii, spacing, typography } from '../../constants/theme';
import { useGame } from '../../context/GameContext';
import { playersService } from '../../services/playersService';
import type { Player } from '../../types/game';
import { MAX_PLAYERS } from '../../types/game';

export default function PlayersScreen() {
  const { setPlayers, state } = useGame();

  // Initialiser avec les joueurs du context ou par défaut
  const [players, setLocalPlayers] = useState<Player[]>(() => {
    if (state.players && state.players.length >= 2) {
      return state.players;
    }
    return [
      { id: '1', name: 'Alex' },
      { id: '2', name: 'Emma' },
    ];
  });

  // Charger automatiquement les prénoms enregistrés au démarrage
  useEffect(() => {
    async function loadPlayers() {
      if (!state.players || state.players.length === 0) {
        const saved = await playersService.getSavedPlayers();
        if (saved.length >= 2) {
          setLocalPlayers(saved);
        }
      }
    }
    loadPlayers();
  }, []);

  const handleNameChange = (id: string, newName: string) => {
    setLocalPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
  };

  const handleAddPlayer = () => {
    if (players.length >= MAX_PLAYERS) return;
    const nextId = String(Date.now());
    setLocalPlayers((prev) => [
      ...prev,
      { id: nextId, name: `Joueur ${prev.length + 1}` },
    ]);
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 2) return;
    setLocalPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const [saveFeedback, setSaveFeedback] = useState(false);

  const handleSaveExplicit = async () => {
    const cleanedPlayers = players.map((p, idx) => ({
      ...p,
      name: p.name.trim() === '' ? `Joueur ${idx + 1}` : p.name.trim(),
    }));

    await playersService.savePlayers(cleanedPlayers);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  const handleContinue = async () => {
    // Remplacer les noms vides par des noms par défaut
    const cleanedPlayers = players.map((p, idx) => ({
      ...p,
      name: p.name.trim() === '' ? `Joueur ${idx + 1}` : p.name.trim(),
    }));

    // Enregistrer localement pour les prochaines parties
    await playersService.savePlayers(cleanedPlayers);

    setPlayers(cleanedPlayers);
    router.push('/setup/intensity');
  };

  return (
    <ScreenContainer noPadding>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Retour au choix du mode"
          >
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Qui joue ?</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>Entrez les prénoms des participants (min 2)</Text>
            <View style={[
              styles.playerCount,
              players.length >= MAX_PLAYERS && styles.playerCountMax,
            ]}>
              <Text style={[
                styles.playerCountText,
                players.length >= MAX_PLAYERS && styles.playerCountTextMax,
              ]}>
                {players.length}/{MAX_PLAYERS}
              </Text>
            </View>
          </View>
        </View>

        {/* Liste des joueurs */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {players.map((player, index) => (
            <PlayerInput
              key={player.id}
              index={index}
              name={player.name}
              onChangeName={(text) => handleNameChange(player.id, text)}
              onRemove={() => handleRemovePlayer(player.id)}
              canRemove={players.length > 2}
            />
          ))}

          {/* Bouton Ajouter un joueur */}
          {players.length < MAX_PLAYERS ? (
            <TouchableOpacity
              onPress={handleAddPlayer}
              style={styles.addButton}
              accessibilityLabel="Ajouter un joueur"
            >
              <Text style={styles.addIcon}>＋</Text>
              <Text style={styles.addText}>Ajouter un joueur</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.maxReachedBanner}>
              <Text style={styles.maxReachedText}>
                👥 Maximum {MAX_PLAYERS} joueurs atteint
              </Text>
            </View>
          )}

          {/* Bouton Enregistrer les prénoms */}
          <TouchableOpacity
            onPress={handleSaveExplicit}
            style={[styles.saveButton, saveFeedback && styles.saveButtonActive]}
            accessibilityLabel="Enregistrer la liste des prénoms"
          >
            <Text style={[styles.saveText, saveFeedback && styles.saveTextActive]}>
              {saveFeedback ? '✓ Prénoms enregistrés !' : '💾 Enregistrer la liste'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Pied de page */}
        <View style={styles.footer}>
          <PrimaryButton
            label="Continuer"
            onPress={handleContinue}
            accessibilityLabel="Continuer vers le choix de l'intensité"
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  header: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
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
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    borderStyle: 'dashed',
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  addIcon: {
    fontSize: typography.sizes.lg,
    color: colors.accent,
    fontWeight: typography.weights.bold,
  },
  addText: {
    fontSize: typography.sizes.md,
    color: colors.accentLight,
    fontWeight: typography.weights.semibold,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  saveButtonActive: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderColor: colors.success,
  },
  saveText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },
  saveTextActive: {
    color: colors.success,
  },
  footer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(13, 13, 18, 0.85)',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  playerCount: {
    backgroundColor: colors.surfaceBorder,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  playerCountMax: {
    backgroundColor: 'rgba(255, 214, 10, 0.2)',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  playerCountText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  playerCountTextMax: {
    color: colors.warning,
  },
  maxReachedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.warning,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
    backgroundColor: 'rgba(255, 214, 10, 0.08)',
  },
  maxReachedText: {
    fontSize: typography.sizes.md,
    color: colors.warning,
    fontWeight: typography.weights.semibold,
  },
});
