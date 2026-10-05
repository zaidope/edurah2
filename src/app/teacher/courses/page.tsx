'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import { Course, Lesson, Subject } from '@/types';
import {
  BookOpen,
  Clock,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  MoveUp,
  MoveDown,
  Film,
  Eye,
  Award
} from 'lucide-react';

const THUMBNAIL_PRESETS = [
  { label: 'Technology / Coding', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80' },
  { label: 'Science / Lab', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Mathematics', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80' },
  { label: 'Literature / Reading', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80' }
];

export default function TeacherCoursesPage() {
  const { profile } = useAuth();
  const teacherGradeId = profile?.gradeId || '';
  const gradeObj = ContentService.getGradeById(teacherGradeId);

  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Course Modal state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);

  // Lesson Management Modal state
  const [managingCourse, setManagingCourse] = useState<Course | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);

  const refreshData = async () => {
    setLoading(true);
    setErrorMessage('');
    if (!teacherGradeId) {
      setCourses([]);
      setErrorMessage('Your account has no assigned grade. Contact an administrator.');
      setLoading(false);
      return;
    }
    try {
      const loadedCourses = await ContentService.loadCourses(teacherGradeId, 'all');
      setCourses(loadedCourses);
      if (managingCourse) {
        const updated = loadedCourses.find((course) => course.id === managingCourse.id);
        if (updated) setManagingCourse(updated);
      }
    } catch (error) {
      setCourses([]);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load courses from the database.');
    }
    setSubjects(ContentService.getSubjects());
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!teacherGradeId) throw new Error('Your account has no assigned grade. Contact an administrator.');
        return ContentService.loadCourses(teacherGradeId, 'all');
      })
      .then((loadedCourses) => {
        if (!active) return;
        setCourses(loadedCourses);
        setErrorMessage('');
        setSubjects(ContentService.getSubjects());
      })
      .catch((error: unknown) => {
        if (!active) return;
        setCourses([]);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load courses from the database.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [teacherGradeId]);

  const extractYouTubeId = (input: string): string => {
    if (!input) return 'zOjov-2OZ0E';
    if (input.includes('youtube.com/watch?v=')) {
      return input.split('v=')[1]?.split('&')[0] || input;
    }
    if (input.includes('youtu.be/')) {
      return input.split('youtu.be/')[1]?.split('?')[0] || input;
    }
    return input;
  };

  // COURSE ACTIONS
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse?.title || !editingCourse?.subjectId) return;

    const selectedSubject = subjects.find(s => s.id === editingCourse.subjectId);

    const courseToSave: Course = {
      id: editingCourse.id || `course-${Date.now()}`,
      title: editingCourse.title,
      slug: editingCourse.slug || editingCourse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      gradeId: teacherGradeId, // Automatically locked to teacher's grade
      subjectId: editingCourse.subjectId,
      subjectName: selectedSubject?.name || 'General',
      shortDescription: editingCourse.shortDescription || '',
      description: editingCourse.description || '',
      thumbnail: editingCourse.thumbnail || THUMBNAIL_PRESETS[0].url,
      level: editingCourse.level || 'Beginner',
      duration: editingCourse.duration || '2h 00m',
      lessonCount: editingCourse.chapters ? editingCourse.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0) : (editingCourse.lessonCount || 0),
      rating: editingCourse.rating ?? 0,
      studentsEnrolled: editingCourse.studentsEnrolled || 0,
      featured: editingCourse.featured ?? true,
      status: editingCourse.status || 'published',
      order: editingCourse.order || 1,
      updatedAt: new Date().toISOString().split('T')[0],
      instructor: editingCourse.instructor || {
        name: profile?.fullName || 'Teacher Educator',
        role: `${gradeObj?.name || 'Grade'} Lead Educator`,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        bio: 'Grade curriculum specialist'
      },
      chapters: editingCourse.chapters && editingCourse.chapters.length > 0 ? editingCourse.chapters : [
        {
          id: `chap-${Date.now()}-1`,
          title: 'Unit 1: Core Concepts',
          description: 'Fundamental concepts and lessons for this course.',
          order: 1,
          lessons: []
        }
      ]
    };

    const result = await ContentService.saveCourse(courseToSave);
    if (!result.success) {
      setErrorMessage(result.error || 'Unable to save course.');
      return;
    }
    setIsCourseModalOpen(false);
    setEditingCourse(null);
    await refreshData();
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course? Students in your grade will no longer be able to access it.')) {
      const result = await ContentService.deleteCourse(courseId);
      if (!result.success) {
        setErrorMessage(result.error || 'Unable to delete course.');
        return;
      }
      await refreshData();
    }
  };

  // LESSON ACTIONS
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingCourse || !editingLesson?.title) return;

    const courseCopy: Course = JSON.parse(JSON.stringify(managingCourse));
    if (!courseCopy.chapters || courseCopy.chapters.length === 0) {
      courseCopy.chapters = [
        {
          id: `chap-${Date.now()}-1`,
          title: 'Unit 1: Core Concepts',
          description: 'Fundamental curriculum concepts.',
          order: 1,
          lessons: []
        }
      ];
    }

    const chapter = courseCopy.chapters[0];
    const vidId = extractYouTubeId(editingLesson.videoUrl || editingLesson.videoId || '');

    const lessonToSave: Lesson = {
      id: editingLesson.id || `les-${Date.now()}`,
      title: editingLesson.title,
      slug: editingLesson.slug || editingLesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: editingLesson.description || '',
      duration: editingLesson.duration || '12:00',
      videoId: vidId,
      videoUrl: `https://www.youtube.com/watch?v=${vidId}`,
      chapterId: chapter.id,
      order: editingLesson.order || (chapter.lessons.length + 1),
      quizId: editingLesson.quizId || undefined,
      isPublished: editingLesson.isPublished ?? true,
      learningObjectives: editingLesson.learningObjectives || ['Master the lesson concepts'],
      keyConcepts: editingLesson.keyConcepts || [],
      resources: editingLesson.resources || []
    };

    const existingIndex = chapter.lessons.findIndex(l => l.id === lessonToSave.id);
    if (existingIndex >= 0) {
      chapter.lessons[existingIndex] = lessonToSave;
    } else {
      chapter.lessons.push(lessonToSave);
    }

    // Sort lessons by order
    chapter.lessons.sort((a, b) => a.order - b.order);
    courseCopy.lessonCount = chapter.lessons.length;
    courseCopy.updatedAt = new Date().toISOString().split('T')[0];

    const result = await ContentService.saveCourse(courseCopy);
    if (!result.success) {
      setErrorMessage(result.error || 'Unable to save lesson.');
      return;
    }
    setManagingCourse(courseCopy);
    await refreshData();
    setIsLessonModalOpen(false);
    setEditingLesson(null);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!managingCourse) return;
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    const courseCopy: Course = JSON.parse(JSON.stringify(managingCourse));
    courseCopy.chapters.forEach(ch => {
      ch.lessons = ch.lessons.filter(l => l.id !== lessonId);
    });
    courseCopy.lessonCount = courseCopy.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);

    const result = await ContentService.saveCourse(courseCopy);
    if (!result.success) {
      setErrorMessage(result.error || 'Unable to delete lesson.');
      return;
    }
    setManagingCourse(courseCopy);
    await refreshData();
  };

  const handleReorderLesson = async (lessonIndex: number, direction: 'up' | 'down') => {
    if (!managingCourse) return;
    const courseCopy: Course = JSON.parse(JSON.stringify(managingCourse));
    const lessons = courseCopy.chapters[0]?.lessons;
    if (!lessons) return;

    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const temp = lessons[lessonIndex];
    lessons[lessonIndex] = lessons[targetIndex];
    lessons[targetIndex] = temp;

    // Renumber orders
    lessons.forEach((l, idx) => {
      l.order = idx + 1;
    });

    const result = await ContentService.saveCourse(courseCopy);
    if (!result.success) {
      setErrorMessage(result.error || 'Unable to reorder lessons.');
      return;
    }
    setManagingCourse(courseCopy);
    await refreshData();
  };

  const handleToggleLessonPublish = async (lessonId: string) => {
    if (!managingCourse) return;
    const courseCopy: Course = JSON.parse(JSON.stringify(managingCourse));
    courseCopy.chapters.forEach(ch => {
      const match = ch.lessons.find(l => l.id === lessonId);
      if (match) {
        match.isPublished = !(match.isPublished ?? true);
      }
    });

    const result = await ContentService.saveCourse(courseCopy);
    if (!result.success) {
      setErrorMessage(result.error || 'Unable to update lesson publication.');
      return;
    }
    setManagingCourse(courseCopy);
    await refreshData();
  };

  const filteredCourses = courses.filter(c =>
    !searchQuery.trim() ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8d0c2] pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8e5a2b]" />
            Teacher Grade Isolation · {gradeObj?.name || 'Assigned Grade'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-heading font-normal text-[#171819] tracking-tight">
            My Courses & Curriculum
          </h1>
          <p className="text-xs sm:text-sm text-[#6f6b63] mt-1 leading-relaxed">
            Create and manage courses, video lessons, and curriculum modules for your students.
          </p>
        </div>

        <button
          disabled={!teacherGradeId || loading}
          onClick={() => {
            setEditingCourse({
              title: '',
              subjectId: subjects[0]?.id || 'sub-1',
              level: 'Beginner',
              status: 'published',
              shortDescription: '',
              description: '',
              duration: '2h 00m',
              thumbnail: THUMBNAIL_PRESETS[0].url
            });
            setIsCourseModalOpen(true);
          }}
          className="edurah-btn-primary text-xs px-4 py-2.5 inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Create Course
        </button>
      </div>

      {errorMessage && <div role="alert" className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{errorMessage}</div>}
      {loading && <p className="text-xs text-[#6f6b63]">Loading courses from the database…</p>}

      {/* SEARCH BAR */}
      <div className="bg-[#faf8f5] p-3 rounded-2xl border border-[#d8d0c2] flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9d978c] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${gradeObj?.name} courses by title or subject...`}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#d8d0c2] text-xs text-[#171819] placeholder:text-[#9d978c] focus:outline-none focus:border-[#d8a471]"
          />
        </div>
        <div className="text-xs font-semibold text-[#6f6b63] shrink-0 pr-2">
          {filteredCourses.length} {filteredCourses.length === 1 ? 'Course' : 'Courses'}
        </div>
      </div>

      {/* COURSES GRID */}
      {!loading && !errorMessage && filteredCourses.length === 0 ? (
        <div className="edurah-card-warm p-12 text-center rounded-2xl border border-[#d8d0c2] space-y-4">
          <BookOpen className="w-12 h-12 text-[#9d978c] mx-auto" />
          <h3 className="font-serif-heading text-lg font-normal text-[#171819]">No Courses Found</h3>
          <p className="text-xs text-[#6f6b63] max-w-sm mx-auto">
            You have not created any courses for {gradeObj?.name} yet. Click &quot;Create Course&quot; above to build your cohort curriculum.
          </p>
          <button
            onClick={() => {
              setEditingCourse({
                title: '',
                subjectId: subjects[0]?.id || 'sub-1',
                level: 'Beginner',
                status: 'published',
                shortDescription: '',
                description: '',
                duration: '2h 00m',
                thumbnail: THUMBNAIL_PRESETS[0].url
              });
              setIsCourseModalOpen(true);
            }}
            className="edurah-btn-primary text-xs px-5 py-2 inline-flex items-center gap-1.5 cursor-pointer mx-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Create First Course
          </button>
        </div>
      ) : !loading && !errorMessage ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const allLessons = course.chapters ? course.chapters.flatMap(ch => ch.lessons) : [];

            return (
              <div
                key={course.id}
                className="edurah-card-warm rounded-2xl overflow-hidden shadow-xs hover:border-[#d8a471] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-[#e5ded0]">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#0b0d0e]/80 text-[#f6f2e9] backdrop-blur-xs shadow-xs">
                        {course.subjectName}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-xs ${
                        course.status === 'draft' ? 'bg-amber-600/90 text-white' : 'bg-emerald-600/90 text-white'
                      }`}>
                        {course.status === 'draft' ? 'Draft' : 'Published'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-[#6f6b63]">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" /> {course.duration}
                      </span>
                      <span className="font-semibold text-xs text-[#8e5a2b]">
                        {allLessons.length} {allLessons.length === 1 ? 'Lesson' : 'Lessons'}
                      </span>
                    </div>

                    <h3 className="font-serif-heading font-normal text-base text-[#171819] line-clamp-2">
                      {course.title}
                    </h3>

                    <p className="text-xs text-[#6f6b63] line-clamp-2 leading-relaxed">
                      {course.shortDescription || course.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-3 border-t border-[#e5ded0] bg-[#faf8f5] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setManagingCourse(course)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-[#8e5a2b] hover:bg-[#72451f] text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Film className="w-3.5 h-3.5" /> Manage Lessons ({allLessons.length})
                    </button>
                    <button
                      onClick={() => {
                        setEditingCourse(course);
                        setIsCourseModalOpen(true);
                      }}
                      className="p-1.5 rounded-xl bg-white border border-[#d8d0c2] text-[#6f6b63] hover:text-[#171819] hover:border-[#8e5a2b] cursor-pointer"
                      title="Edit Course Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-1.5 rounded-xl bg-white border border-[#d8d0c2] text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="text-[#8e5a2b] hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Preview Student View
                    </Link>
                    <Link
                      href={`/quizzes`}
                      className="text-[#6f6b63] hover:text-[#171819] font-medium inline-flex items-center gap-1"
                    >
                      <Award className="w-3 h-3" /> Quizzes
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* CREATE / EDIT COURSE MODAL */}
      {isCourseModalOpen && editingCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#fcfbf9] rounded-3xl border border-[#d8d0c2] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e5ded0] pb-3">
              <h3 className="font-serif-heading font-normal text-lg text-[#171819] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#8e5a2b]" />
                {editingCourse.id ? 'Edit Course' : 'Create New Course'}
              </h3>
              <button
                onClick={() => {
                  setIsCourseModalOpen(false);
                  setEditingCourse(null);
                }}
                className="text-[#9d978c] hover:text-[#171819]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#171819]">Course Title</label>
                <input
                  type="text"
                  required
                  value={editingCourse.title || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  placeholder="e.g. Introduction to Physics: Forces & Motion"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#d8d0c2] text-[#171819] focus:outline-none focus:border-[#d8a471]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#171819]">Subject / Category</label>
                  <select
                    value={editingCourse.subjectId || subjects[0]?.id}
                    onChange={(e) => setEditingCourse({ ...editingCourse, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d8d0c2] text-[#171819] font-semibold focus:outline-none focus:border-[#d8a471]"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#171819]">Target Grade (Locked to your cohort)</label>
                  <input
                    type="text"
                    disabled
                    value={gradeObj?.name || teacherGradeId}
                    className="w-full px-3 py-2 rounded-xl bg-[#ede6d8]/50 border border-[#d8d0c2] text-[#8e5a2b] font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#171819]">Publication Status</label>
                  <select
                    value={editingCourse.status || 'published'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, status: e.target.value as NonNullable<Course['status']> })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d8d0c2] text-[#171819] font-semibold focus:outline-none focus:border-[#d8a471]"
                  >
                    <option value="published">Published (Visible to Students)</option>
                    <option value="draft">Draft (Hidden from Students)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#171819]">Estimated Duration</label>
                  <input
                    type="text"
                    value={editingCourse.duration || '2h 00m'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                    placeholder="e.g. 2h 30m"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d8d0c2] text-[#171819] focus:outline-none focus:border-[#d8a471]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#171819]">Short Overview / Hook</label>
                <input
                  type="text"
                  value={editingCourse.shortDescription || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, shortDescription: e.target.value })}
                  placeholder="One sentence summary for catalog cards"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#d8d0c2] text-[#171819] focus:outline-none focus:border-[#d8a471]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#171819]">Full Syllabus Description</label>
                <textarea
                  rows={3}
                  value={editingCourse.description || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  placeholder="Comprehensive description of topics covered..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#d8d0c2] text-[#171819] focus:outline-none focus:border-[#d8a471]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#171819]">Thumbnail Image URL</label>
                <input
                  type="text"
                  value={editingCourse.thumbnail || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#d8d0c2] text-[#171819] focus:outline-none focus:border-[#d8a471]"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {THUMBNAIL_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditingCourse({ ...editingCourse, thumbnail: p.url })}
                      className="px-2 py-0.5 rounded-lg bg-[#ede6d8] hover:bg-[#e2d8c3] text-[#8e5a2b] text-[10px] font-semibold cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e5ded0]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCourseModalOpen(false);
                    setEditingCourse(null);
                  }}
                  className="edurah-btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="edurah-btn-primary text-xs px-5 py-2 cursor-pointer shadow-xs"
                >
                  {editingCourse.id ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE LESSONS MODAL */}
      {managingCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#fcfbf9] rounded-3xl border border-[#d8d0c2] shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#e5ded0] pb-3 shrink-0">
              <div>
                <span className="text-[10px] font-bold text-[#8e5a2b] uppercase tracking-wider block">
                  Lesson & Video Management · {gradeObj?.name}
                </span>
                <h3 className="font-serif-heading font-normal text-xl text-[#171819]">
                  {managingCourse.title}
                </h3>
              </div>
              <button
                onClick={() => setManagingCourse(null)}
                className="text-[#9d978c] hover:text-[#171819]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LESSONS LIST */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(!managingCourse.chapters?.[0]?.lessons || managingCourse.chapters[0].lessons.length === 0) ? (
                <div className="p-8 text-center bg-[#faf8f5] rounded-2xl border border-dashed border-[#d8d0c2] space-y-2">
                  <Film className="w-8 h-8 text-[#9d978c] mx-auto" />
                  <p className="text-xs text-[#6f6b63]">No lessons in this course yet. Add your first video lesson!</p>
                </div>
              ) : (
                managingCourse.chapters[0].lessons.map((lesson, idx) => {
                  const isPublished = lesson.isPublished ?? true;
                  return (
                    <div
                      key={lesson.id}
                      className="p-4 rounded-2xl bg-white border border-[#d8d0c2] shadow-xs flex items-center justify-between gap-3 hover:border-[#d8a471] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#ede6d8] text-[#8e5a2b] font-mono-code font-bold text-xs flex items-center justify-center shrink-0 border border-[#d8d0c2]">
                          #{idx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-serif-heading font-normal text-sm text-[#171819]">
                              {lesson.title}
                            </span>
                            <button
                              onClick={() => handleToggleLessonPublish(lesson.id)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                isPublished
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-300'
                              }`}
                            >
                              {isPublished ? 'Published' : 'Hidden'}
                            </button>
                          </div>
                          <div className="text-[11px] text-[#6f6b63] flex items-center gap-3 font-mono-code">
                            <span>⏱ {lesson.duration}</span>
                            <span>▶ Video ID: {lesson.videoId || 'Default'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* REORDER BUTTONS */}
                        <button
                          onClick={() => handleReorderLesson(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-[#faf8f5] hover:bg-[#ede6d8] text-[#6f6b63] disabled:opacity-30 cursor-pointer"
                          title="Move Lesson Up"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReorderLesson(idx, 'down')}
                          disabled={idx === (managingCourse.chapters[0].lessons.length - 1)}
                          className="p-1.5 rounded-lg bg-[#faf8f5] hover:bg-[#ede6d8] text-[#6f6b63] disabled:opacity-30 cursor-pointer"
                          title="Move Lesson Down"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => {
                            setEditingLesson(lesson);
                            setIsLessonModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-white border border-[#d8d0c2] text-[#8e5a2b] hover:bg-[#ede6d8] cursor-pointer ml-1"
                          title="Edit Lesson"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-1.5 rounded-lg bg-white border border-[#d8d0c2] text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Lesson"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="border-t border-[#e5ded0] pt-3 flex items-center justify-between shrink-0">
              <span className="text-xs text-[#6f6b63]">
                Changes to videos and orders save immediately to curriculum.
              </span>
              <button
                onClick={() => {
                  setEditingLesson({
                    title: '',
                    description: '',
                    duration: '12:00',
                    videoUrl: 'https://www.youtube.com/watch?v=zOjov-2OZ0E',
                    isPublished: true,
                    order: (managingCourse.chapters?.[0]?.lessons?.length || 0) + 1
                  });
                  setIsLessonModalOpen(true);
                }}
                className="edurah-btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT LESSON SUB-MODAL */}
      {isLessonModalOpen && editingLesson && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#d8d0c2] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5ded0] pb-3">
              <h3 className="font-serif-heading font-normal text-lg text-[#171819] flex items-center gap-2">
                <Film className="w-5 h-5 text-[#8e5a2b]" />
                {editingLesson.id ? 'Edit Lesson' : 'Add Lesson to Course'}
              </h3>
              <button
                onClick={() => {
                  setIsLessonModalOpen(false);
                  setEditingLesson(null);
                }}
                className="text-[#9d978c] hover:text-[#171819]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#171819]">Lesson Title</label>
                <input
                  type="text"
                  required
                  value={editingLesson.title || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                  placeholder="e.g. Lesson 1: Introduction to Mechanics"
                  className="w-full px-3 py-2 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] focus:outline-none focus:border-[#d8a471]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#171819]">YouTube Video URL / Link</label>
                <input
                  type="text"
                  required
                  value={editingLesson.videoUrl || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] focus:outline-none focus:border-[#d8a471]"
                />
                <span className="text-[10px] text-[#6f6b63] block">
                  Accepts standard YouTube links or youtu.be short links.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#171819]">Estimated Duration</label>
                  <input
                    type="text"
                    value={editingLesson.duration || '12:00'}
                    onChange={(e) => setEditingLesson({ ...editingLesson, duration: e.target.value })}
                    placeholder="12:00"
                    className="w-full px-3 py-2 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] focus:outline-none focus:border-[#d8a471]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#171819]">Lesson Order (#)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingLesson.order || 1}
                    onChange={(e) => setEditingLesson({ ...editingLesson, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] focus:outline-none focus:border-[#d8a471]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#171819]">Lesson Description</label>
                <textarea
                  rows={2}
                  value={editingLesson.description || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                  placeholder="Key concepts covered in this video..."
                  className="w-full px-3 py-2 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] focus:outline-none focus:border-[#d8a471]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="lessonPublishedCheckbox"
                  checked={editingLesson.isPublished ?? true}
                  onChange={(e) => setEditingLesson({ ...editingLesson, isPublished: e.target.checked })}
                  className="rounded text-[#8e5a2b] focus:ring-[#8e5a2b]"
                />
                <label htmlFor="lessonPublishedCheckbox" className="font-bold text-[#171819] cursor-pointer">
                  Publish this lesson immediately (visible to students)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e5ded0]">
                <button
                  type="button"
                  onClick={() => {
                    setIsLessonModalOpen(false);
                    setEditingLesson(null);
                  }}
                  className="edurah-btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="edurah-btn-primary text-xs px-5 py-2 cursor-pointer shadow-xs"
                >
                  {editingLesson.id ? 'Save Lesson' : 'Add Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

