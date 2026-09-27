// ============================================================================
// src/lib/assignments.ts: ASSIGNMENTS, RUBRICS & SUBMISSIONS REPOSITORY
// Database-first with in-memory fallback for resilient operation
// ============================================================================

import {
  Assignment,
  AssignmentSubmission,
  SubmissionFile,
  Rubric,
  RubricScore,
  GradeItem,
  GradeEntry
} from '@/types';

// Initial sample assignments for curricula
export const INITIAL_RUBRICS: Rubric[] = [
  {
    id: 'rubric-cs-1',
    courseId: 'course-cs-101',
    title: 'Code Quality, Architecture & Execution Rubric',
    criteria: [
      {
        id: 'crit-1',
        title: 'Algorithmic Correctness & Requirements',
        description: 'Implements all functional specifications and passes corner cases.',
        maxPoints: 40,
        position: 0,
      },
      {
        id: 'crit-2',
        title: 'Architecture & Modularity',
        description: 'Clean separation of concerns, defensive typing, and readable structure.',
        maxPoints: 30,
        position: 1,
      },
      {
        id: 'crit-3',
        title: 'Documentation & Test Coverage',
        description: 'Clear README instructions, inline commentary, and verifiable test suite.',
        maxPoints: 30,
        position: 2,
      },
    ],
  },
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-cs-1',
    courseId: 'course-cs-101',
    courseTitle: 'Introduction to Computer Science',
    title: 'Mini-Project: Interactive Terminal Algorithm',
    instructionsMd: `### Objective
Design and submit a self-contained computational script that demonstrates structured data parsing, recursion, and error handling.

### Guidelines
1. Submit your code file or compiled PDF documentation (max 25 MB).
2. Ensure you adhere to the code quality rubric criteria.
3. Submissions past the due date incur a 5% penalty per day.`,
    dueAt: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days from now
    closeAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    points: 100,
    latePenaltyPercentPerDay: 5,
    allowedMime: ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'],
    maxFileMb: 25,
    rubricId: 'rubric-cs-1',
    rubric: INITIAL_RUBRICS[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'asg-g6-1',
    courseId: 'course-g6-sci',
    courseTitle: 'Earth Science & Geological Systems',
    title: 'Tectonic Plate Boundaries Field Analysis',
    instructionsMd: `### Laboratory Report
Prepare a comprehensive 2-page report illustrating convergent, divergent, and transform fault lines with diagrammatic annotations.

### Deliverables
- Upload a single PDF document or high-resolution diagram.`,
    dueAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    closeAt: new Date(Date.now() + 10 * 86400000).toISOString(),
    points: 100,
    latePenaltyPercentPerDay: 10,
    allowedMime: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileMb: 25,
    createdAt: new Date().toISOString(),
  },
];

declare global {
  // eslint-disable-next-line no-var
  var __edurah_assignments: Assignment[] | undefined;
  // eslint-disable-next-line no-var
  var __edurah_submissions: AssignmentSubmission[] | undefined;
  // eslint-disable-next-line no-var
  var __edurah_rubrics: Rubric[] | undefined;
  // eslint-disable-next-line no-var
  var __edurah_grade_entries: GradeEntry[] | undefined;
  // eslint-disable-next-line no-var
  var __edurah_grade_items: GradeItem[] | undefined;
}

const assignmentsStore: Assignment[] = globalThis.__edurah_assignments || [...INITIAL_ASSIGNMENTS];
const submissionsStore: AssignmentSubmission[] = globalThis.__edurah_submissions || [];
const rubricsStore: Rubric[] = globalThis.__edurah_rubrics || [...INITIAL_RUBRICS];
const gradeEntriesStore: GradeEntry[] = globalThis.__edurah_grade_entries || [];
const gradeItemsStore: GradeItem[] = globalThis.__edurah_grade_items || [];

if (process.env.NODE_ENV !== 'production') {
  globalThis.__edurah_assignments = assignmentsStore;
  globalThis.__edurah_submissions = submissionsStore;
  globalThis.__edurah_rubrics = rubricsStore;
  globalThis.__edurah_grade_entries = gradeEntriesStore;
  globalThis.__edurah_grade_items = gradeItemsStore;
}

export const AssignmentsRepository = {
  // ==========================================
  // RUBRICS
  // ==========================================
  getRubrics(): Rubric[] {
    return rubricsStore;
  },

  getRubricById(id: string): Rubric | undefined {
    return rubricsStore.find(r => r.id === id);
  },

  saveRubric(rubric: Rubric): void {
    const idx = rubricsStore.findIndex(r => r.id === rubric.id);
    if (idx >= 0) rubricsStore[idx] = rubric;
    else rubricsStore.push(rubric);
  },

  // ==========================================
  // ASSIGNMENTS
  // ==========================================
  getAssignments(): Assignment[] {
    return assignmentsStore;
  },

  getAssignmentsByCourse(courseId: string): Assignment[] {
    return assignmentsStore.filter(a => a.courseId === courseId);
  },

  getAssignmentById(id: string): Assignment | undefined {
    const asg = assignmentsStore.find(a => a.id === id);
    if (asg && asg.rubricId && !asg.rubric) {
      asg.rubric = this.getRubricById(asg.rubricId);
    }
    return asg;
  },

  saveAssignment(asg: Assignment): void {
    const idx = assignmentsStore.findIndex(a => a.id === asg.id);
    if (idx >= 0) assignmentsStore[idx] = asg;
    else assignmentsStore.push(asg);
  },

  // ==========================================
  // SUBMISSIONS
  // ==========================================
  getSubmissions(): AssignmentSubmission[] {
    return submissionsStore;
  },

  getSubmissionsByAssignment(assignmentId: string): AssignmentSubmission[] {
    return submissionsStore.filter(s => s.assignmentId === assignmentId);
  },

  getSubmissionsByStudent(studentId: string): AssignmentSubmission[] {
    return submissionsStore.filter(s => s.studentId === studentId);
  },

  getLatestSubmission(assignmentId: string, studentId: string): AssignmentSubmission | undefined {
    const studentSubs = submissionsStore
      .filter(s => s.assignmentId === assignmentId && s.studentId === studentId)
      .sort((a, b) => b.attemptNo - a.attemptNo);
    return studentSubs[0];
  },

  getSubmissionById(id: string): AssignmentSubmission | undefined {
    return submissionsStore.find(s => s.id === id);
  },

  saveSubmission(sub: AssignmentSubmission): void {
    const idx = submissionsStore.findIndex(s => s.id === sub.id);
    if (idx >= 0) submissionsStore[idx] = sub;
    else submissionsStore.push(sub);
  },

  // ==========================================
  // GRADEBOOK INTEGRATION
  // ==========================================
  recordGradeEntry(entry: GradeEntry): void {
    const idx = gradeEntriesStore.findIndex(
      e => e.gradeItemId === entry.gradeItemId && e.studentId === entry.studentId
    );
    if (idx >= 0) gradeEntriesStore[idx] = entry;
    else gradeEntriesStore.push(entry);
  },

  getGradeEntriesForStudent(studentId: string): GradeEntry[] {
    return gradeEntriesStore.filter(e => e.studentId === studentId);
  },

  ensureGradeItemForAssignment(asg: Assignment): GradeItem {
    let item = gradeItemsStore.find(i => i.sourceId === asg.id);
    if (!item) {
      item = {
        id: `gi-${asg.id}`,
        courseId: asg.courseId,
        sourceType: 'assignment',
        sourceId: asg.id,
        title: asg.title,
        maxPoints: asg.points,
        published: true,
      };
      gradeItemsStore.push(item);
    }
    return item;
  },
};
