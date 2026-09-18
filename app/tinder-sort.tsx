// app/tinder-sort.tsx
// Mode Temporaire de Tri des Cartes style Tinder
// Swipe droite = Garder (reste en jeu) | Swipe gauche = Jeter (automatiquement exclu du jeu)
// Support complet de l'Édition personnalisée de chaque question (✏️ Modifier)

import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import { questions } from '../data/questions';
import { questionEngine } from '../services/questionEngine';
import { tinderSortService, type TinderSortState } from '../services/tinderSortService';
import { CATEGORY_CONFIGS, type QuestionCategory } from '../types/game';
import type { Question } from '../types/question';

const CATEGORY_LABELS: Record<string, string> = {
  fun: 'Fun 🥳',
  future: 'Avenir 🔮',
  personality: 'Personnalité 👤',
  relationships: 'Relations 🤝',
  hypothetical: 'Dilemme 🌀',
  debate: 'Débat ⚖️',
  memories: 'Souvenir 📜',
  dreams: 'Rêve 🌟',
  flirt: 'Flirt 😏',
  lifestyle: 'Mode de vie 🌿',
  gossip: 'Extrême Potin 🔥',
  philosophy: 'Philosophie 🧠',
  hot: 'Hot 🌶️',
};

const SWIPE_THRESHOLD = 90;

export default function TinderSortScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = windowWidth >= 768;

  // Largeur et hauteur adaptatives de la carte Tinder
  const cardWidth = Math.min(windowWidth - 32, isDesktop ? 480 : 380);
  const cardHeight = Math.min(windowHeight * 0.54, 520);

  // État du tri et des éditions
  const [sortState, setSortState] = useState<TinderSortState>({
    keptIds: [],
    rejectedIds: [],
    history: [],
    editedQuestions: {},
  });

  // Filtres
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'all'>('all');
  const [viewFilter, setViewFilter] = useState<'unprocessed' | 'all'>('unprocessed');

  // Modals & feedback
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryTab, setSummaryTab] = useState<'stats' | 'rejected' | 'kept' | 'edited'>('stats');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal d'Édition de question
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editedTextDraft, setEditedTextDraft] = useState('');

  // Animation values pour la carte active
  const pan = useRef(new Animated.ValueXY()).current;
  const nextCardOpacity = useRef(new Animated.Value(0.85)).current;
  const nextCardScale = useRef(new Animated.Value(0.94)).current;

  // Charger l'état au montage
  useEffect(() => {
    const init = async () => {
      const state = await tinderSortService.getSortState();
      setSortState(state);
    };
    init();

    const unsubscribe = tinderSortService.subscribe((updated) => {
      setSortState(updated);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Ouvrir le modal d'édition
  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setEditedTextDraft(q.text);
  };

  // Enregistrer le texte modifié
  const handleSaveEdit = async () => {
    if (!editingQuestion || !editedTextDraft.trim()) return;
    const updated = await tinderSortService.updateQuestionText(editingQuestion.id, editedTextDraft);
    setSortState(updated);
    setEditingQuestion(null);
    showToast(`✏️ Question #${editingQuestion.id} modifiée avec succès !`);
  };

  // Rétablir le texte d'origine
  const handleResetQuestionText = async (questionId: string) => {
    const updated = await tinderSortService.resetQuestionText(questionId);
    setSortState(updated);
    const orig = tinderSortService.getOriginalText(questionId);
    if (editingQuestion && editingQuestion.id === questionId) {
      setEditedTextDraft(orig);
    }
    showToast(`🔄 Texte d'origine rétabli pour #${questionId}`);
  };

  // Liste ordonnée des questions filtrées
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;

      const isProcessed = sortState.keptIds.includes(q.id) || sortState.rejectedIds.includes(q.id);
      if (viewFilter === 'unprocessed' && isProcessed) return false;

      return true;
    });
  }, [selectedCategory, viewFilter, sortState.keptIds, sortState.rejectedIds]);

  // Carte active au dessus de la pile et les cartes suivantes
  const currentCard = filteredQuestions[0] || null;
  const secondCard = filteredQuestions[1] || null;
  const thirdCard = filteredQuestions[2] || null;

  // Reset de la position de la carte
  const resetPosition = useCallback(() => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      friction: 6,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [pan]);

  // Traiter un choix (Garder ou Jeter)
  const handleDecision = useCallback(
    async (action: 'keep' | 'reject', questionToProcess: Question) => {
      const updated = await tinderSortService.markCard(questionToProcess.id, action);
      setSortState(updated);
      pan.setValue({ x: 0, y: 0 });

      // Animer l'apparition de la prochaine carte
      nextCardScale.setValue(0.94);
      nextCardOpacity.setValue(0.85);
      Animated.parallel([
        Animated.spring(nextCardScale, { toValue: 1, friction: 6, useNativeDriver: false }),
        Animated.timing(nextCardOpacity, { toValue: 1, duration: 150, useNativeDriver: false }),
      ]).start();
    },
    [nextCardOpacity, nextCardScale, pan]
  );

  // Déclencher le swipe avec animation complète
  const triggerSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!currentCard) return;
      const targetX = direction === 'right' ? windowWidth + 150 : -windowWidth - 150;
      const action = direction === 'right' ? 'keep' : 'reject';

      Animated.timing(pan, {
        toValue: { x: targetX, y: 30 },
        duration: 220,
        useNativeDriver: false,
      }).start(() => {
        handleDecision(action, currentCard);
      });
    },
    [currentCard, handleDecision, pan, windowWidth]
  );

  // Annuler la dernière action (Undo)
  const handleUndo = async () => {
    if (sortState.history.length === 0) {
      showToast('ℹ️ Rien à annuler');
      return;
    }
    const { state: updated, undoneCardId } = await tinderSortService.undoLastAction();
    setSortState(updated);
    pan.setValue({ x: 0, y: 0 });
    const undoneQuestion = questions.find((q) => q.id === undoneCardId);
    showToast(`↩️ Choix annulé pour ${undoneQuestion ? `la carte #${undoneQuestion.id}` : 'la carte'}`);
  };

  // Restaurer une carte rejetée
  const handleRestoreCard = async (questionId: string) => {
    const updated = await tinderSortService.restoreCard(questionId);
    setSortState(updated);
    showToast(`✅ Carte #${questionId} réintégrée au jeu !`);
  };

  // Copier au presse-papier
  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`📋 ${label} copié dans le presse-papier !`);
    } else {
      showToast(`📋 Copié !`);
    }
  };

  // Configurer le PanResponder pour le glissement tactile / souris
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6,
        onPanResponderMove: (_, gesture) => {
          pan.setValue({ x: gesture.dx, y: gesture.dy * 0.4 });
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > SWIPE_THRESHOLD) {
            // Swipe Droite -> Garder
            Animated.timing(pan, {
              toValue: { x: windowWidth + 120, y: gesture.dy },
              duration: 200,
              useNativeDriver: false,
            }).start(() => {
              if (currentCard) handleDecision('keep', currentCard);
            });
          } else if (gesture.dx < -SWIPE_THRESHOLD) {
            // Swipe Gauche -> Jeter (exclure du jeu)
            Animated.timing(pan, {
              toValue: { x: -windowWidth - 120, y: gesture.dy },
              duration: 200,
              useNativeDriver: false,
            }).start(() => {
              if (currentCard) handleDecision('reject', currentCard);
            });
          } else {
            resetPosition();
          }
        },
      }),
    [currentCard, handleDecision, pan, resetPosition, windowWidth]
  );

  // Raccourcis clavier sur Web (Flèche Gauche = Jeter, Flèche Droite = Garder, E = Modifier, Z = Undo)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        triggerSwipe('right');
      } else if (e.key === 'ArrowLeft' || e.key === 'q' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        triggerSwipe('left');
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (currentCard) handleOpenEdit(currentCard);
      } else if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, triggerSwipe]);

  // Interpolations visuelles pour la carte en glissement
  const rotate = pan.x.interpolate({
    inputRange: [-windowWidth * 0.7, 0, windowWidth * 0.7],
    outputRange: ['-16deg', '0deg', '16deg'],
    extrapolate: 'clamp',
  });

  const keepOpacity = pan.x.interpolate({
    inputRange: [20, SWIPE_THRESHOLD * 0.9],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const rejectOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD * 0.9, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Statistiques globales
  const totalQuestionsCount = questions.length;
  const keptCount = sortState.keptIds.length;
  const rejectedCount = sortState.rejectedIds.length;
  const editedCount = Object.keys(sortState.editedQuestions || {}).length;
  const processedCount = keptCount + rejectedCount;
  const remainingCount = Math.max(0, totalQuestionsCount - processedCount);
  const progressPercent = Math.round((processedCount / totalQuestionsCount) * 100);

  return (
    <ScreenContainer>
      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Barre supérieure */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Retour à l'accueil"
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>🔥 Tri Express</Text>
          <Text style={styles.screenSubtitle}>Mode Tinder • Tri & Édition</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowSummaryModal(true)}
          style={styles.summaryButton}
          accessibilityLabel="Voir le bilan et exporter"
        >
          <Text style={styles.summaryButtonText}>📊 Bilan</Text>
        </TouchableOpacity>
      </View>

      {/* Règle & Explication rapide */}
      <View style={styles.bannerNotice}>
        <Text style={styles.bannerEmoji}>⚠️</Text>
        <Text style={styles.bannerText}>
          <Text style={styles.bannerBold}>Swipe Gauche (❌)</Text> = Bannie des parties •{' '}
          <Text style={styles.bannerBoldEdit}>Bouton ✏️</Text> = Modifier le texte de la question.
        </Text>
      </View>

      {/* Barre de filtres par Catégorie */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.filterChipText, selectedCategory === 'all' && styles.filterChipTextActive]}>
              Tous les thèmes
            </Text>
          </TouchableOpacity>

          {(Object.keys(CATEGORY_CONFIGS) as QuestionCategory[]).map((catId) => {
            const cfg = CATEGORY_CONFIGS[catId];
            const isActive = selectedCategory === catId;
            return (
              <TouchableOpacity
                key={catId}
                style={[
                  styles.filterChip,
                  isActive && {
                    borderColor: cfg.color,
                    backgroundColor: cfg.badgeBg,
                  },
                ]}
                onPress={() => setSelectedCategory(catId)}
              >
                <Text style={[styles.filterChipText, isActive && { color: cfg.color, fontWeight: 'bold' }]}>
                  {cfg.emoji} {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Barre de progression & Compteurs */}
      <View style={styles.statsRow}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {processedCount} / {totalQuestionsCount} triées ({progressPercent}%) • {editedCount} modifiée{editedCount > 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.countersRow}>
          <View style={[styles.counterPill, styles.counterKept]}>
            <Text style={styles.counterText}>💚 {keptCount} gardées</Text>
          </View>
          <View style={[styles.counterPill, styles.counterRejected]}>
            <Text style={styles.counterText}>❌ {rejectedCount} exclues</Text>
          </View>
          <View style={[styles.counterPill, styles.counterEdited]}>
            <Text style={styles.counterText}>✏️ {editedCount} éditées</Text>
          </View>
          <View style={[styles.counterPill, styles.counterRemaining]}>
            <Text style={styles.counterText}>⏳ {remainingCount} rest.</Text>
          </View>
        </View>
      </View>

      {/* Zone centrale : Pile de cartes Tinder */}
      <View style={styles.deckContainer}>
        {currentCard ? (
          <View style={[styles.cardStack, { width: cardWidth, height: cardHeight }]}>
            {/* 3ème carte en fond (décorative) */}
            {thirdCard && (
              <View
                style={[
                  styles.cardFrame,
                  styles.thirdCardShadow,
                  { width: cardWidth, height: cardHeight },
                ]}
              />
            )}

            {/* 2ème carte en fond */}
            {secondCard && (
              <Animated.View
                style={[
                  styles.cardFrame,
                  styles.secondCardShadow,
                  {
                    width: cardWidth,
                    height: cardHeight,
                    opacity: nextCardOpacity,
                    transform: [{ scale: nextCardScale }],
                  },
                ]}
              >
                <RenderCardInner
                  question={secondCard}
                  isEdited={!!sortState.editedQuestions[secondCard.id]}
                />
              </Animated.View>
            )}

            {/* Carte Active au premier plan avec PanResponder */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.cardFrame,
                styles.activeCard,
                {
                  width: cardWidth,
                  height: cardHeight,
                  transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
                },
                currentCard.intensity === 6 && styles.goldCardBorder,
              ]}
            >
              {/* Tampon Vert "GARDER" */}
              <Animated.View style={[styles.stamp, styles.keepStamp, { opacity: keepOpacity }]}>
                <Text style={styles.keepStampText}>GARDER 👍</Text>
              </Animated.View>

              {/* Tampon Rouge "EXCLURE" */}
              <Animated.View style={[styles.stamp, styles.rejectStamp, { opacity: rejectOpacity }]}>
                <Text style={styles.rejectStampText}>JETER 🚫</Text>
              </Animated.View>

              {/* Contenu de la carte avec support d'édition */}
              <RenderCardInner
                question={currentCard}
                onEdit={handleOpenEdit}
                isEdited={!!sortState.editedQuestions[currentCard.id]}
              />
            </Animated.View>
          </View>
        ) : (
          /* Écran vide si toutes les cartes filtrées ont été triées */
          <View style={[styles.emptyContainer, { width: cardWidth, height: cardHeight }]}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>Toutes les cartes sont triées !</Text>
            <Text style={styles.emptySubtitle}>
              Tu as passé en revue l'ensemble des questions pour cette sélection.
            </Text>

            <View style={styles.emptyActions}>
              <TouchableOpacity
                style={styles.emptyButtonPrimary}
                onPress={() => setShowSummaryModal(true)}
              >
                <Text style={styles.emptyButtonPrimaryText}>📊 Voir le Bilan & Exporter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.emptyButtonSecondary}
                onPress={handleUndo}
              >
                <Text style={styles.emptyButtonSecondaryText}>↩️ Annuler le dernier swipe</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Boutons d'Action Inférieurs (Jeter / Modifier / Undo / Garder) */}
      <View style={styles.actionsBar}>
        {/* Bouton Jeter (Swipe Gauche) */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn, !currentCard && styles.actionBtnDisabled]}
          onPress={() => triggerSwipe('left')}
          disabled={!currentCard}
          accessibilityLabel="Jeter la carte et l'exclure des parties du jeu (Swipe gauche)"
        >
          <Text style={styles.actionBtnEmoji}>✕</Text>
          <Text style={styles.actionBtnSubtext}>Exclure</Text>
        </TouchableOpacity>

        {/* Bouton Modifier le texte */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn, !currentCard && styles.actionBtnDisabled]}
          onPress={() => currentCard && handleOpenEdit(currentCard)}
          disabled={!currentCard}
          accessibilityLabel="Modifier le texte de cette question"
        >
          <Text style={styles.actionBtnEmojiSmall}>✏️</Text>
          <Text style={styles.actionBtnSubtext}>Modifier</Text>
        </TouchableOpacity>

        {/* Bouton Annuler (Undo) */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.undoBtn,
            sortState.history.length === 0 && styles.actionBtnDisabled,
          ]}
          onPress={handleUndo}
          disabled={sortState.history.length === 0}
          accessibilityLabel="Annuler le dernier choix (Undo)"
        >
          <Text style={styles.undoBtnEmoji}>↩️</Text>
          <Text style={styles.actionBtnSubtext}>Annuler</Text>
        </TouchableOpacity>

        {/* Bouton Garder (Swipe Droite) */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.keepBtn, !currentCard && styles.actionBtnDisabled]}
          onPress={() => triggerSwipe('right')}
          disabled={!currentCard}
          accessibilityLabel="Garder la carte dans le jeu (Swipe droite)"
        >
          <Text style={styles.actionBtnEmoji}>♥</Text>
          <Text style={styles.actionBtnSubtext}>Garder</Text>
        </TouchableOpacity>
      </View>

      {/* Raccourcis clavier (Web) */}
      {Platform.OS === 'web' && (
        <View style={styles.keyboardHelp}>
          <Text style={styles.keyboardHelpText}>
            💡 Raccourcis : <Text style={styles.kbd}>←</Text> Jeter • <Text style={styles.kbd}>E</Text> Modifier • <Text style={styles.kbd}>→</Text> Garder • <Text style={styles.kbd}>Z</Text> Annuler
          </Text>
        </View>
      )}

      {/* MODAL DE MODIFICATION DE QUESTION */}
      <Modal
        visible={!!editingQuestion}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingQuestion(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>✏️ Modifier la question</Text>
                {editingQuestion && (
                  <Text style={styles.modalSub}>
                    #{editingQuestion.id} • {CATEGORY_LABELS[editingQuestion.category] ?? editingQuestion.category} • Niv {editingQuestion.intensity}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setEditingQuestion(null)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.editInputLabel}>Texte de la question :</Text>
            <TextInput
              style={styles.editTextInput}
              value={editedTextDraft}
              onChangeText={setEditedTextDraft}
              multiline
              numberOfLines={4}
              placeholder="Écris la nouvelle formulation de la question..."
              placeholderTextColor={colors.textTertiary}
            />

            <View style={styles.editHelperRow}>
              <Text style={styles.editHelperText}>
                {editedTextDraft.length} caractères • Mis à jour dans tout le jeu
              </Text>
            </View>

            {/* Comparaison avec l'original si modifiée */}
            {editingQuestion && tinderSortService.getOriginalText(editingQuestion.id) !== editedTextDraft && (
              <View style={styles.originalBox}>
                <Text style={styles.originalBoxTitle}>Texte initial par défaut :</Text>
                <Text style={styles.originalBoxText}>
                  {tinderSortService.getOriginalText(editingQuestion.id)}
                </Text>
                <TouchableOpacity
                  style={styles.revertInlineBtn}
                  onPress={() => handleResetQuestionText(editingQuestion.id)}
                >
                  <Text style={styles.revertInlineBtnText}>🔄 Rétablir le texte d'origine</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={styles.saveEditBtn}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveEditBtnText}>💾 Enregistrer la modification</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelEditBtn}
                onPress={() => setEditingQuestion(null)}
              >
                <Text style={styles.cancelEditBtnText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE BILAN & EXPORT */}
      <Modal
        visible={showSummaryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>📊 Bilan du Tri</Text>
                <Text style={styles.modalSub}>{totalQuestionsCount} questions au total</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSummaryModal(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Onglets Modal */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabBtn, summaryTab === 'stats' && styles.tabBtnActive]}
                onPress={() => setSummaryTab('stats')}
              >
                <Text style={[styles.tabBtnText, summaryTab === 'stats' && styles.tabBtnTextActive]}>
                  Statistiques
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, summaryTab === 'rejected' && styles.tabBtnActive]}
                onPress={() => setSummaryTab('rejected')}
              >
                <Text style={[styles.tabBtnText, summaryTab === 'rejected' && styles.tabBtnTextActive]}>
                  Exclues ({rejectedCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, summaryTab === 'kept' && styles.tabBtnActive]}
                onPress={() => setSummaryTab('kept')}
              >
                <Text style={[styles.tabBtnText, summaryTab === 'kept' && styles.tabBtnTextActive]}>
                  Gardées ({keptCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, summaryTab === 'edited' && styles.tabBtnActive]}
                onPress={() => setSummaryTab('edited')}
              >
                <Text style={[styles.tabBtnText, summaryTab === 'edited' && styles.tabBtnTextActive]}>
                  Éditées ({editedCount})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Contenu de l'onglet Statistiques */}
            {summaryTab === 'stats' && (
              <ScrollView style={styles.tabContent}>
                <View style={styles.summaryKpis}>
                  <View style={[styles.kpiCard, { borderColor: colors.success }]}>
                    <Text style={styles.kpiValue}>{keptCount}</Text>
                    <Text style={styles.kpiLabel}>Cartes Validées 💚</Text>
                    <Text style={styles.kpiSub}>Restent dans le jeu</Text>
                  </View>

                  <View style={[styles.kpiCard, { borderColor: colors.danger }]}>
                    <Text style={[styles.kpiValue, { color: colors.danger }]}>{rejectedCount}</Text>
                    <Text style={styles.kpiLabel}>Cartes Exclues ❌</Text>
                    <Text style={styles.kpiSub}>Bannies des tirages</Text>
                  </View>

                  <View style={[styles.kpiCard, { borderColor: colors.accent }]}>
                    <Text style={[styles.kpiValue, { color: colors.accentLight }]}>{editedCount}</Text>
                    <Text style={styles.kpiLabel}>Éditées ✏️</Text>
                    <Text style={styles.kpiSub}>Textes personnalisés</Text>
                  </View>
                </View>

                {/* Section Export Rapide */}
                <Text style={styles.sectionHeader}>Outils d'Exportation & Nettoyage</Text>
                <View style={styles.exportActions}>
                  <TouchableOpacity
                    style={styles.exportBtn}
                    onPress={() =>
                      copyToClipboard(
                        JSON.stringify(sortState.rejectedIds, null, 2),
                        'Liste des IDs exclus'
                      )
                    }
                  >
                    <Text style={styles.exportBtnText}>📋 Copier les IDs exclus (JSON)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.exportBtn}
                    onPress={() =>
                      copyToClipboard(
                        JSON.stringify(sortState.keptIds, null, 2),
                        'Liste des IDs gardés'
                      )
                    }
                  >
                    <Text style={styles.exportBtnText}>📋 Copier les IDs gardés (JSON)</Text>
                  </TouchableOpacity>

                  {editedCount > 0 && (
                    <TouchableOpacity
                      style={[styles.exportBtn, { borderColor: colors.accent }]}
                      onPress={() =>
                        copyToClipboard(
                          JSON.stringify(sortState.editedQuestions, null, 2),
                          'Questions modifiées'
                        )
                      }
                    >
                      <Text style={[styles.exportBtnText, { color: colors.accentLight }]}>
                        📋 Copier les questions modifiées (JSON)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Bouton de réinitialisation */}
                <TouchableOpacity
                  style={styles.resetSortBtn}
                  onPress={async () => {
                    await tinderSortService.resetSortState();
                    showToast('🔄 Tout le tri a été réinitialisé !');
                    setShowSummaryModal(false);
                  }}
                >
                  <Text style={styles.resetSortBtnText}>🔄 Réinitialiser tout le tri (Remettre à zéro)</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Contenu de l'onglet Cartes Exclues */}
            {summaryTab === 'rejected' && (
              <ScrollView style={styles.tabContent}>
                {sortState.rejectedIds.length === 0 ? (
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyListText}>Aucune carte n'est actuellement exclue du jeu.</Text>
                  </View>
                ) : (
                  sortState.rejectedIds.map((id) => {
                    const q = questions.find((item) => item.id === id);
                    if (!q) return null;
                    return (
                      <View key={id} style={styles.questionListItem}>
                        <View style={styles.itemTextCol}>
                          <View style={styles.itemMetaRow}>
                            <Text style={styles.itemIdBadge}>#{id}</Text>
                            <Text style={styles.itemCategoryBadge}>
                              {CATEGORY_LABELS[q.category] ?? q.category}
                            </Text>
                            <Text style={styles.itemIntensityBadge}>Niv {q.intensity}</Text>
                            {sortState.editedQuestions[id] && (
                              <Text style={styles.itemEditedBadge}>✏️ Éditée</Text>
                            )}
                          </View>
                          <Text style={styles.itemQuestionText}>{q.text}</Text>
                        </View>
                        <View style={styles.itemActionsCol}>
                          <TouchableOpacity
                            style={styles.editSmallBtn}
                            onPress={() => handleOpenEdit(q)}
                            accessibilityLabel={`Modifier la question ${id}`}
                          >
                            <Text style={styles.editSmallBtnText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.restoreBtn}
                            onPress={() => handleRestoreCard(id)}
                            accessibilityLabel={`Restaurer la question ${id}`}
                          >
                            <Text style={styles.restoreBtnText}>↩️ Restaurer</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}

            {/* Contenu de l'onglet Cartes Gardées */}
            {summaryTab === 'kept' && (
              <ScrollView style={styles.tabContent}>
                {sortState.keptIds.length === 0 ? (
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyListText}>Aucune carte n'a encore été marquée comme gardée.</Text>
                  </View>
                ) : (
                  sortState.keptIds.map((id) => {
                    const q = questions.find((item) => item.id === id);
                    if (!q) return null;
                    return (
                      <View key={id} style={styles.questionListItem}>
                        <View style={styles.itemTextCol}>
                          <View style={styles.itemMetaRow}>
                            <Text style={styles.itemIdBadge}>#{id}</Text>
                            <Text style={styles.itemCategoryBadge}>
                              {CATEGORY_LABELS[q.category] ?? q.category}
                            </Text>
                            <Text style={styles.itemIntensityBadge}>Niv {q.intensity}</Text>
                            {sortState.editedQuestions[id] && (
                              <Text style={styles.itemEditedBadge}>✏️ Éditée</Text>
                            )}
                          </View>
                          <Text style={styles.itemQuestionText}>{q.text}</Text>
                        </View>
                        <View style={styles.itemActionsCol}>
                          <TouchableOpacity
                            style={styles.editSmallBtn}
                            onPress={() => handleOpenEdit(q)}
                            accessibilityLabel={`Modifier la question ${id}`}
                          >
                            <Text style={styles.editSmallBtnText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.excludeFromKeptBtn}
                            onPress={() => handleDecision('reject', q)}
                            accessibilityLabel={`Exclure la question ${id}`}
                          >
                            <Text style={styles.excludeFromKeptBtnText}>❌ Exclure</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}

            {/* Contenu de l'onglet Cartes Éditées */}
            {summaryTab === 'edited' && (
              <ScrollView style={styles.tabContent}>
                {editedCount === 0 ? (
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyListText}>Aucune question n'a été modifiée pour le moment.</Text>
                    <Text style={styles.emptyListSubtext}>
                      Clique sur le bouton ✏️ ou sur le texte d'une carte pour la personnaliser !
                    </Text>
                  </View>
                ) : (
                  Object.entries(sortState.editedQuestions).map(([id, text]) => {
                    const q = questions.find((item) => item.id === id);
                    const orig = tinderSortService.getOriginalText(id);
                    return (
                      <View key={id} style={styles.questionListItem}>
                        <View style={styles.itemTextCol}>
                          <View style={styles.itemMetaRow}>
                            <Text style={styles.itemIdBadge}>#{id}</Text>
                            {q && (
                              <Text style={styles.itemCategoryBadge}>
                                {CATEGORY_LABELS[q.category] ?? q.category}
                              </Text>
                            )}
                            <Text style={styles.itemEditedBadge}>✏️ Modifiée</Text>
                          </View>
                          <Text style={styles.itemQuestionText}>{text}</Text>
                          {orig !== text && (
                            <Text style={styles.itemOriginalText}>Origine : {orig}</Text>
                          )}
                        </View>
                        <View style={styles.itemActionsCol}>
                          {q && (
                            <TouchableOpacity
                              style={styles.editSmallBtn}
                              onPress={() => handleOpenEdit(q)}
                            >
                              <Text style={styles.editSmallBtnText}>✏️</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.restoreBtn}
                            onPress={() => handleResetQuestionText(id)}
                          >
                            <Text style={styles.restoreBtnText}>🔄 Rétablir</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

// ─── COMPOSANT DU RECTANGLE INTÉRIEUR DE LA CARTE ──────────────────────────────
function RenderCardInner({
  question,
  onEdit,
  isEdited,
}: {
  question: Question;
  onEdit?: (q: Question) => void;
  isEdited?: boolean;
}) {
  const catConfig = CATEGORY_CONFIGS[question.category] || CATEGORY_CONFIGS.fun;

  return (
    <View style={[styles.cardInner, { borderColor: catConfig.badgeBg }]}>
      {/* Motifs filigranes aux 4 coins façon carte de poker */}
      <Text style={[styles.cornerMotif, styles.topLeft]}>♠ ♥</Text>
      <Text style={[styles.cornerMotif, styles.topRight]}>♦ ♣</Text>
      <Text style={[styles.cornerMotif, styles.bottomLeft]}>♦ ♣</Text>
      <Text style={[styles.cornerMotif, styles.bottomRight]}>♠ ♥</Text>

      {/* En-tête de la carte */}
      <View style={styles.cardHeader}>
        <View style={[styles.categoryBadge, { borderColor: catConfig.color, backgroundColor: catConfig.badgeBg }]}>
          <Text style={[styles.categoryBadgeText, { color: catConfig.color }]}>
            {catConfig.emoji} {catConfig.label}
          </Text>
        </View>

        <View style={styles.headerRightGroup}>
          {isEdited && (
            <View style={styles.editedBadgePill}>
              <Text style={styles.editedBadgeText}>✏️ Éditée</Text>
            </View>
          )}

          {onEdit && (
            <TouchableOpacity
              style={styles.cardEditPill}
              onPress={() => onEdit(question)}
              accessibilityLabel="Modifier cette question"
            >
              <Text style={styles.cardEditPillText}>✏️ Modifier</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Corps avec le texte de la question — cliquable pour modifier */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onEdit?.(question)}
        style={styles.cardBody}
      >
        <Text
          style={[
            styles.questionText,
            question.text.length > 140 && styles.questionTextSmaller,
          ]}
        >
          {question.text}
        </Text>
        {onEdit && (
          <Text style={styles.cardTapToEditHint}>Appuie pour modifier ✏️</Text>
        )}
      </TouchableOpacity>

      {/* Pied de carte avec ID et Thème */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardIdBadge}>#{question.id}</Text>
        <Text style={[styles.categorySubtext, { color: catConfig.color }]}>
          {catConfig.emoji} {catConfig.label}
        </Text>
      </View>
    </View>
  );
}

// ─── STYLES DU MODE TINDER ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  backButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  backButtonText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  titleContainer: {
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  summaryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accentMuted,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  summaryButtonText: {
    color: colors.accentLight,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  bannerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  bannerEmoji: {
    fontSize: 16,
  },
  bannerText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  bannerBold: {
    fontWeight: typography.weights.bold,
  },
  bannerBoldEdit: {
    fontWeight: typography.weights.bold,
    color: colors.accentLight,
  },
  filtersWrapper: {
    marginBottom: spacing.sm,
  },
  filtersScroll: {
    gap: spacing.xs,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  filterChipActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  filterChipTextActive: {
    color: colors.accentLight,
    fontWeight: typography.weights.bold,
  },
  filterDivider: {
    width: 1,
    height: 18,
    backgroundColor: colors.surfaceBorder,
    marginHorizontal: spacing.xs,
  },
  statsRow: {
    flexDirection: 'column',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    gap: 4,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  countersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  counterPill: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: radii.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  counterKept: {
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  counterRejected: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  counterEdited: {
    backgroundColor: 'rgba(123, 97, 255, 0.12)',
    borderColor: 'rgba(123, 97, 255, 0.3)',
  },
  counterRemaining: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.surfaceBorder,
  },
  counterText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },
  deckContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  cardStack: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFrame: {
    position: 'absolute',
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
    ...shadows.lg,
  },
  activeCard: {
    zIndex: 10,
  },
  secondCardShadow: {
    zIndex: 5,
    transform: [{ translateY: 8 }, { scale: 0.94 }],
  },
  thirdCardShadow: {
    zIndex: 1,
    transform: [{ translateY: 16 }, { scale: 0.88 }],
    opacity: 0.4,
  },
  goldCardBorder: {
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.6,
  },
  stamp: {
    position: 'absolute',
    top: 24,
    zIndex: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 3,
  },
  keepStamp: {
    left: 24,
    borderColor: colors.success,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    transform: [{ rotate: '-12deg' }],
  },
  keepStampText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 1,
  },
  rejectStamp: {
    right: 24,
    borderColor: colors.danger,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    transform: [{ rotate: '12deg' }],
  },
  rejectStampText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.danger,
    letterSpacing: 1,
  },
  cardInner: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
    backgroundColor: '#18181F',
    borderRadius: 22,
  },
  goldCardInner: {
    backgroundColor: '#FFF8DC',
  },
  cornerMotif: {
    position: 'absolute',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.12)',
  },
  goldMotif: {
    color: 'rgba(180, 140, 0, 0.25)',
  },
  topLeft: { top: 10, left: 12 },
  topRight: { top: 10, right: 12 },
  bottomLeft: { bottom: 10, left: 12 },
  bottomRight: { bottom: 10, right: 12 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  categoryBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editedBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    backgroundColor: 'rgba(123, 97, 255, 0.2)',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  editedBadgeText: {
    fontSize: 10,
    color: colors.accentLight,
    fontWeight: '700',
  },
  cardEditPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardEditPillText: {
    fontSize: 11,
    color: colors.accentLight,
    fontWeight: '600',
  },
  intensityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  intensityPillText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  goldIntensityPill: {
    backgroundColor: '#FFD700',
  },
  goldIntensityPillText: {
    color: '#000000',
    fontWeight: '800',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  questionText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
  },
  questionTextSmaller: {
    fontSize: typography.sizes.lg,
    lineHeight: 26,
  },
  goldQuestionText: {
    color: '#111111',
  },
  cardTapToEditHint: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: spacing.sm,
  },
  cardIdBadge: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  categorySubtext: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  goldCardIdBadge: {
    color: '#8B6508',
  },
  modesRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  modeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  modeTagText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyEmoji: {
    fontSize: 54,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  emptyButtonPrimary: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  emptyButtonPrimaryText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },
  emptyButtonSecondary: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  emptyButtonSecondaryText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionBtn: {
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  actionBtnDisabled: {
    opacity: 0.35,
  },
  rejectBtn: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderWidth: 2,
    borderColor: colors.danger,
  },
  keepBtn: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderWidth: 2,
    borderColor: colors.success,
  },
  editBtn: {
    width: 54,
    height: 54,
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  undoBtn: {
    width: 50,
    height: 50,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
  },
  actionBtnEmoji: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  actionBtnEmojiSmall: {
    fontSize: 18,
  },
  undoBtnEmoji: {
    fontSize: 18,
  },
  actionBtnSubtext: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: -2,
    fontWeight: typography.weights.semibold,
  },
  keyboardHelp: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  keyboardHelpText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  kbd: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  toastContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: '#2A2A38',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.accent,
    zIndex: 9999,
    ...shadows.lg,
  },
  toastText: {
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  editModalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  editInputLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  editTextInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    lineHeight: 24,
    padding: spacing.md,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  editHelperRow: {
    marginTop: 6,
    marginBottom: spacing.md,
  },
  editHelperText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  originalBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.md,
    gap: 4,
  },
  originalBoxTitle: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  originalBoxText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  revertInlineBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
  },
  revertInlineBtnText: {
    fontSize: 11,
    color: colors.accentLight,
    fontWeight: '600',
  },
  editModalButtons: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  saveEditBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  saveEditBtnText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  cancelEditBtn: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cancelEditBtnText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
  },
  tabBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  tabBtnTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
  },
  tabContent: {
    maxHeight: 460,
  },
  summaryKpis: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.success,
  },
  kpiLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
    marginTop: 4,
    textAlign: 'center',
  },
  kpiSub: {
    fontSize: 10,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exportActions: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  exportBtn: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  exportBtnText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  resetSortBtn: {
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.4)',
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  resetSortBtnText: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  emptyList: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyListText: {
    color: colors.textTertiary,
    fontSize: typography.sizes.sm,
  },
  emptyListSubtext: {
    color: colors.textTertiary,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  questionListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: spacing.sm,
  },
  itemTextCol: {
    flex: 1,
    gap: 4,
  },
  itemActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemIdBadge: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  itemCategoryBadge: {
    fontSize: 10,
    color: colors.accentLight,
    fontWeight: typography.weights.semibold,
  },
  itemIntensityBadge: {
    fontSize: 10,
    color: colors.warning,
  },
  itemEditedBadge: {
    fontSize: 10,
    color: colors.accentLight,
    fontWeight: '700',
  },
  itemQuestionText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  itemOriginalText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: 2,
  },
  editSmallBtn: {
    backgroundColor: colors.surface,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSmallBtnText: {
    fontSize: 14,
  },
  restoreBtn: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.success,
  },
  restoreBtnText: {
    color: colors.success,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  excludeFromKeptBtn: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  excludeFromKeptBtnText: {
    color: colors.danger,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
