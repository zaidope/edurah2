'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Course } from '@/types';
import { ProgressService } from '@/lib/progress';
import { CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, PlayCircle } from 'lucide-react';

interface LessonControlsProps {
  lessonId: string;
  lessonType?: 'video' | 'reading' | 'assignment' | 'quiz';
  course: Course;
  nextLessonSlug?: string;
  prevLessonSlug?: string;
}

export default function LessonControls({
  lessonId,
  lessonType = 'video',
  course,
  nextLessonSlug,
  prevLessonSlug,
}: LessonControlsProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [watchPct, setWatchPct] = useState(0);

  useEffect(() => {
    setIsCompleted(ProgressService.isLessonCompleted(lessonId));
    const record = ProgressService.getLessonRecord(lessonId);
    if (record) {
      setWatchPct(record.watchPercentage || 0);
    }
  }, [lessonId]);

  const handleToggle = () => {
    // Only allowed for reading/assignment types
    if (lessonType === 'video') return;
    const newState = ProgressService.toggleLessonComplete(lessonId, course);
    setIsCompleted(newState);
  };

  const isVideo = lessonType === 'video';

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* PREV LESSON BUTTON */}
      {prevLessonSlug && (
        <Link
          href={`/courses/${course.slug}/lessons/${prevLessonSlug}`}
          className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-[#ede8dc] border border-[#d8d0c2] text-xs font-bold uppercase tracking-wider text-[#171819] transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-[#81512f]" /> Prev
        </Link>
      )}

      {/* TASK 2.4: VIDEO COMPLETION IS SERVER-CONTROLLED */}
      {isVideo ? (
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider border rounded-md select-none transition-all ${
            isCompleted
              ? 'bg-[#e2edd8] text-[#365314] border-[#a3e635]/60'
              : 'bg-[#f5ebd7] text-[#854d0e] border-[#fde047]/60'
          }`}
        >
          <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'text-[#365314]' : 'text-[#854d0e]'}`} />
          <span>
            {isCompleted
              ? 'Lesson Completed (90%+ Watched) ✓'
              : `Watched ${watchPct}% — 90% Required`}
          </span>
        </div>
      ) : (
        /* MANUAL COMPLETE FOR READING LESSONS */
        <button
          onClick={handleToggle}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
            isCompleted
              ? 'bg-[#f3e5d4] text-[#81512f] border-[#d8a471]/60'
              : 'bg-[#171819] hover:bg-[#0b0d0e] text-[#f6f2e9] border-[#171819]'
          }`}
        >
          <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'text-[#81512f]' : 'text-[#d8a471]'}`} />
          <span>{isCompleted ? 'Completed ✓' : 'Mark as Complete'}</span>
        </button>
      )}

      {/* NEXT LESSON BUTTON */}
      {nextLessonSlug && (
        <Link
          href={`/courses/${course.slug}/lessons/${nextLessonSlug}`}
          className="inline-flex items-center gap-1 px-4 py-2 bg-[#81512f] hover:bg-[#6b4225] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
