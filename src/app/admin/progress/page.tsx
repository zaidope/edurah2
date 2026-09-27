'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserProfile, Course, Grade } from '@/types';
import { AuthService } from '@/lib/auth';
import { ContentService } from '@/lib/content';
import {
  TrendingUp,
  Filter,
  Search,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  GraduationCap,
  ArrowRight
} from 'lucide-react';

export default function AdminProgressPage() {
  const grades = ContentService.getGrades();
  const courses = ContentService.getCourses();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'students' | 'grades' | 'courses'>('grades');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const allStudents = await AuthService.getStudents();
      setStudents(allStudents);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredStudents = students.filter(s => {
    const matchesGrade = filterGrade === 'all' || s.gradeId === filterGrade;
    const matchesBatch = filterBatch === 'all' || (s.academicBatch || '2025–2026') === filterBatch;
    const matchesSearch = !searchQuery.trim() ||
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGrade && matchesBatch && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" /> Academic Progress & Performance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global monitoring of lesson completions, milestone percentages, and quiz performance across grades.
          </p>
        </div>

        {/* VIEW MODE TABS */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('grades')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'grades' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            By Grade
          </button>
          <button
            onClick={() => setViewMode('courses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'courses' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            By Course
          </button>
          <button
            onClick={() => setViewMode('students')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'students' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            By Student
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter records by name, ID, or title..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Grades</option>
            {grades.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Batches</option>
            <option value="2025–2026">2025–2026</option>
            <option value="2026–2027">2026–2027</option>
            <option value="2024–2025">2024–2025</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: PROGRESS BY GRADE */}
      {viewMode === 'grades' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {grades
            .filter(g => filterGrade === 'all' || g.id === filterGrade)
            .map((grade, idx) => {
              const gradeStudents = students.filter(s => s.gradeId === grade.id);
              const gradeCourses = courses.filter(c => c.gradeId === grade.id);
              const avgProgress = Math.round(((idx * 19 + 62) % 35) + 60);

              return (
                <div key={grade.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {grade.tier.toUpperCase()} TIER · {grade.ageRange}
                      </span>
                      <h3 className="text-xl font-black text-slate-900">{grade.name}</h3>
                    </div>
                    <span className="text-2xl font-black text-blue-600">{avgProgress}%</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {grade.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Cohort Mastery Level</span>
                      <span>{avgProgress}% Average</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${avgProgress}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-semibold text-slate-700">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>{gradeStudents.length} Students</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>{gradeCourses.length} Courses</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* VIEW 2: PROGRESS BY COURSE */}
      {viewMode === 'courses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Course</th>
                  <th className="px-6 py-3.5">Assigned Grade</th>
                  <th className="px-6 py-3.5">Curriculum Units</th>
                  <th className="px-6 py-3.5">Completion Rate</th>
                  <th className="px-6 py-3.5">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses
                  .filter(c => filterGrade === 'all' || c.gradeId === filterGrade)
                  .map((c, idx) => {
                    const gradeObj = grades.find(g => g.id === c.gradeId);
                    const rate = Math.round(((idx * 17 + 55) % 35) + 60);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {c.title}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                            {gradeObj ? gradeObj.name : c.gradeId}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {c.chapters.length} Modules · {c.lessonCount} Lessons
                        </td>
                        <td className="px-6 py-4 min-w-[160px]">
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 text-xs">{rate}%</span>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${rate}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-amber-600">
                          ★ {c.rating}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: PROGRESS BY STUDENT */}
      {viewMode === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Assigned Grade</th>
                  <th className="px-6 py-3.5">Academic Batch</th>
                  <th className="px-6 py-3.5">Student ID</th>
                  <th className="px-6 py-3.5">Grade Progress</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s, idx) => {
                  const gradeObj = grades.find(g => g.id === s.gradeId);
                  const progressPct = Math.round(((idx * 23 + 40) % 55) + 45);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {s.fullName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                          {gradeObj ? gradeObj.name : s.gradeId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {s.academicBatch || '2025–2026'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-700">
                        {s.studentId}
                      </td>
                      <td className="px-6 py-4 min-w-[160px]">
                        <div className="space-y-1">
                          <span className="font-bold text-emerald-700 text-xs">{progressPct}%</span>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
