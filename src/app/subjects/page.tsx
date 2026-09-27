import React from 'react';
import Link from 'next/link';
import { ContentService } from '@/lib/content';
import { Layers, BookOpen, Film, ArrowUpRight } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedPage from '@/components/layout/AnimatedPage';
import { getSubjectIdentity } from '@/components/subjects/SubjectMotif';

export default function SubjectsPage() {
  const subjects = ContentService.getSubjects();

  return (
    <PageTransition>
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 space-y-10">
          {/* HEADER */}
          <div className="space-y-3 max-w-2xl border-b border-[#d8d0c2] pb-8">
            <p className="edurah-eyebrow">
              <span /> Academic Disciplines
            </p>
            <h1 className="font-serif-hero text-4xl sm:text-5xl font-normal text-[#171819] tracking-tight">
              Curriculum Subject Tracks
            </h1>
            <p className="text-xs sm:text-sm text-[#555048] leading-relaxed">
              Explore our core disciplines. Each subject track connects sequential video courses, structured units, and interactive conceptual assessments across primary and senior curricula.
            </p>
          </div>

          {/* SUBJECTS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map((subject) => {
              const identity = getSubjectIdentity(subject.slug);

              return (
                <div
                  key={subject.id}
                  className={`bg-white border border-[#d8d0c2] overflow-hidden flex flex-col justify-between group edurah-card-hover ${identity.cardBorder}`}
                >
                  {/* VISUAL MOTIF PREVIEW */}
                  <div className="relative">
                    {identity.renderVisual()}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${identity.badgeBg}`}>
                        {subject.category}
                      </span>
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-2">
                      <h2 className="font-serif-heading text-xl font-normal text-[#171819] group-hover:text-[#81512f] transition-colors">
                        {subject.name}
                      </h2>
                      <p className="text-xs text-[#555048] leading-relaxed line-clamp-3">
                        {subject.description}
                      </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[#e8e2d5]">
                      <div className="flex items-center justify-between text-[11px] text-[#706b63]">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#a59e93]" /> {subject.courseCount} Courses
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-[#a59e93]" /> {subject.lessonCount} Video Lessons
                        </span>
                      </div>

                      <Link
                        href={`/subjects/${subject.slug}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#f6f2e9] hover:bg-[#ede8dc] text-[#171819] text-xs font-bold uppercase tracking-wider border border-[#d8d0c2] transition-colors"
                      >
                        <span>Explore Subject Track</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#81512f]" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AnimatedPage>
    </PageTransition>
  );
}
