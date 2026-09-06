'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Chapter } from '@/types';
import { CheckCircle2, PlayCircle, HelpCircle, ChevronDown, ChevronUp, Clock, FileText } from 'lucide-react';
import { ProgressService } from '@/lib/progress';

interface CourseSyllabusProps {
  chapters: Chapter[];
  courseSlug: string;
}

export default function CourseSyllabus({ chapters, courseSlug }: CourseSyllabusProps) {
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    chapters.forEach(ch => { initial[ch.id] = true; });
    return initial;
  });

  const toggleChapter = (id: string) => {
    setOpenChapters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {chapters.map((chapter, index) => {
        const isOpen = openChapters[chapter.id];
        const completedCount = chapter.lessons.filter(l => ProgressService.isLessonCompleted(l.id)).length;

        return (
          <div
            key={chapter.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
          >
            {/* CHAPTER HEADER */}
            <button
              onClick={() => toggleChapter(chapter.id)}
              className="w-full p-4 sm:p-5 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors text-left focus:outline-none cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center">
                  0{index + 1}
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 text-base leading-snug">{chapter.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{chapter.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {completedCount}/{chapter.lessons.length} Completed
                </span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* LESSONS LIST */}
            {isOpen && (
              <div className="divide-y divide-slate-100 bg-white">
                {chapter.lessons.map((lesson) => {
                  const isCompleted = ProgressService.isLessonCompleted(lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      className="p-3.5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <PlayCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                        <div>
                          <Link
                            href={`/courses/${courseSlug}/lessons/${lesson.slug}`}
                            className="font-medium text-sm text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {lesson.title}
                          </Link>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" /> {lesson.duration}
                            </span>
                            {lesson.resources.length > 0 && (
                              <span className="flex items-center gap-1 text-slate-500">
                                <FileText className="w-3 h-3 text-slate-400" /> {lesson.resources.length} resources
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {lesson.quizId && (
                          <Link
                            href={`/quizzes/${lesson.quizId}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium hover:bg-amber-100 transition-colors"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Take Quiz</span>
                          </Link>
                        )}

                        <Link
                          href={`/courses/${courseSlug}/lessons/${lesson.slug}`}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isCompleted
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                          }`}
                        >
                          {isCompleted ? 'Review' : 'Start Lesson'}
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

