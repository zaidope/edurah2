'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Layers, BookOpen, Film, Award, ChevronRight } from 'lucide-react';
import { ContentService } from '@/lib/content';
import { ease, duration } from '@/lib/motion';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    subjects: any[];
    courses: any[];
    lessons: any[];
    quizzes: any[];
  }>({ subjects: [], courses: [], lessons: [], quizzes: [] });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (query.trim()) {
      setResults(ContentService.search(query));
    } else {
      setResults({ subjects: [], courses: [], lessons: [], quizzes: [] });
    }
  }, [query]);

  const hasResults =
    results.subjects.length > 0 ||
    results.courses.length > 0 ||
    results.lessons.length > 0 ||
    results.quizzes.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.fast }}
        >
          {/* BACKDROP */}
          <motion.div
            className="absolute inset-0 bg-[#0b0d0e]/60 backdrop-blur-xs"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* MODAL */}
          <motion.div
            className="relative w-full max-w-2xl bg-[#fcfbf9] border border-[#d8d0c2] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: duration.normal, ease: ease.outCubic }}
          >
            {/* INPUT BAR */}
            <div className="relative flex items-center px-4 py-3 border-b border-[#d8d0c2] bg-[#f6f2e9]">
              <Search className="w-4 h-4 text-[#81512f] mr-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subjects, courses, lessons, or quizzes..."
                autoFocus
                className="w-full bg-transparent border-none text-[#171819] placeholder:text-[#a59e93] focus:outline-none text-sm font-medium"
              />
              <button
                onClick={onClose}
                className="p-1 text-[#706b63] hover:text-[#171819] transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* RESULTS BODY */}
            <div className="p-5 overflow-y-auto space-y-6">
              {!query.trim() && (
                <div className="text-center py-10 space-y-2">
                  <Search className="w-8 h-8 text-[#a59e93] mx-auto" />
                  <p className="text-xs font-bold uppercase tracking-wider text-[#171819]">Type to search Edurah</p>
                  <p className="text-xs text-[#706b63]">e.g., &quot;Mathematics&quot;, &quot;Python&quot;, &quot;Fractions&quot;, &quot;Data Structures&quot;</p>
                </div>
              )}

              {query.trim() && !hasResults && (
                <div className="text-center py-10 space-y-2">
                  <p className="text-sm text-[#171819]">No results found for &quot;{query}&quot;</p>
                  <p className="text-xs text-[#706b63]">Try broader terms like &quot;Math&quot;, &quot;Science&quot;, or &quot;Algorithms&quot;</p>
                </div>
              )}

              {/* SUBJECTS */}
              {results.subjects.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-[#81512f] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Subjects
                  </h4>
                  <div className="space-y-1">
                    {results.subjects.map((s) => (
                      <Link
                        key={s.id}
                        href={`/subjects/${s.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 border border-transparent hover:border-[#d8d0c2] hover:bg-white transition-all group"
                      >
                        <div>
                          <div className="font-semibold text-xs text-[#171819] group-hover:text-[#81512f] transition-colors">
                            {s.name}
                          </div>
                          <div className="text-[11px] text-[#706b63] line-clamp-1">{s.shortDescription}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#a59e93] group-hover:text-[#81512f] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* COURSES */}
              {results.courses.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-[#81512f] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" /> Courses
                  </h4>
                  <div className="space-y-1">
                    {results.courses.map((c) => (
                      <Link
                        key={c.id}
                        href={`/courses/${c.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 border border-transparent hover:border-[#d8d0c2] hover:bg-white transition-all group"
                      >
                        <div>
                          <div className="font-semibold text-xs text-[#171819] group-hover:text-[#81512f] transition-colors">
                            {c.title}
                          </div>
                          <div className="text-[11px] text-[#706b63]">
                            {c.subjectName} • {c.level} • {c.duration}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#a59e93] group-hover:text-[#81512f] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* LESSONS */}
              {results.lessons.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-[#81512f] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Film className="w-3.5 h-3.5" /> Video Lessons
                  </h4>
                  <div className="space-y-1">
                    {results.lessons.map(({ lesson, course }: { lesson: any; course: any }) => (
                      <Link
                        key={lesson.id}
                        href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 border border-transparent hover:border-[#d8d0c2] hover:bg-white transition-all group"
                      >
                        <div>
                          <div className="font-semibold text-xs text-[#171819] group-hover:text-[#81512f] transition-colors">
                            {lesson.title}
                          </div>
                          <div className="text-[11px] text-[#706b63]">
                            {course.title} ({lesson.duration})
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#a59e93] group-hover:text-[#81512f] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* QUIZZES */}
              {results.quizzes.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-[#81512f] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-[#d8a471]" /> Quizzes
                  </h4>
                  <div className="space-y-1">
                    {results.quizzes.map((qz) => (
                      <Link
                        key={qz.id}
                        href={`/quizzes/${qz.id}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 border border-transparent hover:border-[#d8d0c2] hover:bg-white transition-all group"
                      >
                        <div>
                          <div className="font-semibold text-xs text-[#171819] group-hover:text-[#81512f] transition-colors">
                            {qz.title}
                          </div>
                          <div className="text-[11px] text-[#706b63]">
                            {qz.questions.length} Questions • {qz.passingScore}% Pass mark
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#a59e93] group-hover:text-[#81512f] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="p-3 bg-[#f6f2e9] border-t border-[#d8d0c2] text-[11px] text-[#706b63] flex items-center justify-between">
              <span>Press Esc to close</span>
              <span>Edurah Knowledge Search</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
