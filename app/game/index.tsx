// app/game/index.tsx
// Écran principal de jeu — tirage des cartes, favoris, rotation des joueurs

import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { CardDeck } from '../../components/CardDeck';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionCard } from '../../components/QuestionCard';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors, radii, spacing, typography } from '../../constants/theme';
import { useGame } from '../../context/GameContext';
import type { Gage } from '../../data/gages';
import { favoritesService } from '../../services/favoritesService';
import { gagesService } from '../../services/gagesService';
import { jokeEngine, type JokeEffect } from '../../services/jokeEngine';
import { questionEngine } from '../../services/questionEngine';
import { CATEGORY_CONFIGS, type Player, type QuestionCategory } from '../../types/game';

interface PlayedCardHistoryItem {
  id: string;
  text: string;
  category: QuestionCategory;
  playerName?: string;
  result: 'validated' | 'tongue_in_cheek' | 'skipped';
  timestamp: number;
}

export default function GameScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 700;

  const {
    state,
    currentPlayer,
    nextPlayer,
    setCurrentQuestion,
    markQuestionSeen,
    addPlayerPoints,
    deductPlayerPoints,
    resetSession,
  } = useGame();

  const [isFavorite, setIsFavorite] = useState(false);
  const [activeJoke, setActiveJoke] = useState<JokeEffect | null>(null);
  const [showPodium, setShowPodium] = useState(false);
  const [playedHistory, setPlayedHistory] = useState<PlayedCardHistoryItem[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // ─── États Joker Double Niveau ─────────────────────────────────────────────
  // Joker Hasard (-10 Pts) : roulette animée parmi les autres joueurs
  const [showRouletteOverlay, setShowRouletteOverlay] = useState(false);
  const [rouletteDisplayName, setRouletteDisplayName] = useState('');
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);
  const [rouletteTarget, setRouletteTarget] = useState<Player | null>(null);
  // Joker Victime (-15 Pts) : sélecteur manuel
  const [showVictimPicker, setShowVictimPicker] = useState(false);
  // Joueur forcé — overrides le joueur affiché pour cette carte uniquement
  const [forcedPlayerIndex, setForcedPlayerIndex] = useState<number | null>(null);

  // ⏱️ Timer "Patate Chaude" — 15 secondes pour répondre
  const [timerModeEnabled, setTimerModeEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [showGageAlert, setShowGageAlert] = useState(false);
  const [currentGage, setCurrentGage] = useState<Gage | null>(null);

  const rollGage = async () => {
    const g = await gagesService.getRandomGage();
    setCurrentGage(g);
  };

  // Classement des joueurs par score décroissant
  const rankedPlayers = [...state.players].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

  // Joueur effectif : la victime désignée par un Joker, sinon le joueur normal du tour
  const effectivePlayer = forcedPlayerIndex !== null
    ? (state.players[forcedPlayerIndex] ?? currentPlayer)
    : currentPlayer;

  const currentQuestion = state.currentQuestionId
    ? questionEngine.getQuestionById(state.currentQuestionId)
    : null;

  // Calculer le nombre de cartes de la pioche (restantes) et défaussées
  const totalEligibleCount = useMemo(
    () =>
      questionEngine.getEligibleQuestions({
        categories: state.selectedCategories,
        playerCount: state.players.length,
        seenQuestionIds: [],
      }).length,
    [state.selectedCategories, state.players.length]
  );

  const discardCount = state.seenQuestionIds.length;
  const drawCount = Math.max(0, totalEligibleCount - discardCount);

  // Détection du Code Blague (ex: Sam -> Game Over)
  useEffect(() => {
    async function checkJoke() {
      if (!currentPlayer?.name) {
        setActiveJoke(null);
        return;
      }

      const joke = await jokeEngine.getJokeForPlayer(currentPlayer.name);
      setActiveJoke(joke && joke.type === 'GAME_OVER' ? joke : null);
    }

    checkJoke();
  }, [currentPlayer?.name]);

  // useEffect Timer Patate Chaude — reset à chaque nouvelle question, décompte 15→0
  useEffect(() => {
    if (!timerModeEnabled || !currentQuestion) {
      setTimeLeft(15);
      setShowGageAlert(false);
      return;
    }

    setTimeLeft(15);
    setShowGageAlert(false);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          rollGage();
          setShowGageAlert(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion?.id, timerModeEnabled]);

  // Vérifier si la question actuelle est en favori
  useEffect(() => {
    async function checkFav() {
      if (!state.currentQuestionId) return;
      const fav = await favoritesService.isFavorite(state.currentQuestionId);
      setIsFavorite(fav);
    }
    checkFav();
  }, [state.currentQuestionId]);

  // Basculer l'état favori
  const handleToggleFavorite = async () => {
    if (!state.currentQuestionId) return;
    const newStatus = await favoritesService.toggleFavorite(state.currentQuestionId);
    setIsFavorite(newStatus);
  };

  // Piocher la question suivante (avec ou sans rotation de joueur)
  const drawNext = (advancePlayer: boolean = true) => {
    if (advancePlayer) {
      setForcedPlayerIndex(null);
      nextPlayer();
    }

    const nextQ = questionEngine.getNextQuestion({
      categories: state.selectedCategories,
      playerCount: state.players.length,
      seenQuestionIds: state.seenQuestionIds,
      lastCategory: currentQuestion?.category,
    });

    if (nextQ) {
      setCurrentQuestion(nextQ.id);
      markQuestionSeen(nextQ.id);
    } else {
      setCurrentQuestion('');
    }
  };

  // Obtenir la question suivante & attribuer +1 Pt si points activés
  const handleNextQuestion = () => {
    if (currentQuestion) {
      setPlayedHistory((prev) => [
        {
          id: currentQuestion.id,
          text: questionEngine.formatQuestionText(currentQuestion.text, effectivePlayer?.name, state.players),
          category: currentQuestion.category,
          playerName: effectivePlayer?.name,
          result: 'validated',
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    }
    if (state.pointsEnabled && effectivePlayer) {
      addPlayerPoints(effectivePlayer.id, 1);
    }
    drawNext(true);
  };

  // Réponse insatisfaisante / langue de bois (+0 Pt)
  const handleUnsatisfactoryResponse = () => {
    if (currentQuestion) {
      setPlayedHistory((prev) => [
        {
          id: currentQuestion.id,
          text: questionEngine.formatQuestionText(currentQuestion.text, effectivePlayer?.name, state.players),
          category: currentQuestion.category,
          playerName: effectivePlayer?.name,
          result: 'tongue_in_cheek',
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    }
    drawNext(true);
  };

  // Passer la question sans changer de joueur
  const handleSkipQuestion = () => {
    if (currentQuestion) {
      setPlayedHistory((prev) => [
        {
          id: currentQuestion.id,
          text: questionEngine.formatQuestionText(currentQuestion.text, effectivePlayer?.name, state.players),
          category: currentQuestion.category,
          playerName: effectivePlayer?.name,
          result: 'skipped',
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    }
    drawNext(false);
  };

  // Raccourci clavier : Appuyer sur la touche Espace pour changer de question
  const handleNextQuestionRef = useRef(handleNextQuestion);
  useEffect(() => {
    handleNextQuestionRef.current = handleNextQuestion;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ne déclencher le raccourci que si l'utilisateur n'est pas en train de taper dans un champ de texte
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        handleNextQuestionRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ── Joker Hasard (-10 Pts) : roulette aléatoire, joueur actuel exclu ────────
  const isJokerRandomAvailable = !!currentQuestion && (currentPlayer?.points ?? 0) >= 10 && forcedPlayerIndex === null;

  const handleJokerRandom = () => {
    if (!currentPlayer || !isJokerRandomAvailable) return;

    const otherPlayers = state.players.filter((_, i) => i !== state.currentPlayerIndex);
    if (otherPlayers.length === 0) return;

    // Choisir la victime aléatoirement
    const targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
    const targetPlayerIndex = state.players.findIndex((p) => p.id === targetPlayer.id);

    // Déduire -10 Pts au joueur qui utilise le Joker
    deductPlayerPoints(currentPlayer.id, 10);

    // Lancer l'overlay roulette
    setRouletteTarget(targetPlayer);
    setIsRouletteSpinning(true);
    setShowRouletteOverlay(true);
    setRouletteDisplayName(otherPlayers[0].name);

    // Animation : les noms défilent rapidement puis ralentissent progressivement
    let speed = 80;
    let nameIdx = 0;
    let totalElapsed = 0;
    const spinDuration = 2500;

    const spin = () => {
      setRouletteDisplayName(otherPlayers[nameIdx % otherPlayers.length].name);
      nameIdx++;
      totalElapsed += speed;
      speed = Math.min(speed * 1.09, 480);

      if (totalElapsed < spinDuration) {
        setTimeout(spin, speed);
      } else {
        // Atterrissage sur la cible
        setRouletteDisplayName(targetPlayer.name);
        setIsRouletteSpinning(false);
        setForcedPlayerIndex(targetPlayerIndex);
      }
    };

    setTimeout(spin, speed);
  };

  // ── Joker Victime (-15 Pts) : sélecteur manuel de la victime ─────────────────
  const isJokerVictimAvailable = !!currentQuestion && (currentPlayer?.points ?? 0) >= 15 && forcedPlayerIndex === null;

  const handleJokerVictim = (targetPlayer: Player) => {
    if (!currentPlayer) return;
    const targetPlayerIndex = state.players.findIndex((p) => p.id === targetPlayer.id);
    deductPlayerPoints(currentPlayer.id, 15);
    setForcedPlayerIndex(targetPlayerIndex);
    setShowVictimPicker(false);
  };

  // Quitter la partie
  const handleQuit = () => {
    router.replace('/');
  };

  return (
    <ScreenContainer>
      {/* Barre supérieure conviviale */}
      <View style={[styles.topBar, !isDesktop && styles.topBarMobile]}>
        <TouchableOpacity
          onPress={handleQuit}
          style={styles.quitButton}
          accessibilityLabel="Quitter la partie et revenir à l'accueil"
        >
          <Text style={[styles.quitText, !isDesktop && styles.quitTextMobile]}>
            {isDesktop ? '🏠 Accueil' : '🏠'}
          </Text>
        </TouchableOpacity>

        {state.pointsEnabled && (
          <TouchableOpacity
            onPress={() => setShowPodium(true)}
            style={[styles.finishButton, !isDesktop && styles.finishButtonMobile]}
            accessibilityLabel="Finir la partie et afficher le podium des scores"
          >
            <Text style={[styles.finishText, !isDesktop && styles.finishTextMobile]}>
              {isDesktop ? '🏁 Terminer la partie' : '🏁 Finir'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Badge catégorie courante */}
        {currentQuestion && (
          <View style={[styles.modeBadge, !isDesktop && styles.modeBadgeMobile]}>
            <Text style={[styles.modeBadgeText, !isDesktop && styles.modeBadgeTextMobile]}>
              {currentQuestion.category.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Zone centrale : Tabletop 3 Paquets (Pioche - Carte Active - Défausse) */}
      {currentQuestion ? (
        <View style={styles.gameArea}>
          {isDesktop ? (
            /* Mode Tabletop 3 colonnes pour grand écran */
            <View style={styles.tabletopRow}>
              <CardDeck type="draw" count={drawCount} />

              <View style={styles.centerSlot}>
                <QuestionCard
                  question={currentQuestion}
                  currentPlayerName={effectivePlayer?.name}
                  currentPlayerPoints={effectivePlayer?.points}
                  allPlayers={state.players}
                  pointsEnabled={state.pointsEnabled}
                />
              </View>

              <CardDeck type="discard" count={discardCount} />
            </View>
          ) : (
            /* Mode Mobile compact */
            <View style={styles.mobileGameContainer}>
              <View style={styles.mobileDeckRow}>
                <CardDeck type="draw" count={drawCount} compact />
                <CardDeck type="discard" count={discardCount} compact />
              </View>

              <View style={styles.centerSlotMobile}>
                <QuestionCard
                  question={currentQuestion}
                  currentPlayerName={effectivePlayer?.name}
                  currentPlayerPoints={effectivePlayer?.points}
                  allPlayers={state.players}
                  pointsEnabled={state.pointsEnabled}
                />
              </View>
            </View>
          )}

          {/* Boutons d'actions sous la carte */}
          <View style={[styles.cardActions, !isDesktop && styles.cardActionsMobile]}>
            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={[styles.actionChip, !isDesktop && styles.actionChipMobile, isFavorite && styles.favoriteActive]}
              accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Text style={[styles.actionChipText, !isDesktop && styles.actionChipTextMobile]}>
                {isFavorite ? '❤️ Coup de cœur' : '🤍 Favori'}
              </Text>
            </TouchableOpacity>

            {state.pointsEnabled && (
              <>
                <TouchableOpacity
                  onPress={handleJokerRandom}
                  disabled={!isJokerRandomAvailable}
                  style={[
                    styles.actionChip,
                    !isDesktop && styles.actionChipMobile,
                    isJokerRandomAvailable ? styles.jokerActive : styles.jokerDisabled,
                  ]}
                  accessibilityLabel="Joker Hasard : passer la carte à un joueur aléatoire (-10 Pts)"
                >
                  <Text style={[styles.actionChipText, !isDesktop && styles.actionChipTextMobile]}>
                    🎲 Hasard -10
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowVictimPicker(true)}
                  disabled={!isJokerVictimAvailable}
                  style={[
                    styles.actionChip,
                    !isDesktop && styles.actionChipMobile,
                    isJokerVictimAvailable ? styles.jokerVictimActive : styles.jokerDisabled,
                  ]}
                  accessibilityLabel="Joker Victime : choisir qui répond à ta place (-15 Pts)"
                >
                  <Text style={[styles.actionChipText, !isDesktop && styles.actionChipTextMobile]}>
                    🎯 Cible -15
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={() => setShowPodium(true)}
              style={[styles.actionChip, !isDesktop && styles.actionChipMobile, styles.finishChip]}
              accessibilityLabel="Finir la partie et voir le podium"
            >
              <Text style={[styles.actionChipText, !isDesktop && styles.actionChipTextMobile]}>
                {state.pointsEnabled ? '🏆 Scores' : '🏁 Bilan'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTimerModeEnabled((prev) => !prev)}
              style={[
                styles.actionChip,
                !isDesktop && styles.actionChipMobile,
                timerModeEnabled && styles.timerChipActive,
              ]}
              accessibilityLabel="Activer ou désactiver le timer Patate Chaude 15 secondes"
            >
              <Text style={[styles.actionChipText, !isDesktop && styles.actionChipTextMobile]}>
                {timerModeEnabled ? `⏱️ ${timeLeft}s` : '🥔 Patate'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowHistoryModal(true)}
              style={[styles.actionChip, !isDesktop && styles.actionChipMobile]}
              accessibilityLabel="Consulter l'historique des cartes de la partie"
            >
              <Text style={[styles.actionChipText, !isDesktop && styles.actionChipTextMobile]}>
                📜 {playedHistory.length > 0 ? `${playedHistory.length}` : 'Historique'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bannière Joker actif — indique qui répond à la place du joueur actuel */}
          {forcedPlayerIndex !== null && (
            <View style={styles.jokerBanner}>
              <Text style={styles.jokerBannerText}>
                🎯 {state.players[forcedPlayerIndex]?.name} répond à la place de {currentPlayer?.name}
              </Text>
            </View>
          )}

          {/* Barre de progression Patate Chaude */}
          {timerModeEnabled && currentQuestion && (
            <View style={styles.timerBarContainer}>
              <View style={styles.timerBarBg}>
                <View
                  style={[
                    styles.timerBarFill,
                    timeLeft <= 5 && styles.timerBarFillUrgent,
                    { width: `${Math.round((timeLeft / 15) * 100)}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Boutons d'actions bienveillants et conviviaux */}
          <View style={styles.footer}>
            {state.pointsEnabled ? (
              <View style={styles.voteButtonsContainer}>
                <TouchableOpacity
                  onPress={handleNextQuestion}
                  style={[styles.voteButton, styles.satisfactoryButton]}
                  accessibilityLabel="Valider la réponse bien jouée (+1 Pt)"
                >
                  <Text style={styles.voteButtonText}>
                    {isDesktop ? '👏 BIEN JOUÉ ! (+1 Pt)' : '👏 Validé (+1)'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleUnsatisfactoryResponse}
                  style={[styles.voteButton, styles.unsatisfactoryButton]}
                  accessibilityLabel="Langue de bois ou passe son tour"
                >
                  <Text style={[styles.voteButtonText, styles.unsatisfactoryButtonText]}>
                    {isDesktop ? '🙈 LANGUE DE BOIS (0 Pt)' : '🙈 Passe (0)'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.voteButtonsContainer}>
                <TouchableOpacity
                  onPress={handleNextQuestion}
                  style={[styles.voteButton, styles.satisfactoryButton, { flex: 2 }]}
                  accessibilityLabel="Passer à la question suivante"
                >
                  <Text style={styles.voteButtonText}>✨ QUESTION SUIVANTE ➔</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSkipQuestion}
                  style={[styles.voteButton, styles.unsatisfactoryButton, { flex: 1 }]}
                  accessibilityLabel="Passer cette carte"
                >
                  <Text style={[styles.voteButtonText, styles.unsatisfactoryButtonText]}>Passer ⏭️</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      ) : (
        /* Écran de fin de paquet */
        <View style={styles.exhaustedContainer}>
          <Text style={styles.exhaustedEmoji}>🎉</Text>
          <Text style={styles.exhaustedTitle}>
            Vous avez fait le tour de la sélection !
          </Text>
          <Text style={styles.exhaustedSubtitle}>
            Vous avez parcouru toutes les questions disponibles pour les catégories sélectionnées.
          </Text>

          <View style={styles.exhaustedActions}>
            <PrimaryButton
              label="Recommencer la pioche"
              onPress={() => {
                resetSession();
                router.replace('/setup/categories');
              }}
              style={styles.exhaustedButton}
            />
            <PrimaryButton
              label="Changer les catégories"
              onPress={() => router.push('/setup/categories')}
              variant="secondary"
              style={styles.exhaustedButton}
            />
          </View>
        </View>
      )}

      {/* Overlay Patate Chaude — Gage ! */}
      {showGageAlert && (
        <View style={styles.gageOverlay}>
          <View style={styles.gageCard}>
            <Text style={styles.gageEmoji}>⏱️</Text>
            <Text style={styles.gageTitle}>TROP LENT !</Text>
            <Text style={styles.gageMessage}>
              {effectivePlayer?.name ?? 'Le joueur'} n'a pas répondu à temps.{'\n'}Voici son gage :
            </Text>

            {currentGage && (
              <View style={styles.gageBox}>
                <Text style={styles.gageBoxText}>{currentGage.text}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={rollGage}
              style={styles.rerollGageButton}
              accessibilityLabel="Tirer un autre gage"
            >
              <Text style={styles.rerollGageText}>🎲 Tirer un autre gage</Text>
            </TouchableOpacity>

            <PrimaryButton
              label="Gage accepté → Joueur suivant"
              onPress={() => {
                setShowGageAlert(false);
                handleUnsatisfactoryResponse();
              }}
              style={{ width: '100%', marginBottom: spacing.xs }}
            />
            <TouchableOpacity
              onPress={() => {
                setShowGageAlert(false);
                setTimerModeEnabled(false);
                handleNextQuestion();
              }}
              style={styles.homeLinkButton}
            >
              <Text style={styles.homeLinkText}>Ignorer et donner les points</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Overlay Game Over (Code Blague) */}
      {activeJoke && (
        <View style={styles.jokeOverlay}>
          <View style={styles.jokeCard}>
            <Text style={styles.jokeEmoji}>{activeJoke.emoji}</Text>
            <Text style={styles.jokeTitle}>{activeJoke.title}</Text>
            <Text style={styles.jokeMessage}>{activeJoke.message}</Text>

            <View style={styles.jokeActions}>
              <PrimaryButton
                label="Recommencer la partie"
                onPress={() => {
                  setActiveJoke(null);
                  resetSession();
                  router.replace('/setup/categories');
                }}
                style={{ width: '100%' }}
              />
              <PrimaryButton
                label="Ignorer la blague et continuer"
                onPress={() => {
                  setActiveJoke(null);
                  handleNextQuestion();
                }}
                variant="secondary"
                style={{ width: '100%', marginTop: spacing.sm }}
              />
            </View>
          </View>
        </View>
      )}

      {/* Overlay Joker Hasard — Roulette animée 🎰 */}
      {showRouletteOverlay && (
        <View style={styles.jokerOverlay}>
          <View style={styles.jokerCard}>
            <Text style={styles.jokerCardEmoji}>🎰</Text>
            <Text style={styles.jokerCardTitle}>ROUE DU DESTIN</Text>

            {/* Slot animé avec les noms */}
            <View style={styles.rouletteSlot}>
              <Text style={styles.rouletteSlotName}>{rouletteDisplayName}</Text>
            </View>

            {!isRouletteSpinning && rouletteTarget ? (
              <>
                <Text style={styles.rouletteReveal}>
                  🎯 {rouletteTarget.name} répond !
                </Text>
                <Text style={styles.rouletteSubtitle}>
                  La carte lui est transmise... bonne chance 😬
                </Text>
                <PrimaryButton
                  label={`OK, c'est pour ${rouletteTarget.name} ! →`}
                  onPress={() => setShowRouletteOverlay(false)}
                  style={{ width: '100%' }}
                />
              </>
            ) : (
              <Text style={styles.rouletteSubtitle}>La roue tourne...</Text>
            )}
          </View>
        </View>
      )}

      {/* Overlay Joker Victime — Sélecteur de victime 😈 */}
      {showVictimPicker && (
        <View style={styles.jokerOverlay}>
          <View style={styles.jokerCard}>
            <Text style={styles.jokerCardEmoji}>😈</Text>
            <Text style={styles.jokerCardTitle}>CHOISIR TA VICTIME</Text>
            <Text style={styles.jokerCardSubtitle}>
              -15 Pts de ton score · {currentPlayer?.name} choisit
            </Text>

            {/* Grille des autres joueurs */}
            <View style={styles.victimGrid}>
              {state.players
                .filter((_, i) => i !== state.currentPlayerIndex)
                .map((player) => (
                  <TouchableOpacity
                    key={player.id}
                    onPress={() => handleJokerVictim(player)}
                    style={styles.victimChip}
                    accessibilityLabel={`Désigner ${player.name} comme victime`}
                  >
                    <Text style={styles.victimChipEmoji}>😈</Text>
                    <Text style={styles.victimChipName}>{player.name}</Text>
                    <Text style={styles.victimChipPoints}>⭐ {player.points ?? 0} Pts</Text>
                  </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
              onPress={() => setShowVictimPicker(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal du Podium des Scores */}
      <Modal
        visible={showPodium}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPodium(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.podiumCard}>
            <Text style={styles.podiumEmoji}>{state.pointsEnabled ? '🏆' : '🥂'}</Text>
            <Text style={styles.podiumTitle}>
              {state.pointsEnabled ? 'PODIUM DES SCORES' : 'FIN DE PARTIE'}
            </Text>
            <Text style={styles.podiumSubtitle}>
              {state.pointsEnabled
                ? (rankedPlayers[0] ? `${rankedPlayers[0].name} remporte la victoire ! 🎉` : 'Fin de la partie !')
                : 'Superbe session ! Merci pour ces beaux partages.'}
            </Text>

            <ScrollView style={styles.podiumList} showsVerticalScrollIndicator={false}>
              {rankedPlayers.map((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                return (
                  <View
                    key={player.id}
                    style={[
                      styles.podiumItem,
                      state.pointsEnabled && index === 0 && styles.firstPlaceItem,
                    ]}
                  >
                    <View style={styles.podiumLeft}>
                      <Text style={styles.podiumMedal}>{state.pointsEnabled ? medal : '✨'}</Text>
                      <Text style={styles.podiumPlayerName}>{player.name}</Text>
                    </View>
                    {state.pointsEnabled && (
                      <Text style={styles.podiumScore}>⭐ {player.points ?? 0} Pts</Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.podiumActions}>
              {playedHistory.length > 0 && (
                <PrimaryButton
                  label={`📜 REVOIR LES CARTES (${playedHistory.length})`}
                  variant="secondary"
                  onPress={() => setShowHistoryModal(true)}
                  style={{ width: '100%', marginBottom: spacing.xs }}
                />
              )}
              <PrimaryButton
                label="🔄 NOUVELLE PARTIE"
                onPress={() => {
                  setShowPodium(false);
                  resetSession();
                  router.replace('/setup/categories');
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  setShowPodium(false);
                  resetSession();
                  router.replace('/');
                }}
                style={styles.homeLinkButton}
              >
                <Text style={styles.homeLinkText}>🏠 Écran d'accueil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Historique des questions de la session */}
      <Modal
        visible={showHistoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.historyCard, !isDesktop && styles.historyCardMobile]}>
            <View style={styles.historyHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle}>📜 CARTES JOUÉES</Text>
                <Text style={styles.historySubtitle}>
                  {playedHistory.length} question{playedHistory.length > 1 ? 's' : ''} tirée{playedHistory.length > 1 ? 's' : ''} dans cette session
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowHistoryModal(false)}
                style={styles.historyCloseButton}
              >
                <Text style={styles.historyCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {playedHistory.length === 0 ? (
              <View style={styles.historyEmpty}>
                <Text style={styles.historyEmptyEmoji}>🃏</Text>
                <Text style={styles.historyEmptyText}>Aucune carte n'a encore été jouée !</Text>
              </View>
            ) : (
              <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
                {playedHistory.map((item, index) => {
                  const cfg = CATEGORY_CONFIGS[item.category] || CATEGORY_CONFIGS.fun;
                  return (
                    <View key={`${item.id}-${index}`} style={styles.historyItem}>
                      <View style={styles.historyItemHeader}>
                        <View style={[styles.historyBadge, { backgroundColor: cfg.badgeBg, borderColor: cfg.color }]}>
                          <Text style={[styles.historyBadgeText, { color: cfg.color }]}>
                            {cfg.emoji ? `${cfg.emoji} ` : ''}{cfg.label}
                          </Text>
                        </View>
                        <Text style={styles.historyItemPlayer}>
                          {item.playerName ? `🎤 ${item.playerName}` : '👥 Groupe'}
                        </Text>
                      </View>

                      <Text style={styles.historyItemText}>« {item.text} »</Text>

                      <View style={styles.historyItemFooter}>
                        <Text style={styles.historyIdText}>#{item.id}</Text>
                        {item.result === 'validated' && (
                          <Text style={[styles.historyResultText, { color: '#30D158' }]}>👍 Validé</Text>
                        )}
                        {item.result === 'tongue_in_cheek' && (
                          <Text style={[styles.historyResultText, { color: '#FF9F0A' }]}>👎 Langue de bois</Text>
                        )}
                        {item.result === 'skipped' && (
                          <Text style={[styles.historyResultText, { color: colors.textTertiary }]}>⏭️ Passée</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.historyActions}>
              <PrimaryButton
                label="Fermer"
                onPress={() => setShowHistoryModal(false)}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  topBarMobile: {
    paddingVertical: spacing.xs,
  },
  quitButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  quitText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  quitTextMobile: {
    fontSize: typography.sizes.sm,
  },
  modeBadge: {
    backgroundColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  modeBadgeMobile: {
    paddingHorizontal: spacing.sm,
  },
  modeBadgeText: {
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },
  modeBadgeTextMobile: {
    fontSize: 10,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tabletopRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  centerSlot: {
    flex: 1,
    height: '100%',
    marginHorizontal: spacing.sm,
  },
  mobileGameContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  mobileDeckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  centerSlotMobile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardActionsMobile: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  actionChipMobile: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  favoriteActive: {
    backgroundColor: colors.favoriteMuted,
    borderColor: colors.favorite,
  },
  jokerActive: {
    backgroundColor: 'rgba(255, 214, 10, 0.18)',
    borderColor: '#FFD60A',
  },
  jokerDisabled: {
    opacity: 0.35,
  },
  finishChip: {
    backgroundColor: 'rgba(255, 214, 10, 0.22)',
    borderColor: '#FFD60A',
  },
  actionChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  actionChipTextMobile: {
    fontSize: typography.sizes.xs,
  },
  footer: {
    width: '100%',
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  voteButtonsContainer: {
    width: '100%',
    maxWidth: 560,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  voteButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satisfactoryButton: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  unsatisfactoryButton: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderWidth: 1.5,
    borderColor: '#FF453A',
  },
  voteButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  unsatisfactoryButtonText: {
    color: '#FF453A',
  },
  exhaustedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  exhaustedEmoji: {
    fontSize: 64,
  },
  exhaustedTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  exhaustedSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
    marginBottom: spacing.lg,
  },
  exhaustedActions: {
    width: '100%',
    gap: spacing.sm,
  },
  exhaustedButton: {
    width: '100%',
  },
  jokeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 999,
  },
  jokeCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xxl,
    borderWidth: 2,
    borderColor: colors.danger,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
  },
  jokeEmoji: {
    fontSize: 56,
  },
  jokeTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.danger,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  jokeMessage: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  jokeActions: {
    width: '100%',
    marginTop: spacing.md,
  },
  finishButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255, 214, 10, 0.18)',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#FFD60A',
  },
  finishButtonMobile: {
    paddingHorizontal: spacing.sm,
  },
  finishText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#FFD60A',
  },
  finishTextMobile: {
    fontSize: typography.sizes.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 13, 18, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  podiumCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xxl,
    borderWidth: 2,
    borderColor: colors.accent,
    padding: spacing.xl,
    alignItems: 'center',
  },
  podiumEmoji: {
    fontSize: 54,
  },
  podiumTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    letterSpacing: -0.5,
  },
  podiumSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.accentLight,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  podiumList: {
    width: '100%',
    marginVertical: spacing.sm,
  },
  podiumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  firstPlaceItem: {
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    borderColor: '#FFD60A',
  },
  podiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  podiumMedal: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  podiumPlayerName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  podiumScore: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    color: '#FFD60A',
  },
  podiumActions: {
    width: '100%',
    marginTop: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  homeLinkButton: {
    paddingVertical: spacing.sm,
  },
  homeLinkText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },

  // ── Timer Patate Chaude ───────────────────────────────────
  timerBarContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  timerBarBg: {
    height: 6,
    backgroundColor: colors.surfaceBorder,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: 6,
    backgroundColor: colors.success,
    borderRadius: radii.full,
  },
  timerBarFillUrgent: {
    backgroundColor: colors.danger,
  },
  timerChipActive: {
    backgroundColor: 'rgba(255, 69, 58, 0.18)',
    borderColor: colors.danger,
  },

  // ── Joker Victime active style ────────────────────────────────
  jokerVictimActive: {
    backgroundColor: 'rgba(255, 69, 58, 0.18)',
    borderColor: '#FF453A',
  },

  // ── Bannière Joker actif ──────────────────────────────────────
  jokerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 214, 10, 0.12)',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#FFD60A',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  jokerBannerText: {
    fontSize: typography.sizes.sm,
    color: '#FFD60A',
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },

  // ── Joker Overlays ────────────────────────────────────────────
  jokerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 999,
  },
  jokerCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xxl,
    borderWidth: 2,
    borderColor: '#FFD60A',
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    gap: spacing.md,
  },
  jokerCardEmoji: {
    fontSize: 56,
  },
  jokerCardTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: '#FFD60A',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  jokerCardSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Roulette
  rouletteSlot: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: '#FFD60A',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 72,
    justifyContent: 'center',
  },
  rouletteSlotName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  rouletteReveal: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: '#FFD60A',
    textAlign: 'center',
  },
  rouletteSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Victim picker
  victimGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  victimChip: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: 4,
    minWidth: 100,
  },
  victimChipEmoji: {
    fontSize: 28,
  },
  victimChipName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  victimChipPoints: {
    fontSize: typography.sizes.xs,
    color: '#FFD60A',
    fontWeight: typography.weights.semibold,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },

  // ── Gage Overlay ─────────────────────────────────────────
  gageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 999,
  },
  gageCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xxl,
    borderWidth: 2,
    borderColor: colors.warning,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
  },
  gageEmoji: {
    fontSize: 56,
  },
  gageTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.warning,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  gageMessage: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  gageBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.35)',
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  gageBoxText: {
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  rerollGageButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  rerollGageText: {
    color: '#FF9F0A',
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  historyCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: 'space-between',
  },
  historyCardMobile: {
    padding: spacing.md,
    maxHeight: '90%',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  historyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  historySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyCloseButton: {
    padding: spacing.xs,
  },
  historyCloseText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  historyEmpty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyEmptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  historyEmptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  historyList: {
    flex: 1,
    marginBottom: spacing.md,
  },
  historyItem: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  historyItemPlayer: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  historyItemText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    marginVertical: spacing.xs,
  },
  historyItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  historyIdText: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: 'monospace',
  },
  historyResultText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  historyActions: {
    marginTop: spacing.xs,
  },
});
