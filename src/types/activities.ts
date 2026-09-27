// ============================================================================
// EDURAH ACTIVITIES ENGINE TYPE DEFINITIONS
// SUBJECT-AGNOSTIC EXTENSIBLE ARCHITECTURE
// ============================================================================

export type ActivityType =
  | 'match_pairs'
  | 'drag_drop'
  | 'fill_blanks'
  | 'word_scramble'
  | 'arrange_order'
  | 'category_sort'
  | 'sequence';

export type ActivityDifficulty = 'easy' | 'medium' | 'hard';
export type ActivityStatus = 'draft' | 'published' | 'archived';

// ----------------------------------------------------------------------------
// 1. MATCH THE PAIRS
// ----------------------------------------------------------------------------
export interface MatchPairItem {
  id: string;
  left: string;
  right: string;
  leftMediaUrl?: string;
  rightMediaUrl?: string;
}

export interface MatchPairsContent {
  pairs: MatchPairItem[];
  instruction?: string;
}

// ----------------------------------------------------------------------------
// 2. DRAG & DROP
// ----------------------------------------------------------------------------
export interface DragItem {
  id: string;
  text: string;
  mediaUrl?: string;
}

export interface DropZone {
  id: string;
  label: string;
  description?: string;
  acceptsItemIds: string[];
}

export interface DragDropContent {
  items: DragItem[];
  zones: DropZone[];
  instruction?: string;
}

// ----------------------------------------------------------------------------
// 3. FILL IN THE BLANKS
// ----------------------------------------------------------------------------
export interface BlankDefinition {
  id: string;
  answer: string;
  acceptableAlternatives?: string[];
  hint?: string;
}

export interface FillBlanksQuestion {
  id: string;
  // Template with [blank] or {blank_id} tokens
  template: string;
  blanks: BlankDefinition[];
  wordBank?: string[]; // Optional clickable word bank
}

export interface FillBlanksContent {
  questions: FillBlanksQuestion[];
  instruction?: string;
}

// ----------------------------------------------------------------------------
// 4. WORD SCRAMBLE
// ----------------------------------------------------------------------------
export interface WordScrambleItem {
  id: string;
  word: string;
  clue?: string;
  hint?: string;
  customScramble?: string; // Optional manual scramble; if omitted, engine auto-scrambles
}

export interface WordScrambleContent {
  words: WordScrambleItem[];
  instruction?: string;
}

// ----------------------------------------------------------------------------
// 5. ARRANGE IN ORDER
// ----------------------------------------------------------------------------
export interface OrderItem {
  id: string;
  text: string;
  correctPosition: number; // 1-indexed correct sequence position
  mediaUrl?: string;
}

export interface ArrangeOrderContent {
  items: OrderItem[];
  instruction?: string;
  sequenceContext?: string; // e.g. "Chronological order" or "Smallest to largest"
}

// ----------------------------------------------------------------------------
// 6. SORT INTO CATEGORIES
// ----------------------------------------------------------------------------
export interface CategoryDefinition {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface CategorizedItem {
  id: string;
  text: string;
  categoryId: string; // The correct category id
  mediaUrl?: string;
}

export interface CategorySortContent {
  categories: CategoryDefinition[];
  items: CategorizedItem[];
  instruction?: string;
}

// ----------------------------------------------------------------------------
// 7. SEQUENCE / WHAT COMES NEXT
// ----------------------------------------------------------------------------
export interface SequenceItem {
  id: string;
  prompt?: string;
  items: string[]; // e.g. ["2", "4", "8", "?"]
  missingIndex: number; // Index in items array where ? appears
  options: string[]; // Options to pick from e.g. ["12", "14", "16", "20"]
  correctOption: string; // "16"
  ruleExplanation?: string; // e.g. "Each number doubles the previous number"
}

export interface SequenceContent {
  sequences: SequenceItem[];
  instruction?: string;
}

// ----------------------------------------------------------------------------
// UNION CONTENT TYPE
// ----------------------------------------------------------------------------
export type ActivityContent =
  | MatchPairsContent
  | DragDropContent
  | FillBlanksContent
  | WordScrambleContent
  | ArrangeOrderContent
  | CategorySortContent
  | SequenceContent;

// ----------------------------------------------------------------------------
// CORE ACTIVITY MODEL
// ----------------------------------------------------------------------------
export interface Activity<TContent = ActivityContent> {
  id: string;
  title: string;
  description: string;
  activityType: ActivityType;
  subjectId?: string;
  gradeId: string;
  courseId?: string;
  lessonId?: string;
  difficulty: ActivityDifficulty;
  points: number;
  timeLimitSeconds?: number;
  hints: string[];
  content: TContent;
  status: ActivityStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Sanitized version for client display (answer keys hidden where appropriate)
export type ClientActivity<TContent = ActivityContent> = Activity<TContent>;

// ----------------------------------------------------------------------------
// STUDENT ATTEMPT & RESULTS
// ----------------------------------------------------------------------------
export interface ActivityAttempt {
  id: string;
  activityId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  attemptNumber: number;
  score: number;
  maxScore: number;
  percentage: number;
  completed: boolean;
  timeTakenSeconds: number;
  hintsUsed: number;
  studentAnswers: Record<string, any>;
  evaluationDetails: {
    correctCount: number;
    totalCount: number;
    itemResults?: Array<{
      id: string;
      isCorrect: boolean;
      userAnswer?: any;
      expectedAnswer?: any;
      feedback?: string;
    }>;
  };
  startedAt: string;
  completedAt: string;
}

export interface ActivityStats {
  activityId: string;
  title: string;
  type: ActivityType;
  gradeId: string;
  totalAttempts: number;
  uniqueStudentsCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  completionRate: number; // percentage (0-100)
}
