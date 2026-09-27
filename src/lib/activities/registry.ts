import { ActivityType, ActivityContent } from '@/types/activities';

export interface ActivityTypeDefinition {
  type: ActivityType;
  label: string;
  badge: string;
  description: string;
  iconName: string;
  defaultInstruction: string;
  difficultyRecommended: 'easy' | 'medium' | 'hard';
  createDefaultContent: () => ActivityContent;
  validateContent: (content: any) => { isValid: boolean; error?: string };
}

export const ACTIVITY_REGISTRY: Record<ActivityType, ActivityTypeDefinition> = {
  match_pairs: {
    type: 'match_pairs',
    label: 'Match the Pairs',
    badge: 'Connect Concepts',
    description: 'Match items on the left with their corresponding items on the right.',
    iconName: 'ArrowLeftRight',
    defaultInstruction: 'Tap an item on the left and connect it to its matching pair on the right.',
    difficultyRecommended: 'easy',
    createDefaultContent: () => ({
      instruction: 'Connect each concept on the left with its correct match on the right.',
      pairs: [
        { id: 'p1', left: 'Root', right: 'Absorbs water and anchor the plant' },
        { id: 'p2', left: 'Leaf', right: 'Uses sunlight to produce food' },
        { id: 'p3', left: 'Stem', right: 'Transports nutrients throughout the plant' },
      ],
    }),
    validateContent: (content) => {
      if (!content || !Array.isArray(content.pairs) || content.pairs.length < 2) {
        return { isValid: false, error: 'Provide at least 2 matching pairs.' };
      }
      for (let i = 0; i < content.pairs.length; i++) {
        const p = content.pairs[i];
        if (!p.left?.trim() || !p.right?.trim()) {
          return { isValid: false, error: `Pair #${i + 1} has an empty left or right value.` };
        }
      }
      return { isValid: true };
    },
  },

  drag_drop: {
    type: 'drag_drop',
    label: 'Drag & Drop',
    badge: 'Spatial Placement',
    description: 'Drag objects, concepts, or labels into their correct destination target.',
    iconName: 'Move',
    defaultInstruction: 'Drag each token from the bank into its designated drop target.',
    difficultyRecommended: 'medium',
    createDefaultContent: () => ({
      instruction: 'Drag each organelle or trait into the correct cell classification.',
      zones: [
        { id: 'zone-1', label: 'Plant Cell Only', description: 'Features exclusive to flora', acceptsItemIds: ['item-1', 'item-2'] },
        { id: 'zone-2', label: 'Animal & Plant Cells', description: 'Common cellular components', acceptsItemIds: ['item-3', 'item-4'] },
      ],
      items: [
        { id: 'item-1', text: 'Chloroplast' },
        { id: 'item-2', text: 'Rigid Cell Wall' },
        { id: 'item-3', text: 'Mitochondria' },
        { id: 'item-4', text: 'Cell Membrane' },
      ],
    }),
    validateContent: (content) => {
      if (!content || !Array.isArray(content.zones) || content.zones.length < 1) {
        return { isValid: false, error: 'Provide at least 1 drop zone target.' };
      }
      if (!Array.isArray(content.items) || content.items.length < 2) {
        return { isValid: false, error: 'Provide at least 2 draggable items.' };
      }
      for (const zone of content.zones) {
        if (!zone.label?.trim()) return { isValid: false, error: 'All drop zones must have a title.' };
        if (!zone.acceptsItemIds || zone.acceptsItemIds.length === 0) {
          return { isValid: false, error: `Zone "${zone.label}" has no correct items assigned.` };
        }
      }
      return { isValid: true };
    },
  },

  fill_blanks: {
    type: 'fill_blanks',
    label: 'Fill in the Blanks',
    badge: 'Recall & Synthesis',
    description: 'Fill in the missing terms, numbers, or expressions within contextual sentences.',
    iconName: 'FileEdit',
    defaultInstruction: 'Fill in each blank with the correct missing term.',
    difficultyRecommended: 'medium',
    createDefaultContent: () => ({
      instruction: 'Complete each scientific statement by filling in the missing term.',
      questions: [
        {
          id: 'q1',
          template: 'Plants use [blank] from sunlight to synthesize glucose.',
          blanks: [{ id: 'b1', answer: 'energy', acceptableAlternatives: ['light', 'sunlight', 'solar energy'] }],
          wordBank: ['energy', 'oxygen', 'water', 'nitrogen'],
        },
        {
          id: 'q2',
          template: 'The primary green pigment responsible for absorption is [blank].',
          blanks: [{ id: 'b2', answer: 'chlorophyll', acceptableAlternatives: ['chloroplast'] }],
          wordBank: ['chlorophyll', 'carotenoid', 'hemoglobin'],
        },
      ],
    }),
    validateContent: (content) => {
      if (!content || !Array.isArray(content.questions) || content.questions.length < 1) {
        return { isValid: false, error: 'Provide at least 1 fill-in-the-blank question.' };
      }
      for (let i = 0; i < content.questions.length; i++) {
        const q = content.questions[i];
        if (!q.template?.trim() || !q.template.includes('[blank]')) {
          return { isValid: false, error: `Question #${i + 1} must include a [blank] placeholder.` };
        }
        if (!Array.isArray(q.blanks) || q.blanks.length === 0 || !q.blanks[0].answer?.trim()) {
          return { isValid: false, error: `Question #${i + 1} is missing a correct answer.` };
        }
      }
      return { isValid: true };
    },
  },

  word_scramble: {
    type: 'word_scramble',
    label: 'Word Scramble',
    badge: 'Letter Puzzle',
    description: 'Unscramble mixed letters to discover key vocabulary, terms, or concepts.',
    iconName: 'Shuffle',
    defaultInstruction: 'Rearrange the jumbled letters into the correct order to spell the mystery word.',
    difficultyRecommended: 'easy',
    createDefaultContent: () => ({
      instruction: 'Unscramble the letters to reveal key scientific terms.',
      words: [
        { id: 'w1', word: 'PHOTOSYNTHESIS', clue: 'Process by which green plants make food' },
        { id: 'w2', word: 'CHLOROPHYLL', clue: 'The green pigment in plant leaves' },
        { id: 'w3', word: 'ECOSYSTEM', clue: 'A biological community of interacting organisms' },
      ],
    }),
    validateContent: (content) => {
      if (!content || !Array.isArray(content.words) || content.words.length < 1) {
        return { isValid: false, error: 'Provide at least 1 word to scramble.' };
      }
      for (let i = 0; i < content.words.length; i++) {
        const w = content.words[i];
        if (!w.word?.trim() || w.word.trim().length < 2) {
          return { isValid: false, error: `Word #${i + 1} must be at least 2 letters long.` };
        }
      }
      return { isValid: true };
    },
  },

  arrange_order: {
    type: 'arrange_order',
    label: 'Arrange in Order',
    badge: 'Sequencing & Steps',
    description: 'Organize items into chronological sequence, cycle phases, or logical steps.',
    iconName: 'ListOrdered',
    defaultInstruction: 'Rearrange the items into their correct sequential order from first to last.',
    difficultyRecommended: 'medium',
    createDefaultContent: () => ({
      instruction: 'Order the stages of a flowering plant life cycle from beginning to maturity.',
      sequenceContext: 'Biological life progression',
      items: [
        { id: 's1', text: 'Dormant Seed', correctPosition: 1 },
        { id: 's2', text: 'Germination & Radicle Emergence', correctPosition: 2 },
        { id: 's3', text: 'Seedling Sprout with Cotyledons', correctPosition: 3 },
        { id: 's4', text: 'Mature Flowering Plant', correctPosition: 4 },
      ],
    }),
    validateContent: (content) => {
      if (!content || !Array.isArray(content.items) || content.items.length < 3) {
        return { isValid: false, error: 'Provide at least 3 steps to arrange.' };
      }
      for (let i = 0; i < content.items.length; i++) {
        const it = content.items[i];
        if (!it.text?.trim()) {
          return { isValid: false, error: `Step #${i + 1} has no text description.` };
        }
      }
      return { isValid: true };
    },
  },

  category_sort: {
    type: 'category_sort',
    label: 'Sort into Categories',
    badge: 'Taxonomy & Logic',
    description: 'Classify and organize multiple items into distinct categorical buckets.',
    iconName: 'FolderKanban',
    defaultInstruction: 'Sort each card into its appropriate categorical bucket.',
    difficultyRecommended: 'medium',
    createDefaultContent: () => ({
      instruction: 'Categorize each organism by its zoological vertebrate class.',
      categories: [
        { id: 'cat-1', name: 'Mammals', description: 'Warm-blooded with hair/fur', color: '#38bdf8' },
        { id: 'cat-2', name: 'Reptiles', description: 'Cold-blooded with scales', color: '#34d399' },
      ],
      items: [
        { id: 'ci-1', text: 'Blue Whale', categoryId: 'cat-1' },
        { id: 'ci-2', text: 'African Elephant', categoryId: 'cat-1' },
        { id: 'ci-3', text: 'Komodo Dragon', categoryId: 'cat-2' },
        { id: 'ci-4', text: 'Chameleon', categoryId: 'cat-2' },
      ],
    }),
    validateContent: (content) => {
      if (!content || !Array.isArray(content.categories) || content.categories.length < 2) {
        return { isValid: false, error: 'Provide at least 2 categories.' };
      }
      if (!Array.isArray(content.items) || content.items.length < 2) {
        return { isValid: false, error: 'Provide at least 2 items to sort.' };
      }
      const catIds = new Set(content.categories.map((c: any) => c.id));
      for (const item of content.items) {
        if (!item.text?.trim()) return { isValid: false, error: 'All items must have a name.' };
        if (!catIds.has(item.categoryId)) {
          return { isValid: false, error: `Item "${item.text}" is assigned to an invalid category.` };
        }
      }
      return { isValid: true };
    },
  },

  sequence: {
    type: 'sequence',
    label: 'Sequence / What Comes Next',
    badge: 'Pattern Recognition',
    description: 'Identify patterns, mathematical series, or logic chains to deduce the next element.',
    iconName: 'Sparkles',
    defaultInstruction: 'Analyze the progression and choose the correct element that completes the sequence.',
    difficultyRecommended: 'hard',
    createDefaultContent: () => ({
      instruction: 'Identify the pattern in each sequence and select the missing term.',
      sequences: [
        {
          id: 'seq-1',
          prompt: 'Geometric Exponential Progression',
          items: ['3', '6', '12', '24', '?'],
          missingIndex: 4,
          options: ['36', '42', '48', '56'],
          correctOption: '48',
          ruleExplanation: 'Each term is multiplied by 2 (24 × 2 = 48).',
        },
        {
          id: 'seq-2',
          prompt: 'Square Number Series',
          items: ['1', '4', '9', '?', '25'],
          missingIndex: 3,
          options: ['12', '16', '18', '20'],
          correctOption: '16',
          ruleExplanation: 'Consecutive perfect squares: 1², 2², 3², 4² = 16, 5².',
        },
      ],
    }),
    validateContent: (content) => {
      if (!content || !Array.isArray(content.sequences) || content.sequences.length < 1) {
        return { isValid: false, error: 'Provide at least 1 sequence.' };
      }
      for (let i = 0; i < content.sequences.length; i++) {
        const s = content.sequences[i];
        if (!Array.isArray(s.items) || s.items.length < 3) {
          return { isValid: false, error: `Sequence #${i + 1} must contain at least 3 items.` };
        }
        if (!s.correctOption || !s.options?.includes(s.correctOption)) {
          return { isValid: false, error: `Sequence #${i + 1} correct option must be in the choices list.` };
        }
      }
      return { isValid: true };
    },
  },
};

export const ALL_ACTIVITY_TYPES = Object.keys(ACTIVITY_REGISTRY) as ActivityType[];

export function getActivityTypeDef(type: ActivityType): ActivityTypeDefinition {
  return ACTIVITY_REGISTRY[type] || ACTIVITY_REGISTRY.match_pairs;
}
