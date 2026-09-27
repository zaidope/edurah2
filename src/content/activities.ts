import { Activity } from '@/types/activities';

export const INITIAL_ACTIVITIES: Activity[] = [
  // --------------------------------------------------------------------------
  // 1. MATCH THE PAIRS — Grade 2 (Junior) Science
  // --------------------------------------------------------------------------
  {
    id: 'act-match-plants-g2',
    title: 'Plant Parts & Their Superpowers',
    description: 'Match each part of a plant with its vital role in helping the plant survive and grow.',
    activityType: 'match_pairs',
    subjectId: 'sub-sci',
    gradeId: 'grade-2',
    courseId: 'course-g2-sci',
    difficulty: 'easy',
    points: 100,
    timeLimitSeconds: 180,
    hints: [
      'Think about where water enters the plant from the soil.',
      'Leaves are green and love soaking up bright sunlight.',
    ],
    status: 'published',
    content: {
      instruction: 'Match the plant part on the left with what it does on the right!',
      pairs: [
        { id: 'p1', left: 'Roots', right: 'Absorbs water and anchors the plant firmly in soil' },
        { id: 'p2', left: 'Stem', right: 'Carries water and nutrients up to the leaves and flowers' },
        { id: 'p3', left: 'Leaf', right: 'Uses sunlight and air to make sweet food for the plant' },
        { id: 'p4', left: 'Flower', right: 'Produces pollen, seeds, and colourful petals' },
      ],
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z',
  },

  // --------------------------------------------------------------------------
  // 2. WORD SCRAMBLE — Grade 3 (Junior) English / Wildlife
  // --------------------------------------------------------------------------
  {
    id: 'act-scramble-animals-g3',
    title: 'Wild Animal Word Scramble',
    description: 'Unscramble the letters to reveal magnificent creatures from around the world.',
    activityType: 'word_scramble',
    subjectId: 'sub-eng',
    gradeId: 'grade-3',
    difficulty: 'easy',
    points: 100,
    timeLimitSeconds: 240,
    hints: [
      'The first creature has a very long trunk!',
      'The second creature is a mammal that swims in the ocean!',
    ],
    status: 'published',
    content: {
      instruction: 'Rearrange the mixed-up letter tiles to spell each wild animal name!',
      words: [
        { id: 'w1', word: 'ELEPHANT', clue: 'The largest land mammal with big ears and a long trunk' },
        { id: 'w2', word: 'DOLPHIN', clue: 'An intelligent marine mammal that leaps through waves' },
        { id: 'w3', word: 'GIRAFFE', clue: 'The tallest animal in Africa with a long neck' },
        { id: 'w4', word: 'CHEETAH', clue: 'The fastest land animal on planet Earth' },
      ],
    },
    createdAt: '2026-09-02T09:00:00Z',
    updatedAt: '2026-09-02T09:00:00Z',
  },

  // --------------------------------------------------------------------------
  // 3. ARRANGE IN ORDER — Grade 4 (Junior) Science
  // --------------------------------------------------------------------------
  {
    id: 'act-order-frog-g4',
    title: 'Life Cycle of an Amphibian (Frog)',
    description: 'Put the biological stages of frog metamorphosis into their correct chronological sequence.',
    activityType: 'arrange_order',
    subjectId: 'sub-sci',
    gradeId: 'grade-4',
    difficulty: 'medium',
    points: 100,
    timeLimitSeconds: 200,
    hints: [
      'Frogs always begin as a jelly-covered cluster of eggs in water.',
      'Tadpoles grow hind legs first before their front legs emerge.',
    ],
    status: 'published',
    content: {
      instruction: 'Drag and reorder the stages from egg to fully grown adult frog!',
      sequenceContext: 'Chronological Metamorphosis',
      items: [
        { id: 's1', text: '1. Egg Cluster (Frogspawn) floating in shallow pond water', correctPosition: 1 },
        { id: 's2', text: '2. Tadpole hatches with gills and a swimming tail', correctPosition: 2 },
        { id: 's3', text: '3. Tadpole with growing hind legs and developing lungs', correctPosition: 3 },
        { id: 's4', text: '4. Froglet with front legs and a shrinking tail', correctPosition: 4 },
        { id: 's5', text: '5. Adult Frog breathing air and living on land & water', correctPosition: 5 },
      ],
    },
    createdAt: '2026-09-03T10:00:00Z',
    updatedAt: '2026-09-03T10:00:00Z',
  },

  // --------------------------------------------------------------------------
  // 4. SORT INTO CATEGORIES — Grade 6 (Middle) Science
  // --------------------------------------------------------------------------
  {
    id: 'act-sort-vertebrates-g6',
    title: 'Vertebrate Classification Challenge',
    description: 'Classify various vertebrate organisms into Mammals, Reptiles, and Amphibians.',
    activityType: 'category_sort',
    subjectId: 'sub-sci',
    gradeId: 'grade-6',
    courseId: 'course-g6-sci',
    difficulty: 'medium',
    points: 100,
    timeLimitSeconds: 240,
    hints: [
      'Whales are mammals that nurse their young with milk.',
      'Salamanders must keep their skin moist to absorb oxygen.',
    ],
    status: 'published',
    content: {
      instruction: 'Drag each animal token into its correct vertebrate class bucket.',
      categories: [
        { id: 'cat-mammal', name: 'Mammalia', description: 'Endothermic, possess hair/fur, mammary glands', color: '#38bdf8' },
        { id: 'cat-reptile', name: 'Reptilia', description: 'Ectothermic, keratin scales, lay amniotic eggs', color: '#34d399' },
        { id: 'cat-amphibian', name: 'Amphibia', description: 'Permeable skin, dual aquatic/terrestrial life', color: '#fbbf24' },
      ],
      items: [
        { id: 'it-1', text: 'Humpback Whale', categoryId: 'cat-mammal' },
        { id: 'it-2', text: 'Snow Leopard', categoryId: 'cat-mammal' },
        { id: 'it-3', text: 'Komodo Dragon', categoryId: 'cat-reptile' },
        { id: 'it-4', text: 'Green Sea Turtle', categoryId: 'cat-reptile' },
        { id: 'it-5', text: 'Poison Dart Frog', categoryId: 'cat-amphibian' },
        { id: 'it-6', text: 'Spotted Salamander', categoryId: 'cat-amphibian' },
      ],
    },
    createdAt: '2026-09-04T11:00:00Z',
    updatedAt: '2026-09-04T11:00:00Z',
  },

  // --------------------------------------------------------------------------
  // 5. SEQUENCE / WHAT COMES NEXT — Grade 6 (Middle) Mathematics
  // --------------------------------------------------------------------------
  {
    id: 'act-sequence-math-g6',
    title: 'Mathematical Patterns & Sequences',
    description: 'Deduce arithmetic rules, geometric powers, and Fibonacci steps to solve missing elements.',
    activityType: 'sequence',
    subjectId: 'sub-math',
    gradeId: 'grade-6',
    difficulty: 'hard',
    points: 100,
    timeLimitSeconds: 300,
    hints: [
      'Examine the ratio or difference between consecutive elements.',
      'Look for perfect squares or Fibonacci summation rules.',
    ],
    status: 'published',
    content: {
      instruction: 'Analyze the mathematical progression and choose the correct missing value.',
      sequences: [
        {
          id: 'seq-1',
          prompt: 'Geometric Doubling Series',
          items: ['2', '4', '8', '16', '32', '?'],
          missingIndex: 5,
          options: ['48', '56', '64', '72'],
          correctOption: '64',
          ruleExplanation: 'Each term is multiplied by 2 (32 × 2 = 64).',
        },
        {
          id: 'seq-2',
          prompt: 'Fibonacci Sequence',
          items: ['1', '1', '2', '3', '5', '8', '?'],
          missingIndex: 6,
          options: ['11', '12', '13', '15'],
          correctOption: '13',
          ruleExplanation: 'Each term is the sum of the two preceding terms (5 + 8 = 13).',
        },
        {
          id: 'seq-3',
          prompt: 'Perfect Squares Progression',
          items: ['4', '9', '16', '?', '36', '49'],
          missingIndex: 3,
          options: ['20', '24', '25', '30'],
          correctOption: '25',
          ruleExplanation: 'Squares of consecutive integers: 2², 3², 4², 5² = 25, 6², 7².',
        },
      ],
    },
    createdAt: '2026-09-05T12:00:00Z',
    updatedAt: '2026-09-05T12:00:00Z',
  },

  // --------------------------------------------------------------------------
  // 6. DRAG & DROP — Grade 7 (Middle) Science
  // --------------------------------------------------------------------------
  {
    id: 'act-drag-cells-g7',
    title: 'Cellular Organelle Compartments',
    description: 'Map organelles into Plant Cell Exclusive, Animal Cell Exclusive, or Shared Organelles.',
    activityType: 'drag_drop',
    subjectId: 'sub-sci',
    gradeId: 'grade-7',
    difficulty: 'medium',
    points: 100,
    timeLimitSeconds: 240,
    hints: [
      'Chloroplasts conduct photosynthesis and are not found in animal cells.',
      'Both plant and animal cells generate ATP in mitochondria.',
    ],
    status: 'published',
    content: {
      instruction: 'Drag each organelle token into its correct cellular classification zone.',
      zones: [
        {
          id: 'z-plant',
          label: 'Plant Cells Only',
          description: 'Unique to photosynthetic plant cells',
          acceptsItemIds: ['item-chloro', 'item-wall', 'item-vacuole'],
        },
        {
          id: 'z-shared',
          label: 'Shared Organelles',
          description: 'Present in both plant and animal eukaryotic cells',
          acceptsItemIds: ['item-mito', 'item-nucleus', 'item-ribo'],
        },
      ],
      items: [
        { id: 'item-chloro', text: 'Chloroplast' },
        { id: 'item-wall', text: 'Cellulose Cell Wall' },
        { id: 'item-vacuole', text: 'Large Central Vacuole' },
        { id: 'item-mito', text: 'Mitochondria' },
        { id: 'item-nucleus', text: 'Membrane-bound Nucleus' },
        { id: 'item-ribo', text: 'Ribosomes' },
      ],
    },
    createdAt: '2026-09-06T13:00:00Z',
    updatedAt: '2026-09-06T13:00:00Z',
  },

  // --------------------------------------------------------------------------
  // 7. FILL IN THE BLANKS — Grade 9 (Senior) Science & Chemistry
  // --------------------------------------------------------------------------
  {
    id: 'act-blanks-respiration-g9',
    title: 'Cellular Respiration & Bioenergetics',
    description: 'Fill in the critical reactants, products, and molecular stoichiometry of metabolic pathways.',
    activityType: 'fill_blanks',
    subjectId: 'sub-sci',
    gradeId: 'grade-9',
    difficulty: 'hard',
    points: 100,
    timeLimitSeconds: 300,
    hints: [
      'The primary energy currency produced is adenosine triphosphate (ATP).',
      'Aerobic respiration requires oxygen as the terminal electron acceptor.',
    ],
    status: 'published',
    content: {
      instruction: 'Synthesize your biochemical knowledge by filling in each missing chemical term.',
      questions: [
        {
          id: 'q1',
          template: 'During aerobic cellular respiration, glucose reacts with [blank] to yield carbon dioxide, water, and energy.',
          blanks: [{ id: 'b1', answer: 'oxygen', acceptableAlternatives: ['O2', 'molecular oxygen'] }],
          wordBank: ['oxygen', 'nitrogen', 'hydrogen', 'glucose'],
        },
        {
          id: 'q2',
          template: 'The universal molecular energy carrier synthesized during this reaction is called [blank].',
          blanks: [{ id: 'b2', answer: 'ATP', acceptableAlternatives: ['adenosine triphosphate'] }],
          wordBank: ['ATP', 'DNA', 'NADH', 'hemoglobin'],
        },
        {
          id: 'q3',
          template: 'The initial breakdown of glucose in the cytoplasm occurs without oxygen via [blank].',
          blanks: [{ id: 'b3', answer: 'glycolysis', acceptableAlternatives: ['anaerobic glycolysis'] }],
          wordBank: ['glycolysis', 'fermentation', 'Krebs cycle', 'osmosis'],
        },
      ],
    },
    createdAt: '2026-09-07T14:00:00Z',
    updatedAt: '2026-09-07T14:00:00Z',
  },
];
