'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Quiz, QuizResult, ClientQuiz, ClientQuizQuestion, QuestionResultItem } from '@/types';
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
  Sparkles,
  Clock,
  Calendar,
  Lock,
  AlertCircle,
  RotateCcw,
  Maximize2,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ProgressService } from '@/lib/progress';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface QuizEngineProps {
  quiz: Quiz | ClientQuiz;
}

export default function QuizEngine({ quiz }: QuizEngineProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [existingResult, setExistingResult] = useState<QuizResult | null>(null);
  const [canRetake, setCanRetake] = useState(false);
  const [isTaking, setIsTaking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Active quiz session state (strictly sanitized questions from server)
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ClientQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [startedAt, setStartedAt] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showReview, setShowReview] = useState(false);

  // Academic integrity events tracker
  const integrityEventsRef = useRef<Array<{ type: string; timestamp: string; details?: string }>>([]);

  // Check schedule validity
  const now = new Date();
  let isBeforeStart = false;
  let isAfterDeadline = false;
  let startDateTimeDisplay = '';
  let deadlineDateTimeDisplay = '';

  if (quiz.startDate) {
    const startStr = `${quiz.startDate}T${quiz.startTime || '00:00'}:00`;
    const startDateObj = new Date(startStr);
    if (!isNaN(startDateObj.getTime())) {
      isBeforeStart = now < startDateObj;
      startDateTimeDisplay =
        startDateObj.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) + (quiz.startTime ? ` at ${quiz.startTime}` : '');
    }
  }

  if (quiz.deadlineDate) {
    const deadlineStr = `${quiz.deadlineDate}T${quiz.deadlineTime || '23:59'}:59`;
    const deadlineDateObj = new Date(deadlineStr);
    if (!isNaN(deadlineDateObj.getTime())) {
      isAfterDeadline = now > deadlineDateObj;
      deadlineDateTimeDisplay =
        deadlineDateObj.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) + (quiz.deadlineTime ? ` at ${quiz.deadlineTime}` : '');
    }
  }

  // Load existing submission & retake permission on mount
  useEffect(() => {
    async function loadStatus() {
      setLoading(true);
      try {
        // 1. Check local progress service
        const localResult = ProgressService.getQuizResult(quiz.id);
        if (localResult) {
          setExistingResult(localResult);
        }

        // 2. Fetch server retake permission and server quiz results if logged in
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          // Check retake permission
          const retakeRes = await fetch(`/api/quizzes/retake?quizId=${encodeURIComponent(quiz.id)}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (retakeRes.ok) {
            const retakeJson = await retakeRes.json();
            setCanRetake(Boolean(retakeJson.canRetake));
          }

          // Check server progress
          const progRes = await fetch('/api/progress/user', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (progRes.ok) {
            const progJson = await progRes.json();
            if (progJson.success && Array.isArray(progJson.quizResults)) {
              const serverMatch = progJson.quizResults.find((r: any) => r.quizId === quiz.id);
              if (serverMatch) {
                setExistingResult(serverMatch);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load quiz status:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, [quiz.id]);

  // Exam Integrity Listeners (Fullscreen exit, visibilitychange, window blur)
  useEffect(() => {
    if (!isTaking) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        integrityEventsRef.current.push({
          type: 'tab_switch',
          timestamp: new Date().toISOString(),
          details: 'Student switched tabs or minimized window',
        });
      }
    };

    const handleBlur = () => {
      integrityEventsRef.current.push({
        type: 'window_blur',
        timestamp: new Date().toISOString(),
        details: 'Browser window lost focus',
      });
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isTaking) {
        integrityEventsRef.current.push({
          type: 'fullscreen_exit',
          timestamp: new Date().toISOString(),
          details: 'Student exited fullscreen during assessment',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isTaking]);

  // Countdown timer effect
  useEffect(() => {
    if (!isTaking || !expiresAt) return;

    const interval = setInterval(() => {
      const exp = new Date(expiresAt).getTime();
      const diffSeconds = Math.max(0, Math.floor((exp - Date.now()) / 1000));
      setTimeRemainingSeconds(diffSeconds);

      if (diffSeconds <= 0) {
        clearInterval(interval);
        // Automatically submit assessment when time expires
        void submitAssessment(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTaking, expiresAt]);

  // 1. Two-Stage Lifecycle: START ASSESSMENT
  const handleStartQuiz = async () => {
    setSubmitError(null);
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setSubmitError('Authentication session expired. Please refresh and log in.');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/quizzes/${encodeURIComponent(quiz.id)}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        setSubmitError(resData.error?.message || 'Unable to initialize assessment session.');
        setLoading(false);
        return;
      }

      const attempt = resData.data;
      setAttemptId(attempt.attemptId);
      setExpiresAt(attempt.expiresAt || null);
      setQuestions(attempt.questions || []);
      setStartedAt(attempt.startedAt || new Date().toISOString());

      if (attempt.timeLimitSeconds) {
        setTimeRemainingSeconds(attempt.timeLimitSeconds);
      }

      // Request fullscreen for academic integrity
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Browser may restrict if gesture context expires; log event
        integrityEventsRef.current.push({
          type: 'fullscreen_denied',
          timestamp: new Date().toISOString(),
          details: 'Fullscreen request denied by browser permissions',
        });
      }

      integrityEventsRef.current = [];
      setCurrentIndex(0);
      setSelectedAnswers({});
      setIsCompleted(false);
      setResult(null);
      setIsTaking(true);
    } catch (err: any) {
      console.error('Failed to start assessment attempt:', err);
      setSubmitError(err.message || 'Network error initializing assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (questions.length === 0) return;
    const currentQ = questions[currentIndex];
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: optionIndex }));
  };

  // 2. Two-Stage Lifecycle: AUTHORITATIVE SUBMISSION
  const submitAssessment = async (isAutoSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    // Release fullscreen
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignored
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token || !attemptId) {
        setSubmitError('Invalid session or attempt identifier. Submission failed.');
        setSubmitting(false);
        return;
      }

      // Format answers: STRICTLY NO correctAnswerIndex, NO correct, NO score, NO passed!
      const answersPayload = Object.entries(selectedAnswers).map(([questionId, response]) => ({
        questionId,
        response,
      }));

      const res = await fetch(`/api/quizzes/attempts/${encodeURIComponent(attemptId)}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          answers: answersPayload,
          integrityEvents: integrityEventsRef.current,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setSubmitError(data.error?.message || 'Server rejected assessment submission.');
        setSubmitting(false);
        return;
      }

      const submissionResult = data.data || data.result;

      const formattedResult: QuizResult = {
        quizId: quiz.id,
        quizName: quiz.title,
        courseId: quiz.courseId,
        score: submissionResult.score,
        maxScore: submissionResult.maxScore,
        total: questions.length,
        percentage: submissionResult.percentage,
        passed: submissionResult.passed,
        completedAt: submissionResult.completedAt || new Date().toISOString(),
        startedAt,
        timeTakenSeconds: submissionResult.timeTakenSeconds,
        answers: selectedAnswers,
        correctAnswers: submissionResult.correctAnswers,
        incorrectAnswers: submissionResult.incorrectAnswers,
        unanswered: submissionResult.unanswered,
        questionResults: submissionResult.questionResults || [],
      };

      ProgressService.saveQuizResult(formattedResult);
      setResult(formattedResult);
      setExistingResult(formattedResult);
      setCanRetake(false);
      setIsCompleted(true);
      setIsTaking(false);
    } catch (err: any) {
      console.error('Quiz submission error:', err);
      setSubmitError(err.message || 'Failed to submit assessment to server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      void submitAssessment(false);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="edurah-card-warm p-10 rounded-3xl border border-[#d8d0c2] text-center max-w-xl mx-auto space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#8e5a2b] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-[#6f6b63]">Verifying assessment schedule and session credentials...</p>
      </div>
    );
  }

  // 1. BEFORE START TIME (NOT OPEN YET)
  if (isBeforeStart && !existingResult) {
    return (
      <div className="edurah-card-warm p-10 sm:p-12 rounded-3xl border border-[#d8d0c2] shadow-sm text-center max-w-xl mx-auto space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center bg-amber-50 border border-amber-200 text-amber-800">
          <Clock className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <span className="inline-block px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
            Assessment Scheduled
          </span>
          <h2 className="text-2xl font-serif-heading font-normal text-[#171819]">{quiz.title}</h2>
          <p className="text-sm font-semibold text-amber-900 pt-1">
            Assessment opens on {startDateTimeDisplay || 'the designated start date'}.
          </p>
          <p className="text-xs text-[#6f6b63] leading-relaxed">
            This assessment is currently locked. You will be able to start once the scheduled window begins.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/quizzes" className="edurah-btn-secondary text-xs px-6 py-2.5 inline-flex items-center gap-2">
            Return to Assessments
          </Link>
        </div>
      </div>
    );
  }

  // 2. AFTER DEADLINE (CLOSED) AND NOT PREVIOUSLY TAKEN
  if (isAfterDeadline && !existingResult) {
    return (
      <div className="edurah-card-warm p-10 sm:p-12 rounded-3xl border border-[#d8d0c2] shadow-sm text-center max-w-xl mx-auto space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-700">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <span className="inline-block px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300">
            Assessment Closed
          </span>
          <h2 className="text-2xl font-serif-heading font-normal text-[#171819]">{quiz.title}</h2>
          <p className="text-sm font-semibold text-rose-800 pt-1">
            The deadline for this assessment was {deadlineDateTimeDisplay || 'past'}.
          </p>
          <p className="text-xs text-[#6f6b63] leading-relaxed">
            Submissions are no longer accepted for this assessment period. If you require an extension, contact your teacher or administrator.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/quizzes" className="edurah-btn-secondary text-xs px-6 py-2.5 inline-flex items-center gap-2">
            Return to Assessments
          </Link>
        </div>
      </div>
    );
  }

  // 3. ALREADY SUBMITTED (RESULTS SCREEN WITH AUDIT REVIEW & EXPLANATIONS)
  const displayResult = isCompleted ? result : existingResult;
  if (!isTaking && displayResult) {
    const formattedDate = displayResult.completedAt
      ? new Date(displayResult.completedAt).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Recently';

    const formatTimeTaken = (seconds?: number) => {
      if (!seconds || seconds <= 0) return null;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    };

    return (
      <div className="edurah-card-warm p-8 sm:p-12 rounded-3xl border border-[#d8d0c2] shadow-sm text-center max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-[#ede6d8] border border-[#d8d0c2]">
          {displayResult.passed ? (
            <CheckCircle2 className="w-9 h-9 text-[#16a34a]" />
          ) : (
            <XCircle className="w-9 h-9 text-[#dc2626]" />
          )}
        </div>

        <div className="space-y-2">
          <span
            className={`inline-block px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              displayResult.passed
                ? 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]'
                : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
            }`}
          >
            Assessment Completed
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif-heading font-normal text-[#171819]">
            {quiz.title} Results
          </h2>
          <p className="text-xs text-[#6f6b63]">
            Attempted on: <strong className="text-[#171819]">{formattedDate}</strong>
            {displayResult.timeTakenSeconds ? (
              <>
                {' '}
                · Time taken: <strong className="text-[#171819]">{formatTimeTaken(displayResult.timeTakenSeconds)}</strong>
              </>
            ) : null}
          </p>
        </div>

        {/* SCORE METRICS CARD */}
        <div className="py-5 px-4 bg-[#faf8f5] rounded-2xl border border-[#d8d0c2] max-w-md mx-auto grid grid-cols-3 gap-2 text-center">
          <div className="border-r border-[#e5ded0] pr-2">
            <div className="text-2xl sm:text-3xl font-serif-heading font-normal text-[#171819]">
              {displayResult.score} / {displayResult.maxScore || displayResult.total}
            </div>
            <div className="text-[10px] text-[#6f6b63] uppercase tracking-wider mt-0.5 font-bold">Marks Awarded</div>
          </div>

          <div className="border-r border-[#e5ded0] px-2">
            <div
              className={`text-2xl sm:text-3xl font-mono-code font-bold ${
                displayResult.passed ? 'text-[#16a34a]' : 'text-[#dc2626]'
              }`}
            >
              {displayResult.percentage}%
            </div>
            <div className="text-[10px] text-[#6f6b63] uppercase tracking-wider mt-0.5 font-bold">Accuracy</div>
          </div>

          <div className="pl-2">
            <div className="text-xs font-bold text-emerald-700">
              ✓ {displayResult.correctAnswers !== undefined ? displayResult.correctAnswers : displayResult.score} Correct
            </div>
            <div className="text-xs font-bold text-rose-700 mt-1">
              ✕{' '}
              {displayResult.incorrectAnswers !== undefined
                ? displayResult.incorrectAnswers
                : (displayResult.total - displayResult.score)}{' '}
              Incorrect
            </div>
            <div className="text-[10px] text-[#6f6b63] uppercase tracking-wider mt-0.5 font-bold">Breakdown</div>
          </div>
        </div>

        {/* POST-SUBMISSION QUESTION REVIEW (EXPLANATIONS SAFELY RELEASED) */}
        {displayResult.questionResults && displayResult.questionResults.length > 0 && (
          <div className="text-left max-w-xl mx-auto space-y-3 pt-2">
            <button
              onClick={() => setShowReview(!showReview)}
              className="w-full p-3.5 rounded-2xl bg-[#ede6d8]/60 border border-[#d8d0c2] flex items-center justify-between text-xs font-bold text-[#171819] hover:bg-[#ede6d8] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8e5a2b]" />
                <span>Review Explanations & Answer Breakdown</span>
              </span>
              {showReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showReview && (
              <div className="space-y-4 pt-2">
                {displayResult.questionResults.map((item: QuestionResultItem, idx: number) => (
                  <div
                    key={item.questionId || idx}
                    className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                      item.isCorrect
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/60 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold flex items-center gap-2">
                        {item.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        )}
                        <span>Question {idx + 1}</span>
                      </div>
                      <span className="font-mono-code text-[11px] font-bold">
                        {item.marksAwarded} / {item.maxMarks} marks
                      </span>
                    </div>

                    <p className="font-medium text-[#171819] leading-relaxed">{item.questionText}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded-xl bg-white/80 border border-[#d8d0c2]">
                        <span className="text-[#6f6b63] font-bold block text-[10px] uppercase">Your Answer</span>
                        <span className={item.isCorrect ? 'text-emerald-800 font-semibold' : 'text-rose-800 font-semibold'}>
                          {item.studentAnswerText}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/80 border border-[#d8d0c2]">
                        <span className="text-[#6f6b63] font-bold block text-[10px] uppercase">Correct Answer</span>
                        <span className="text-emerald-800 font-semibold">{item.correctAnswerText}</span>
                      </div>
                    </div>

                    {item.explanation && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-[#171819] space-y-1">
                        <span className="font-bold text-[#8e5a2b] uppercase text-[10px] block">Explanation:</span>
                        <p className="leading-relaxed">{item.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RETAKE POLICY LOCK NOTICE */}
        {!canRetake ? (
          <div className="p-4 rounded-2xl bg-[#ede6d8]/60 border border-[#d8d0c2] text-xs text-[#6f6b63] max-w-md mx-auto space-y-1 text-left">
            <div className="flex items-center gap-2 font-bold text-[#171819]">
              <Lock className="w-3.5 h-3.5 text-[#8e5a2b]" /> Retake Policy
            </div>
            <p className="text-[11px] leading-relaxed">
              Assessments cannot be retaken once submitted. If you need to re-attempt this assessment, your teacher or administrator must grant explicit retake authorization.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 max-w-md mx-auto space-y-2 text-left">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instructor Retake Authorized
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800">
              Your instructor has authorized you to take an additional attempt.
            </p>
            <button
              onClick={handleStartQuiz}
              className="mt-1 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Start Authorized Retake
            </button>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/quizzes"
            className="edurah-btn-secondary text-xs px-6 py-2.5 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            Back to Assessments
          </Link>
          <Link
            href="/dashboard"
            className="edurah-btn-primary text-xs px-6 py-2.5 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <BookOpen className="w-4 h-4" /> Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // 4. PRE-START LOBBY (ASSESSMENT DETAILS)
  if (!isTaking) {
    const questionCount = quiz.questions?.length || 0;

    return (
      <div className="edurah-card-warm p-8 sm:p-10 rounded-3xl border border-[#d8d0c2] shadow-sm max-w-2xl mx-auto space-y-6">
        {submitError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-[#e5ded0] pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8e5a2b]" />
            <span className="text-xs font-bold text-[#8e5a2b] uppercase tracking-wider font-mono-code">
              Assessment Details
            </span>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Available Now
          </span>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-serif-heading font-normal text-[#171819]">{quiz.title}</h2>
          <p className="text-xs sm:text-sm text-[#6f6b63] leading-relaxed">{quiz.description}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2]">
            <span className="text-[10px] text-[#6f6b63] font-bold uppercase block">Total Questions</span>
            <span className="text-lg font-mono-code font-bold text-[#171819]">{questionCount}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2]">
            <span className="text-[10px] text-[#6f6b63] font-bold uppercase block">Passing Score</span>
            <span className="text-lg font-mono-code font-bold text-[#171819]">{quiz.passingScore}%</span>
          </div>
          {deadlineDateTimeDisplay ? (
            <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] col-span-2 sm:col-span-1">
              <span className="text-[10px] text-[#6f6b63] font-bold uppercase block">Deadline</span>
              <span className="text-xs font-semibold text-rose-800 block truncate" title={deadlineDateTimeDisplay}>
                {deadlineDateTimeDisplay}
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2]">
              <span className="text-[10px] text-[#6f6b63] font-bold uppercase block">Attempts Allowed</span>
              <span className="text-xs font-semibold text-[#171819]">1 Single Attempt</span>
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-[#ede6d8]/60 border border-[#d8d0c2] text-xs text-[#6f6b63] space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#171819]">
            <Lock className="w-3.5 h-3.5 text-[#8e5a2b]" /> Academic Integrity Rules:
          </div>
          <ul className="text-[11px] leading-relaxed list-disc list-inside space-y-1">
            <li>Assessment will request fullscreen mode upon start.</li>
            <li>Tab switches and window blurs are logged securely to the server audit record.</li>
            <li>Once submitted, grading is authoritatively finalized on the server.</li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5ded0]">
          <Link href="/quizzes" className="edurah-btn-secondary text-xs px-5 py-2.5">
            Cancel
          </Link>
          <button
            onClick={handleStartQuiz}
            className="edurah-btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Start Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 5. ACTIVE QUESTION ENGINE (ZERO ANSWERS, ZERO EXPLANATIONS DURING TAKING)
  const activeQuestions = questions.length > 0 ? questions : (quiz.questions as ClientQuizQuestion[]);
  const currentQuestion = activeQuestions[currentIndex];
  const selectedOption = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const isSelected = selectedOption !== undefined;

  return (
    <div
      onPaste={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      className="edurah-card-warm p-6 sm:p-10 rounded-3xl border border-[#d8d0c2] shadow-sm max-w-3xl mx-auto space-y-7 select-none"
    >
      {submitError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* TOP BAR WITH PROGRESS & COUNTDOWN */}
      <div className="flex items-center justify-between border-b border-[#e5ded0] pb-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#8e5a2b]" />
          <span className="text-xs font-bold text-[#8e5a2b] uppercase tracking-wider font-mono-code">
            Question {currentIndex + 1} of {activeQuestions.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {timeRemainingSeconds !== null && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-code font-bold ${
                timeRemainingSeconds < 120
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                  : 'bg-[#ede6d8] text-[#171819] border border-[#d8d0c2]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(timeRemainingSeconds)}</span>
            </div>
          )}
          <span className="text-xs text-[#6f6b63]">
            Passing: <strong className="text-[#171819] font-mono-code">{quiz.passingScore}%</strong>
          </span>
        </div>
      </div>

      {/* QUESTION PROMPT */}
      <h3 className="text-xl sm:text-2xl font-serif-heading font-normal text-[#171819] leading-snug">
        {currentQuestion?.question}
      </h3>

      {/* OPTIONS LIST (HIGHLIGHT SELECTED ONLY - NO GREEN/RED REVEALS DURING ASSESSMENT) */}
      <div className="space-y-3">
        {currentQuestion?.options.map((option, idx) => {
          const isThisSelected = selectedOption === idx;

          let cardStyle = 'bg-[#faf8f5] border-[#d8d0c2] text-[#171819] hover:border-[#d8a471] hover:bg-[#ede6d8]/40';
          if (isThisSelected) {
            cardStyle = 'bg-[#ede6d8] border-[#8e5a2b] text-[#171819] font-semibold ring-1 ring-[#8e5a2b]';
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between gap-3 text-sm transition-all cursor-pointer ${cardStyle}`}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className={`w-7 h-7 rounded-xl text-xs font-mono-code font-bold flex items-center justify-center shrink-0 mt-0.5 border ${
                    isThisSelected
                      ? 'bg-[#8e5a2b] text-white border-[#8e5a2b]'
                      : 'bg-[#ede6d8] text-[#8e5a2b] border-[#d8d0c2]'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-relaxed text-sm pt-0.5">{option}</span>
              </div>
              {isThisSelected && <CheckCircle2 className="w-5 h-5 text-[#8e5a2b] shrink-0 mt-0.5" />}
            </button>
          );
        })}
      </div>

      {/* FOOTER ACTION */}
      <div className="flex items-center justify-between pt-3 border-t border-[#e5ded0]">
        <span className="text-xs text-[#6f6b63]">
          {isSelected ? 'Answer recorded' : 'Select an option to proceed'}
        </span>

        <button
          onClick={handleNext}
          disabled={submitting || !isSelected}
          className="edurah-btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {submitting ? (
            <span>Authoritatively Grading...</span>
          ) : (
            <>
              <span>{currentIndex === activeQuestions.length - 1 ? 'Submit Assessment' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
