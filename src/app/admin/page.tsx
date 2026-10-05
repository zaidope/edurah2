'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContentService } from '@/lib/content';
import { AuthService } from '@/lib/auth';
import { Course, Quiz, UserProfile } from '@/types';
import { 
  Users, 
  GraduationCap,
  BookOpen, 
  Award, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck,
  FileQuestion,
  Layers,
  Sparkles
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      AuthService.getStudents(),
      AuthService.getTeachers(),
      ContentService.loadCourses(undefined, 'published'),
      ContentService.loadQuizzes(undefined, undefined, 'published'),
    ])
      .then(([studentData, teacherData, courseData, quizData]) => {
        if (!active) return;
        setStudents(studentData);
        setTeachers(teacherData);
        setCourses(courseData);
        setQuizzes(quizData);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load administration metrics.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const activeStudentsCount = students.filter(s => s.isActive).length;
  const activeTeachersCount = teachers.filter(t => t.isActive).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {loadError && <div role="alert" className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{loadError}</div>}
      {loading && <p className="text-xs text-[#6f6b63]">Loading institutional metrics…</p>}
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8d0c2] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] text-[11px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8e5a2b]" /> Platform Administration & Governance
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif-heading font-normal text-[#171819] tracking-tight mt-2">
            Institutional Oversight
          </h1>
          <p className="text-xs sm:text-sm text-[#6f6b63] mt-1 leading-relaxed">
            Central governance across multi-grade curricula, faculty assignments, cohort promotions, and assessments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/quiz-maker"
            className="edurah-btn-primary text-xs px-4 py-2.5 inline-flex items-center gap-2"
          >
            <FileQuestion className="w-4 h-4" /> PDF Quiz Compiler
          </Link>
          <Link
            href="/admin/students"
            className="edurah-btn-secondary text-xs px-4 py-2.5 inline-flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Student Roster
          </Link>
        </div>
      </div>

      {/* STATS METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Assigned Students', count: students.length, sub: `${activeStudentsCount} active accounts`, href: '/admin/students', icon: Users },
          { label: 'Faculty Educators', count: teachers.length, sub: `${activeTeachersCount} cohort leaders`, href: '/admin/teachers', icon: GraduationCap },
          { label: 'Curriculum Modules', count: courses.length, sub: `Active across Grades 1–10`, href: '/admin/courses', icon: BookOpen },
          { label: 'Published Assessments', count: quizzes.length, sub: 'Interactive syllabus tests', href: '/admin/quizzes', icon: Award }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              href={stat.href}
              className="edurah-card-warm p-6 rounded-2xl flex items-center justify-between group hover:border-[#d8a471] shadow-xs transition-all"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#8e5a2b] uppercase tracking-wider">{stat.label}</span>
                <div className="text-3xl font-serif-heading font-normal text-[#171819] group-hover:text-[#8e5a2b] transition-colors">
                  {stat.count}
                </div>
                <p className="text-[11px] text-[#6f6b63]">{stat.sub}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] flex items-center justify-center shrink-0 group-hover:bg-[#e4dcce] transition-colors">
                <Icon className="w-6 h-6" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* WORKFLOW SHORTCUTS & GRADE WORLDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SHORTCUTS */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-serif-heading font-normal text-[#171819] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8e5a2b]" /> Governance Workflows
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/admin/teachers"
              className="edurah-card-warm p-5 rounded-2xl hover:border-[#d8a471] shadow-xs space-y-2 group transition-all"
            >
              <div className="flex items-center justify-between text-[#8e5a2b]">
                <GraduationCap className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-serif-heading font-normal text-base text-[#171819]">Faculty Provisioning</h3>
              <p className="text-xs text-[#6f6b63] leading-relaxed">
                Assign educators to grade tiers, manage teaching credentials, and delegate curriculum ownership.
              </p>
            </Link>

            <Link
              href="/admin/students"
              className="edurah-card-warm p-5 rounded-2xl hover:border-[#d8a471] shadow-xs space-y-2 group transition-all"
            >
              <div className="flex items-center justify-between text-[#8e5a2b]">
                <Users className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-serif-heading font-normal text-base text-[#171819]">Student Cohort Promotion</h3>
              <p className="text-xs text-[#6f6b63] leading-relaxed">
                Promote students to next grade level while preserving historical completion records and scores.
              </p>
            </Link>

            <Link
              href="/admin/quiz-maker"
              className="edurah-card-warm p-5 rounded-2xl hover:border-[#d8a471] shadow-xs space-y-2 group transition-all"
            >
              <div className="flex items-center justify-between text-[#8e5a2b]">
                <FileQuestion className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-serif-heading font-normal text-base text-[#171819]">Assessment Compiler</h3>
              <p className="text-xs text-[#6f6b63] leading-relaxed">
                Upload question PDFs to automatically parse, edit, and publish interactive tests for any grade.
              </p>
            </Link>

            <Link
              href="/admin/progress"
              className="edurah-card-warm p-5 rounded-2xl hover:border-[#d8a471] shadow-xs space-y-2 group transition-all"
            >
              <div className="flex items-center justify-between text-[#8e5a2b]">
                <TrendingUp className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-serif-heading font-normal text-base text-[#171819]">Curriculum Analytics Matrix</h3>
              <p className="text-xs text-[#6f6b63] leading-relaxed">
                Inspect cross-grade completion statistics, student mastery metrics, and quiz results.
              </p>
            </Link>
          </div>
        </div>

        {/* GRADE WORLDS ARCHITECTURE */}
        <div className="edurah-card-warm p-6 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-base font-serif-heading font-normal text-[#171819] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8e5a2b]" /> Pedagogical Tiers
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#ede6d8]/60 border border-[#d8d0c2] space-y-1">
              <div className="flex items-center justify-between font-bold text-[#171819]">
                <span>Junior World (Grades 1–4)</span>
                <span className="text-[10px] bg-[#d8a471]/30 text-[#8e5a2b] font-bold px-2 py-0.5 rounded-full">Exploratory</span>
              </div>
              <p className="text-[11px] text-[#6f6b63] leading-relaxed">
                Warm parchment palette, floating educational stars & clouds, rounded shapes, and playful pedagogical metaphors.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#ede6d8]/60 border border-[#d8d0c2] space-y-1">
              <div className="flex items-center justify-between font-bold text-[#171819]">
                <span>Middle World (Grades 5–8)</span>
                <span className="text-[10px] bg-[#d8a471]/30 text-[#8e5a2b] font-bold px-2 py-0.5 rounded-full">Analytical</span>
              </div>
              <p className="text-[11px] text-[#6f6b63] leading-relaxed">
                Structured coordinate grids, planetary orbits, transitional typography, and rigorous STEM diagrams.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#ede6d8]/60 border border-[#d8d0c2] space-y-1">
              <div className="flex items-center justify-between font-bold text-[#171819]">
                <span>Senior World (Grades 8–10)</span>
                <span className="text-[10px] bg-[#0b0d0e] text-[#f6f2e9] font-bold px-2 py-0.5 rounded-full">Academic</span>
              </div>
              <p className="text-[11px] text-[#6f6b63] leading-relaxed">
                Obsidian dark theme, sine wave harmonics, restrained editorial typography, and university preparation focus.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
