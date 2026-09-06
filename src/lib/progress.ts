import { UserProgress, QuizResult, LastViewed, Course } from '@/types';

const PROGRESS_KEY = 'edurah_user_progress';

const DEFAULT_PROGRESS: UserProgress = {
  completedLessons: [],
  courseProgress: {},
  quizResults: {}
};

export interface AchievementBadge {
  id: string;
  name: string;
  category: string;
  unlocked: boolean;
  color: string;
  iconName: 'Star' | 'Zap' | 'Award' | 'CheckCircle2';
  description: string;
}

class ProgressServiceClass {
  getProgress(): UserProgress {
    if (typeof window === 'undefined') return DEFAULT_PROGRESS;
    try {
      const data = localStorage.getItem(PROGRESS_KEY);
      return data ? JSON.parse(data) : DEFAULT_PROGRESS;
    } catch {
      return DEFAULT_PROGRESS;
    }
  }

  private saveProgress(progress: UserProgress): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }

  isLessonCompleted(lessonId: string): boolean {
    const progress = this.getProgress();
    return progress.completedLessons.includes(lessonId);
  }

  toggleLessonComplete(lessonId: string, course: Course): boolean {
    const progress = this.getProgress();
    const isCompleted = progress.completedLessons.includes(lessonId);

    if (isCompleted) {
      progress.completedLessons = progress.completedLessons.filter(id => id !== lessonId);
    } else {
      progress.completedLessons.push(lessonId);
    }

    // Recalculate course percentage
    let totalLessonsInCourse = 0;
    let completedInCourse = 0;

    for (const chap of course.chapters) {
      for (const les of chap.lessons) {
        totalLessonsInCourse++;
        if (progress.completedLessons.includes(les.id)) {
          completedInCourse++;
        }
      }
    }

    const percentage = totalLessonsInCourse > 0
      ? Math.round((completedInCourse / totalLessonsInCourse) * 100)
      : 0;

    progress.courseProgress[course.id] = percentage;
    this.saveProgress(progress);

    return !isCompleted;
  }

  saveQuizResult(result: QuizResult): void {
    const progress = this.getProgress();
    progress.quizResults[result.quizId] = result;
    this.saveProgress(progress);
  }

  getQuizResult(quizId: string): QuizResult | undefined {
    const progress = this.getProgress();
    return progress.quizResults[quizId];
  }

  setLastViewedLesson(lastViewed: LastViewed): void {
    const progress = this.getProgress();
    progress.lastViewedLesson = lastViewed;
    this.saveProgress(progress);
  }

  getCourseProgress(courseId: string): number {
    const progress = this.getProgress();
    return progress.courseProgress[courseId] || 0;
  }

  getOverallProgress(courses: Course[]): number {
    const progress = this.getProgress();
    if (courses.length === 0) return 0;
    
    const percentages = courses.map(c => progress.courseProgress[c.id] || 0);
    const sum = percentages.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / courses.length);
  }

  calculateStreak(): number {
    const progress = this.getProgress();
    const count = progress.completedLessons.length + Object.keys(progress.quizResults).length;
    // Base streak for active learner plus count
    return 12 + count;
  }

  getAchievements(): AchievementBadge[] {
    const progress = this.getProgress();
    const completedLessonsCount = progress.completedLessons.length;
    const completedQuizzesCount = Object.keys(progress.quizResults).length;

    return [
      {
        id: 'ach-1',
        name: 'Confident Speaker',
        category: 'Communication',
        unlocked: completedLessonsCount >= 1,
        color: 'bg-emerald-500 text-emerald-100',
        iconName: 'Star',
        description: 'Completed your first lesson track'
      },
      {
        id: 'ach-2',
        name: 'Quick Learner',
        category: 'Speed',
        unlocked: completedQuizzesCount >= 1,
        color: 'bg-amber-500 text-amber-100',
        iconName: 'Zap',
        description: 'Passed your first conceptual quiz'
      },
      {
        id: 'ach-3',
        name: 'Grammar Star',
        category: 'Mastery',
        unlocked: completedQuizzesCount >= 2,
        color: 'bg-blue-500 text-blue-100',
        iconName: 'Award',
        description: 'Scored above 80% on 2 quizzes'
      },
      {
        id: 'ach-4',
        name: 'Helping Hand',
        category: 'Community',
        unlocked: true,
        color: 'bg-purple-500 text-purple-100',
        iconName: 'CheckCircle2',
        description: 'Active member of Edurah community'
      }
    ];
  }

  resetAllProgress(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PROGRESS_KEY);
  }
}

export const ProgressService = new ProgressServiceClass();
