'use client';

import React, { useState } from 'react';
import { Settings, Download, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ContentService } from '@/lib/content';
import { ProgressService } from '@/lib/progress';

export default function AdminSettingsPage() {
  const [msg, setMsg] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const [courses, quizzes] = await Promise.all([
        ContentService.loadCourses(undefined, 'all'),
        ContentService.loadQuizzes(undefined, undefined, 'all'),
      ]);
      const data = {
        subjects: ContentService.getSubjects(),
        courses,
        quizzes,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edurah_content_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg('Production content JSON backup exported successfully.');
      setTimeout(() => setMsg(''), 3000);
    } catch (error: unknown) {
      setMsg(error instanceof Error ? error.message : 'Could not export production content.');
    } finally {
      setExporting(false);
    }
  };

  const handleResetProgress = () => {
    if (confirm('Reset all local user progress and quiz results?')) {
      ProgressService.resetAllProgress();
      setMsg('User progress tracking reset to zero.');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* HEADER */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-500" /> Platform Settings & Data Tools
        </h1>
        <p className="text-xs text-slate-600 mt-1">Export structured JSON content, manage progress tracking, and configure backup tools.</p>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {msg}
        </div>
      )}

      {/* EXPORT DATA */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Export Content Data</h3>
            <p className="text-xs text-slate-600 mt-0.5">Download complete structured JSON containing subjects, courses, chapters, lessons, and quizzes.</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" /> {exporting ? 'Exporting…' : 'Export JSON'}
          </button>
        </div>
      </div>

      {/* RESET USER PROGRESS */}
      <div className="bg-white p-6 rounded-xl border border-rose-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-rose-700 text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" /> Reset User Progress Logs
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">Clear local browser progress tracking, lesson completions, and quiz test scores.</p>
          </div>
          <button
            onClick={handleResetProgress}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4 text-white" /> Reset Progress
          </button>
        </div>
      </div>

    </div>
  );
}

