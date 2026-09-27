import { Activity, ActivityAttempt, ActivityStats, ActivityType, ActivityStatus, ActivityDifficulty } from '@/types/activities';
import { INITIAL_ACTIVITIES } from '@/content/activities';
import { supabase } from '@/lib/supabase/client';

export interface ActivityFilter {
  gradeId?: string;
  subjectId?: string;
  courseId?: string;
  activityType?: ActivityType;
  status?: ActivityStatus;
  difficulty?: ActivityDifficulty;
  search?: string;
}

const STORAGE_KEY_ACTIVITIES = 'edurah_activities_cache_v1';
const STORAGE_KEY_ATTEMPTS = 'edurah_activity_attempts_v1';

class ActivityServiceClass {
  private activitiesCache: Activity[] = [...INITIAL_ACTIVITIES];
  private attemptsCache: ActivityAttempt[] = [];
  private isLoadedFromStorage = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      void this.syncWithServer();
    }
  }

  private loadFromStorage() {
    try {
      const storedActivities = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
      if (storedActivities) {
        const parsed = JSON.parse(storedActivities);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge custom/updated activities with initial seed
          const map = new Map<string, Activity>();
          INITIAL_ACTIVITIES.forEach((a) => map.set(a.id, a));
          parsed.forEach((a) => map.set(a.id, a));
          this.activitiesCache = Array.from(map.values());
        }
      }

      const storedAttempts = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
      if (storedAttempts) {
        const parsed = JSON.parse(storedAttempts);
        if (Array.isArray(parsed)) {
          this.attemptsCache = parsed;
        }
      }

      this.isLoadedFromStorage = true;
    } catch (e) {
      console.warn('Failed to load activities from storage:', e);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(this.activitiesCache));
      localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(this.attemptsCache));
    } catch (e) {
      console.warn('Failed to save activities to storage:', e);
    }
  }

  /**
   * Syncs with Supabase backend API if available
   */
  async syncWithServer(): Promise<void> {
    try {
      const res = await fetch('/api/activities');
      if (res.ok) {
        const json = await res.json();
        if (json.data?.activities && Array.isArray(json.data.activities) && json.data.activities.length > 0) {
          const map = new Map<string, Activity>();
          // Keep local edits if newer, otherwise use server
          this.activitiesCache.forEach((a) => map.set(a.id, a));
          json.data.activities.forEach((a: Activity) => map.set(a.id, a));
          this.activitiesCache = Array.from(map.values());
          this.saveToStorage();
        }
      }
    } catch {
      // Gracefully retain local cache
    }
  }

  // --------------------------------------------------------------------------
  // ACTIVITIES QUERIES
  // --------------------------------------------------------------------------
  getActivities(filter?: ActivityFilter): Activity[] {
    let list = [...this.activitiesCache];

    if (filter) {
      if (filter.gradeId && filter.gradeId !== 'all') {
        list = list.filter((a) => a.gradeId === filter.gradeId);
      }
      if (filter.subjectId && filter.subjectId !== 'all') {
        list = list.filter((a) => a.subjectId === filter.subjectId);
      }
      if (filter.courseId && filter.courseId !== 'all') {
        list = list.filter((a) => a.courseId === filter.courseId);
      }
      if (filter.activityType && filter.activityType !== ('all' as any)) {
        list = list.filter((a) => a.activityType === filter.activityType);
      }
      if (filter.status && filter.status !== ('all' as any)) {
        list = list.filter((a) => a.status === filter.status);
      }
      if (filter.difficulty && filter.difficulty !== ('all' as any)) {
        list = list.filter((a) => a.difficulty === filter.difficulty);
      }
      if (filter.search?.trim()) {
        const term = filter.search.trim().toLowerCase();
        list = list.filter(
          (a) =>
            a.title.toLowerCase().includes(term) ||
            a.description.toLowerCase().includes(term) ||
            a.activityType.toLowerCase().includes(term)
        );
      }
    }

    return list;
  }

  getActivitiesByGrade(gradeId: string, publishedOnly = true): Activity[] {
    return this.getActivities({
      gradeId,
      status: publishedOnly ? 'published' : undefined,
    });
  }

  getActivitiesByCourse(courseId: string, publishedOnly = true): Activity[] {
    return this.getActivities({
      courseId,
      status: publishedOnly ? 'published' : undefined,
    });
  }

  getActivityById(id: string): Activity | undefined {
    return this.activitiesCache.find((a) => a.id === id);
  }

  // --------------------------------------------------------------------------
  // ACTIVITIES MUTATIONS
  // --------------------------------------------------------------------------
  saveActivity(activity: Activity): Activity {
    const existingIndex = this.activitiesCache.findIndex((a) => a.id === activity.id);
    const now = new Date().toISOString();

    const activityToSave: Activity = {
      ...activity,
      updatedAt: now,
      createdAt: activity.createdAt || now,
    };

    if (existingIndex >= 0) {
      this.activitiesCache[existingIndex] = activityToSave;
    } else {
      this.activitiesCache.unshift(activityToSave);
    }

    this.saveToStorage();

    // Async attempt to persist to API / Supabase
    if (typeof window !== 'undefined') {
      void this.persistToServer(activityToSave, existingIndex >= 0 ? 'PUT' : 'POST');
    }

    return activityToSave;
  }

  deleteActivity(id: string): boolean {
    const prevCount = this.activitiesCache.length;
    this.activitiesCache = this.activitiesCache.filter((a) => a.id !== id);
    const deleted = this.activitiesCache.length < prevCount;

    if (deleted) {
      this.saveToStorage();
      if (typeof window !== 'undefined') {
        void fetch(`/api/activities/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
      }
    }

    return deleted;
  }

  private async persistToServer(activity: Activity, method: 'POST' | 'PUT') {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const url = method === 'PUT' ? `/api/activities/${encodeURIComponent(activity.id)}` : '/api/activities';
      await fetch(url, {
        method,
        headers,
        body: JSON.stringify(activity),
      });
    } catch {
      // Retain local copy
    }
  }

  // --------------------------------------------------------------------------
  // ATTEMPTS & RESULTS
  // --------------------------------------------------------------------------
  recordAttempt(attempt: ActivityAttempt): void {
    const idx = this.attemptsCache.findIndex(
      (a) => a.activityId === attempt.activityId && a.studentId === attempt.studentId && a.attemptNumber === attempt.attemptNumber
    );

    if (idx >= 0) {
      this.attemptsCache[idx] = attempt;
    } else {
      this.attemptsCache.unshift(attempt);
    }

    this.saveToStorage();
  }

  getAttempts(filter?: { activityId?: string; studentId?: string; gradeId?: string }): ActivityAttempt[] {
    let list = [...this.attemptsCache];

    if (filter?.activityId) {
      list = list.filter((a) => a.activityId === filter.activityId);
    }
    if (filter?.studentId) {
      list = list.filter((a) => a.studentId === filter.studentId);
    }
    if (filter?.gradeId) {
      // Lookup activity's grade
      list = list.filter((att) => {
        const act = this.getActivityById(att.activityId);
        return act?.gradeId === filter.gradeId;
      });
    }

    return list;
  }

  getStudentBestAttempt(activityId: string, studentId: string): ActivityAttempt | undefined {
    const attempts = this.attemptsCache.filter((a) => a.activityId === activityId && a.studentId === studentId);
    if (attempts.length === 0) return undefined;
    return attempts.reduce((best, curr) => (curr.score > best.score ? curr : best), attempts[0]);
  }

  getActivityStats(activityId: string): ActivityStats {
    const activity = this.getActivityById(activityId);
    const attempts = this.getAttempts({ activityId });

    if (attempts.length === 0 || !activity) {
      return {
        activityId,
        title: activity?.title || 'Unknown Activity',
        type: activity?.activityType || 'match_pairs',
        gradeId: activity?.gradeId || 'grade-1',
        totalAttempts: 0,
        uniqueStudentsCount: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        completionRate: 0,
      };
    }

    const uniqueStudents = new Set(attempts.map((a) => a.studentId));
    const scores = attempts.map((a) => a.score);
    const sumScore = scores.reduce((a, b) => a + b, 0);
    const averageScore = Math.round(sumScore / attempts.length);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const completedCount = attempts.filter((a) => a.completed).length;
    const completionRate = Math.round((completedCount / attempts.length) * 100);

    return {
      activityId,
      title: activity.title,
      type: activity.activityType,
      gradeId: activity.gradeId,
      totalAttempts: attempts.length,
      uniqueStudentsCount: uniqueStudents.size,
      averageScore,
      highestScore,
      lowestScore,
      completionRate,
    };
  }
}

export const ActivityService = new ActivityServiceClass();
