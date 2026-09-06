import React from 'react';
import Link from 'next/link';
import { ContentService } from '@/lib/content';
import { Layers, BookOpen, Film, ArrowRight } from 'lucide-react';

export default function SubjectsPage() {
  const subjects = ContentService.getSubjects();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* HEADER */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          <Layers className="w-3.5 h-3.5 text-blue-600" /> Curated Specializations
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Explore Learning Subjects</h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Deep-dive into comprehensive subject tracks. Each subject encapsulates multiple structured courses, video lessons, and interactive quizzes.
        </p>
      </div>

      {/* SUBJECTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {subjects.map(subject => (
          <div
            key={subject.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between group shadow-xs edurah-card-hover"
          >
            {/* BANNER PREVIEW */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
              <img
                src={subject.bannerImage}
                alt={subject.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-600 text-white uppercase tracking-wider shadow-xs">
                  {subject.category}
                </span>
              </div>
            </div>

            {/* BODY */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {subject.name}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {subject.description}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" /> {subject.courseCount} Courses
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-slate-400" /> {subject.lessonCount} Lessons
                  </span>
                </div>

                <Link
                  href={`/subjects/${subject.slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white transition-all cursor-pointer shadow-xs group/btn"
                >
                  <span>Explore Subject Track</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

