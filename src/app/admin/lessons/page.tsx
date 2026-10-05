'use client';

import React, { useState, useEffect } from 'react';
import { Course, Lesson, Quiz } from '@/types';
import { ContentService } from '@/lib/content';
import { Film, Plus, Edit2, X, Play } from 'lucide-react';

export default function AdminLessonsPage() {
  const [allData, setAllData] = useState<{ lesson: Lesson; course: Course }[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> & { courseId?: string }>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const refreshData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [loadedCourses, loadedQuizzes] = await Promise.all([
        ContentService.loadCourses(undefined, 'all'),
        ContentService.loadQuizzes(undefined, undefined, 'all'),
      ]);
      setCourses(loadedCourses);
      setQuizzes(loadedQuizzes);
      setAllData(loadedCourses.flatMap((course) => course.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({ lesson, course })))));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load lessons from the database.');
      setCourses([]);
      setQuizzes([]);
      setAllData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      ContentService.loadCourses(undefined, 'all'),
      ContentService.loadQuizzes(undefined, undefined, 'all'),
    ])
      .then(([loadedCourses, loadedQuizzes]) => {
        if (!active) return;
        setCourses(loadedCourses);
        setQuizzes(loadedQuizzes);
        setAllData(loadedCourses.flatMap((course) => course.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({ lesson, course })))));
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load lessons from the database.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const extractYouTubeId = (input: string): string => {
    if (!input) return '';
    if (input.includes('youtube.com/watch?v=')) {
      return input.split('v=')[1]?.split('&')[0] || input;
    }
    if (input.includes('youtu.be/')) {
      return input.split('youtu.be/')[1]?.split('?')[0] || input;
    }
    return input;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson?.title || !editingLesson?.courseId) return;

    const targetCourse = courses.find(c => c.id === editingLesson.courseId);
    if (!targetCourse) {
      setErrorMessage('Select a course loaded from the database before saving a lesson.');
      return;
    }

    const courseCopy: Course = structuredClone(targetCourse);
    if (courseCopy.chapters.length === 0) {
      courseCopy.chapters.push({
        id: `${courseCopy.id}-ch-1`,
        title: 'Module 1',
        description: '',
        order: 1,
        lessons: [],
      });
    }
    const chapter = courseCopy.chapters.find((item) => item.id === editingLesson.chapterId) || courseCopy.chapters[0];

    const vidId = extractYouTubeId(editingLesson.videoUrl || editingLesson.videoId || '');

    const lessonToSave: Lesson = {
      id: editingLesson.id || `les-${Date.now()}`,
      title: editingLesson.title,
      slug: editingLesson.slug || editingLesson.title.toLowerCase().replace(/\s+/g, '-'),
      description: editingLesson.description || '',
      duration: editingLesson.duration || '15:00',
      videoId: vidId,
      videoUrl: `https://www.youtube.com/watch?v=${vidId}`,
      chapterId: chapter.id,
      order: editingLesson.order || (chapter.lessons.length + 1),
      quizId: editingLesson.quizId || undefined,
      learningObjectives: editingLesson.learningObjectives || ['Master lesson core principles'],
      keyConcepts: editingLesson.keyConcepts || [],
      resources: editingLesson.resources || []
    };

    const existingIndex = chapter.lessons.findIndex((lesson) => lesson.id === lessonToSave.id);
    if (existingIndex >= 0) chapter.lessons[existingIndex] = lessonToSave;
    else chapter.lessons.push(lessonToSave);
    chapter.lessons.sort((left, right) => left.order - right.order);
    courseCopy.lessonCount = courseCopy.chapters.reduce((total, item) => total + item.lessons.length, 0);

    const result = await ContentService.saveCourse(courseCopy);
    if (!result.success) {
      setErrorMessage(result.error || 'Unable to save lesson.');
      return;
    }
    setIsModalOpen(false);
    setEditingLesson({});
    await refreshData();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Film className="w-6 h-6 text-emerald-600" /> Video Lesson Management
          </h1>
          <p className="text-xs text-slate-600 mt-1">Configure YouTube video URLs, learning objectives, and quiz pairing.</p>
        </div>

        <button
          disabled={loading || courses.length === 0}
          onClick={() => {
            setEditingLesson({
              title: '',
              courseId: courses[0]?.id || '',
              duration: '15:00',
              videoUrl: '',
              description: ''
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 text-white" /> Add Video Lesson
        </button>
      </div>

      {errorMessage && <div role="alert" className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{errorMessage}</div>}
      {loading && <p className="text-xs text-slate-500">Loading lessons from the database…</p>}

      {/* LESSONS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="p-4">Lesson Title</th>
                <th className="p-4">Belongs to Course</th>
                <th className="p-4">YouTube ID</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Quiz Linked</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && !errorMessage && allData.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No lessons are recorded for the published or draft courses.</td></tr>
              ) : allData.map(({ lesson, course }) => (
                <tr key={lesson.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-semibold text-slate-900">
                    <div>{lesson.title}</div>
                    <div className="text-[10px] text-slate-500">slug: {lesson.slug}</div>
                  </td>
                  <td className="p-4 text-blue-600 font-medium">{course.title}</td>
                  <td className="p-4 font-medium text-emerald-600 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5" /> {lesson.videoId}
                  </td>
                  <td className="p-4 text-slate-600">{lesson.duration}</td>
                  <td className="p-4">
                    {lesson.quizId ? (
                      <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        {lesson.quizId}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">None</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingLesson({ ...lesson, courseId: course.id });
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT LESSON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                {editingLesson?.id ? 'Edit Video Lesson' : 'Add New Video Lesson'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Target Course</label>
                <select
                  value={editingLesson?.courseId || ''}
                  disabled={Boolean(editingLesson?.id)}
                  onChange={e => setEditingLesson({ ...editingLesson, courseId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Lesson Title</label>
                <input
                  type="text"
                  required
                  value={editingLesson?.title || ''}
                  onChange={e => setEditingLesson({ ...editingLesson, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g. Memory Layout & CPU Execution"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">YouTube Video URL or ID</label>
                  <input
                    type="text"
                    required
                    value={editingLesson?.videoUrl || editingLesson?.videoId || ''}
                    onChange={e => setEditingLesson({ ...editingLesson, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Duration (e.g. 18:30)</label>
                  <input
                    type="text"
                    value={editingLesson?.duration || ''}
                    onChange={e => setEditingLesson({ ...editingLesson, duration: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Associate Practice Quiz (Optional)</label>
                <select
                  value={editingLesson?.quizId || ''}
                  onChange={e => setEditingLesson({ ...editingLesson, quizId: e.target.value || undefined })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="">No Quiz Linked</option>
                  {quizzes.map(qz => (
                    <option key={qz.id} value={qz.id}>{qz.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Lesson Description</label>
                <textarea
                  rows={3}
                  value={editingLesson?.description || ''}
                  onChange={e => setEditingLesson({ ...editingLesson, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                >
                  Save Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

