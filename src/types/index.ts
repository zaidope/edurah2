export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type UserRole = 'admin' | 'student';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  role: UserRole;
  classGroup?: string;
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
  videoUrl: string;
  videoId: string;
  duration: string;
  chapterId: string;
  order: number;
  learningObjectives: string[];
  keyConcepts: KeyConcept[];
  resources: Resource[];
  quizId?: string;
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
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subjectId?: string;
  courseId?: string;
  lessonId?: string;
  passingScore: number;
  questions: QuizQuestion[];
}

export interface QuizResult {
  id?: string;
  userId?: string;
  quizId: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
  answers: Record<string, number>;
}

export interface LastViewed {
  courseSlug: string;
  lessonSlug: string;
  title: string;
  timestamp: string;
}

export interface UserProgress {
  completedLessons: string[]; // lessonIds
  courseProgress: Record<string, number>; // courseId -> percentage
  quizResults: Record<string, QuizResult>; // quizId -> QuizResult
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
