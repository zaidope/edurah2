'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Quiz, QuizQuestion } from '@/types';
import { ContentService } from '@/lib/content';
import { parsePdfFile } from '@/lib/quizMaker/pdfParser';
import {
  FileUp,
  Sparkles,
  Trash2,
  Plus,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  Save,
  Check,
  FileCheck2,
  SlidersHorizontal,
  ChevronLeft,
  Clock,
  Calendar
} from 'lucide-react';

interface QuizMakerProps {
  allowedGradeId?: string; // If teacher, locked to this grade; if undefined, admin can pick any grade
  role: 'teacher' | 'admin';
}

export default function QuizMakerComponent({ allowedGradeId, role }: QuizMakerProps) {
  const router = useRouter();
  const grades = ContentService.getGrades();
  const allCourses = ContentService.getCourses();

  const [selectedGradeId, setSelectedGradeId] = useState<string>(
    allowedGradeId || 'grade-1'
  );

  const availableCourses = allCourses.filter(c => c.gradeId === selectedGradeId);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    availableCourses[0]?.id || ''
  );

  const [step, setStep] = useState<'upload' | 'edit'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [passingScore, setPassingScore] = useState<number>(75);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [parserWarnings, setParserWarnings] = useState<string[]>([]);
  const [publishedSuccess, setPublishedSuccess] = useState<string | null>(null);

  // Handle PDF file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setParserWarnings([]);

    try {
      const draft = await parsePdfFile(file);
      setQuizTitle(draft.title || `${file.name.replace('.pdf', '')} Assessment`);
      setQuizDescription(draft.description || 'Curriculum assessment parsed from document.');
      setQuestions(draft.questions.length > 0 ? draft.questions.map(q => ({ ...q, marks: q.marks || 1 })) : [createBlankQuestion()]);
      if (draft.warnings) setParserWarnings(draft.warnings);
      setStep('edit');
    } catch {
      setParserWarnings(['Failed to automatically parse structure from this PDF. You can structure questions manually below.']);
      setQuestions([createBlankQuestion()]);
      setStep('edit');
    } finally {
      setIsProcessing(false);
    }
  };

  const createBlankQuestion = (): QuizQuestion => ({
    id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    question: 'Enter question text here...',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswerIndex: 0,
    marks: 1,
    explanation: 'Explanation for correct choice.'
  });

  const handleAddQuestion = () => {
    setQuestions([...questions, createBlankQuestion()]);
  };

  const handleDeleteQuestion = (index: number) => {
    const next = questions.filter((_, i) => i !== index);
    setQuestions(next.length > 0 ? next : [createBlankQuestion()]);
  };

  const handleUpdateQuestionText = (index: number, text: string) => {
    const next = [...questions];
    next[index].question = text;
    setQuestions(next);
  };

  const handleUpdateQuestionMarks = (index: number, marks: number) => {
    const next = [...questions];
    next[index].marks = Math.max(1, marks);
    setQuestions(next);
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, val: string) => {
    const next = [...questions];
    next[qIndex].options[optIndex] = val;
    setQuestions(next);
  };

  const handleSetCorrectAnswer = (qIndex: number, optIndex: number) => {
    const next = [...questions];
    next[qIndex].correctAnswerIndex = optIndex;
    setQuestions(next);
  };

  const handleAddOption = (qIndex: number) => {
    const next = [...questions];
    next[qIndex].options.push(`Option ${String.fromCharCode(65 + next[qIndex].options.length)}`);
    setQuestions(next);
  };

  const handleDeleteOption = (qIndex: number, optIndex: number) => {
    const next = [...questions];
    if (next[qIndex].options.length > 2) {
      next[qIndex].options.splice(optIndex, 1);
      if (next[qIndex].correctAnswerIndex >= next[qIndex].options.length) {
        next[qIndex].correctAnswerIndex = 0;
      }
      setQuestions(next);
    }
  };

  const handlePublish = () => {
    if (!quizTitle.trim() || questions.length === 0) return;

    const quizId = `quiz-gen-${Date.now()}`;
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    const newQuiz: Quiz = {
      id: quizId,
      title: quizTitle,
      description: quizDescription || 'Curriculum assessment quiz.',
      gradeId: selectedGradeId,
      courseId: selectedCourseId || undefined,
      passingScore,
      startDate: startDate || undefined,
      startTime: startTime || undefined,
      deadlineDate: deadlineDate || undefined,
      deadlineTime: deadlineTime || undefined,
      durationMinutes: durationMinutes || undefined,
      totalMarks,
      questions: questions.map((q, idx) => ({
        ...q,
        id: q.id || `q-${quizId}-${idx + 1}`,
        marks: q.marks || 1
      }))
    };

    ContentService.saveQuiz(newQuiz);
    setPublishedSuccess(quizId);
  };

  const currentGradeName = grades.find(g => g.id === selectedGradeId)?.name || selectedGradeId;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* HEADER CARD */}
      <div className="edurah-card-warm p-6 sm:p-8 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#d8a471]" />
            Faculty Assessment Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-heading font-normal text-[#171819] tracking-tight">
            Document-to-Quiz Compiler
          </h1>
          <p className="text-sm text-[#6f6b63] max-w-xl leading-relaxed">
            Upload questions or exam sheets as PDF. Edurah extracts prompts, options, and keys into an editable quiz for your assigned students.
          </p>
        </div>

        {/* GRADE & COURSE CONFIGURATION */}
        <div className="bg-[#faf8f5] p-5 rounded-xl border border-[#d8d0c2] space-y-3 min-w-[280px]">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6f6b63] block mb-1">
              Curriculum Target
            </label>
            {allowedGradeId ? (
              <div className="px-3.5 py-2 rounded-lg bg-[#ede6d8]/60 border border-[#d8d0c2] text-[#171819] text-xs font-semibold flex items-center justify-between">
                <span>{currentGradeName}</span>
                <span className="text-[10px] uppercase font-bold text-[#8e5a2b] tracking-wider">Assigned Cohort</span>
              </div>
            ) : (
              <select
                value={selectedGradeId}
                onChange={(e) => {
                  setSelectedGradeId(e.target.value);
                  const courses = allCourses.filter(c => c.gradeId === e.target.value);
                  setSelectedCourseId(courses[0]?.id || '');
                }}
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#d8d0c2] text-xs font-semibold text-[#171819] focus:outline-none focus:border-[#d8a471]"
              >
                {grades.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.tier.toUpperCase()})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6f6b63] block mb-1">
              Course Binding
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#d8d0c2] text-xs font-semibold text-[#171819] focus:outline-none focus:border-[#d8a471]"
            >
              <option value="">General Grade Quiz (All Cohort Students)</option>
              {availableCourses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* PUBLISHED SUCCESS BANNER */}
      {publishedSuccess && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#14532d] space-y-4 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#16a34a] text-white flex items-center justify-center shrink-0">
              <Check className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif-heading text-lg font-normal text-[#14532d]">
                Assessment Published Successfully
              </h3>
              <p className="text-sm text-[#15803d] leading-relaxed">
                This quiz has been validated and committed to the curriculum. It is now active and accessible exclusively to students in <strong>{currentGradeName}</strong>.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => router.push(`/quizzes/${publishedSuccess}`)}
              className="px-5 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold shadow-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              Inspect Live Quiz <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setPublishedSuccess(null);
                setStep('upload');
                setQuestions([]);
              }}
              className="px-5 py-2.5 rounded-xl bg-white border border-[#bbf7d0] text-[#14532d] text-xs font-semibold hover:bg-[#dcfce7] transition-colors cursor-pointer"
            >
              Create Another Quiz
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: UPLOAD AREA */}
      {step === 'upload' && !publishedSuccess && (
        <div className="space-y-6">
          <div className="edurah-card-warm p-10 sm:p-14 text-center border-2 border-dashed border-[#d8d0c2] hover:border-[#d8a471] transition-colors relative group">
            <div className="w-16 h-16 rounded-2xl bg-[#ede6d8] text-[#8e5a2b] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
              <FileUp className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif-heading font-normal text-[#171819]">
              Upload Assessment PDF
            </h3>
            <p className="text-sm text-[#6f6b63] mt-2 max-w-lg mx-auto leading-relaxed">
              Select your question sheet, quiz document, or syllabus assessment. Edurah will parse questions, answer options, and explanation hints for your review before publishing.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 max-w-sm mx-auto">
              <label className="edurah-btn-primary cursor-pointer inline-flex items-center justify-center gap-2.5 px-6 py-3 text-sm w-full">
                <FileUp className="w-4 h-4" />
                <span>Select PDF Document</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-3 w-full">
                <div className="h-px bg-[#d8d0c2] flex-1" />
                <span className="text-[10px] text-[#9d978c] uppercase font-bold tracking-wider">or</span>
                <div className="h-px bg-[#d8d0c2] flex-1" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setQuizTitle('New Assessment');
                  setQuizDescription('Curriculum evaluation quiz.');
                  setQuestions([createBlankQuestion()]);
                  setStep('edit');
                }}
                className="edurah-btn-secondary text-xs px-5 py-2.5 inline-flex items-center justify-center gap-2 w-full cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Start Manually (No PDF)
              </button>

              <p className="text-xs text-[#9d978c]">Supported format: Standard text-based PDF documents or manual creation.</p>
            </div>

            {isProcessing && (
              <div className="mt-8 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#ede6d8] text-[#171819] text-xs font-medium border border-[#d8d0c2]">
                <span className="w-3.5 h-3.5 border-2 border-[#8e5a2b] border-t-transparent rounded-full animate-spin" />
                Parsing document structure and question boundaries...
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: REVIEW & EDIT QUIZ */}
      {step === 'edit' && !publishedSuccess && (
        <div className="space-y-6 animate-in fade-in">
          {/* NOTICE BANNER IF WARNINGS */}
          {parserWarnings.length > 0 && (
            <div className="p-4 rounded-xl bg-[#fffbeb] border border-[#fde68a] text-[#92400e] text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-[#d97706]" /> Parser Notice
              </div>
              {parserWarnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          )}

          {/* QUIZ METADATA */}
          <div className="edurah-card-warm p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5ded0] pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6f6b63]">
                <SlidersHorizontal className="w-4 h-4 text-[#d8a471]" />
                Assessment Configuration & Scheduling
              </div>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="text-xs font-semibold text-[#8e5a2b] hover:underline"
              >
                Back to PDF Upload
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-[#171819]">Assessment Title</label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. Fractions & Arithmetic Mastery Test"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-sm font-semibold text-[#171819] focus:outline-none focus:border-[#d8a471]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#171819]">Passing Requirement (%)</label>
                <input
                  type="number"
                  min="40"
                  max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-sm font-semibold text-[#171819] focus:outline-none focus:border-[#d8a471]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#171819]">Instructions & Context</label>
              <textarea
                rows={2}
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                placeholder="Guidelines or instructions presented to students before starting..."
                className="w-full px-4 py-2 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-xs text-[#171819] focus:outline-none focus:border-[#d8a471]"
              />
            </div>

            {/* SCHEDULING CONTROLS */}
            <div className="pt-3 border-t border-[#e5ded0] space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8e5a2b]">
                <Clock className="w-3.5 h-3.5" /> Start Window & Deadline Scheduling
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#171819]">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] font-medium focus:outline-none focus:border-[#d8a471]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#171819]">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] font-medium focus:outline-none focus:border-[#d8a471]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#171819]">Deadline Date</label>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] font-medium focus:outline-none focus:border-[#d8a471]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#171819]">Deadline Time</label>
                  <input
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] font-medium focus:outline-none focus:border-[#d8a471]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <div className="w-48 space-y-1">
                  <label className="font-bold text-[#171819] text-xs">Exam Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-xs font-semibold text-[#171819] focus:outline-none focus:border-[#d8a471]"
                  />
                </div>
                <span className="text-[11px] text-[#6f6b63] pt-4">
                  Students cannot start before Start Time, and submissions close permanently at Deadline.
                </span>
              </div>
            </div>
          </div>

          {/* QUESTIONS LIST */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif-heading font-normal text-[#171819] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#8e5a2b]" />
                Review & Edit Questions ({questions.length}) · Total Marks:{' '}
                <strong className="text-[#8e5a2b]">
                  {questions.reduce((sum, q) => sum + (q.marks || 1), 0)}
                </strong>
              </h2>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ede6d8] hover:bg-[#e4dcce] text-[#171819] text-xs font-semibold border border-[#d8d0c2] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Question
              </button>
            </div>

            {questions.map((q, qIndex) => (
              <div
                key={q.id || qIndex}
                className="edurah-card-warm p-6 rounded-2xl space-y-4 relative transition-all"
              >
                <div className="flex items-center justify-between border-b border-[#e5ded0] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#8e5a2b] uppercase tracking-wider font-mono-code">
                      Question {qIndex + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-[#6f6b63]">Marks:</span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={q.marks || 1}
                        onChange={(e) => handleUpdateQuestionMarks(qIndex, Number(e.target.value))}
                        className="w-14 px-2 py-0.5 rounded-lg bg-[#faf8f5] border border-[#d8d0c2] text-xs font-bold text-[#171819] focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(qIndex)}
                    className="p-1.5 rounded-lg text-[#9d978c] hover:text-[#b91c1c] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                    title="Remove Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* QUESTION PROMPT */}
                <div>
                  <label className="text-[11px] font-bold text-[#6f6b63] uppercase tracking-wider block mb-1">
                    Question Text
                  </label>
                  <textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => handleUpdateQuestionText(qIndex, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-sm font-medium text-[#171819] focus:outline-none focus:border-[#d8a471]"
                    placeholder="Enter question prompt..."
                  />
                </div>

                {/* OPTIONS LIST */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#6f6b63] uppercase tracking-wider block">
                      Answer Choices (Select radio button for Correct Answer)
                    </label>
                    <span className="text-[11px] text-[#8e5a2b] font-medium">
                      Correct: Choice {String.fromCharCode(65 + q.correctAnswerIndex)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, optIndex) => {
                      const isCorrect = q.correctAnswerIndex === optIndex;
                      return (
                        <div
                          key={optIndex}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            isCorrect
                              ? 'bg-[#f0fdf4] border-[#86efac] ring-1 ring-[#86efac]'
                              : 'bg-[#faf8f5] border-[#d8d0c2]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={isCorrect}
                            onChange={() => handleSetCorrectAnswer(qIndex, optIndex)}
                            className="w-4 h-4 text-[#16a34a] focus:ring-[#16a34a] cursor-pointer shrink-0"
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                            className="flex-1 bg-transparent text-xs text-[#171819] focus:outline-none font-medium"
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteOption(qIndex, optIndex)}
                              className="text-[#9d978c] hover:text-[#b91c1c] text-xs px-1"
                              title="Delete option"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => handleAddOption(qIndex)}
                      className="text-xs text-[#8e5a2b] font-semibold hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Choice
                    </button>
                  )}
                </div>

                {/* EXPLANATION */}
                <div className="pt-2 border-t border-[#e5ded0]">
                  <label className="text-[11px] font-bold text-[#6f6b63] uppercase tracking-wider block mb-1">
                    Pedagogical Explanation / Hint
                  </label>
                  <input
                    type="text"
                    value={q.explanation || ''}
                    onChange={(e) => {
                      const next = [...questions];
                      next[qIndex].explanation = e.target.value;
                      setQuestions(next);
                    }}
                    placeholder="Provide reasoning shown to students when reviewing their test..."
                    className="w-full px-4 py-2 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-xs text-[#171819] focus:outline-none focus:border-[#d8a471]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#d8d0c2]">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="edurah-btn-ghost text-xs cursor-pointer inline-flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Re-upload PDF
            </button>

            <button
              type="button"
              onClick={handlePublish}
              className="edurah-btn-primary cursor-pointer inline-flex items-center gap-2 text-xs px-6 py-2.5"
            >
              <FileCheck2 className="w-4 h-4" />
              Publish Quiz to {currentGradeName}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
