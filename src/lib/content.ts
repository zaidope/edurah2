import { Subject, Course, Lesson, Chapter, Quiz, MediaItem, Grade, QuizQuestion, ClientQuiz, ClientQuizQuestion } from '@/types';
import { INITIAL_SUBJECTS } from '@/content/subjects';
import { INITIAL_COURSES } from '@/content/courses';
import { INITIAL_QUIZZES } from '@/content/quizzes';
import { GRADES, getGradeById as fetchGradeById } from '@/content/grades';
import { supabase } from '@/lib/supabase/client';

const INITIAL_MEDIA: MediaItem[] = [
  {
    id: 'med-1',
    name: 'computer_science_banner.jpg',
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    type: 'image',
    size: '1.4 MB',
    dimensions: '1920x1080',
    uploadedAt: '2026-08-10',
    category: 'banners',
  },
  {
    id: 'med-2',
    name: 'ai_neural_networks.jpg',
    url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80',
    type: 'image',
    size: '2.1 MB',
    dimensions: '1920x1080',
    uploadedAt: '2026-08-14',
    category: 'courses',
  },
];

class ContentServiceClass {
  // In-memory runtime cache (seeded initially, synchronized from Postgres)
  private coursesCache: Course[] = [...INITIAL_COURSES];
  private quizzesCache: Quiz[] = [...INITIAL_QUIZZES];
  private subjectsCache: Subject[] = [...INITIAL_SUBJECTS];
  private mediaCache: MediaItem[] = [...INITIAL_MEDIA];
  private isSynchronized = false;

  constructor() {
    // Attempt background sync if in browser
    if (typeof window !== 'undefined') {
      void this.syncWithServer();
    }
  }

  /**
   * Asynchronously fetches the latest published courses and quizzes from Postgres
   */
  async syncWithServer(): Promise<void> {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const json = await res.json();
        if (json.data?.courses && Array.isArray(json.data.courses) && json.data.courses.length > 0) {
          this.coursesCache = json.data.courses;
        }
      }

      const qRes = await fetch('/api/quizzes');
      if (qRes.ok) {
        const qJson = await qRes.json();
        if (qJson.data?.quizzes && Array.isArray(qJson.data.quizzes) && qJson.data.quizzes.length > 0) {
          this.quizzesCache = qJson.data.quizzes;
        }
      }

      this.isSynchronized = true;
    } catch {
      // In offline or initial bootstrap, gracefully retain memory cache
    }
  }

  // ==========================================
  // GRADES
  // ==========================================
  getGrades(): Grade[] {
    return GRADES;
  }

  getGradeById(id: string): Grade | undefined {
    return fetchGradeById(id);
  }

  // ==========================================
  // SUBJECTS
  // ==========================================
  getSubjects(): Subject[] {
    return this.subjectsCache;
  }

  getSubjectBySlug(slug: string): Subject | undefined {
    return this.subjectsCache.find((s) => s.slug === slug);
  }

  getSubjectById(id: string): Subject | undefined {
    return this.subjectsCache.find((s) => s.id === id);
  }

  saveSubject(subject: Subject): void {
    const idx = this.subjectsCache.findIndex((s) => s.id === subject.id);
    if (idx >= 0) {
      this.subjectsCache[idx] = subject;
    } else {
      this.subjectsCache.push(subject);
    }
  }

  deleteSubject(id: string): void {
    this.subjectsCache = this.subjectsCache.filter((s) => s.id !== id);
  }

  // ==========================================
  // COURSES
  // ==========================================
  getCourses(): Course[] {
    return this.coursesCache;
  }

  getCoursesByGrade(gradeId: string): Course[] {
    return this.coursesCache.filter((c) => c.gradeId === gradeId);
  }

  getCoursesForGrade(gradeId: string): Course[] {
    return this.getCoursesByGrade(gradeId);
  }

  getCourseBySlug(slug: string): Course | undefined {
    return this.coursesCache.find((c) => c.slug === slug);
  }

  getCourseById(id: string): Course | undefined {
    return this.coursesCache.find((c) => c.id === id);
  }

  getCoursesBySubject(subjectId: string): Course[] {
    return this.coursesCache.filter((c) => c.subjectId === subjectId);
  }

  /**
   * Saves course to in-memory cache and asynchronously persists to PostgreSQL database
   */
  async saveCourse(course: Course): Promise<{ success: boolean; error?: string }> {
    const index = this.coursesCache.findIndex((c) => c.id === course.id);
    if (index >= 0) {
      this.coursesCache[index] = course;
    } else {
      this.coursesCache.push(course);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch('/api/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(course),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.error?.message || 'Database sync failed' };
        }
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error saving course' };
    }
  }

  deleteCourse(id: string): void {
    this.coursesCache = this.coursesCache.filter((c) => c.id !== id);
  }

  // ==========================================
  // CHAPTERS & LESSONS
  // ==========================================
  saveChapter(courseId: string, chapter: Chapter): void {
    const course = this.getCourseById(courseId);
    if (!course) return;

    if (!course.chapters) course.chapters = [];
    const idx = course.chapters.findIndex((ch) => ch.id === chapter.id);
    if (idx >= 0) {
      course.chapters[idx] = chapter;
    } else {
      course.chapters.push(chapter);
    }
    void this.saveCourse(course);
  }

  saveLesson(courseId: string, updatedLesson: Lesson): void {
    const course = this.getCourseById(courseId);
    if (!course) return;

    let found = false;
    for (const chap of course.chapters || []) {
      if (chap.id === updatedLesson.chapterId) {
        const lIndex = chap.lessons.findIndex((l) => l.id === updatedLesson.id);
        if (lIndex >= 0) {
          chap.lessons[lIndex] = updatedLesson;
        } else {
          chap.lessons.push(updatedLesson);
        }
        found = true;
        break;
      }
    }

    if (!found && course.chapters && course.chapters.length > 0) {
      course.chapters[0].lessons.push(updatedLesson);
    }

    void this.saveCourse(course);
  }

  getAllLessons(): { lesson: Lesson; course: Course }[] {
    const result: { lesson: Lesson; course: Course }[] = [];
    for (const course of this.coursesCache) {
      for (const chapter of course.chapters || []) {
        for (const lesson of chapter.lessons || []) {
          result.push({ lesson, course });
        }
      }
    }
    return result;
  }

  getLessonBySlug(
    courseSlug: string,
    lessonSlug: string
  ): { lesson: Lesson; course: Course; nextLesson?: Lesson; prevLesson?: Lesson } | undefined {
    const course = this.getCourseBySlug(courseSlug);
    if (!course) return undefined;

    const allLessons: Lesson[] = [];
    for (const chapter of course.chapters || []) {
      allLessons.push(...chapter.lessons);
    }
    allLessons.sort((a, b) => a.order - b.order);

    const index = allLessons.findIndex((l) => l.slug === lessonSlug);
    if (index === -1) return undefined;

    return {
      lesson: allLessons[index],
      course,
      nextLesson: allLessons[index + 1],
      prevLesson: allLessons[index - 1],
    };
  }

  // ==========================================
  // QUIZZES & SENSITIVE ANSWER STRIPPING
  // ==========================================
  getQuizzes(): Quiz[] {
    return this.quizzesCache;
  }

  getQuizzesByGrade(gradeId: string): Quiz[] {
    return this.quizzesCache.filter((q) => q.gradeId === gradeId);
  }

  getQuizById(id: string): Quiz | undefined {
    return this.quizzesCache.find((q) => q.id === id);
  }

  /**
   * Returns quiz with answer keys and explanations strictly stripped for student security
   */
  getQuizForStudent(id: string): ClientQuiz | undefined {
    const quiz = this.getQuizById(id);
    if (!quiz) return undefined;

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      gradeId: quiz.gradeId,
      courseId: quiz.courseId,
      lessonId: quiz.lessonId,
      subjectId: quiz.subjectId,
      passingScore: quiz.passingScore,
      totalMarks: quiz.totalMarks,
      durationMinutes: quiz.durationMinutes,
      startDate: quiz.startDate,
      startTime: quiz.startTime,
      deadlineDate: quiz.deadlineDate,
      deadlineTime: quiz.deadlineTime,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        marks: q.marks,
      })),
    };
  }

  /**
   * Returns full quiz with answers for faculty evaluation
   */
  getQuizForTeacher(id: string): Quiz | undefined {
    return this.getQuizById(id);
  }

  /**
   * Saves quiz to in-memory cache and asynchronously persists to PostgreSQL database
   */
  async saveQuiz(quiz: Quiz): Promise<{ success: boolean; error?: string }> {
    const index = this.quizzesCache.findIndex((q) => q.id === quiz.id);
    if (index >= 0) {
      this.quizzesCache[index] = quiz;
    } else {
      this.quizzesCache.push(quiz);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch('/api/quizzes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(quiz),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.error?.message || 'Quiz database sync failed' };
        }
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error saving quiz' };
    }
  }

  deleteQuiz(id: string): void {
    this.quizzesCache = this.quizzesCache.filter((q) => q.id !== id);
  }

  // ==========================================
  // MEDIA
  // ==========================================
  getMediaItems(): MediaItem[] {
    return this.mediaCache;
  }

  saveMediaItem(item: MediaItem): void {
    this.mediaCache.unshift(item);
  }

  deleteMediaItem(id: string): void {
    this.mediaCache = this.mediaCache.filter((m) => m.id !== id);
  }

  // ==========================================
  // SEARCH
  // ==========================================
  search(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) return { subjects: [], courses: [], lessons: [], quizzes: [] };

    const subjects = this.subjectsCache.filter(
      (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );

    const courses = this.coursesCache.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.subjectName.toLowerCase().includes(q)
    );

    const lessons = this.getAllLessons().filter(
      ({ lesson }) =>
        lesson.title.toLowerCase().includes(q) || lesson.description.toLowerCase().includes(q)
    );

    const quizzes = this.quizzesCache.filter(
      (qz) => qz.title.toLowerCase().includes(q) || qz.description.toLowerCase().includes(q)
    );

    return { subjects, courses, lessons, quizzes };
  }
}

export const ContentService = new ContentServiceClass();
