'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import { AuthService } from '@/lib/auth';
import { UserProfile, Course, Quiz, AtRiskStudent, TopicMastery } from '@/types';
import { supabase } from '@/lib/supabase/client';
import {
  BookOpen,
  Users,
  Award,
  FileQuestion,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Table,
  TrendingDown,
  Clock,
  FileX,
} from 'lucide-react';

export default function TeacherDashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [atRiskList, setAtRiskList] = useState<AtRiskStudent[]>([]);
  const [weakestTopics, setWeakestTopics] = useState<TopicMastery[]>([]);
  const [recommendations, setRecommendations] = useState<Array<{ id: string; title: string; reason: string; priority: number; status: string }>>([]);
  const [recommendationBusy, setRecommendationBusy] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const teacherGradeId = profile?.gradeId || '';
  const gradeObj = ContentService.getGradeById(teacherGradeId);

  useEffect(() => {
    if (authLoading || !profile) return;
    let active = true;
    async function loadData() {
      setLoading(true);
      setLoadError('');
      try {
        if (!teacherGradeId) throw new Error('Your account has no assigned grade. Contact an administrator.');
        const gradeStudents = await AuthService.getStudentsByGrade(teacherGradeId);
        const [gradeCourses, gradeQuizzes] = await Promise.all([
          ContentService.loadCourses(teacherGradeId, 'published'),
          ContentService.loadQuizzes(teacherGradeId, undefined, 'published'),
        ]);

        if (!active) return;
        setStudents(gradeStudents);
        setCourses(gradeCourses);
        setQuizzes(gradeQuizzes);

        // Fetch at-risk students and topic mastery
        const { data: sessionData } = await supabase.auth.getSession();
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
        const { data: savedRecommendations, error: recommendationLoadError } = await supabase.from('rah_recommendations')
          .select('id,title,reason,priority,status')
          .eq('teacher_id', profile?.id || '')
          .order('created_at', { ascending: false })
          .limit(20);
        if (recommendationLoadError) setRecommendationError('RAH interventions are unavailable. Apply the RAH learning migration first.');
        else setRecommendations(savedRecommendations || []);
      } catch (error: unknown) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Failed to load teacher dashboard data.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void Promise.resolve().then(loadData);
    return () => { active = false; };
  }, [teacherGradeId, authLoading, profile]);

  async function generateInterventions() {
    setRecommendationBusy(true);
    setRecommendationError('');
    try {
      const { data, error } = await supabase.functions.invoke('rah-lms', { body: { mode: 'teacher_analysis' } });
      if (error) throw new Error(error.message || 'RAH analysis is unavailable.');
      if (data?.error) throw new Error(data.error);
      setRecommendations(data.recommendations || []);
    } catch (requestError) {
      setRecommendationError(requestError instanceof Error ? requestError.message : 'Could not generate interventions.');
    } finally {
      setRecommendationBusy(false);
    }
  }

  async function updateIntervention(id: string, status: 'acted' | 'dismissed') {
    const { error } = await supabase.from('rah_recommendations').update({ status }).eq('id', id).eq('teacher_id', profile?.id || '');
    if (error) {
      setRecommendationError('Could not save the intervention status.');
      return;
    }
    setRecommendations((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  }

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

      {loadError && <div role="alert" className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{loadError}</div>}
      {loading && <p className="text-xs text-[#706b63]">Loading production cohort data…</p>}

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
              No students are currently flagged for inactivity or low recorded quiz scores.
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

      <section className="space-y-4 border border-[#d8d0c2] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8e2d5] pb-4">
          <div>
            <p className="edurah-eyebrow"><span /> RAH CLASS INTERVENTIONS</p>
            <h2 className="mt-2 font-serif-heading text-xl font-normal">Evidence-based next steps</h2>
            <p className="mt-1 text-xs text-[#706b63]">Suggestions are based on recorded cohort lessons, quizzes, and RAH skill practice.</p>
          </div>
          <button onClick={generateInterventions} disabled={recommendationBusy} className="inline-flex items-center gap-2 rounded-lg bg-[#1e2e30] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
            <Sparkles className="h-4 w-4" /> {recommendationBusy ? 'Analysing saved evidence…' : 'Generate interventions'}
          </button>
        </div>
        {recommendationError && <p role="alert" className="text-xs text-rose-800">{recommendationError}</p>}
        {recommendations.length ? <div className="divide-y divide-[#e8e2d5]">
          {recommendations.map((item) => <article key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold">{item.title}</h3><span className="text-[10px] font-bold uppercase text-[#81512f]">Priority {item.priority}</span><span className="text-[10px] capitalize text-[#706b63]">{item.status}</span></div>
              <p className="mt-1 text-xs leading-relaxed text-[#555048]">{item.reason}</p>
            </div>
            {item.status === 'new' && <div className="flex gap-2">
              <button onClick={() => void updateIntervention(item.id, 'acted')} className="rounded-md border border-[#d8d0c2] px-3 py-2 text-xs font-bold text-[#81512f]">Mark acted</button>
              <button onClick={() => void updateIntervention(item.id, 'dismissed')} className="rounded-md px-3 py-2 text-xs font-semibold text-[#706b63]">Dismiss</button>
            </div>}
          </article>)}
        </div> : <p className="py-3 text-xs text-[#706b63]">No intervention records yet. Generate suggestions after your cohort has saved learning activity.</p>}
      </section>

      {/* RECORDED QUIZ AND QUESTION OUTCOMES */}
      <div className="bg-white border border-[#d8d0c2] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e8e2d5] pb-3 gap-2">
          <div>
            <p className="edurah-eyebrow">
              <span /> Recorded Assessment Outcomes
            </p>
            <h2 className="font-serif-heading text-xl font-normal text-[#171819]">
              Cohort Quiz and Question Accuracy
            </h2>
          </div>
          <span className="text-[11px] text-[#706b63]">
            Aggregated accuracy from saved student assessment attempts
          </span>
        </div>

        {weakestTopics.length === 0 ? (
          <p className="text-xs text-[#706b63] italic">No assessment outcome statistics recorded yet.</p>
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
                      Assessment Focus #{idx + 1}
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
                    <span>{top.accuracyPercent < 70 ? 'Review Needed' : 'Strong Results'}</span>
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
