'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Quiz, QuizResult } from '@/types';
import { Award, CheckCircle2, XCircle, ArrowRight, RotateCcw, BookOpen, Sparkles } from 'lucide-react';
import { ProgressService } from '@/lib/progress';

interface QuizEngineProps {
  quiz: Quiz;
}

export default function QuizEngine({ quiz }: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const currentQuestion = quiz.questions[currentIndex];
  const selectedOption = selectedAnswers[currentQuestion.id];
  const isSelected = selectedOption !== undefined;

  const handleSelectOption = (optionIndex: number) => {
    if (isSelected) return; // Prevent changing after selection
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Calculate score
      let correct = 0;
      quiz.questions.forEach(q => {
        if (selectedAnswers[q.id] === q.correctAnswerIndex) {
          correct++;
        }
      });

      const percentage = Math.round((correct / quiz.questions.length) * 100);
      const passed = percentage >= quiz.passingScore;

      const quizResult: QuizResult = {
        quizId: quiz.id,
        score: correct,
        total: quiz.questions.length,
        percentage,
        passed,
        completedAt: new Date().toISOString(),
        answers: selectedAnswers
      };

      ProgressService.saveQuizResult(quizResult);
      setResult(quizResult);
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setIsCompleted(false);
    setResult(null);
  };

  if (isCompleted && result) {
    return (
      <div className="bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-slate-50 border border-slate-200">
          {result.passed ? (
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          ) : (
            <XCircle className="w-10 h-10 text-rose-600" />
          )}
        </div>

        <div className="space-y-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            result.passed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {result.passed ? 'Quiz Passed 🎉' : 'Needs Review'}
          </span>
          <h2 className="text-2xl font-bold text-slate-900">{quiz.title} Results</h2>
          <p className="text-sm text-slate-600">
            Passing threshold: <strong className="text-slate-900">{quiz.passingScore}%</strong>
          </p>
        </div>

        {/* SCORE CIRCLE METRIC */}
        <div className="py-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto flex items-center justify-around">
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{result.score} / {result.total}</div>
            <div className="text-xs text-slate-500 uppercase mt-0.5 font-medium">Correct Answers</div>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <div className={`text-3xl font-extrabold ${result.passed ? 'text-emerald-700' : 'text-rose-600'}`}>
              {result.percentage}%
            </div>
            <div className="text-xs text-slate-500 uppercase mt-0.5 font-medium">Total Score</div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRestart}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4" /> Retake Quiz
          </button>

          <Link
            href="/courses"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white shadow-xs cursor-pointer"
          >
            <BookOpen className="w-4 h-4" /> Continue Learning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
      
      {/* TOP PROGRESS */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
            Question {currentIndex + 1} of {quiz.questions.length}
          </span>
        </div>
        <span className="text-xs text-slate-500">
          Pass score: <strong className="text-slate-900">{quiz.passingScore}%</strong>
        </span>
      </div>

      {/* QUESTION TITLE */}
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
        {currentQuestion.question}
      </h3>

      {/* OPTIONS LIST */}
      <div className="space-y-3">
        {currentQuestion.options.map((option, idx) => {
          const isThisSelected = selectedOption === idx;
          const isCorrect = idx === currentQuestion.correctAnswerIndex;

          let cardStyle = 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50';
          if (isSelected) {
            if (isCorrect) {
              cardStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium';
            } else if (isThisSelected) {
              cardStyle = 'bg-rose-50 border-rose-300 text-rose-950 font-medium';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              disabled={isSelected}
              className={`w-full p-4 rounded-xl border text-left flex items-start justify-between gap-3 text-sm transition-all cursor-pointer ${cardStyle}`}
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-snug">{option}</span>
              </div>
              {isSelected && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
              {isSelected && isThisSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* EXPLANATION CARD */}
      {showExplanation && (
        <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-600" /> Explanation
          </div>
          <p className="text-xs sm:text-sm text-blue-950 leading-relaxed">
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* FOOTER ACTION */}
      {isSelected && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs cursor-pointer"
          >
            <span>{currentIndex === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}

