'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Course } from '@/types';
import { CheckCircle2, PlayCircle, ChevronLeft, BookOpen, X, List } from 'lucide-react';
import { ProgressService } from '@/lib/progress';

interface LessonSidebarProps {
  course: Course;
  currentLessonSlug: string;
}

export default function LessonSidebar({ course, currentLessonSlug }: LessonSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const progressPercent = ProgressService.getCourseProgress(course.id);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#fcfbf9] border-r border-[#d8d0c2] text-[#171819]">
      {/* HEADER */}
      <div className="p-4 border-b border-[#d8d0c2] space-y-3 bg-[#f6f2e9]">
        <Link
          href={`/courses/${course.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-[#81512f] hover:text-[#171819] font-bold uppercase tracking-wider"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Course Overview
        </Link>

        <div>
          <h3 className="font-serif-heading text-base font-normal text-[#171819] line-clamp-1">
            {course.title}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-[#706b63] mt-1.5 font-medium">
            <span>Progress</span>
            <span className="text-[#81512f] font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-[#ede8dc] h-1.5 overflow-hidden mt-1">
            <div
              className="bg-[#d8a471] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* CHAPTER & LESSON NAVIGATION TREE */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {course.chapters.map((chapter, idx) => (
          <div key={chapter.id} className="space-y-1.5">
            <div className="px-2 text-[10px] font-bold text-[#8a8376] uppercase tracking-wider flex items-center justify-between">
              <span>Unit 0{idx + 1}: {chapter.title}</span>
            </div>

            <div className="space-y-1">
              {chapter.lessons.map((lesson) => {
                const isActive = lesson.slug === currentLessonSlug;
                const isCompleted = ProgressService.isLessonCompleted(lesson.id);

                return (
                  <Link
                    key={lesson.id}
                    href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-start gap-2.5 p-2.5 border text-xs transition-all ${
                      isActive
                        ? 'bg-[#f3e5d4] border-[#d8a471] text-[#81512f] font-semibold border-l-2 border-l-[#81512f]'
                        : isCompleted
                        ? 'bg-white border-[#e8e2d5] text-[#555048] hover:bg-[#ede8dc]'
                        : 'bg-transparent border-transparent text-[#706b63] hover:bg-[#f6f2e9] hover:text-[#171819]'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-[#81512f] mt-0.5 flex-shrink-0" />
                    ) : (
                      <PlayCircle
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-[#81512f]' : 'text-[#a59e93]'}`}
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="line-clamp-2 leading-snug">{lesson.title}</div>
                      <div className="text-[10px] text-[#8a8376] mt-0.5">{lesson.duration}</div>
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
      <aside className="hidden lg:block w-80 h-[calc(100vh-4.5rem)] sticky top-18 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* MOBILE TRIGGER BAR */}
      <div className="lg:hidden sticky top-18 z-30 bg-[#f6f2e9] border-b border-[#d8d0c2] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#81512f]" />
          <span className="text-xs font-bold text-[#171819] truncate max-w-[200px]">{course.title}</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="text-xs font-bold text-[#81512f] flex items-center gap-1 px-2.5 py-1 bg-white border border-[#d8d0c2]"
        >
          <List className="w-3.5 h-3.5" /> Modules
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0b0d0e]/60 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] h-full bg-[#fcfbf9] z-10 shadow-2xl flex flex-col">
            <div className="p-3 border-b border-[#d8d0c2] flex justify-end bg-[#f6f2e9]">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 text-[#706b63] hover:text-[#171819]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">{sidebarContent}</div>
          </div>
        </div>
      )}
    </>
  );
}
