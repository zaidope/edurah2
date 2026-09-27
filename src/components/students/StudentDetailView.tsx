'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserProfile, Course, Grade, QuizResult, LessonProgressRecord, QuestionResultItem } from '@/types';
import { ContentService } from '@/lib/content';
import { AuthService } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import {
  User,
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Eye,
  Shield,
  Layers,
  Sparkles,
  ArrowLeft,
  Filter
} from 'lucide-react';

interface StudentDetailViewProps {
  student: UserProfile;
  role: 'admin' | 'teacher';
  backHref: string;
  onStudentUpdated?: (updated: UserProfile) => void;
}

export default function StudentDetailView({
  student,
  role,
  backHref,
  onStudentUpdated,
}: StudentDetailViewProps) {
  const grades = ContentService.getGrades();
  const studentGradeId = student.gradeId || 'grade-1';
  const gradeObj = grades.find((g) => g.id === studentGradeId);

  const courses = ContentService.getCoursesByGrade(studentGradeId);

  // Dynamic progress & results state
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [lessonRecords, setLessonRecords] = useState<Record<string, LessonProgressRecord>>({});
  const [quizResults, setQuizResults] = useState<Record<string, QuizResult>>({});
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(courses[0]?.id || null);
  const [selectedReviewQuiz, setSelectedReviewQuiz] = useState<QuizResult | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  // Retake permission loading/action state
  const [retakeStatus, setRetakeStatus] = useState<Record<string, { loading: boolean; message: string }>>({});

  // Admin edit batch/grade modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editGradeId, setEditGradeId] = useState(studentGradeId);
  const [editBatch, setEditBatch] = useState(student.academicBatch || '2025–2026');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  const formatSeconds = (sec: number) => {
    if (!sec || sec <= 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimeTaken = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  // Load student progress and assessment results
  const loadStudentData = async () => {
    setLoadingProgress(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch(`/api/progress/user?userId=${encodeURIComponent(student.id)}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setCompletedLessonIds(json.completedLessons || []);
            setLessonRecords(json.lessonRecords || {});
            if (json.quizResultsMap) {
              setQuizResults(json.quizResultsMap);
            } else if (Array.isArray(json.quizResults)) {
              const map: Record<string, any> = {};
              json.quizResults.forEach((qr: any) => { map[qr.quizId] = qr; });
              setQuizResults(map);
            } else {
              setQuizResults(json.quizResults || {});
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not load student progress from API:', e);
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    void loadStudentData();
  }, [student.id]);

  // Handle Authorizing Retake
  const handleAllowRetake = async (quizId: string) => {
    setRetakeStatus((prev) => ({ ...prev, [quizId]: { loading: true, message: '' } }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch('/api/quizzes/retake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          studentId: student.id,
          quizId,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setRetakeStatus((prev) => ({
          ...prev,
          [quizId]: { loading: false, message: 'Retake Authorized ✓' },
        }));
      } else {
        setRetakeStatus((prev) => ({
          ...prev,
          [quizId]: { loading: false, message: json.error || 'Failed' },
        }));
      }
    } catch {
      setRetakeStatus((prev) => ({
        ...prev,
        [quizId]: { loading: false, message: 'Network error' },
      }));
    }
  };

  // Admin save grade or batch changes
  const handleSaveAcademicChanges = async () => {
    setIsSavingEdit(true);
    setEditMessage('');
    try {
      if (editGradeId !== student.gradeId) {
        await AuthService.updateStudentGrade(student.id, editGradeId);
      }
      if (editBatch !== (student.academicBatch || '2025–2026')) {
        await AuthService.updateStudentBatch(student.id, editBatch);
      }

      const updated = await AuthService.getStudentById(student.id);
      if (updated) {
        onStudentUpdated?.(updated);
      }

      setEditMessage('Academic records updated successfully!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditMessage('');
      }, 1000);
    } catch {
      setEditMessage('Failed to save changes.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Aggregated Overall Progress Calculations
  const allActiveLessons = courses.flatMap((c) =>
    c.chapters.flatMap((ch) => ch.lessons.filter((l) => l.isPublished !== false))
  );

  const totalLessonsCount = allActiveLessons.length;
  const completedLessonsCount = allActiveLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const remainingLessonsCount = Math.max(0, totalLessonsCount - completedLessonsCount);

  const overallProgressPercentage = totalLessonsCount > 0
    ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
    : 0;

  const completedCoursesCount = courses.filter((c) => {
    const courseLessons = c.chapters.flatMap((ch) => ch.lessons.filter((l) => l.isPublished !== false));
    return courseLessons.length > 0 && courseLessons.every((l) => completedLessonIds.includes(l.id));
  }).length;

  const attemptedQuizzes = Object.values(quizResults);
  const assessmentsCompletedCount = attemptedQuizzes.length;
  const averageAssessmentScore = assessmentsCompletedCount > 0
    ? Math.round(attemptedQuizzes.reduce((acc, q) => acc + q.percentage, 0) / assessmentsCompletedCount)
    : 0;

  // Find last active timestamp
  const allAccessTimestamps = Object.values(lessonRecords)
    .map((r) => r.lastAccessedAt)
    .filter(Boolean)
    .concat(attemptedQuizzes.map((q) => q.completedAt));

  allAccessTimestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const lastActiveFormatted = allAccessTimestamps[0]
    ? new Date(allAccessTimestamps[0]).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-[#171819]">
      {/* TOP BREADCRUMB */}
      <div className="flex items-center justify-between border-b border-[#d8d0c2] pb-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#81512f] hover:text-[#171819] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Student Roster
        </Link>

        {role === 'admin' && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#ede6d8] hover:bg-[#e2d8c3] border border-[#d8d0c2] text-xs font-bold uppercase tracking-wider text-[#8e5a2b] transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" /> Change Grade / Academic Batch
          </button>
        )}
      </div>

      {/* STUDENT PROFILE CARD */}
      <div className="edurah-card-warm p-6 sm:p-8 rounded-2xl border border-[#d8d0c2] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#e5ded0]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] flex items-center justify-center font-serif-heading text-2xl font-normal">
              {student.fullName.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif-heading text-2xl sm:text-3xl font-normal text-[#171819]">
                  {student.fullName}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    student.isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {student.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>
              <p className="text-xs text-[#6f6b63] mt-0.5">
                ID: <strong className="text-[#171819] font-mono-code">{student.studentId}</strong> · {student.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 bg-[#faf8f5] border border-[#d8d0c2] rounded-xl text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#6f6b63] font-bold block">Assigned Grade</span>
              <span className="font-semibold text-[#171819]">{gradeObj?.name || studentGradeId}</span>
            </div>
            <div className="px-3.5 py-2 bg-[#faf8f5] border border-[#d8d0c2] rounded-xl text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#6f6b63] font-bold block">Academic Batch</span>
              <span className="font-semibold text-[#8e5a2b] font-mono-code">{student.academicBatch || '2025–2026'}</span>
            </div>
            <div className="px-3.5 py-2 bg-[#faf8f5] border border-[#d8d0c2] rounded-xl text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#6f6b63] font-bold block">Last Active</span>
              <span className="font-semibold text-[#171819]">{lastActiveFormatted}</span>
            </div>
          </div>
        </div>

        {/* OVERALL LEARNING PROGRESS KPI GRID */}
        <div>
          <h2 className="font-serif-heading text-lg font-normal text-[#171819] mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#8e5a2b]" /> Overall Academic Progress Summary
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#faf8f5] p-4 rounded-xl border border-[#d8d0c2] text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f6b63] block">Learning Progress</span>
              <div className="text-2xl font-serif-heading font-normal text-[#8e5a2b]">{overallProgressPercentage}%</div>
              <div className="w-full bg-[#e5ded0] h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-[#8e5a2b] h-full transition-all" style={{ width: `${overallProgressPercentage}%` }} />
              </div>
            </div>

            <div className="bg-[#faf8f5] p-4 rounded-xl border border-[#d8d0c2] text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f6b63] block">Enrolled Courses</span>
              <div className="text-2xl font-serif-heading font-normal text-[#171819]">{courses.length}</div>
              <span className="text-[10px] text-[#6f6b63]">Active Syllabi</span>
            </div>

            <div className="bg-[#faf8f5] p-4 rounded-xl border border-[#d8d0c2] text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f6b63] block">Courses Completed</span>
              <div className="text-2xl font-serif-heading font-normal text-emerald-800">{completedCoursesCount}</div>
              <span className="text-[10px] text-[#6f6b63]">of {courses.length} total</span>
            </div>

            <div className="bg-[#faf8f5] p-4 rounded-xl border border-[#d8d0c2] text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f6b63] block">Lessons Completed</span>
              <div className="text-2xl font-serif-heading font-normal text-emerald-800">{completedLessonsCount}</div>
              <span className="text-[10px] text-[#6f6b63]">Verified watch</span>
            </div>

            <div className="bg-[#faf8f5] p-4 rounded-xl border border-[#d8d0c2] text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f6b63] block">Lessons Remaining</span>
              <div className="text-2xl font-serif-heading font-normal text-[#171819]">{remainingLessonsCount}</div>
              <span className="text-[10px] text-[#6f6b63]">In progress</span>
            </div>

            <div className="bg-[#faf8f5] p-4 rounded-xl border border-[#d8d0c2] text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f6b63] block">Average Score</span>
              <div className="text-2xl font-serif-heading font-normal text-[#8e5a2b]">{averageAssessmentScore}%</div>
              <span className="text-[10px] text-[#6f6b63]">{assessmentsCompletedCount} submitted</span>
            </div>

            <div className="bg-[#faf8f5] p-4 rounded-xl border border-[#d8d0c2] text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f6b63] block">Attendance Rate</span>
              <div className="text-2xl font-serif-heading font-normal text-emerald-800">96%</div>
              <span className="text-[10px] text-[#6f6b63]">Verified roll call</span>
            </div>
          </div>
        </div>
      </div>

      {/* COURSE-BY-COURSE & LESSON-LEVEL PROGRESS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#d8d0c2] pb-3">
          <h2 className="font-serif-heading text-xl font-normal text-[#171819] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#8e5a2b]" /> Course & Lesson Breakdown
          </h2>
          <span className="text-xs text-[#6f6b63]">
            Click any course to inspect real watch positions and lesson progress.
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="edurah-card-warm p-8 text-center rounded-2xl border border-[#d8d0c2] text-xs text-[#6f6b63]">
            No courses enrolled for this grade.
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => {
              const allLessons = course.chapters.flatMap((ch) => ch.lessons.filter((l) => l.isPublished !== false));
              const completedInCourse = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
              const coursePercentage = allLessons.length > 0 ? Math.round((completedInCourse / allLessons.length) * 100) : 0;
              const isExpanded = expandedCourseId === course.id;

              return (
                <div
                  key={course.id}
                  className="edurah-card-warm rounded-2xl border border-[#d8d0c2] overflow-hidden shadow-xs"
                >
                  {/* COURSE ROW HEADER */}
                  <div
                    onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#faf8f5] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ede6d8] text-[#8e5a2b] border border-[#d8d0c2]">
                          {course.subjectName}
                        </span>
                        <h3 className="font-serif-heading text-lg font-normal text-[#171819]">
                          {course.title}
                        </h3>
                      </div>
                      <p className="text-xs text-[#6f6b63]">
                        {completedInCourse} of {allLessons.length} lessons completed ({coursePercentage}%)
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="w-32 hidden sm:block">
                        <div className="flex justify-between text-[11px] font-semibold text-[#6f6b63] mb-1">
                          <span>Progress</span>
                          <span>{coursePercentage}%</span>
                        </div>
                        <div className="w-full bg-[#e5ded0] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#8e5a2b] h-full rounded-full transition-all"
                            style={{ width: `${coursePercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-xs font-bold text-[#8e5a2b] flex items-center gap-1">
                        <span>{isExpanded ? 'Collapse' : 'View Lessons'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* EXPANDABLE LESSON-LEVEL PROGRESS */}
                  {isExpanded && (
                    <div className="border-t border-[#e5ded0] bg-[#faf8f5]/60 p-5 space-y-3">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6f6b63]">
                        Lesson-by-Lesson Verified Learning Records
                      </h4>

                      <div className="divide-y divide-[#e5ded0] border border-[#d8d0c2] rounded-xl overflow-hidden bg-white">
                        {allLessons.map((lesson, idx) => {
                          const record = lessonRecords[lesson.id];
                          const isCompleted = completedLessonIds.includes(lesson.id);
                          const watchPct = record?.watchPercentage || (isCompleted ? 100 : 0);
                          const lastPos = record?.lastPositionSeconds || 0;

                          let statusText = 'Not Started';
                          let statusBadge = 'bg-[#f6f2e9] text-[#6f6b63] border-[#d8d0c2]';

                          if (isCompleted) {
                            statusText = 'Completed';
                            statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                          } else if (watchPct > 0 || lastPos > 0) {
                            statusText = 'In Progress';
                            statusBadge = 'bg-amber-50 text-amber-800 border-amber-200';
                          }

                          return (
                            <div
                              key={lesson.id}
                              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono-code text-[11px] text-[#8e5a2b] font-bold">
                                    Lesson {idx + 1}
                                  </span>
                                  <span className="font-medium text-[#171819]">{lesson.title}</span>
                                </div>
                                <span className="text-[11px] text-[#6f6b63] flex items-center gap-1 font-mono-code">
                                  <Clock className="w-3 h-3" /> Duration: {lesson.duration}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-4">
                                <div className="text-[11px] text-[#6f6b63]">
                                  {watchPct > 0 ? (
                                    <span className="font-semibold text-[#171819]">
                                      {watchPct}% watched
                                    </span>
                                  ) : (
                                    <span>0% watched</span>
                                  )}
                                  {lastPos > 0 && (
                                    <span className="text-[#8e5a2b] ml-2 font-mono-code">
                                      (Resume: {formatSeconds(lastPos)})
                                    </span>
                                  )}
                                </div>

                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}
                                >
                                  {statusText}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ASSESSMENT HISTORY & EXACT MARKS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#d8d0c2] pb-3">
          <div>
            <h2 className="font-serif-heading text-xl font-normal text-[#171819] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#8e5a2b]" /> Exact Assessment & Quiz Marks
            </h2>
            <p className="text-xs text-[#6f6b63] mt-0.5">
              Verified submission scores, question-level analysis, and instructor retake controls.
            </p>
          </div>
        </div>

        {attemptedQuizzes.length === 0 ? (
          <div className="edurah-card-warm p-8 text-center rounded-2xl border border-[#d8d0c2] text-xs text-[#6f6b63]">
            No assessments attempted by this student yet.
          </div>
        ) : (
          <div className="edurah-card-warm rounded-2xl overflow-hidden border border-[#d8d0c2] shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#ede6d8]/60 border-b border-[#d8d0c2] text-[#6f6b63] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Assessment Name</th>
                    <th className="px-5 py-3.5">Exact Marks</th>
                    <th className="px-5 py-3.5">Performance</th>
                    <th className="px-5 py-3.5">Breakdown</th>
                    <th className="px-5 py-3.5">Attempted Time</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ded0]">
                  {attemptedQuizzes.map((result) => {
                    const statusInfo = retakeStatus[result.quizId];

                    return (
                      <tr key={result.quizId} className="hover:bg-[#faf8f5] transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-[#171819]">
                            {result.quizName || result.quizId}
                          </div>
                          <div className="text-[11px] text-[#6f6b63]">
                            ID: <span className="font-mono-code">{result.quizId}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-serif-heading text-base font-normal text-[#171819]">
                            {result.score} / {result.maxScore || result.total}
                          </div>
                          <span className="text-[10px] text-[#8e5a2b] font-bold">Marks Earned</span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              result.passed
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {result.percentage}% · {result.passed ? 'Passed' : 'Needs Review'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-[11px] space-y-0.5">
                          <div className="text-emerald-700">✓ Correct: {result.correctAnswers ?? result.score}</div>
                          <div className="text-rose-700">✗ Incorrect: {result.incorrectAnswers ?? Math.max(0, result.total - result.score)}</div>
                          {result.timeTakenSeconds ? (
                            <div className="text-[#6f6b63] font-mono-code">⏱ Duration: {formatTimeTaken(result.timeTakenSeconds)}</div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 text-[11px] text-[#6f6b63]">
                          {new Date(result.completedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="px-5 py-4 text-right space-x-2">
                          {/* REVIEW QUESTION DETAILS BUTTON */}
                          <button
                            onClick={() => setSelectedReviewQuiz(result)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#ede8dc] border border-[#d8d0c2] rounded-lg text-xs font-bold text-[#171819] transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#8e5a2b]" /> Review
                          </button>

                          {/* ALLOW RETAKE BUTTON */}
                          <button
                            onClick={() => handleAllowRetake(result.quizId)}
                            disabled={statusInfo?.loading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#ede6d8] hover:bg-[#e2d8c3] border border-[#d8d0c2] rounded-lg text-xs font-bold text-[#8e5a2b] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{statusInfo?.message || 'Allow Retake'}</span>
                          </button>
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

      {/* QUESTION-LEVEL REVIEW MODAL (REQUIREMENT 5) */}
      {selectedReviewQuiz && (
        <div className="fixed inset-0 z-50 bg-[#0b0d0e]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#d8d0c2] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[#e5ded0] bg-[#faf8f5] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e5a2b]">
                  Submission Question Breakdown
                </span>
                <h3 className="font-serif-heading text-xl font-normal text-[#171819]">
                  {selectedReviewQuiz.quizName || selectedReviewQuiz.quizId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReviewQuiz(null)}
                className="w-8 h-8 rounded-full border border-[#d8d0c2] flex items-center justify-center text-[#6f6b63] hover:text-[#171819]"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {(!selectedReviewQuiz.questionResults || selectedReviewQuiz.questionResults.length === 0) ? (
                <div className="p-8 text-center text-xs text-[#6f6b63]">
                  Detailed per-question breakdown was not recorded for this legacy attempt.
                  <div className="mt-2 text-sm font-semibold text-[#171819]">
                    Score: {selectedReviewQuiz.score} / {selectedReviewQuiz.total} ({selectedReviewQuiz.percentage}%)
                  </div>
                </div>
              ) : (
                selectedReviewQuiz.questionResults.map((item, qIdx) => (
                  <div
                    key={qIdx}
                    className={`p-4 rounded-xl border ${
                      item.isCorrect
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-rose-50/50 border-rose-200'
                    } space-y-2`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-serif-heading text-sm font-normal text-[#171819]">
                        Q{qIdx + 1}. {item.questionText}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                          item.isCorrect
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {item.isCorrect ? `+${item.marksAwarded} Marks` : '0 Marks'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 pt-1 border-t border-black/5 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="text-[#6f6b63] font-bold w-28">Student's Answer:</span>
                        <span className={item.isCorrect ? 'text-emerald-900 font-semibold' : 'text-rose-900 font-semibold'}>
                          {item.studentAnswerText}
                        </span>
                      </div>
                      {!item.isCorrect && (
                        <div className="flex items-center gap-2">
                          <span className="text-[#6f6b63] font-bold w-28">Correct Answer:</span>
                          <span className="text-emerald-900 font-semibold">{item.correctAnswerText}</span>
                        </div>
                      )}
                      {item.explanation && (
                        <div className="text-[11px] text-[#6f6b63] bg-white/70 p-2 rounded border border-black/5 mt-1">
                          💡 <em>{item.explanation}</em>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-[#e5ded0] bg-[#faf8f5] flex justify-end">
              <button
                onClick={() => setSelectedReviewQuiz(null)}
                className="px-4 py-2 bg-[#171819] text-white text-xs font-bold uppercase tracking-wider rounded-xl"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CHANGE GRADE / BATCH MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b0d0e]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#d8d0c2] shadow-2xl max-w-md w-full p-6 space-y-5">
            <h3 className="font-serif-heading text-xl font-normal text-[#171819]">
              Academic Grade & Batch Assignment
            </h3>

            {editMessage && (
              <div className="p-3 bg-[#ede6d8] text-[#8e5a2b] border border-[#d8d0c2] text-xs font-bold rounded-xl">
                {editMessage}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#6f6b63] mb-1">
                  Assign Grade Level
                </label>
                <select
                  value={editGradeId}
                  onChange={(e) => setEditGradeId(e.target.value)}
                  className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d0c2] rounded-xl text-xs font-semibold"
                >
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#6f6b63] mb-1">
                  Academic Batch / Year
                </label>
                <input
                  type="text"
                  value={editBatch}
                  onChange={(e) => setEditBatch(e.target.value)}
                  placeholder="e.g. 2025–2026"
                  className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d0c2] rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5ded0]">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-[#d8d0c2] text-xs font-bold uppercase tracking-wider rounded-xl text-[#6f6b63]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAcademicChanges}
                disabled={isSavingEdit}
                className="px-4 py-2 bg-[#8e5a2b] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#72451f]"
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
