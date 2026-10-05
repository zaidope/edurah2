'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import { Quiz } from '@/types';
import { Award, FileQuestion, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function TeacherQuizzesPage() {
  const { profile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const teacherGradeId = profile?.gradeId || '';
  const gradeObj = ContentService.getGradeById(teacherGradeId);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!teacherGradeId) {
        if (active) setLoadError('Your account has no assigned grade. Contact an administrator.');
        if (active) setLoading(false);
        return;
      }
      try {
        const loadedQuizzes = await ContentService.loadQuizzes(teacherGradeId, undefined, 'published');
        if (active) setQuizzes(loadedQuizzes);
      } catch (error: unknown) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Could not load cohort quizzes.');
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, [teacherGradeId]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8d0c2] pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8e5a2b]" />
            Cohort Assessments
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-heading font-normal text-[#171819] tracking-tight">
            Quizzes for {gradeObj?.name || 'Assigned Grade'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6f6b63] mt-1 leading-relaxed">
            Active assessments, automated PDF tests, and knowledge checks published for your cohort.
          </p>
        </div>

        <Link
          href="/teacher/quiz-maker"
          className="edurah-btn-primary inline-flex items-center gap-2 text-xs px-4 py-2.5"
        >
          <FileQuestion className="w-4 h-4" /> Compile Quiz from PDF
        </Link>
      </div>

      {loadError && <div role="alert" className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{loadError}</div>}
      {loading && <p className="text-xs text-[#706b63]">Loading cohort assessments…</p>}

      {quizzes.length === 0 ? (
        <div className="edurah-card-warm p-12 text-center rounded-2xl border border-[#d8d0c2] space-y-4">
          <Award className="w-12 h-12 text-[#9d978c] mx-auto" />
          <h3 className="font-serif-heading text-lg font-normal text-[#171819]">No Quizzes Published Yet</h3>
          <p className="text-xs text-[#6f6b63] max-w-md mx-auto leading-relaxed">
            Upload question sheets or curriculum exam PDFs to compile and publish interactive tests for {gradeObj?.name}.
          </p>
          <Link
            href="/teacher/quiz-maker"
            className="edurah-btn-primary inline-flex items-center gap-2 text-xs px-5 py-2.5"
          >
            <FileQuestion className="w-4 h-4" /> Launch PDF Quiz Compiler
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="edurah-card-warm rounded-2xl p-6 shadow-xs hover:border-[#d8a471] transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ede6d8] text-[#8e5a2b] border border-[#d8d0c2]">
                    {gradeObj?.name}
                  </span>
                  <span className="text-xs font-semibold text-[#6f6b63]">
                    Pass: {quiz.passingScore}%
                  </span>
                </div>

                <h3 className="font-serif-heading font-normal text-base text-[#171819] line-clamp-2">
                  {quiz.title}
                </h3>

                <p className="text-xs text-[#6f6b63] line-clamp-2 leading-relaxed">
                  {quiz.description}
                </p>

                <div className="flex items-center gap-2 text-xs font-semibold text-[#6f6b63] pt-2 border-t border-[#e5ded0]">
                  <HelpCircle className="w-4 h-4 text-[#8e5a2b]" />
                  <span>{quiz.questions.length} Questions</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#e5ded0]">
                <Link
                  href={`/quizzes/${quiz.id}`}
                  className="edurah-btn-secondary w-full text-xs justify-center inline-flex items-center gap-1.5"
                >
                  Review Student View <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
