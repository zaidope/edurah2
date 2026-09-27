'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import { AuthService } from '@/lib/auth';
import { UserProfile, Course, Quiz, AtRiskStudent, TopicMastery } from '@/types';
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  FileQuestion,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Table,
  TrendingDown,
  Clock,
  FileX,
  Target
} from 'lucide-react';

export default function TeacherDashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [atRiskList, setAtRiskList] = useState<AtRiskStudent[]>([]);
  const [weakestTopics, setWeakestTopics] = useState<TopicMastery[]>([]);
  const [loading, setLoading] = useState(true);

  const teacherGradeId = profile?.gradeId || 'grade-1';
  const gradeObj = ContentService.getGradeById(teacherGradeId);

  useEffect(() => {
    if (authLoading) return;
    async function loadData() {
      setLoading(true);
      try {
        const gradeStudents = await AuthService.getStudentsByGrade(teacherGradeId);
        const gradeCourses = ContentService.getCoursesByGrade(teacherGradeId);
        const gradeQuizzes = ContentService.getQuizzesByGrade(teacherGradeId);

        setStudents(gradeStudents);
        setCourses(gradeCourses);
        setQuizzes(gradeQuizzes);

        // Fetch at-risk students and topic mastery
        const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
        const { data: sessionData } = await token.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (accessToken) {
          const atRiskRes = await fetch(`/api/teacher/at-risk?gradeId=${teacherGradeId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (atRiskRes.ok) {
            const json = await atRiskRes.json();
            setAtRiskList(json.data?.students || []);
          }

          const analyticsRes = await fetch(`/api/teacher/analytics/topic-mastery?gradeId=${teacherGradeId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (analyticsRes.ok) {
            const json = await analyticsRes.json();
            setWeakestTopics(json.data?.weakestTopics || []);
          }
        }
      } catch (err) {
        console.error('Failed to load teacher dashboard analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [teacherGradeId, authLoading]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* FACULTY HERO BANNER */}
      <div className="bg-[#171819] border border-[#d8a471]/30 p-6 sm:p-8 text-[#f6f2e9] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#d8a471]" />

        <div className="space-y-2 relative z-10">
          <p className="edurah-eyebrow-dark">
            <span /> Faculty Workspace
          </p>
          <h1 className="font-serif-hero text-2xl sm:text-4xl font-normal text-white tracking-tight">
            Educator Hub · {gradeObj?.name || 'Assigned Grade'}
          </h1>
          <p className="text-xs sm:text-sm text-[#e9e4d7]/75 max-w-xl leading-relaxed">
            Welcome, <strong>{profile?.fullName || 'Faculty Member'}</strong>. Review enrolled cohort students, analyze academic integrity metrics, and track curriculum outcome mastery.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
          <Link
            href="/teacher/gradebook"
            className="px-5 py-3 bg-[#d8a471] hover:bg-[#e8b57c] text-[#172020] text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Table className="w-4 h-4 text-[#172020]" /> Weighted Gradebook
          </Link>
          <Link
            href="/teacher/quiz-maker"
            className="px-4 py-3 bg-[#f6f2e9]/10 hover:bg-[#f6f2e9]/20 text-[#f6f2e9] border border-[#d8d0c2]/30 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <FileQuestion className="w-4 h-4 text-[#d8a471]" /> PDF Quiz Maker
          </Link>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-[#d8d0c2] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#81512f] uppercase tracking-wider">Cohort Enrolled</span>
            <div className="font-serif-hero text-2xl sm:text-3xl text-[#171819]">{students.length}</div>
            <span className="text-[11px] text-[#706b63] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#81512f]" /> {gradeObj?.name}
            </span>
          </div>
          <div className="w-10 h-10 bg-[#f6f2e9] border border-[#d8d0c2] text-[#81512f] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 border border-[#d8d0c2] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#81512f] uppercase tracking-wider">Active Courses</span>
            <div className="font-serif-hero text-2xl sm:text-3xl text-[#171819]">{courses.length}</div>
            <span className="text-[11px] text-[#706b63] font-medium flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#81512f]" /> Curricula
            </span>
          </div>
          <div className="w-10 h-10 bg-[#f6f2e9] border border-[#d8d0c2] text-[#81512f] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 border border-[#d8d0c2] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#81512f] uppercase tracking-wider">Active Assessments</span>
            <div className="font-serif-hero text-2xl sm:text-3xl text-[#171819]">{quizzes.length}</div>
            <span className="text-[11px] text-[#706b63] font-medium flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#81512f]" /> Quizzes
            </span>
          </div>
          <div className="w-10 h-10 bg-[#f6f2e9] border border-[#d8d0c2] text-[#81512f] flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 border border-[#d8d0c2] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#c62828] uppercase tracking-wider">At-Risk Students</span>
            <div className="font-serif-hero text-2xl sm:text-3xl text-[#c62828]">{atRiskList.length}</div>
            <span className="text-[11px] text-[#706b63] font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#c62828]" /> Needs Attention
            </span>
          </div>
          <div className="w-10 h-10 bg-[#ffebee] border border-[#ffcdd2] text-[#c62828] flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* AT-RISK DETECTION PANEL (Task 4.4) */}
      <div className="bg-white border border-[#d8d0c2] overflow-hidden">
        <div className="p-5 border-b border-[#d8d0c2] bg-[#fcfbf9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#c62828] animate-pulse" />
              <p className="edurah-eyebrow">
                <span /> Automated At-Risk Early Warning
              </p>
            </div>
            <h2 className="font-serif-heading text-xl font-normal text-[#171819]">
              Students Requiring Academic Intervention ({atRiskList.length})
            </h2>
          </div>
          <Link
            href="/teacher/gradebook"
            className="text-xs font-bold uppercase tracking-wider text-[#81512f] hover:text-[#171819] transition-colors flex items-center gap-1"
          >
            Review In Gradebook <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {atRiskList.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#2e7d32] bg-[#f1f8e9] space-y-1">
            <CheckCircle2 className="w-6 h-6 text-[#2e7d32] mx-auto mb-1" />
            <p className="font-bold">Cohort in Excellent Standing</p>
            <p className="text-[11px] text-[#555048]">
              No students are currently flagged for inactivity, failing weighted grades, or missing work.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e8e2d5]">
            {atRiskList.map((item, idx) => (
              <div
                key={`${item.studentId}-${idx}`}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fff9f9] transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-xs text-[#171819]">{item.studentName}</span>
                    <span className="text-[10px] text-[#706b63] font-mono-code">{item.studentEmail}</span>
                    <span
                      className={`text-[9px] font-mono-code font-bold uppercase px-1.5 py-0.2 ${
                        item.riskLevel === 'high'
                          ? 'bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]'
                          : 'bg-[#fff8e1] text-[#f57f17] border border-[#ffe082]'
                      }`}
                    >
                      {item.riskLevel} Risk
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {item.reasonDetails.map((detail, dIdx) => (
                      <span
                        key={dIdx}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-[#f6f2e9] text-[#555048] border border-[#d8d0c2]"
                      >
                        {detail.includes('missing') ? (
                          <FileX className="w-3 h-3 text-[#c62828]" />
                        ) : detail.includes('activity') ? (
                          <Clock className="w-3 h-3 text-[#f57f17]" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-[#c62828]" />
                        )}
                        <span>{detail}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/teacher/students/${item.studentId}`}
                    className="px-3 py-1.5 bg-white hover:bg-[#ede8dc] text-[#171819] border border-[#d8d0c2] text-[11px] font-bold uppercase tracking-wider transition-colors"
                  >
                    View History
                  </Link>
                  <Link
                    href="/teacher/gradebook"
                    className="px-3 py-1.5 bg-[#81512f] hover:bg-[#683f23] text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Inspect Grades
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OUTCOME ANALYTICS & WEAKEST TOPICS (Task 4.5) */}
      <div className="bg-white border border-[#d8d0c2] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e8e2d5] pb-3 gap-2">
          <div>
            <p className="edurah-eyebrow">
              <span /> Curriculum Mastery Outcomes
            </p>
            <h2 className="font-serif-heading text-xl font-normal text-[#171819]">
              Cohort Topic Mastery & Weakest Focus Areas
            </h2>
          </div>
          <span className="text-[11px] text-[#706b63]">
            Aggregated question accuracy across student assessment attempts
          </span>
        </div>

        {weakestTopics.length === 0 ? (
          <p className="text-xs text-[#706b63] italic">No topic outcome statistics recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {weakestTopics.map((top, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#fcfbf9] border border-[#d8d0c2] space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono-code uppercase font-bold text-[#81512f]">
                      Topic Focus #{idx + 1}
                    </span>
                    <h3 className="font-bold text-xs text-[#171819] line-clamp-1" title={top.topic}>
                      {top.topic}
                    </h3>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold font-mono-code ${
                      top.accuracyPercent < 70
                        ? 'bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]'
                        : 'bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]'
                    }`}
                  >
                    {top.accuracyPercent}% Accuracy
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-[#e8e2d5] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        top.accuracyPercent < 70 ? 'bg-[#c62828]' : 'bg-[#81512f]'
                      }`}
                      style={{ width: `${top.accuracyPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#706b63] font-mono-code">
                    <span>{top.correctAnswers} / {top.totalAttempts} correct answers</span>
                    <span>{top.accuracyPercent < 70 ? 'Review Needed' : 'Solid Mastery'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STUDENT ROSTER PREVIEW */}
      <div className="bg-white border border-[#d8d0c2] overflow-hidden">
        <div className="p-5 border-b border-[#d8d0c2] bg-[#fcfbf9] flex items-center justify-between">
          <div>
            <p className="edurah-eyebrow">
              <span /> Grade Roster
            </p>
            <h2 className="font-serif-heading text-xl font-normal text-[#171819]">
              Enrolled Students ({students.length})
            </h2>
          </div>
          <Link
            href="/teacher/students"
            className="text-xs font-bold uppercase tracking-wider text-[#81512f] hover:text-[#171819] transition-colors flex items-center gap-1"
          >
            Manage Roster <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#706b63] space-y-2">
            <Users className="w-8 h-8 text-[#a59e93] mx-auto" />
            <p>No students enrolled in {gradeObj?.name} yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e8e2d5]">
            {students.slice(0, 5).map((student) => (
              <div key={student.id} className="p-4 flex items-center justify-between hover:bg-[#fbf9f5] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#171819] text-[#f6f2e9] text-xs font-bold flex items-center justify-center font-mono-code">
                    {student.fullName.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#171819] block">{student.fullName}</span>
                    <span className="text-[11px] text-[#706b63] font-mono-code block">{student.email} • ID: {student.studentId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#e2ede8] text-[#1b4337] border border-[#93c6ae]/40">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
