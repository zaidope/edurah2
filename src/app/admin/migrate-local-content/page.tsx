'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import {
  Database,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { INITIAL_SUBJECTS } from '@/content/subjects';
import { INITIAL_COURSES } from '@/content/courses';
import { INITIAL_QUIZZES } from '@/content/quizzes';

export default function MigrateLocalContentPage() {
  const { profile, loading } = useAuth();
  const [localCourses, setLocalCourses] = useState<any[]>([]);
  const [localQuizzes, setLocalQuizzes] = useState<any[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedCourses = localStorage.getItem('edurah_courses_data_v2');
        const storedQuizzes = localStorage.getItem('edurah_quizzes_data_v2');
        const courses = storedCourses ? JSON.parse(storedCourses) : INITIAL_COURSES;
        const quizzes = storedQuizzes ? JSON.parse(storedQuizzes) : INITIAL_QUIZZES;
        setLocalCourses(courses);
        setLocalQuizzes(quizzes);
      } catch (err) {
        console.error('Error reading localStorage:', err);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="p-8 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Restricted Administration Surface</h2>
        <p className="text-xs text-slate-500">Only institutional administrators can run database migrations.</p>
      </div>
    );
  }

  const handleMigrate = async () => {
    setIsMigrating(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setErrorMsg('Active session required. Please sign in again.');
        setIsMigrating(false);
        return;
      }

      const res = await fetch('/api/admin/import-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subjects: INITIAL_SUBJECTS,
          courses: localCourses,
          quizzes: localQuizzes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error?.message || 'Migration request failed.');
      } else {
        setResult(json.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred during content migration.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="border-b border-slate-200 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold mb-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> One-Time Database Rescue Tool
        </div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" /> Migrate Curriculum to Supabase Postgres
        </h1>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          This utility extracts courses, chapters, lessons, and quizzes stored in this browser's local cache and the initial curriculum seed, uploading them directly into relational Supabase database tables with strict Row Level Security.
        </p>
      </div>

      {/* DISCOVERED DATA SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Subjects</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{INITIAL_SUBJECTS.length}</div>
          <p className="text-[11px] text-slate-500">Foundational disciplines</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Courses Discovered</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{localCourses.length}</div>
          <p className="text-[11px] text-slate-500">Includes authored modules & chapters</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quizzes Discovered</span>
            <HelpCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{localQuizzes.length}</div>
          <p className="text-[11px] text-slate-500">Answer keys will be secured server-side</p>
        </div>
      </div>

      {/* RESULT / ERROR NOTICES */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {result && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Curriculum Successfully Migrated to Database!
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block">Subjects:</span>
              <strong className="text-slate-900 text-sm">{result.counts?.subjects || 0}</strong>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block">Courses:</span>
              <strong className="text-slate-900 text-sm">{result.counts?.courses || 0}</strong>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block">Chapters:</span>
              <strong className="text-slate-900 text-sm">{result.counts?.chapters || 0}</strong>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block">Lessons:</span>
              <strong className="text-slate-900 text-sm">{result.counts?.lessons || 0}</strong>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block">Quizzes:</span>
              <strong className="text-slate-900 text-sm">{result.counts?.quizzes || 0}</strong>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block">Questions:</span>
              <strong className="text-slate-900 text-sm">{result.counts?.questions || 0}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ACTION CARD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Execute Migration</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Clicking the button below will send all discovered local entities to the backend. The server will idempotently upsert them into the database. Slugs, IDs, and positions will be preserved to maintain existing course links and progress.
        </p>

        <button
          onClick={handleMigrate}
          disabled={isMigrating}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          {isMigrating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Migrating to Database...
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" /> Start Local &rarr; Postgres Migration
            </>
          )}
        </button>
      </div>
    </div>
  );
}
