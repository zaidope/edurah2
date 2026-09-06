import { Subject, Course, Lesson, Quiz, MediaItem } from '@/types';
import { INITIAL_SUBJECTS } from '@/content/subjects';
import { INITIAL_COURSES } from '@/content/courses';
import { INITIAL_QUIZZES } from '@/content/quizzes';

const SUBJECTS_KEY = 'edurah_subjects_data';
const COURSES_KEY = 'edurah_courses_data';
const QUIZZES_KEY = 'edurah_quizzes_data';
const MEDIA_KEY = 'edurah_media_data';

const INITIAL_MEDIA: MediaItem[] = [
  {
    id: 'med-1',
    name: 'computer_science_banner.jpg',
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    type: 'image',
    size: '1.4 MB',
    dimensions: '1920x1080',
    uploadedAt: '2026-08-10',
    category: 'banners'
  },
  {
    id: 'med-2',
    name: 'ai_neural_networks.jpg',
    url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80',
    type: 'image',
    size: '2.1 MB',
    dimensions: '1920x1080',
    uploadedAt: '2026-08-14',
    category: 'courses'
  },
  {
    id: 'med-3',
    name: 'react_nextjs_architecture.jpg',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    type: 'image',
    size: '1.8 MB',
    dimensions: '1920x1080',
    uploadedAt: '2026-08-18',
    category: 'courses'
  }
];

class ContentServiceClass {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setStorageItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  // SUBJECTS
  getSubjects(): Subject[] {
    return this.getStorageItem<Subject[]>(SUBJECTS_KEY, INITIAL_SUBJECTS);
  }

  getSubjectBySlug(slug: string): Subject | undefined {
    return this.getSubjects().find(s => s.slug === slug);
  }

  getSubjectById(id: string): Subject | undefined {
    return this.getSubjects().find(s => s.id === id);
  }

  saveSubject(subject: Subject): void {
    const subjects = this.getSubjects();
    const index = subjects.findIndex(s => s.id === subject.id);
    if (index >= 0) {
      subjects[index] = subject;
    } else {
      subjects.push(subject);
    }
    this.setStorageItem(SUBJECTS_KEY, subjects);
  }

  deleteSubject(id: string): void {
    const subjects = this.getSubjects().filter(s => s.id !== id);
    this.setStorageItem(SUBJECTS_KEY, subjects);
  }

  // COURSES
  getCourses(): Course[] {
    return this.getStorageItem<Course[]>(COURSES_KEY, INITIAL_COURSES);
  }

  getCourseBySlug(slug: string): Course | undefined {
    return this.getCourses().find(c => c.slug === slug);
  }

  getCoursesBySubject(subjectId: string): Course[] {
    return this.getCourses().filter(c => c.subjectId === subjectId);
  }

  saveCourse(course: Course): void {
    const courses = this.getCourses();
    const index = courses.findIndex(c => c.id === course.id);
    if (index >= 0) {
      courses[index] = course;
    } else {
      courses.push(course);
    }
    this.setStorageItem(COURSES_KEY, courses);
  }

  deleteCourse(id: string): void {
    const courses = this.getCourses().filter(c => c.id !== id);
    this.setStorageItem(COURSES_KEY, courses);
  }

  // LESSONS
  getAllLessons(): { lesson: Lesson; course: Course }[] {
    const courses = this.getCourses();
    const result: { lesson: Lesson; course: Course }[] = [];
    for (const course of courses) {
      for (const chapter of course.chapters) {
        for (const lesson of chapter.lessons) {
          result.push({ lesson, course });
        }
      }
    }
    return result;
  }

  getLessonBySlug(courseSlug: string, lessonSlug: string): { lesson: Lesson; course: Course; nextLesson?: Lesson; prevLesson?: Lesson } | undefined {
    const course = this.getCourseBySlug(courseSlug);
    if (!course) return undefined;

    const allLessonsInCourse: Lesson[] = [];
    for (const chapter of course.chapters) {
      allLessonsInCourse.push(...chapter.lessons);
    }
    allLessonsInCourse.sort((a, b) => a.order - b.order);

    const index = allLessonsInCourse.findIndex(l => l.slug === lessonSlug);
    if (index === -1) return undefined;

    return {
      lesson: allLessonsInCourse[index],
      course,
      nextLesson: allLessonsInCourse[index + 1],
      prevLesson: allLessonsInCourse[index - 1]
    };
  }

  saveLesson(courseId: string, updatedLesson: Lesson): void {
    const courses = this.getCourses();
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    let found = false;
    for (const chap of course.chapters) {
      if (chap.id === updatedLesson.chapterId) {
        const lIndex = chap.lessons.findIndex(l => l.id === updatedLesson.id);
        if (lIndex >= 0) {
          chap.lessons[lIndex] = updatedLesson;
        } else {
          chap.lessons.push(updatedLesson);
        }
        found = true;
        break;
      }
    }

    if (!found && course.chapters.length > 0) {
      course.chapters[0].lessons.push(updatedLesson);
    }

    this.saveCourse(course);
  }

  // QUIZZES
  getQuizzes(): Quiz[] {
    return this.getStorageItem<Quiz[]>(QUIZZES_KEY, INITIAL_QUIZZES);
  }

  getQuizById(id: string): Quiz | undefined {
    return this.getQuizzes().find(q => q.id === id);
  }

  saveQuiz(quiz: Quiz): void {
    const quizzes = this.getQuizzes();
    const index = quizzes.findIndex(q => q.id === quiz.id);
    if (index >= 0) {
      quizzes[index] = quiz;
    } else {
      quizzes.push(quiz);
    }
    this.setStorageItem(QUIZZES_KEY, quizzes);
  }

  deleteQuiz(id: string): void {
    const quizzes = this.getQuizzes().filter(q => q.id !== id);
    this.setStorageItem(QUIZZES_KEY, quizzes);
  }

  // MEDIA
  getMediaItems(): MediaItem[] {
    return this.getStorageItem<MediaItem[]>(MEDIA_KEY, INITIAL_MEDIA);
  }

  saveMediaItem(item: MediaItem): void {
    const items = this.getMediaItems();
    items.unshift(item);
    this.setStorageItem(MEDIA_KEY, items);
  }

  deleteMediaItem(id: string): void {
    const items = this.getMediaItems().filter(m => m.id !== id);
    this.setStorageItem(MEDIA_KEY, items);
  }

  // GLOBAL SEARCH
  search(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) return { subjects: [], courses: [], lessons: [], quizzes: [] };

    const subjects = this.getSubjects().filter(s =>
      s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );

    const courses = this.getCourses().filter(c =>
      c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.subjectName.toLowerCase().includes(q)
    );

    const lessons = this.getAllLessons().filter(({ lesson }) =>
      lesson.title.toLowerCase().includes(q) || lesson.description.toLowerCase().includes(q)
    );

    const quizzes = this.getQuizzes().filter(qz =>
      qz.title.toLowerCase().includes(q) || qz.description.toLowerCase().includes(q)
    );

    return { subjects, courses, lessons, quizzes };
  }
}

export const ContentService = new ContentServiceClass();
