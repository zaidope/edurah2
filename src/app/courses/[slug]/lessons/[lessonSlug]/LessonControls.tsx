'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Course } from '@/types';
import { ProgressService } from '@/lib/progress';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

interface LessonControlsProps {
  lessonId: string;
  course: Course;
  nextLessonSlug?: string;
  prevLessonSlug?: string;
}

export default function LessonControls({
  lessonId,
  course,
  nextLessonSlug,
  prevLessonSlug
}: LessonControlsProps) {
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    setIsCompleted(ProgressService.isLessonCompleted(lessonId));
  }, [lessonId]);

  const handleToggle = () => {
    const newState = ProgressService.toggleLessonComplete(lessonId, course);
    setIsCompleted(newState);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      
      {/* PREV LESSON BUTTON */}
      {prevLessonSlug && (
        <Link
          href={`/courses/${course.slug}/lessons/${prevLessonSlug}`}
          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 shadow-xs"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" /> Prev
        </Link>
      )}

      {/* MARK COMPLETE BUTTON */}
      <button
        onClick={handleToggle}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-xs ${
          isCompleted
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>{isCompleted ? 'Completed ✓' : 'Mark as Complete'}</span>
      </button>

      {/* NEXT LESSON BUTTON */}
      {nextLessonSlug && (
        <Link
          href={`/courses/${course.slug}/lessons/${nextLessonSlug}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 shadow-xs"
        >
          <span>Next Lesson</span>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </Link>
      )}

    </div>
  );
}

