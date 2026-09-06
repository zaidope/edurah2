import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentService } from '@/lib/content';
import QuizEngine from '@/components/quiz/QuizEngine';
import { ChevronLeft } from 'lucide-react';

interface QuizDetailPageProps {
  params: Promise<{ quizId: string }>;
}

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const { quizId } = await params;
  const quiz = ContentService.getQuizById(quizId);

  if (!quiz) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/quizzes"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Quizzes
        </Link>
      </div>

      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">{quiz.title}</h1>
        <p className="text-sm text-slate-600">{quiz.description}</p>
      </div>

      <QuizEngine quiz={quiz} />
    </div>
  );
}

