'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContentService } from '@/lib/content';
import { AuthService } from '@/lib/auth';
import { 
  Users, 
  Layers, 
  BookOpen, 
  Film, 
  Award, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck 
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    setStudents(AuthService.getDemoStudents());
    setSubjects(ContentService.getSubjects());
    setCourses(ContentService.getCourses());
    setQuizzes(ContentService.getQuizzes());
  }, []);

  const activeStudentsCount = students.filter(s => s.isActive).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Content & Student Management System
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">Admin Dashboard</h1>
          <p className="text-xs text-slate-600">Overview of 300+ student accounts, curriculum metrics, and system status.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs"
          >
            <Users className="w-4 h-4 text-white" /> Manage Students
          </Link>
        </div>
      </div>

      {/* STATS METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Enrolled Students', count: students.length, href: '/admin/students', icon: Users, color: 'text-blue-600' },
          { label: 'Active Accounts', count: activeStudentsCount, href: '/admin/students', icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Total Courses', count: courses.length, href: '/admin/courses', icon: BookOpen, color: 'text-blue-600' },
          { label: 'Active Quizzes', count: quizzes.length, href: '/admin/quizzes', icon: Award, color: 'text-amber-600' }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              href={stat.href}
              className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-slate-300 shadow-xs transition-colors"
            >
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className="text-3xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {stat.count}
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* QUICK ACTIONS & SYSTEM HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* QUICK MANAGEMENT SHORTCUTS */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" /> Quick Management Actions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/admin/students"
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 shadow-xs space-y-2 group"
            >
              <div className="flex items-center justify-between text-blue-600">
                <Users className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Provision Student Accounts</h3>
              <p className="text-xs text-slate-600">Create login credentials, manage 300+ students, and view individual progress.</p>
            </Link>

            <Link
              href="/admin/subjects"
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 shadow-xs space-y-2 group"
            >
              <div className="flex items-center justify-between text-blue-600">
                <Layers className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Subject Track Manager</h3>
              <p className="text-xs text-slate-600">Create, edit, or toggle featured status of learning domains.</p>
            </Link>

            <Link
              href="/admin/lessons"
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs space-y-2 group"
            >
              <div className="flex items-center justify-between text-emerald-600">
                <Film className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Lesson Video Editor</h3>
              <p className="text-xs text-slate-600">Attach YouTube embed links, learning objectives, and resources.</p>
            </Link>

            <Link
              href="/admin/quizzes"
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-amber-300 shadow-xs space-y-2 group"
            >
              <div className="flex items-center justify-between text-amber-600">
                <Award className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Quiz Builder Engine</h3>
              <p className="text-xs text-slate-600">Construct question banks, option choices, and explanations.</p>
            </Link>
          </div>
        </div>

        {/* SYSTEM INTEGRITY STATUS */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Security & DB Integrity
          </h2>

          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Student Auth System</span>
                <span className="text-emerald-700 font-bold">Supabase Auth</span>
              </div>
              <p className="text-[11px] text-slate-500">Public self-registration disabled</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Row Level Security</span>
                <span className="text-emerald-700 font-bold">RLS Active (PostgreSQL)</span>
              </div>
              <p className="text-[11px] text-slate-500">Strict student data isolation</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Progress Tracker</span>
                <span className="text-emerald-700 font-bold">Server-Side Sync</span>
              </div>
              <p className="text-[11px] text-slate-500">Cross-device lesson & quiz persistence</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

