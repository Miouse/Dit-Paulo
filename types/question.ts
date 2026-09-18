// types/question.ts
// Structure d'une question et métadonnées des catégories dans Dit-Paul ?

export type QuestionCategory =
  | 'fun'
  | 'lifestyle'
  | 'flirt'
  | 'relationships'
  | 'personality'
  | 'memories'
  | 'future'
  | 'dreams'
  | 'hypothetical'
  | 'debate'
  | 'philosophy'
  | 'gossip'
  | 'hot';

export interface CategoryConfig {
  id: QuestionCategory;
  label: string;
  emoji: string;
  description: string;
  color: string;
  badgeBg: string;
}

export const CATEGORY_CONFIGS: Record<QuestionCategory, CategoryConfig> = {
  fun: {
    id: 'fun',
    label: 'Fun & Insolite',
    emoji: '🥳',
    description: 'Histoires légères, questions drôles et situations absurdes',
    color: '#FF8C42',
    badgeBg: 'rgba(255, 140, 66, 0.15)',
  },
  gossip: {
    id: 'gossip',
    label: 'Potins de Soirée',
    emoji: '🔥',
    description: 'Révélations piquantes, anecdotes croustillantes et petites vérités',
    color: '#FF2D55',
    badgeBg: 'rgba(255, 45, 85, 0.15)',
  },
  relationships: {
    id: 'relationships',
    label: 'Relations & Amour',
    emoji: '🤝',
    description: 'Complicité, dynamiques de couple, amitiés et ruptures',
    color: '#FF6B9D',
    badgeBg: 'rgba(255, 107, 157, 0.15)',
  },
  hot: {
    id: 'hot',
    label: 'Hot & Intime',
    emoji: '🌶️',
    description: 'Séduction directe, fantasmes, désirs et vérités cash (18+)',
    color: '#FF3B30',
    badgeBg: 'rgba(255, 59, 48, 0.15)',
  },
  flirt: {
    id: 'flirt',
    label: 'Flirt & Séduction',
    emoji: '😏',
    description: 'Tension romantique, attirance, dates et jeu de séduction',
    color: '#AF52DE',
    badgeBg: 'rgba(175, 82, 222, 0.15)',
  },
  personality: {
    id: 'personality',
    label: 'Personnalité & Vrai Toi',
    emoji: '👤',
    description: 'Traits de caractère, défauts assumés et fonctionnement intime',
    color: '#30D158',
    badgeBg: 'rgba(48, 209, 88, 0.15)',
  },
  debate: {
    id: 'debate',
    label: 'Débat & Opinions',
    emoji: '⚖️',
    description: 'Divergences d\'avis, prises de position et arguments enflammés',
    color: '#FFD60A',
    badgeBg: 'rgba(255, 214, 10, 0.15)',
  },
  hypothetical: {
    id: 'hypothetical',
    label: 'Dilemmes & Scénarios',
    emoji: '🌀',
    description: 'Choix impossibles, mondes parallèles et situations extrêmes',
    color: '#64D2FF',
    badgeBg: 'rgba(100, 210, 255, 0.15)',
  },
  memories: {
    id: 'memories',
    label: 'Souvenirs & Nostalgie',
    emoji: '📜',
    description: 'Moments marquants du passé, bêtises d\'enfance et nostalgie',
    color: '#FF9F0A',
    badgeBg: 'rgba(255, 159, 10, 0.15)',
  },
  future: {
    id: 'future',
    label: 'Avenir & Ambitions',
    emoji: '🔮',
    description: 'Projets de vie, visions du futur et grandes étapes à venir',
    color: '#5E5CE6',
    badgeBg: 'rgba(94, 92, 230, 0.15)',
  },
  philosophy: {
    id: 'philosophy',
    label: 'Philosophie & Pensées',
    emoji: '🧠',
    description: 'Sens de la vie, réflexions profondes et grandes questions existentielles',
    color: '#7B61FF',
    badgeBg: 'rgba(123, 97, 255, 0.15)',
  },
  lifestyle: {
    id: 'lifestyle',
    label: 'Mode de Vie & Quotidien',
    emoji: '🌿',
    description: 'Habitudes, plaisirs simples, rythme de vie et petites manies',
    color: '#34C759',
    badgeBg: 'rgba(52, 199, 89, 0.15)',
  },
  dreams: {
    id: 'dreams',
    label: 'Rêves & Idéaux',
    emoji: '🌟',
    description: 'Aspirations les plus folles, désirs secrets et idéaux de vie',
    color: '#BF5AF2',
    badgeBg: 'rgba(191, 90, 242, 0.15)',
  },
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIGS) as QuestionCategory[];

export interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  minPlayers: number;
  maxPlayers?: number;
  // Champs optionnels dépréciés
  modes?: string[];
  intensity?: number;
}
