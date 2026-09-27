'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import GradeForbiddenAccess from '@/components/auth/GradeForbiddenAccess';
import { Award, ArrowRight, Filter, Search, HelpCircle } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedPage from '@/components/layout/AnimatedPage';

export default function QuizzesPage() {
  const { profile, loading } = useAuth();
  const grades = ContentService.getGrades();
  const allQuizzes = ContentService.getQuizzes();
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#8e5a2b] border-t-transparent animate-spin" />
      </div>
    );
  }

  // 1. Unauthenticated users: show clean polite gate
  if (!profile) {
    return (
      <GradeForbiddenAccess
        isUnauthenticated={true}
        requiredGradeName="Your Assigned Grade"
        resourceType="quiz"
      />
    );
  }

  const isAdmin = profile.role === 'admin';
  const assignedGradeObj = profile.gradeId ? ContentService.getGradeById(profile.gradeId) : null;

  // 2. Strict grade isolation: Non-admins only see quizzes for their assigned grade
  const visibleQuizzes = isAdmin
    ? (filterGrade === 'all' ? allQuizzes : allQuizzes.filter(q => q.gradeId === filterGrade))
    : allQuizzes.filter(q => q.gradeId === profile.gradeId);

  const filtered = visibleQuizzes.filter(q =>
    !searchQuery.trim() ||
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#d8d0c2] pb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] text-[11px] font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-[#d8a471]" />
                {isAdmin ? 'Institutional Assessment Bank' : `${assignedGradeObj?.name || 'Assigned Cohort'} Assessments`}
              </div>
              <h1 className="text-3xl sm:text-5xl font-serif-hero font-normal text-[#171819] tracking-tight">
                {isAdmin ? 'Global Curriculum Quizzes' : `Assessments for ${assignedGradeObj?.name || 'Your Cohort'}`}
              </h1>
              <p className="text-xs sm:text-sm text-[#6f6b63] leading-relaxed">
                {isAdmin
                  ? 'Manage and review knowledge checks across all developmental grades.'
                  : `Evaluate your understanding with interactive assessments aligned to ${assignedGradeObj?.name}.`}
              </p>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 bg-[#faf8f5] p-2 rounded-2xl border border-[#d8d0c2] shadow-xs self-start md:self-auto">
                <Filter className="w-3.5 h-3.5 text-[#8e5a2b] ml-2" />
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#d8d0c2] text-xs font-semibold text-[#171819] focus:outline-none focus:border-[#d8a471]"
                >
                  <option value="all">All Grades ({allQuizzes.length})</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({allQuizzes.filter(q => q.gradeId === g.id).length})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* SEARCH */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#9d978c] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessments by title or topic..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-xs text-[#171819] placeholder:text-[#9d978c] focus:outline-none focus:border-[#d8a471] shadow-xs transition-colors"
            />
          </div>

          {/* QUIZZES GRID */}
          {filtered.length === 0 ? (
            <div className="edurah-card-warm p-12 text-center rounded-2xl border border-[#d8d0c2] space-y-3">
              <Award className="w-10 h-10 text-[#9d978c] mx-auto" />
              <h3 className="font-serif-heading text-lg font-normal text-[#171819]">No Assessments Found</h3>
              <p className="text-xs text-[#6f6b63] max-w-sm mx-auto">
                There are currently no active quizzes for this curriculum matching your query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(quiz => {
                const quizGrade = grades.find(g => g.id === quiz.gradeId);

                return (
                  <div
                    key={quiz.id}
                    className="edurah-card-warm p-6 rounded-2xl flex flex-col justify-between space-y-6 shadow-xs hover:border-[#d8a471] transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ede6d8] text-[#8e5a2b] border border-[#d8d0c2]">
                          {quizGrade?.name || quiz.gradeId}
                        </span>
                        <span className="text-[#6f6b63] font-medium text-xs">Passing Requirement: {quiz.passingScore}%</span>
                      </div>

                      <h2 className="font-serif-heading font-normal text-lg text-[#171819] group-hover:text-[#8e5a2b] transition-colors line-clamp-2">
                        {quiz.title}
                      </h2>

                      <p className="text-xs text-[#6f6b63] leading-relaxed line-clamp-3">
                        {quiz.description}
                      </p>

                      <div className="pt-2 text-xs font-semibold text-[#6f6b63] flex items-center justify-between border-t border-[#e5ded0]">
                        <div className="flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-[#8e5a2b]" />
                          <span>{quiz.questions.length} Questions</span>
                        </div>
                        {quiz.deadlineDate && (
                          <span className="text-[11px] text-[#8e5a2b] font-medium">
                            Due: {quiz.deadlineDate}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#e5ded0]">
                      <Link
                        href={`/quizzes/${quiz.id}`}
                        className="edurah-btn-primary w-full text-xs justify-center inline-flex items-center gap-2 py-2.5"
                      >
                        <span>Open Assessment</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </AnimatedPage>
    </PageTransition>
  );
}
