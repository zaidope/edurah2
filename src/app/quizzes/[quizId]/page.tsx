'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import QuizEngine from '@/components/quiz/QuizEngine';
import GradeForbiddenAccess from '@/components/auth/GradeForbiddenAccess';
import { ChevronLeft, Award } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedPage from '@/components/layout/AnimatedPage';

export default function QuizDetailPage() {
  const params = useParams();
  const quizId = params?.quizId as string;
  const { profile, loading } = useAuth();

  const rawQuiz = ContentService.getQuizById(quizId);
  const quiz = profile?.role === 'student' ? ContentService.getQuizForStudent(quizId) : rawQuiz;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f6f2e9]">
        <div className="w-8 h-8 rounded-full border-2 border-[#8e5a2b] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    notFound();
  }

  const quizGradeObj = ContentService.getGradeById(quiz.gradeId);
  const userGradeObj = profile?.gradeId ? ContentService.getGradeById(profile.gradeId) : null;

  // 1. Unauthenticated users cannot take or view quizzes
  if (!profile) {
    return (
      <GradeForbiddenAccess
        isUnauthenticated={true}
        requiredGradeName={quizGradeObj?.name || quiz.gradeId}
        resourceTitle={quiz.title}
        resourceType="quiz"
      />
    );
  }

  // 2. Grade boundary restriction: Student/Teacher must belong to quiz's grade
  const isAllowed = profile.role === 'admin' || profile.gradeId === quiz.gradeId;

  if (!isAllowed) {
    return (
      <GradeForbiddenAccess
        requiredGradeName={quizGradeObj?.name || quiz.gradeId}
        userGradeName={userGradeObj?.name || profile.gradeId}
        userRole={profile.role}
        resourceTitle={quiz.title}
        resourceType="quiz"
      />
    );
  }

  return (
    <PageTransition>
      <AnimatedPage>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
          <div className="flex items-center justify-between">
            <Link
              href="/quizzes"
              className="edurah-btn-ghost text-xs inline-flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Assessments
            </Link>
            <span className="px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#ede6d8] text-[#8e5a2b] border border-[#d8d0c2]">
              {quizGradeObj?.name} Cohort
            </span>
          </div>

          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif-heading font-normal text-[#171819] tracking-tight">
              {quiz.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#6f6b63] leading-relaxed">{quiz.description}</p>
          </div>

          <QuizEngine quiz={quiz} />
        </div>
      </AnimatedPage>
    </PageTransition>
  );
}
