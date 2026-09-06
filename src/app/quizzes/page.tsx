import React from 'react';
import Link from 'next/link';
import { ContentService } from '@/lib/content';
import { Award, ArrowRight } from 'lucide-react';

export default function QuizzesPage() {
  const quizzes = ContentService.getQuizzes();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* HEADER */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          <Award className="w-3.5 h-3.5 text-amber-600" /> Practice & Self-Assessment
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Interactive Quizzes</h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Test your conceptual understanding across computer science, web architecture, artificial intelligence, and mathematics.
        </p>
      </div>

      {/* QUIZZES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map(quiz => (
          <div
            key={quiz.id}
            className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between space-y-6 group shadow-xs edurah-card-hover"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-amber-700">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Award className="w-4 h-4 text-amber-600" /> {quiz.questions.length} Questions
                </span>
                <span className="text-slate-500">Pass mark: {quiz.passingScore}%</span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                {quiz.title}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {quiz.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href={`/quizzes/${quiz.id}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white transition-all cursor-pointer shadow-xs group/btn"
              >
                <span>Take Quiz</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

