import type { ActivityAttempt } from './activities';

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type UserRole = 'admin' | 'teacher' | 'student';
export type GradeTier = 'junior' | 'middle' | 'senior';

export interface Grade {
  id: string;
  name: string;
  tier: GradeTier;
  order: number;
  description: string;
  ageRange?: string;
  color?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  role: UserRole;
  gradeId?: string;
  classGroup?: string;
  academicBatch?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  icon: string;
  color: string;
  category: string;
  courseCount: number;
  lessonCount: number;
  featured: boolean;
  bannerImage?: string;
}

export interface Instructor {
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'code' | 'link' | 'zip' | 'document';
  url: string;
  size?: string;
}

export interface KeyConcept {
  title: string;
  detail: string;
}

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  description: string;
  type?: 'video' | 'reading' | 'assignment' | 'quiz';
  videoUrl: string;
  videoId: string;
  duration: string;
  durationSeconds?: number;
  chapterId: string;
  order: number;
  learningObjectives: string[];
  keyConcepts: KeyConcept[];
  resources: Resource[];
  quizId?: string;
  isPublished?: boolean;
  topic?: string;
  prerequisiteLessonId?: string;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  gradeId: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  subjectId: string;
  subjectName: string;
  level: CourseLevel;
  duration: string;
  lessonCount: number;
  chapters: Chapter[];
  featured: boolean;
  instructor: Instructor;
  rating: number;
  studentsEnrolled: number;
  updatedAt: string;
  status?: 'published' | 'draft';
  order?: number;
}

// Sanitized quiz question for students — strictly NO answer keys or explanations
export interface ClientQuizQuestion {
  id: string;
  question: string;
  options: string[];
  marks?: number;
  topic?: string;
}

// Authored quiz question for teachers and quiz creators
export interface AuthoredQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  marks?: number;
  topic?: string;
}

export type QuizQuestion = AuthoredQuizQuestion;

export interface ClientQuiz {
  id: string;
  title: string;
  description: string;
  gradeId: string;
  subjectId?: string;
  courseId?: string;
  lessonId?: string;
  passingScore: number;
  questions: ClientQuizQuestion[];
  startDate?: string;
  startTime?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  durationMinutes?: number;
  totalMarks?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  gradeId: string;
  subjectId?: string;
  courseId?: string;
  lessonId?: string;
  passingScore: number;
  questions: QuizQuestion[];
  startDate?: string;
  startTime?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  durationMinutes?: number;
  totalMarks?: number;
}

export interface QuestionResultItem {
  questionId: string;
  questionText: string;
  studentAnswerIndex: number;
  correctAnswerIndex: number;
  studentAnswerText: string;
  correctAnswerText: string;
  isCorrect: boolean;
  marksAwarded: number;
  maxMarks: number;
  explanation?: string;
}

export interface QuizResult {
  id?: string;
  userId?: string;
  quizId: string;
  quizName?: string;
  courseId?: string;
  score: number;
  maxScore?: number;
  total: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
  startedAt?: string;
  timeTakenSeconds?: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  unanswered?: number;
  answers: Record<string, number>;
  questionResults?: QuestionResultItem[];
}

export interface LastViewed {
  courseSlug: string;
  lessonSlug: string;
  title: string;
  timestamp: string;
  lastPositionSeconds?: number;
  durationSeconds?: number;
  watchPercentage?: number;
}

export interface LessonProgressRecord {
  lessonId: string;
  courseId: string;
  startedAt: string;
  lastPositionSeconds: number;
  durationSeconds: number;
  watchPercentage: number;
  completed: boolean;
  lastAccessedAt: string;
  completedAt?: string;
}

export interface UserProgress {
  completedLessons: string[]; // lessonIds
  courseProgress: Record<string, number>; // courseId -> percentage
  quizResults: Record<string, QuizResult>; // quizId -> QuizResult
  activityResults?: Record<string, ActivityAttempt>; // activityId -> ActivityAttempt
  lessonRecords?: Record<string, LessonProgressRecord>; // lessonId -> LessonProgressRecord
  lastViewedLesson?: LastViewed;
}

export interface StudentOverview {
  profile: UserProfile;
  lessonsCompletedCount: number;
  quizAveragePercentage: number;
  overallProgressPercentage: number;
  lastActive: string;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  size: string;
  dimensions?: string;
  uploadedAt: string;
  category: 'courses' | 'subjects' | 'lessons' | 'banners';
}

// ==========================================
// PHASE 3: ASSIGNMENTS, RUBRICS & GRADEBOOK
// ==========================================

export interface RubricCriterion {
  id: string;
  rubricId?: string;
  title: string;
  description?: string;
  maxPoints: number;
  position: number;
}

export interface Rubric {
  id: string;
  courseId: string;
  title: string;
  criteria: RubricCriterion[];
  createdAt?: string;
}

export interface RubricScore {
  id?: string;
  submissionId: string;
  criterionId: string;
  points: number;
  comment?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseTitle?: string;
  lessonId?: string;
  title: string;
  instructionsMd: string;
  dueAt: string;
  closeAt?: string;
  points: number;
  latePenaltyPercentPerDay: number;
  allowedMime: string[];
  maxFileMb: number;
  rubricId?: string;
  rubric?: Rubric;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubmissionFile {
  id: string;
  submissionId: string;
  storagePath: string;
  filename: string;
  mime: string;
  sizeBytes: number;
  downloadUrl?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle?: string;
  courseId?: string;
  courseTitle?: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  status: 'draft' | 'submitted' | 'returned' | 'graded';
  submittedAt?: string;
  attemptNo: number;
  textBodyMd?: string;
  score?: number;
  feedbackMd?: string;
  isLate?: boolean;
  latePenaltyApplied?: number;
  gradedBy?: string;
  gradedAt?: string;
  files?: SubmissionFile[];
  rubricScores?: RubricScore[];
  createdAt?: string;
}

export interface GradeCategory {
  id: string;
  courseId: string;
  name: string;
  weightPercent: number;
}

export interface GradeItem {
  id: string;
  courseId: string;
  categoryId?: string;
  categoryName?: string;
  weightPercent?: number;
  sourceType: 'quiz' | 'assignment' | 'manual';
  sourceId?: string;
  title: string;
  maxPoints: number;
  published: boolean;
  dueDate?: string;
  topic?: string;
}

export interface GradeEntry {
  id: string;
  gradeItemId: string;
  studentId: string;
  points: number;
  comment?: string;
  status?: 'graded' | 'missing' | 'excused' | 'submitted';
  isExcused?: boolean;
  isMissing?: boolean;
  enteredBy?: string;
  enteredAt?: string;
}

export interface GradeScale {
  id: string;
  name: string;
  minPercentage: number;
  maxPercentage: number;
  letterGrade: string;
  gpaPoints: number;
  isPassing: boolean;
  position: number;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  createdAt: string;
}

export interface AtRiskStudent {
  studentId: string;
  studentName: string;
  studentEmail: string;
  gradeId?: string;
  courseId?: string;
  courseTitle?: string;
  reasons: ('no_activity_7_days' | 'low_quiz_average')[];
  reasonDetails: string[];
  lastActiveAt?: string;
  weightedAverage?: number;
  averageQuizScore?: number;
  letterGrade?: string;
  missingCount: number;
  riskLevel: 'high' | 'medium';
}

export interface TopicMastery {
  topic: string;
  courseId: string;
  courseTitle?: string;
  gradeId?: string;
  totalAttempts: number;
  correctAnswers: number;
  accuracyPercent: number;
  isWeakTopic: boolean;
}

export type NotificationEventType =
  | 'assignment_posted'
  | 'deadline_in_24h'
  | 'grade_published'
  | 'submission_returned'
  | 'thread_reply'
  | 'announcement_pinned'
  | 'certificate_issued';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationEventType | string;
  title: string;
  body: string;
  linkUrl?: string;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  eventType: string;
  channel: 'instant' | 'daily_digest' | 'off';
  emailOptOut: boolean;
  updatedAt?: string;
}

export interface Announcement {
  id: string;
  scope: 'institution' | 'course' | 'grade';
  courseId?: string;
  gradeId?: string;
  title: string;
  bodyMd: string;
  pinned: boolean;
  createdBy?: string;
  authorName?: string;
  publishAt: string;
  emailSent: boolean;
  createdAt: string;
}

export interface DiscussionThread {
  id: string;
  courseId: string;
  lessonId?: string;
  title: string;
  createdBy: string;
  authorName?: string;
  authorRole?: string;
  locked: boolean;
  pinned: boolean;
  postCount?: number;
  lastActivityAt?: string;
  createdAt: string;
}

export interface DiscussionPost {
  id: string;
  threadId: string;
  parentPostId?: string;
  authorId: string;
  authorName?: string;
  authorRole?: 'student' | 'teacher' | 'admin';
  bodyMd: string;
  isInstructorAnswer: boolean;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  studentName?: string;
  courseId: string;
  courseTitle?: string;
  serial: string;
  issuedAt: string;
  pdfStoragePath: string;
  verificationToken: string;
  downloadUrl?: string;
}

// ============================================================================
// PHASE 6: INSTITUTIONAL TYPES
// ============================================================================

export interface Section {
  id: string;
  gradeId: string;
  name: string;
  classTeacherId?: string;
  classTeacherName?: string;
  studentCount?: number;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  courseId: string;
  sectionId?: string;
  sectionName?: string;
  status: 'active' | 'dropped' | 'completed';
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'tardy' | 'excused';

export interface AttendanceRecord {
  id: string;
  sectionId: string;
  studentId: string;
  studentName?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  markedBy?: string;
  markedAt: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  totalDays: number;
  presentCount: number;
  absentCount: number;
  tardyCount: number;
  excusedCount: number;
  attendancePercentage: number;
  records: AttendanceRecord[];
}

export interface GuardianLink {
  id: string;
  guardianId: string;
  guardianName?: string;
  guardianEmail?: string;
  studentId: string;
  studentName?: string;
  relationship: string;
  status: 'pending' | 'active' | 'revoked';
  inviteCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuardianStudentDossier {
  student: {
    id: string;
    fullName: string;
    email: string;
    gradeId: string;
    gradeName: string;
    academicBatch?: string;
    sectionName?: string;
  };
  attendance: {
    attendancePercentage: number;
    totalDays: number;
    presentCount: number;
    absentCount: number;
    recentRecords: AttendanceRecord[];
  };
  upcomingDeadlines: {
    id: string;
    title: string;
    courseTitle: string;
    dueAt: string;
    points: number;
    submitted: boolean;
  }[];
  publishedGrades: {
    courseId: string;
    courseTitle: string;
    weightedPercentage: number;
    letterGrade: string;
    isPassing: boolean;
    missingCount: number;
  }[];
}

export interface LiveSession {
  id: string;
  courseId: string;
  courseTitle?: string;
  sectionId?: string;
  title: string;
  provider: 'google_meet' | 'zoom' | 'teams';
  meetingUrl: string;
  scheduledStart: string;
  scheduledEnd: string;
  hostTeacherId: string;
  hostTeacherName?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  canJoin?: boolean;
  joinWindowMessage?: string;
  createdAt: string;
}

export type AuditLogEntry = AuditLog;

export * from './activities';

