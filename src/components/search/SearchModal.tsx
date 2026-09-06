'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, X, Layers, BookOpen, Film, Award, ChevronRight } from 'lucide-react';
import { ContentService } from '@/lib/content';

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

  if (!isOpen) return null;

  const hasResults =
    results.subjects.length > 0 ||
    results.courses.length > 0 ||
    results.lessons.length > 0 ||
    results.quizzes.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* INPUT BAR */}
        <div className="relative flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
          <Search className="w-5 h-5 text-slate-500 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, courses, lessons, or quizzes..."
            autoFocus
            className="w-full bg-transparent border-none text-slate-900 placeholder-slate-400 focus:outline-none text-sm font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* RESULTS BODY */}
        <div className="p-4 overflow-y-auto space-y-6">
          {!query.trim() && (
            <div className="text-center py-10 space-y-2">
              <Search className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-700">Type a keyword to start searching</p>
              <p className="text-xs text-slate-500">e.g., "Computer Science", "React", "Big-O", "Quiz"</p>
            </div>
          )}

          {query.trim() && !hasResults && (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm text-slate-700">No results found for "{query}"</p>
              <p className="text-xs text-slate-500">Try searching for broader terms like "Algorithms" or "Next.js"</p>
            </div>
          )}

          {/* SUBJECTS */}
          {results.subjects.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-600" /> Subjects
              </h4>
              <div className="space-y-1">
                {results.subjects.map(s => (
                  <Link
                    key={s.id}
                    href={`/subjects/${s.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600">{s.name}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{s.shortDescription}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* COURSES */}
          {results.courses.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Courses
              </h4>
              <div className="space-y-1">
                {results.courses.map(c => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600">{c.title}</div>
                      <div className="text-xs text-slate-500">{c.subjectName} • {c.level} • {c.duration}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* LESSONS */}
          {results.lessons.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Film className="w-3.5 h-3.5 text-blue-600" /> Video Lessons
              </h4>
              <div className="space-y-1">
                {results.lessons.map(({ lesson, course }) => (
                  <Link
                    key={lesson.id}
                    href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600">{lesson.title}</div>
                      <div className="text-xs text-slate-500">{course.title} ({lesson.duration})</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* QUIZZES */}
          {results.quizzes.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-amber-600" /> Interactive Quizzes
              </h4>
              <div className="space-y-1">
                {results.quizzes.map(qz => (
                  <Link
                    key={qz.id}
                    href={`/quizzes/${qz.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 group-hover:text-amber-600">{qz.title}</div>
                      <div className="text-xs text-slate-500">{qz.questions.length} Questions • {qz.passingScore}% Pass mark</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Navigate with ↑ ↓ and Esc to close</span>
          <span>Edurah Search Engine</span>
        </div>

      </div>
    </div>
  );
}

