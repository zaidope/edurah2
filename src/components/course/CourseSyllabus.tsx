'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Chapter } from '@/types';
import { CheckCircle2, PlayCircle, ChevronDown, ChevronUp, Clock, FileText, Award } from 'lucide-react';
import { ProgressService } from '@/lib/progress';

interface CourseSyllabusProps {
  chapters: Chapter[];
  courseSlug: string;
}

export default function CourseSyllabus({ chapters, courseSlug }: CourseSyllabusProps) {
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    chapters.forEach((ch) => {
      initial[ch.id] = true;
    });
    return initial;
  });

  const toggleChapter = (id: string) => {
    setOpenChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {chapters.map((chapter, index) => {
        const isOpen = openChapters[chapter.id];
        const completedCount = chapter.lessons.filter((l) => ProgressService.isLessonCompleted(l.id)).length;

        return (
          <div key={chapter.id} className="bg-white border border-[#d8d0c2] overflow-hidden">
            {/* CHAPTER HEADER */}
            <button
              onClick={() => toggleChapter(chapter.id)}
              className="w-full p-4 sm:p-5 flex items-center justify-between bg-[#fbf9f5] hover:bg-[#f6f2e9] transition-colors text-left focus:outline-none cursor-pointer border-b border-[#e8e2d5]"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-7 h-7 bg-[#171819] text-[#f6f2e9] text-xs font-bold flex items-center justify-center font-mono-code">
                  {index + 1 < 10 ? `0${index + 1}` : index + 1}
                </span>
                <div>
                  <h4 className="font-serif-heading text-base font-normal text-[#171819] leading-snug">
                    {chapter.title}
                  </h4>
                  <p className="text-xs text-[#706b63] mt-0.5">{chapter.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#81512f] font-semibold">
                  {completedCount}/{chapter.lessons.length} Completed
                </span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#706b63]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#706b63]" />
                )}
              </div>
            </button>

            {/* LESSONS LIST */}
            {isOpen && (
              <div className="divide-y divide-[#e8e2d5] bg-white">
                {chapter.lessons.map((lesson) => {
                  const isCompleted = ProgressService.isLessonCompleted(lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      className="p-3.5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#fcfbf9] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-[#81512f] flex-shrink-0" />
                        ) : (
                          <PlayCircle className="w-4 h-4 text-[#d8a471] flex-shrink-0" />
                        )}
                        <div>
                          <Link
                            href={`/courses/${courseSlug}/lessons/${lesson.slug}`}
                            className="font-medium text-xs sm:text-sm text-[#171819] hover:text-[#81512f] transition-colors line-clamp-1"
                          >
                            {lesson.title}
                          </Link>
                          <div className="flex items-center gap-3 text-[11px] text-[#706b63] mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#a59e93]" /> {lesson.duration}
                            </span>
                            {lesson.learningObjectives.length > 0 && (
                              <span className="hidden sm:inline text-[#a59e93]">
                                • {lesson.learningObjectives.length} objectives
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {lesson.quizId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#f3e5d4] text-[#81512f] border border-[#d8a471]/30">
                            <Award className="w-3 h-3" /> Assessment
                          </span>
                        )}

                        <Link
                          href={`/courses/${courseSlug}/lessons/${lesson.slug}`}
                          className="text-[11px] font-bold uppercase tracking-wider text-[#171819] hover:text-[#81512f] px-2.5 py-1 border border-[#d8d0c2] hover:bg-[#f6f2e9] transition-colors"
                        >
                          View Lesson
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
