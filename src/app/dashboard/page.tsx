'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import { Course, Quiz, QuizResult } from '@/types';
import { ProgressService } from '@/lib/progress';
import { getThemeForGrade } from '@/lib/gradeTheme';
import GradeWorldEnvironment from '@/components/grades/GradeWorldEnvironment';
import CourseCard from '@/components/course/CourseCard';
import SearchModal from '@/components/search/SearchModal';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedPage from '@/components/layout/AnimatedPage';
import {
  BookOpen,
  PlayCircle,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { profile, loading } = useAuth();
  const [progress, setProgress] = useState(ProgressService.getProgress());
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [assessmentTab, setAssessmentTab] = useState<'available' | 'upcoming' | 'completed'>('available');

  // Authenticate guard
  useEffect(() => {
    if (!loading && !profile) {
      router.push('/login');
    }
  }, [profile, loading, router]);

  useEffect(() => {
    if (!profile?.id) return;
    let active = true;
    ProgressService.syncFromSupabase(profile.id).then((syncedProgress) => {
      if (active) setProgress(syncedProgress);
    });
    return () => { active = false; };
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!profile.gradeId) throw new Error('Your account has no assigned grade. Contact an administrator.');
        return Promise.all([
          ContentService.loadCourses(profile.gradeId, 'published'),
          ContentService.loadQuizzes(profile.gradeId, undefined, 'published'),
        ]);
      })
      .then(([loadedCourses, loadedQuizzes]) => {
        if (!active) return;
        setCourses(loadedCourses);
        setQuizzes(loadedQuizzes);
      })
      .catch((error: unknown) => {
        if (active) setCatalogError(error instanceof Error ? error.message : 'Unable to load your grade curriculum.');
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => { active = false; };
  }, [profile?.id, profile?.gradeId]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f2e9]">
        <div className="w-8 h-8 rounded-full border-2 border-[#d8a471] border-t-transparent animate-spin" />
      </div>
    );
  }

  const studentGradeId = profile.gradeId || '';
  const gradeObj = ContentService.getGradeById(studentGradeId);
  const theme = getThemeForGrade(studentGradeId);

  // DYNAMIC FILTERING: ONLY courses and quizzes for the student's assigned grade!
  const studentFirstName = profile.fullName ? profile.fullName.split(' ')[0] : 'Student';

  // Determine continue learning target
  const lastActive = progress.lastViewedLesson;
  const continueCourse = courses.find((c) => c.slug === lastActive?.courseSlug) || courses[0];
  const continueLesson = continueCourse?.chapters[0]?.lessons[0];
  const continueCourseProgress = continueCourse ? ProgressService.getCourseProgress(continueCourse.id) : 0;

  const formatSeconds = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Dynamic progress calculations (accurate active lessons formula)
  const overallPercentage = ProgressService.getOverallProgress(courses);
  const totalCompletedLessons = Object.keys(progress.completedLessons).filter((lessonId) => {
    return courses.some((c) => c.chapters.some((ch) => ch.lessons.some((l) => l.id === lessonId && (l.isPublished ?? true))));
  }).length;
  const totalPassedQuizzes = Object.values(progress.quizResults).filter((q) => {
    const quizObj = quizzes.find((quiz) => quiz.id === q.quizId);
    return quizObj?.gradeId === studentGradeId && q.passed;
  }).length;

  // Categorize assessments into Available, Upcoming, and Completed
  const now = new Date();
  const completedAssessments: { quiz: Quiz; result: QuizResult }[] = [];
  const availableAssessments: Quiz[] = [];
  const upcomingAssessments: Quiz[] = [];

  for (const quiz of quizzes) {
    const result = progress.quizResults[quiz.id];
    if (result) {
      completedAssessments.push({ quiz, result });
      return;
    }

    let isUpcoming = false;
    let isClosed = false;

    if (quiz.startDate) {
      const startStr = `${quiz.startDate}T${quiz.startTime || '00:00'}:00`;
      const startObj = new Date(startStr);
      if (!isNaN(startObj.getTime()) && now < startObj) {
        isUpcoming = true;
      }
    }

    if (quiz.deadlineDate) {
      const deadlineStr = `${quiz.deadlineDate}T${quiz.deadlineTime || '23:59'}:59`;
      const deadlineObj = new Date(deadlineStr);
      if (!isNaN(deadlineObj.getTime()) && now > deadlineObj) {
        isClosed = true;
      }
    }

    if (isClosed) continue;
    if (isUpcoming) {
      upcomingAssessments.push(quiz);
    } else {
      availableAssessments.push(quiz);
    }
  }

  return (
    <GradeWorldEnvironment tier={theme.tier}>
      <PageTransition>
        <AnimatedPage>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-10">
            
            {/* TOP IDENTIFICATION & GREETING BAR */}
            <div
              className={`p-6 sm:p-8 ${theme.cardSurface} shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors rounded-2xl`}
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${theme.accentBadge}`}>
                    {gradeObj?.name} · {theme.tierTag}
                  </span>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                    Batch: {profile.academicBatch || 'Not assigned'}
                  </span>
                  {profile.classGroup && (
                    <span className="text-[11px] text-[#706b63] font-medium">
                      • {profile.classGroup}
                    </span>
                  )}
                </div>

                <h1 className="font-serif-hero text-3xl sm:text-4xl font-normal text-current tracking-tight">
                  Welcome back, <span className={theme.accentText}>{studentFirstName}</span>.
                </h1>

                <p className="text-xs sm:text-sm opacity-80 leading-relaxed max-w-lg">
                  {theme.themeSubtitle}
                </p>
              </div>

              {/* SEARCH TRIGGER */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#f6f2e9] hover:bg-[#ede8dc] text-[#171819] text-xs font-bold uppercase tracking-wider border border-[#d8d0c2] rounded-xl transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-[#81512f]" />
                  <span>Search Lessons</span>
                </button>
              </div>
            </div>

            {catalogError && <div role="alert" className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{catalogError}</div>}
            {catalogLoading && <p className="text-xs text-[#706b63]">Loading your published curriculum…</p>}

            {/* CONTINUE LEARNING SECTION */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8e5a2b]">
                <PlayCircle className="w-4 h-4 text-[#8e5a2b]" />
                <h2>Continue Learning</h2>
              </div>

              {continueCourse && continueLesson ? (
                <div
                  className={`p-6 sm:p-8 ${theme.heroSurface} overflow-hidden relative flex flex-col md:flex-row items-center justify-between gap-8 rounded-3xl border border-[#d8d0c2] shadow-sm`}
                >
                  <div className="space-y-4 max-w-xl relative z-10 text-left flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-black/15 backdrop-blur-xs border border-current/20 rounded-full inline-block">
                        {continueCourse.subjectName}
                      </span>
                      <span className="text-xs opacity-75 font-medium">
                        Resume from where you left off
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="font-serif-heading text-2xl sm:text-3xl font-normal leading-snug">
                        {continueCourse.title}
                      </h3>
                      <p className="text-xs sm:text-sm opacity-90 font-medium">
                        Current Lesson:{' '}
                        <strong className="underline underline-offset-4">
                          {lastActive?.title || continueLesson.title}
                        </strong>
                      </p>
                    </div>

                    {/* PROGRESS & EXACT RESUME POSITION METRICS */}
                    <div className="space-y-2 pt-1 max-w-md">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        <span>Course Progress</span>
                        <span>{continueCourseProgress}%</span>
                      </div>
                      <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden border border-white/20">
                        <div
                          className="bg-[#d8a471] h-full transition-all duration-500 rounded-full"
                          style={{ width: `${Math.max(continueCourseProgress, 8)}%` }}
                        />
                      </div>

                      {lastActive?.lastPositionSeconds ? (
                        <div className="flex items-center gap-2 text-xs pt-1 font-mono-code">
                          <Clock className="w-3.5 h-3.5 text-[#d8a471]" />
                          <span>
                            Resume at:{' '}
                            <strong className="text-base font-bold underline">
                              {formatSeconds(lastActive.lastPositionSeconds)}
                            </strong>
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* RESUME CTA BUTTON */}
                    <div className="pt-2">
                      <Link
                        href={`/courses/${continueCourse.slug}/lessons/${lastActive?.lessonSlug || continueLesson.slug}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#171819] hover:bg-[#0b0d0e] text-[#f6f2e9] text-xs font-bold uppercase tracking-wider rounded-xl border border-[#171819] transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
                      >
                        <span>Continue Learning</span>
                        <PlayCircle className="w-4 h-4 text-[#d8a471]" />
                      </Link>
                    </div>
                  </div>

                  {/* THUMBNAIL */}
                  <div className="relative w-full md:w-80 aspect-video rounded-2xl overflow-hidden border border-current/20 shadow-lg flex-shrink-0 bg-black/10">
                    <img
                      src={continueCourse.thumbnail}
                      alt={continueCourse.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className={`p-8 ${theme.cardSurface} text-center space-y-3 rounded-2xl`}>
                  <BookOpen className="w-10 h-10 text-[#a59e93] mx-auto" />
                  <h3 className="font-serif-heading text-xl text-current">No Courses Enrolled in {gradeObj?.name} Yet</h3>
                  <p className="text-xs opacity-75 max-w-sm mx-auto">
                    Courses for your grade will appear as soon as faculty publishes them.
                  </p>
                </div>
              )}
            </section>

            {/* OVERVIEW PROGRESS SNAPSHOT */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className={`p-5 ${theme.cardSurface} rounded-2xl`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#81512f] block">
                  Overall Learning Progress
                </span>
                <div className="font-serif-hero text-3xl sm:text-4xl text-current mt-1">
                  {overallPercentage}%
                </div>
                <p className="text-xs opacity-75 mt-1">Calculated from verified completed lessons</p>
              </div>

              <div className={`p-5 ${theme.cardSurface} rounded-2xl`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#81512f] block">
                  Lessons Completed
                </span>
                <div className="font-serif-hero text-3xl sm:text-4xl text-current mt-1">
                  {totalCompletedLessons}
                </div>
                <p className="text-xs opacity-75 mt-1">Video lectures watched &gt; 90%</p>
              </div>

              <div className={`p-5 ${theme.cardSurface} rounded-2xl`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#81512f] block">
                  Assessments Completed
                </span>
                <div className="font-serif-hero text-3xl sm:text-4xl text-current mt-1">
                  {completedAssessments.length}
                </div>
                <p className="text-xs opacity-75 mt-1">{totalPassedQuizzes} met passing threshold</p>
              </div>
            </div>

            <section className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-[#1e2e30] bg-[#1e2e30] p-6 text-[#f6f2e9] sm:flex-row sm:items-center sm:p-8">
              <div className="max-w-2xl space-y-2">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#d8a471]"><Sparkles className="h-3.5 w-3.5" /> RAH learning companion</p>
                <h2 className="font-serif-heading text-2xl font-normal">A useful next step, right when you need one.</h2>
                <p className="text-sm leading-relaxed text-[#d2d4cf]">Ask about a lesson, practise a tricky skill, or explain what you know out loud.</p>
              </div>
              <Link href="/rah" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#d8a471] px-5 py-3 text-xs font-bold text-[#171819] transition-colors hover:bg-[#e8b57c]">
                Learn with RAH <ArrowRight className="h-4 w-4" />
              </Link>
            </section>

            {/* MY COURSES SECTION */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#d8d0c2] pb-4">
                <div>
                  <p className="edurah-eyebrow">
                    <span /> My Courses
                  </p>
                  <h2 className="font-serif-heading text-2xl sm:text-3xl font-normal text-current">
                    Available Courses for {gradeObj?.name} ({courses.length})
                  </h2>
                </div>
                <Link
                  href="/courses"
                  className="text-xs font-bold uppercase tracking-wider text-[#81512f] hover:text-current transition-colors flex items-center gap-1"
                >
                  View Full Catalog <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {courses.length === 0 ? (
                <div className={`p-10 ${theme.cardSurface} text-center space-y-2 rounded-2xl`}>
                  <BookOpen className="w-8 h-8 text-[#a59e93] mx-auto" />
                  <p className="text-xs text-[#706b63]">No courses published for {gradeObj?.name} yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </section>

            {/* ASSESSMENTS SECTION */}
            <section className="space-y-6 pt-4 border-t border-[#d8d0c2]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="edurah-eyebrow">
                    <span /> Evaluative Checks
                  </p>
                  <h2 className="font-serif-heading text-2xl sm:text-3xl font-normal text-current">
                    Assessments for {gradeObj?.name}
                  </h2>
                </div>

                {/* ASSESSMENT CATEGORY TABS */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#ede6d8] border border-[#d8d0c2] text-xs font-bold">
                  <button
                    onClick={() => setAssessmentTab('available')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      assessmentTab === 'available'
                        ? 'bg-white text-[#171819] shadow-xs'
                        : 'text-[#6f6b63] hover:text-[#171819]'
                    }`}
                  >
                    Available Now ({availableAssessments.length})
                  </button>
                  <button
                    onClick={() => setAssessmentTab('upcoming')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      assessmentTab === 'upcoming'
                        ? 'bg-white text-[#171819] shadow-xs'
                        : 'text-[#6f6b63] hover:text-[#171819]'
                    }`}
                  >
                    Upcoming ({upcomingAssessments.length})
                  </button>
                  <button
                    onClick={() => setAssessmentTab('completed')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      assessmentTab === 'completed'
                        ? 'bg-white text-[#171819] shadow-xs'
                        : 'text-[#6f6b63] hover:text-[#171819]'
                    }`}
                  >
                    Completed ({completedAssessments.length})
                  </button>
                </div>
              </div>

              {/* TAB 1: CURRENTLY AVAILABLE */}
              {assessmentTab === 'available' && (
                <div>
                  {availableAssessments.length === 0 ? (
                    <div className={`p-8 ${theme.cardSurface} text-center space-y-2 rounded-2xl`}>
                      <CheckCircle2 className="w-8 h-8 text-[#16a34a] mx-auto" />
                      <p className="text-xs text-[#6f6b63]">You have caught up on all currently open assessments!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {availableAssessments.map((quiz) => (
                        <div
                          key={quiz.id}
                          className={`p-6 ${theme.cardSurface} flex flex-col justify-between space-y-4 rounded-2xl border border-[#d8d0c2] shadow-xs hover:border-[#d8a471] transition-all`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#81512f]">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Available Now
                              </span>
                              <span>Pass {quiz.passingScore}%</span>
                            </div>
                            <h3 className="font-serif-heading text-lg font-normal text-current leading-snug">
                              {quiz.title}
                            </h3>
                            <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">
                              {quiz.description}
                            </p>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-current/10">
                            {quiz.deadlineDate && (
                              <div className="text-[11px] font-semibold text-rose-800 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Deadline: {quiz.deadlineDate} {quiz.deadlineTime ? `at ${quiz.deadlineTime}` : ''}</span>
                              </div>
                            )}
                            <Link
                              href={`/quizzes/${quiz.id}`}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#8e5a2b] hover:bg-[#73471f] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-xs"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Start Assessment</span>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: UPCOMING ASSESSMENTS */}
              {assessmentTab === 'upcoming' && (
                <div>
                  {upcomingAssessments.length === 0 ? (
                    <div className={`p-8 ${theme.cardSurface} text-center space-y-2 rounded-2xl`}>
                      <Clock className="w-8 h-8 text-[#a59e93] mx-auto" />
                      <p className="text-xs text-[#6f6b63]">No scheduled future assessments at this time.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {upcomingAssessments.map((quiz) => (
                        <div
                          key={quiz.id}
                          className={`p-6 ${theme.cardSurface} flex flex-col justify-between space-y-4 rounded-2xl border border-[#d8d0c2] shadow-xs`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                Scheduled Upcoming
                              </span>
                              <span className="text-[#6f6b63]">{quiz.questions.length} Questions</span>
                            </div>
                            <h3 className="font-serif-heading text-lg font-normal text-current leading-snug">
                              {quiz.title}
                            </h3>
                            <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">
                              {quiz.description}
                            </p>
                          </div>

                          <div className="space-y-2 pt-3 border-t border-current/10">
                            <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Opens on {quiz.startDate} at {quiz.startTime || '00:00'}</span>
                            </div>
                            <Link
                              href={`/quizzes/${quiz.id}`}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#ede6d8] text-[#8e5a2b] text-xs font-bold uppercase tracking-wider rounded-xl border border-[#d8d0c2]"
                            >
                              <span>View Schedule Details</span>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: COMPLETED ASSESSMENTS */}
              {assessmentTab === 'completed' && (
                <div>
                  {completedAssessments.length === 0 ? (
                    <div className={`p-8 ${theme.cardSurface} text-center space-y-2 rounded-2xl`}>
                      <Award className="w-8 h-8 text-[#a59e93] mx-auto" />
                      <p className="text-xs text-[#6f6b63]">No assessments completed yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {completedAssessments.map(({ quiz, result }) => (
                        <div
                          key={quiz.id}
                          className={`p-6 ${theme.cardSurface} flex flex-col justify-between space-y-4 rounded-2xl border border-[#d8d0c2] shadow-xs`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span className={`px-2.5 py-0.5 rounded-full ${
                                result.passed
                                  ? 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]'
                                  : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                              }`}>
                                {result.passed ? 'Completed ✓' : 'Completed'}
                              </span>
                              <span className="font-mono-code font-bold text-sm text-[#8e5a2b]">
                                {result.percentage}%
                              </span>
                            </div>
                            <h3 className="font-serif-heading text-lg font-normal text-current leading-snug">
                              {quiz.title}
                            </h3>
                            <div className="text-xs text-[#6f6b63] space-y-1">
                              <div>Score: <strong className="text-[#171819] font-mono-code">{result.score} / {result.total}</strong> marks</div>
                              <div>Attempted: {new Date(result.completedAt).toLocaleDateString()}</div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-current/10">
                            <Link
                              href={`/quizzes/${quiz.id}`}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-[#ede6d8] text-[#171819] text-xs font-bold uppercase tracking-wider rounded-xl border border-[#d8d0c2] transition-colors"
                            >
                              <Award className="w-3.5 h-3.5 text-[#8e5a2b]" />
                              <span>View Result Breakdown</span>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* SEARCH MODAL */}
            {isSearchOpen && (
              <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            )}

          </div>
        </AnimatedPage>
      </PageTransition>
    </GradeWorldEnvironment>
  );
}
