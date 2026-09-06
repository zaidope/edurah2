'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContentService } from '@/lib/content';
import { ProgressService } from '@/lib/progress';
import CourseCard from '@/components/course/CourseCard';
import { BookOpen, Award } from 'lucide-react';

export default function MyLearningPage() {
  const [progress, setProgress] = useState(ProgressService.getProgress());
  const courses = ContentService.getCourses();

  useEffect(() => {
    setProgress(ProgressService.getProgress());
  }, []);

  const quizResultsList = Object.values(progress.quizResults);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* HEADER */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Enrolled Curricula & Quiz Attempts
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">My Learning Hub</h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Track active courses, completed video lessons, and interactive quiz history.
        </p>
      </div>

      {/* COURSES IN PROGRESS */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Active Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* QUIZ HISTORY TABLE */}
      <section className="space-y-6 pt-6 border-t border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-600" /> Quiz Attempt History
        </h2>

        {quizResultsList.length === 0 ? (
          <div className="p-8 rounded-xl bg-white border border-slate-200 text-center text-slate-500 space-y-2">
            <p>No quiz attempts recorded yet.</p>
            <Link href="/quizzes" className="text-xs font-medium text-amber-700 hover:underline">
              Take your first quiz →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-4">Quiz ID</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Percentage</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quizResultsList.map((res, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">{res.quizId}</td>
                      <td className="p-4 text-slate-700">{res.score} / {res.total}</td>
                      <td className="p-4 font-bold text-blue-600">{res.percentage}%</td>
                      <td className="p-4">
                        {res.passed ? (
                          <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Passed ✓
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            Needs Review
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(res.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}

