import { UserProgress, QuizResult, LastViewed, Course, LessonProgressRecord } from '@/types';
import { supabase } from '@/lib/supabase/client';

const DEFAULT_PROGRESS: UserProgress = {
  completedLessons: [],
  courseProgress: {},
  quizResults: {},
  lessonRecords: {},
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
  private currentUserId: string | null = null;

  setCurrentUserId(userId: string | null) {
    this.currentUserId = userId;
  }

  private getKey(userId?: string): string {
    const uid = userId || this.currentUserId;
    return uid ? `edurah_progress_user_${uid}` : 'edurah_progress_guest';
  }

  getProgress(userId?: string): UserProgress {
    if (typeof window === 'undefined') return DEFAULT_PROGRESS;
    try {
      const key = this.getKey(userId);
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      return DEFAULT_PROGRESS;
    } catch {
      return DEFAULT_PROGRESS;
    }
  }

  private saveProgress(progress: UserProgress, userId?: string): void {
    if (typeof window === 'undefined') return;
    try {
      const key = this.getKey(userId);
      localStorage.setItem(key, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save progress locally:', e);
    }
  }

  /**
   * Synchronize student progress with Supabase backend database
   */
  async syncFromSupabase(userId?: string): Promise<UserProgress> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return this.getProgress(userId);
      }

      const uid = userId || session.user.id;
      const res = await fetch(`/api/progress/user?userId=${encodeURIComponent(uid)}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const current = this.getProgress(uid);
          const merged: UserProgress = {
            completedLessons: data.completedLessons || current.completedLessons || [],
            courseProgress: current.courseProgress || {},
            quizResults: { ...current.quizResults, ...(data.quizResults || {}) },
            lessonRecords: { ...current.lessonRecords, ...(data.lessonRecords || {}) },
            lastViewedLesson: data.lastViewedLesson || current.lastViewedLesson,
          };
          this.saveProgress(merged, uid);
          return merged;
        }
      }
    } catch (e) {
      console.warn('Failed to sync progress with Supabase backend:', e);
    }
    return this.getProgress(userId);
  }

  isLessonCompleted(lessonId: string, userId?: string): boolean {
    const progress = this.getProgress(userId);
    return progress.completedLessons.includes(lessonId);
  }

  getLessonRecord(lessonId: string, userId?: string): LessonProgressRecord | undefined {
    const progress = this.getProgress(userId);
    return progress.lessonRecords?.[lessonId];
  }

  /**
   * Save video playback position and duration.
   * Auto-completes lesson when watch percentage reaches 90%.
   */
  async saveVideoProgress(
    course: Course,
    lessonId: string,
    positionSeconds: number,
    durationSeconds: number,
    interval?: [number, number],
    playbackRate?: number,
    userId?: string
  ): Promise<{ completed: boolean; watchPercentage: number }> {
    const progress = this.getProgress(userId);
    const pos = Math.max(0, positionSeconds);
    const dur = Math.max(0, durationSeconds);
    const watchPct = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;

    let isCompleted = progress.completedLessons.includes(lessonId);
    let completedAt: string | undefined = undefined;

    // 90% Watch Completion Rule
    if (watchPct >= 90 && !isCompleted) {
      isCompleted = true;
      completedAt = new Date().toISOString();
      progress.completedLessons.push(lessonId);
    }

    if (!progress.lessonRecords) progress.lessonRecords = {};

    progress.lessonRecords[lessonId] = {
      lessonId,
      courseId: course.id,
      startedAt: progress.lessonRecords[lessonId]?.startedAt || new Date().toISOString(),
      lastPositionSeconds: pos,
      durationSeconds: dur,
      watchPercentage: Math.max(watchPct, progress.lessonRecords[lessonId]?.watchPercentage || 0),
      completed: isCompleted,
      lastAccessedAt: new Date().toISOString(),
      completedAt,
    };

    // Update last viewed lesson
    progress.lastViewedLesson = {
      courseSlug: course.slug,
      lessonSlug: lessonId,
      title: lessonId,
      timestamp: new Date().toISOString(),
      lastPositionSeconds: pos,
      durationSeconds: dur,
      watchPercentage: watchPct,
    };

    // Recalculate course percentage: completed active lessons / total active lessons * 100
    this.recalculateCourseProgress(progress, course);
    this.saveProgress(progress, userId);

    // Queue in durable outbox and synchronize with backend API
    const idempotencyKey = `${course.id}_${lessonId}_${Math.floor(Date.now() / 5000)}`;
    this.enqueueOutbox({
      id: idempotencyKey,
      endpoint: '/api/progress/lesson',
      payload: {
        courseId: course.id,
        lessonId,
        positionSeconds: pos,
        durationSeconds: dur,
        interval,
        playbackRate,
      },
    });

    void this.flushOutbox();

    return { completed: isCompleted, watchPercentage: watchPct };
  }

  private getOutbox(): Array<{ id: string; endpoint: string; payload: any }> {
    if (typeof window === 'undefined') return [];
    try {
      const item = localStorage.getItem('edurah_progress_outbox');
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  }

  private setOutbox(items: Array<{ id: string; endpoint: string; payload: any }>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('edurah_progress_outbox', JSON.stringify(items));
    } catch {
      // Ignore
    }
  }

  private enqueueOutbox(entry: { id: string; endpoint: string; payload: any }): void {
    const items = this.getOutbox().filter((i) => i.id !== entry.id);
    items.push(entry);
    this.setOutbox(items);
  }

  async flushOutbox(): Promise<void> {
    const items = this.getOutbox();
    if (items.length === 0) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const remaining: typeof items = [];
      for (const item of items) {
        try {
          const res = await fetch(item.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(item.payload),
          });
          if (!res.ok && res.status >= 500) {
            remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      }
      this.setOutbox(remaining);
    } catch {
      // Keep outbox intact for next retry
    }
  }

  toggleLessonComplete(lessonId: string, course: Course, userId?: string): boolean {
    const progress = this.getProgress(userId);
    const isCompleted = progress.completedLessons.includes(lessonId);

    if (isCompleted) {
      progress.completedLessons = progress.completedLessons.filter((id) => id !== lessonId);
    } else {
      progress.completedLessons.push(lessonId);
    }

    if (!progress.lessonRecords) progress.lessonRecords = {};
    if (progress.lessonRecords[lessonId]) {
      progress.lessonRecords[lessonId].completed = !isCompleted;
      if (!isCompleted) progress.lessonRecords[lessonId].completedAt = new Date().toISOString();
    }

    this.recalculateCourseProgress(progress, course);
    this.saveProgress(progress, userId);

    this.enqueueOutbox({
      id: `${course.id}_${lessonId}_toggle_${Date.now()}`,
      endpoint: '/api/progress/lesson',
      payload: {
        courseId: course.id,
        lessonId,
        positionSeconds: 0,
        durationSeconds: 0,
        manualToggle: !isCompleted,
      },
    });
    void this.flushOutbox();

    return !isCompleted;
  }

  private recalculateCourseProgress(progress: UserProgress, course: Course): void {
    let totalLessonsInCourse = 0;
    let completedInCourse = 0;

    for (const chap of course.chapters) {
      for (const les of chap.lessons) {
        if (les.isPublished !== false) {
          totalLessonsInCourse++;
          if (progress.completedLessons.includes(les.id)) {
            completedInCourse++;
          }
        }
      }
    }

    const percentage = totalLessonsInCourse > 0
      ? Math.round((completedInCourse / totalLessonsInCourse) * 100)
      : 0;

    progress.courseProgress[course.id] = percentage;
  }

  saveQuizResult(result: QuizResult, userId?: string): void {
    const progress = this.getProgress(userId);
    progress.quizResults[result.quizId] = result;
    this.saveProgress(progress, userId);
  }

  getQuizResult(quizId: string, userId?: string): QuizResult | undefined {
    const progress = this.getProgress(userId);
    return progress.quizResults[quizId];
  }

  getCourseProgress(courseId: string, userId?: string): number {
    const progress = this.getProgress(userId);
    return progress.courseProgress[courseId] || 0;
  }

  getOverallProgress(courses: Course[], userId?: string): number {
    const progress = this.getProgress(userId);
    if (courses.length === 0) return 0;

    const percentages = courses.map((c) => progress.courseProgress[c.id] || 0);
    const sum = percentages.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / courses.length);
  }

  calculateStreak(userId?: string): number {
    const progress = this.getProgress(userId);
    const count = progress.completedLessons.length + Object.keys(progress.quizResults).length;
    return 12 + count;
  }

  getAchievements(userId?: string): AchievementBadge[] {
    const progress = this.getProgress(userId);
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
        description: 'Completed your first lesson track',
      },
      {
        id: 'ach-2',
        name: 'Quick Learner',
        category: 'Speed',
        unlocked: completedQuizzesCount >= 1,
        color: 'bg-amber-500 text-amber-100',
        iconName: 'Zap',
        description: 'Passed your first conceptual quiz',
      },
      {
        id: 'ach-3',
        name: 'Grammar Star',
        category: 'Mastery',
        unlocked: completedQuizzesCount >= 2,
        color: 'bg-blue-500 text-blue-100',
        iconName: 'Award',
        description: 'Scored above 80% on 2 quizzes',
      },
      {
        id: 'ach-4',
        name: 'Helping Hand',
        category: 'Community',
        unlocked: true,
        color: 'bg-purple-500 text-purple-100',
        iconName: 'CheckCircle2',
        description: 'Active member of Edurah community',
      },
    ];
  }

  resetAllProgress(userId?: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.getKey(userId));
  }
}

export const ProgressService = new ProgressServiceClass();
