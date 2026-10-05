'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import { ProgressService } from '@/lib/progress';
import CourseCard from '@/components/course/CourseCard';
import { Assignment, AssignmentSubmission, Certificate, Course, Quiz } from '@/types';
import { BookOpen, Award, ArrowRight, FolderCheck, ShieldCheck, ExternalLink } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedPage from '@/components/layout/AnimatedPage';

export default function MyLearningPage() {
  const { profile } = useAuth();
  const [progress, setProgress] = useState(ProgressService.getProgress());
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadError, setLoadError] = useState('');
  const [assignmentsList, setAssignmentsList] = useState<Assignment[]>([]);
  const [studentSubmissions, setStudentSubmissions] = useState<AssignmentSubmission[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    const profileId = profile?.id;
    const profileRole = profile?.role;
    const assignedGradeId = profile?.gradeId;
    if (!profileId) return;
    let active = true;
    async function loadStudentData() {
      try {
        const gradeId = profileRole === 'student' ? assignedGradeId : undefined;
        if (profileRole === 'student' && !gradeId) {
          throw new Error('Your account has no assigned grade. Contact an administrator.');
        }
        const [courseData, quizData, syncedProgress] = await Promise.all([
          ContentService.loadCourses(gradeId, 'published'),
          ContentService.loadQuizzes(gradeId, undefined, 'published'),
          ProgressService.syncFromSupabase(profileId),
        ]);
        if (!active) return;
        setCourses(courseData);
        setQuizzes(quizData);
        setProgress(syncedProgress);

        const { data: { session } } = await import('@/lib/supabase/client').then(m => m.supabase.auth.getSession());
        if (session?.access_token) {
          const asgRes = await fetch('/api/assignments', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (asgRes.ok) {
            const asgData = await asgRes.json();
            if (active) {
              setAssignmentsList(asgData.data?.assignments || []);
              setStudentSubmissions(asgData.data?.submissions || []);
            }
          }

          const certRes = await fetch('/api/certificates/student', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (certRes.ok) {
            const certData = await certRes.json();
            if (active) setCertificates(certData.data?.certificates || []);
          }
        }
      } catch (error: unknown) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load learning data.');
      }
    }

    void loadStudentData();
    return () => { active = false; };
  }, [profile]);

  const studentGradeId = profile?.gradeId;
  const gradeObj = studentGradeId ? ContentService.getGradeById(studentGradeId) : null;

  const visibleCourses = profile?.role === 'student' && studentGradeId
    ? courses.filter(course => course.gradeId === studentGradeId)
    : profile?.role === 'student' ? [] : courses;

  // Filter quiz results strictly to student's assigned grade
  const allQuizResults = Object.values(progress.quizResults);
  const quizResultsList = allQuizResults.filter(res => {
    const quizObj = quizzes.find(quiz => quiz.id === res.quizId);
    if (!quizObj) return false;
    if (profile?.role === 'student' && studentGradeId) {
      return quizObj.gradeId === studentGradeId;
    }
    return true;
  });

  return (
    <PageTransition>
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
          
          {/* HEADER */}
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] text-[11px] font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-[#d8a471]" />
              {gradeObj ? `${gradeObj.name} Curriculum Hub` : 'Curriculum & Mastery Hub'}
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif-hero font-normal text-[#171819] tracking-tight">
              My Academic Progress
            </h1>
            <p className="text-sm sm:text-base text-[#6f6b63] leading-relaxed">
              Track your enrolled course modules, syllabus completions, and assessment milestones.
            </p>
          </div>

          {loadError && <div role="alert" className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{loadError}</div>}

          {/* COURSES IN PROGRESS */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#d8d0c2] pb-4">
              <h2 className="text-2xl font-serif-heading font-normal text-[#171819]">
                {gradeObj ? `Courses for ${gradeObj.name}` : 'Enrolled Curricula'}
              </h2>
              <span className="text-xs font-semibold text-[#8e5a2b]">
                {visibleCourses.length} {visibleCourses.length === 1 ? 'Course' : 'Courses'} Active
              </span>
            </div>

            {visibleCourses.length === 0 ? (
              <div className="edurah-card-warm p-12 text-center rounded-2xl border border-[#d8d0c2] space-y-3">
                <BookOpen className="w-10 h-10 text-[#9d978c] mx-auto" />
                <h3 className="font-serif-heading text-lg font-normal text-[#171819]">No active courses enrolled</h3>
                <p className="text-xs text-[#6f6b63] max-w-sm mx-auto">
                  Explore available subjects and syllabus modules to begin learning.
                </p>
                <Link href="/courses" className="edurah-btn-primary text-xs px-5 py-2 inline-flex items-center gap-1.5">
                  Browse Courses <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>

          {/* QUIZ HISTORY */}
          <section className="space-y-6 pt-6 border-t border-[#d8d0c2]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif-heading font-normal text-[#171819] flex items-center gap-2.5">
                  <Award className="w-6 h-6 text-[#d8a471]" /> Assessment History & Exact Marks
                </h2>
                <p className="text-xs text-[#6f6b63] mt-1">
                  Verified assessment submissions for {gradeObj?.name || 'your curriculum'}.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#8e5a2b]">
                {quizResultsList.length} Recorded
              </span>
            </div>

            {quizResultsList.length === 0 ? (
              <div className="edurah-card-warm p-10 rounded-2xl border border-[#d8d0c2] text-center text-[#6f6b63] space-y-3">
                <Award className="w-10 h-10 text-[#9d978c] mx-auto" />
                <p className="text-xs sm:text-sm">No assessment attempts recorded yet for {gradeObj?.name || 'your account'}.</p>
                <Link href="/quizzes" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8e5a2b] hover:text-[#171819]">
                  Take an assessment check →
                </Link>
              </div>
            ) : (
              <div className="edurah-card-warm rounded-2xl border border-[#d8d0c2] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#ede6d8]/60 border-b border-[#d8d0c2] text-[#6f6b63] uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">Assessment Name</th>
                        <th className="p-4">Score</th>
                        <th className="p-4">Percentage</th>
                        <th className="p-4">Correct / Incorrect</th>
                        <th className="p-4">Time Taken</th>
                        <th className="p-4">Attempted</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5ded0]">
                      {quizResultsList.map((res, idx) => {
                        const quizObj = quizzes.find(quiz => quiz.id === res.quizId);
                        const formatTime = (secs?: number) => {
                          if (!secs || secs <= 0) return '—';
                          const m = Math.floor(secs / 60);
                          const s = secs % 60;
                          return `${m}m ${s}s`;
                        };

                        const correct = res.correctAnswers !== undefined ? res.correctAnswers : res.score;
                        const incorrect = res.incorrectAnswers !== undefined ? res.incorrectAnswers : (res.total - res.score);

                        return (
                          <tr key={idx} className="hover:bg-[#faf8f5] transition-colors">
                            <td className="p-4 font-semibold text-[#171819]">
                              <div>{quizObj?.title || res.quizName || res.quizId}</div>
                              <span className="text-[10px] text-[#6f6b63]">{gradeObj?.name}</span>
                            </td>
                            <td className="p-4 font-mono-code font-bold text-[#171819]">
                              {res.score} / {res.total}
                            </td>
                            <td className="p-4 font-mono-code font-bold text-[#8e5a2b]">
                              {res.percentage}%
                            </td>
                            <td className="p-4">
                              <span className="text-emerald-700 font-semibold">{correct} correct</span>
                              <span className="text-[#9d978c] mx-1">·</span>
                              <span className="text-rose-700 font-semibold">{incorrect} incorrect</span>
                            </td>
                            <td className="p-4 font-mono-code text-[#6f6b63]">
                              {formatTime(res.timeTakenSeconds)}
                            </td>
                            <td className="p-4 text-[#6f6b63]">
                              {new Date(res.completedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="p-4 text-right">
                              <Link
                                href={`/quizzes/${res.quizId}`}
                                className="px-3 py-1 rounded-lg bg-[#ede6d8] hover:bg-[#d8d0c2] text-[#8e5a2b] font-bold text-[11px] inline-flex items-center gap-1"
                              >
                                View Results
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* COURSE ASSIGNMENTS & PROJECT GRADES */}
          <section className="space-y-6 pt-6 border-t border-[#d8d0c2]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif-heading font-normal text-[#171819] flex items-center gap-2.5">
                  <FolderCheck className="w-6 h-6 text-[#d8a471]" /> Course Assignments & Project Grades
                </h2>
                <p className="text-xs text-[#6f6b63] mt-1">
                  Assigned coursework, rubric feedback, and graded project submissions.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#8e5a2b]">
                {assignmentsList.length} Active
              </span>
            </div>

            {assignmentsList.length === 0 ? (
              <div className="edurah-card-warm p-10 rounded-2xl border border-[#d8d0c2] text-center text-[#6f6b63] space-y-3">
                <FolderCheck className="w-10 h-10 text-[#9d978c] mx-auto" />
                <p className="text-xs sm:text-sm">No course assignments assigned yet for {gradeObj?.name || 'your curriculum'}.</p>
              </div>
            ) : (
              <div className="edurah-card-warm rounded-2xl border border-[#d8d0c2] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#ede6d8]/60 border-b border-[#d8d0c2] text-[#6f6b63] uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">Assignment Name</th>
                        <th className="p-4">Due Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Grade Awarded</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5ded0]">
                      {assignmentsList.map((asg, idx) => {
                        const sub = studentSubmissions.find(s => s.assignmentId === asg.id);
                        return (
                          <tr key={idx} className="hover:bg-[#faf8f5] transition-colors">
                            <td className="p-4 font-semibold text-[#171819]">
                              <div>{asg.title}</div>
                              <span className="text-[10px] text-[#6f6b63]">{asg.courseTitle || 'Curriculum Project'}</span>
                            </td>
                            <td className="p-4 text-[#6f6b63]">
                              {new Date(asg.dueAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                sub?.status === 'graded'
                                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                  : sub?.status === 'returned'
                                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                  : sub?.status === 'submitted'
                                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                                  : 'bg-[#ede6d8] text-[#8e5a2b]'
                              }`}>
                                {sub ? (sub.status === 'returned' ? 'Returned for Revision' : sub.status) : 'Open'}
                              </span>
                            </td>
                            <td className="p-4 font-mono-code font-bold text-[#171819]">
                              {sub?.score !== undefined ? `${sub.score} / ${asg.points}` : `— / ${asg.points}`}
                            </td>
                            <td className="p-4 text-right">
                              <Link
                                href={`/assignments/${asg.id}`}
                                className="px-3 py-1 rounded-lg bg-[#ede6d8] hover:bg-[#d8d0c2] text-[#8e5a2b] font-bold text-[11px] inline-flex items-center gap-1"
                              >
                                {sub ? 'View Submission' : 'Submit Assignment'}
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* ACADEMIC CERTIFICATES & ACCREDITATIONS */}
          <section className="space-y-6 pt-6 border-t border-[#d8d0c2]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif-heading font-normal text-[#171819] flex items-center gap-2.5">
                  <Award className="w-6 h-6 text-[#d8a471]" /> Conferred Academic Certificates
                </h2>
                <p className="text-xs text-[#6f6b63] mt-1">
                  Official cryptographically verified credentials awarded for 100% curriculum completion and passing standing.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#8e5a2b]">
                {certificates.length} Conferred
              </span>
            </div>

            {certificates.length === 0 ? (
              <div className="edurah-card-warm p-10 rounded-2xl border border-[#d8d0c2] text-center text-[#6f6b63] space-y-3">
                <Award className="w-10 h-10 text-[#9d978c] mx-auto" />
                <p className="text-xs sm:text-sm">
                  Certificates are automatically conferred upon completing 100% of course lessons with passing assessment scores.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-6 bg-white border border-[#d8d0c2] shadow-xs space-y-4 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#d8a471]" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono-code font-bold uppercase text-[#81512f] bg-[#f6f2e9] px-2 py-0.5 border border-[#d8d0c2]">
                          Serial: {cert.serial}
                        </span>
                        <h3 className="font-serif-heading text-lg font-normal text-[#171819] pt-1">
                          {cert.courseTitle || 'Curriculum Course'}
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono-code uppercase px-2 py-0.5 bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]">
                        <ShieldCheck className="w-3 h-3" /> Authentic
                      </span>
                    </div>

                    <div className="text-[11px] text-[#706b63]">
                      Conferred on {new Date(cert.issuedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>

                    <div className="pt-2 border-t border-[#e8e2d5] flex items-center justify-between">
                      <Link
                        href={`/verify/${cert.verificationToken}`}
                        target="_blank"
                        className="text-xs font-bold uppercase tracking-wider text-[#81512f] hover:text-[#171819] flex items-center gap-1 transition-colors"
                      >
                        Verify Credential <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </AnimatedPage>
    </PageTransition>
  );
}
