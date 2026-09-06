'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Course } from '@/types';
import { CheckCircle2, PlayCircle, ChevronLeft, BookOpen, X } from 'lucide-react';
import { ProgressService } from '@/lib/progress';

interface LessonSidebarProps {
  course: Course;
  currentLessonSlug: string;
}

export default function LessonSidebar({ course, currentLessonSlug }: LessonSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const progressPercent = ProgressService.getCourseProgress(course.id);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-800">
      
      {/* HEADER */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50">
        <Link
          href={`/courses/${course.slug}`}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Course Overview
        </Link>

        <div>
          <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{course.title}</h3>
          <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
            <span>Course Progress</span>
            <span className="text-blue-600 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* CHAPTER & LESSON NAVIGATION TREE */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {course.chapters.map((chapter, idx) => (
          <div key={chapter.id} className="space-y-1.5">
            <div className="px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Mod 0{idx + 1}: {chapter.title}</span>
            </div>

            <div className="space-y-1">
              {chapter.lessons.map(lesson => {
                const isActive = lesson.slug === currentLessonSlug;
                const isCompleted = ProgressService.isLessonCompleted(lesson.id);

                return (
                  <Link
                    key={lesson.id}
                    href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold border-l-2 border-l-blue-600 shadow-xs'
                        : isCompleted
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <PlayCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="line-clamp-2 leading-snug">{lesson.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{lesson.duration}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

    </div>
  );

  return (
    <>
      {/* DESKTOP PERSISTENT SIDEBAR */}
      <aside className="hidden lg:block w-80 h-[calc(100vh-4rem)] sticky top-16 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* MOBILE TRIGGER BAR */}
      <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center gap-2 text-xs font-medium text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
        >
          <BookOpen className="w-4 h-4 text-slate-600" />
          <span>Course Navigation</span>
        </button>
        <span className="text-xs text-slate-600">
          Progress: <strong className="text-blue-600">{progressPercent}%</strong>
        </span>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-4/5 max-w-sm h-full bg-white shadow-xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
              <span className="font-bold text-sm text-slate-900">Course Navigation</span>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

