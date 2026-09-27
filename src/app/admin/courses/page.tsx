'use client';

import React, { useState, useEffect } from 'react';
import { Course, Subject, Grade } from '@/types';
import { ContentService } from '@/lib/content';
import { BookOpen, Plus, Edit2, Trash2, X, Filter, Search, ShieldCheck } from 'lucide-react';

export default function AdminCoursesPage() {
  const grades = ContentService.getGrades();
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
    if (!editingCourse?.title || !editingCourse?.subjectId || !editingCourse?.gradeId) return;

    const selectedSubject = subjects.find(s => s.id === editingCourse.subjectId);

    const courseToSave: Course = {
      id: editingCourse.id || `course-${Date.now()}`,
      title: editingCourse.title,
      slug: editingCourse.slug || editingCourse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      gradeId: editingCourse.gradeId,
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
    if (confirm('Are you sure you want to delete this course? Students in this grade will no longer be able to access it.')) {
      ContentService.deleteCourse(id);
      refreshData();
    }
  };

  const filteredCourses = courses.filter(c => {
    const matchesGrade = filterGrade === 'all' || c.gradeId === filterGrade;
    const matchesSearch = !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> Grade-Based Course Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create and organize curricula strictly associated with specific Grade levels (Grades 1 through 10).
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCourse({
              title: '',
              gradeId: 'grade-1',
              subjectId: subjects[0]?.id || '',
              level: 'Beginner',
              duration: '2h 00m',
              shortDescription: '',
              description: '',
              thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Course for Grade
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by course title or subject..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Grades ({courses.length})</option>
            {grades.map(g => (
              <option key={g.id} value={g.id}>
                {g.name} ({courses.filter(c => c.gradeId === g.id).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* COURSES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Course</th>
                <th className="px-6 py-3.5">Assigned Grade</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Level & Duration</th>
                <th className="px-6 py-3.5">Modules</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No courses found matching the selected grade.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => {
                  const gradeObj = grades.find(g => g.id === course.gradeId);
                  return (
                    <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-12 h-8 rounded-lg object-cover flex-shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block line-clamp-1">{course.title}</span>
                            <span className="text-[11px] text-slate-500 font-mono block">/{course.slug}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                          {gradeObj ? gradeObj.name : course.gradeId}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {course.subjectName}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {course.level} · {course.duration}
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {course.chapters.length} Modules
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingCourse(course);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Course"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT COURSE MODAL */}
      {isModalOpen && editingCourse && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                {editingCourse.id ? 'Edit Course' : 'Create Course for Grade'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Course Title</label>
                <input
                  type="text"
                  required
                  value={editingCourse.title || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  placeholder="e.g. Grade 4 Mathematics: Fractions & Decimals"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mandatory Assigned Grade</label>
                  <select
                    value={editingCourse.gradeId || 'grade-1'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, gradeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-600"
                  >
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.tier.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Subject Discipline</label>
                  <select
                    value={editingCourse.subjectId || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Level Track</label>
                  <select
                    value={editingCourse.level || 'Beginner'}
                    onChange={(e: any) => setEditingCourse({ ...editingCourse, level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Estimated Duration</label>
                  <input
                    type="text"
                    value={editingCourse.duration || '3h 30m'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Short Summary</label>
                <input
                  type="text"
                  value={editingCourse.shortDescription || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, shortDescription: e.target.value })}
                  placeholder="Key summary line shown on cards..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Description</label>
                <textarea
                  rows={3}
                  value={editingCourse.description || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Thumbnail URL</label>
                <input
                  type="text"
                  value={editingCourse.thumbnail || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
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
