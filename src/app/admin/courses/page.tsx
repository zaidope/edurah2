'use client';

import React, { useState, useEffect } from 'react';
import { Course, Subject } from '@/types';
import { ContentService } from '@/lib/content';
import { BookOpen, Plus, Edit2, Trash2, X } from 'lucide-react';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);

  const refreshData = () => {
    setCourses(ContentService.getCourses());
    setSubjects(ContentService.getSubjects());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse?.title || !editingCourse?.subjectId) return;

    const selectedSubject = subjects.find(s => s.id === editingCourse.subjectId);

    const courseToSave: Course = {
      id: editingCourse.id || `course-${Date.now()}`,
      title: editingCourse.title,
      slug: editingCourse.slug || editingCourse.title.toLowerCase().replace(/\s+/g, '-'),
      subjectId: editingCourse.subjectId,
      subjectName: selectedSubject?.name || 'General',
      shortDescription: editingCourse.shortDescription || '',
      description: editingCourse.description || '',
      thumbnail: editingCourse.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      level: (editingCourse.level as any) || 'Beginner',
      duration: editingCourse.duration || '2h 30m',
      lessonCount: editingCourse.chapters ? editingCourse.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0) : (editingCourse.lessonCount || 4),
      rating: editingCourse.rating || 4.9,
      studentsEnrolled: editingCourse.studentsEnrolled || 1200,
      featured: editingCourse.featured ?? true,
      updatedAt: new Date().toISOString().split('T')[0],
      instructor: editingCourse.instructor || {
        name: 'Edurah Lead Instructor',
        role: 'Senior Educator',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        bio: 'Domain expert & curriculum developer.'
      },
      chapters: editingCourse.chapters || [
        {
          id: `chap-${Date.now()}-1`,
          title: 'Module 1: Foundations',
          description: 'Initial introduction and concepts.',
          order: 1,
          lessons: []
        }
      ]
    };

    ContentService.saveCourse(courseToSave);
    refreshData();
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      ContentService.deleteCourse(id);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> Course Management
          </h1>
          <p className="text-xs text-slate-600 mt-1">Create, edit, and publish course syllabi and modules.</p>
        </div>

        <button
          onClick={() => {
            setEditingCourse({
              title: '',
              slug: '',
              subjectId: subjects[0]?.id || '',
              level: 'Beginner',
              duration: '3h 00m',
              shortDescription: '',
              description: '',
              featured: true
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" /> Create New Course
        </button>
      </div>

      {/* COURSES TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="p-4">Course Title</th>
                <th className="p-4">Subject Track</th>
                <th className="p-4">Level</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Lessons</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-semibold text-slate-900">
                    <div>{c.title}</div>
                    <div className="text-[10px] text-slate-500">/courses/{c.slug}</div>
                  </td>
                  <td className="p-4 text-blue-600 font-medium">{c.subjectName}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {c.level}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{c.duration}</td>
                  <td className="p-4 text-emerald-600 font-semibold">{c.lessonCount} Modules</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingCourse(c);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-md bg-slate-100 hover:bg-rose-600 text-slate-700 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                {editingCourse?.id ? 'Edit Course' : 'Create New Course'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Course Title</label>
                <input
                  type="text"
                  required
                  value={editingCourse?.title || ''}
                  onChange={e => setEditingCourse({ ...editingCourse, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g. Distributed Systems Architecture"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Subject Domain</label>
                  <select
                    value={editingCourse?.subjectId || ''}
                    onChange={e => setEditingCourse({ ...editingCourse, subjectId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Target Level</label>
                  <select
                    value={editingCourse?.level || 'Beginner'}
                    onChange={e => setEditingCourse({ ...editingCourse, level: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Thumbnail Image URL</label>
                <input
                  type="text"
                  value={editingCourse?.thumbnail || ''}
                  onChange={e => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Short Description</label>
                <input
                  type="text"
                  value={editingCourse?.shortDescription || ''}
                  onChange={e => setEditingCourse({ ...editingCourse, shortDescription: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Full Course Overview</label>
                <textarea
                  rows={3}
                  value={editingCourse?.description || ''}
                  onChange={e => setEditingCourse({ ...editingCourse, description: e.target.value })}
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
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

