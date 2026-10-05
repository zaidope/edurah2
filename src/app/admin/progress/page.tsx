'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserProfile } from '@/types';
import { ContentService } from '@/lib/content';
import { supabase } from '@/lib/supabase/client';
import {
  TrendingUp,
  Filter,
  Search,
  BookOpen,
  Award,
  Users
} from 'lucide-react';

export default function AdminProgressPage() {
  const grades = ContentService.getGrades();
  const [courses, setCourses] = useState<Array<{ id: string; title: string; gradeId: string; lessonCount: number }>>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [lessonProgress, setLessonProgress] = useState<Array<{ user_id: string; course_id: string; completed: boolean }>>([]);
  const [quizResults, setQuizResults] = useState<Array<{ user_id: string; course_id: string | null; percentage: number }>>([]);
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'students' | 'grades' | 'courses'>('grades');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [studentResponse, courseResponse, progressResponse, quizResponse] = await Promise.all([
        supabase.from('profiles').select('id,fullName:full_name,email,studentId:student_id,role,gradeId:grade_id,academicBatch:academic_batch,classGroup:class_group,isActive:is_active,createdAt:created_at,updatedAt:updated_at').eq('role', 'student').eq('is_active', true).order('full_name'),
        supabase.from('courses').select('id,title,gradeId:grade_id,lessonCount:lesson_count').eq('status', 'published').order('position'),
        supabase.from('lesson_progress').select('user_id,course_id,completed'),
        supabase.from('quiz_results').select('user_id,course_id,percentage'),
      ]);
      if (studentResponse.error || courseResponse.error || progressResponse.error || quizResponse.error) {
        setLoadError('Progress data could not be loaded from the production database.');
        setStudents([]);
        setCourses([]);
        setLessonProgress([]);
        setQuizResults([]);
      } else {
        setLoadError('');
        setStudents((studentResponse.data || []).map((record) => ({
          id: record.id,
          fullName: record.fullName,
          email: record.email,
          studentId: record.studentId || '',
          role: record.role as UserProfile['role'],
          gradeId: record.gradeId || undefined,
          academicBatch: record.academicBatch || undefined,
          classGroup: record.classGroup || undefined,
          isActive: record.isActive,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        })));
        setCourses((courseResponse.data || []).map((course) => ({
          id: course.id,
          title: course.title,
          gradeId: course.gradeId,
          lessonCount: Number(course.lessonCount) || 0,
        })));
        setLessonProgress(progressResponse.data || []);
        setQuizResults(quizResponse.data || []);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const getGradeProgress = (gradeId: string) => {
    const gradeStudents = students.filter((student) => student.gradeId === gradeId);
    const gradeCourses = courses.filter((course) => course.gradeId === gradeId);
    const totalLessons = gradeCourses.reduce((sum, course) => sum + course.lessonCount, 0) * gradeStudents.length;
    const courseIds = new Set(gradeCourses.map((course) => course.id));
    const studentIds = new Set(gradeStudents.map((student) => student.id));
    const completed = lessonProgress.filter((row) => row.completed && courseIds.has(row.course_id) && studentIds.has(row.user_id)).length;
    return totalLessons ? Math.round((completed / totalLessons) * 100) : 0;
  };

  const getCourseProgress = (courseId: string, gradeId: string) => {
    const courseStudents = students.filter((student) => student.gradeId === gradeId);
    const studentIds = new Set(courseStudents.map((student) => student.id));
    const enrolled = courseStudents.length;
    const lessonCount = courses.find((course) => course.id === courseId)?.lessonCount || 0;
    const denominator = enrolled * lessonCount;
    const completed = lessonProgress.filter((row) => row.course_id === courseId && row.completed && studentIds.has(row.user_id)).length;
    return denominator ? Math.round((completed / denominator) * 100) : 0;
  };

  const getStudentProgress = (student: UserProfile) => {
    const studentCourses = courses.filter((course) => course.gradeId === student.gradeId);
    const totalLessons = studentCourses.reduce((sum, course) => sum + course.lessonCount, 0);
    const courseIds = new Set(studentCourses.map((course) => course.id));
    const completed = lessonProgress.filter((row) => row.user_id === student.id && row.completed && courseIds.has(row.course_id)).length;
    return totalLessons ? Math.round((completed / totalLessons) * 100) : 0;
  };

  const getQuizAverage = (studentIds: Set<string>, courseId?: string) => {
    const results = quizResults.filter((result) => studentIds.has(result.user_id) && (!courseId || result.course_id === courseId));
    return results.length ? Math.round(results.reduce((sum, result) => sum + Number(result.percentage || 0), 0) / results.length) : null;
  };

  const availableBatches = [...new Set(students.map((student) => student.academicBatch || 'Unassigned'))].sort();

  const filteredStudents = students.filter(s => {
    const matchesGrade = filterGrade === 'all' || s.gradeId === filterGrade;
    const matchesBatch = filterBatch === 'all' || (s.academicBatch || 'Unassigned') === filterBatch;
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
            Recorded lesson completion across active students and published courses.
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

      {loadError && <div role="alert" className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{loadError}</div>}
      {loading && <p className="text-xs text-slate-500">Loading production progress records…</p>}

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
            {availableBatches.map((batch) => <option key={batch} value={batch}>{batch}</option>)}
          </select>
        </div>
      </div>

      {/* VIEW 1: PROGRESS BY GRADE */}
      {viewMode === 'grades' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {grades
            .filter(g => filterGrade === 'all' || g.id === filterGrade)
            .map((grade) => {
              const gradeStudents = students.filter(s => s.gradeId === grade.id);
              const gradeCourses = courses.filter(c => c.gradeId === grade.id);
              const avgProgress = getGradeProgress(grade.id);
              const quizAverage = getQuizAverage(new Set(gradeStudents.map((student) => student.id)));

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
                      <span>Lesson completion rate</span>
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
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 col-span-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>{quizAverage === null ? 'No quiz results recorded' : `${quizAverage}% Average Quiz Score`}</span>
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
                  <th className="px-6 py-3.5">Average Quiz Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses
                  .filter(c => filterGrade === 'all' || c.gradeId === filterGrade)
                  .map((c) => {
                    const gradeObj = grades.find(g => g.id === c.gradeId);
                    const rate = getCourseProgress(c.id, c.gradeId);
                    const courseStudentIds = new Set(students.filter((student) => student.gradeId === c.gradeId).map((student) => student.id));
                    const quizAverage = getQuizAverage(courseStudentIds, c.id);

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
                          {c.lessonCount} Lessons
                        </td>
                        <td className="px-6 py-4 min-w-[160px]">
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 text-xs">{rate}%</span>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${rate}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{quizAverage === null ? 'No results' : `${quizAverage}%`}</td>
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
                  <th className="px-6 py-3.5">Average Quiz Score</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const gradeObj = grades.find(g => g.id === s.gradeId);
                  const progressPct = getStudentProgress(s);
                  const quizAverage = getQuizAverage(new Set([s.id]));

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
                          {s.academicBatch || 'Unassigned'}
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
                      <td className="px-6 py-4 font-semibold text-slate-700">{quizAverage === null ? 'No results' : `${quizAverage}%`}</td>
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
