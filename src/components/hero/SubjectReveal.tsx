'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Layers, 
  Code2, 
  BrainCircuit, 
  Globe, 
  Binary, 
  Palette, 
  Database,
  Sparkles
} from 'lucide-react';
import { INITIAL_SUBJECTS } from '@/content/subjects';

export default function SubjectReveal() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const currentSection = sectionRef.current;
    if (currentSection) {
      observer.observe(currentSection);
    }

    return () => {
      if (currentSection) {
        observer.unobserve(currentSection);
      }
    };
  }, []);

  const getSubjectIcon = (slug: string) => {
    switch (slug) {
      case 'computer-science': return Code2;
      case 'artificial-intelligence': return BrainCircuit;
      case 'web-development': return Globe;
      case 'mathematics': return Binary;
      case 'ux-design': return Palette;
      case 'data-engineering': return Database;
      default: return Layers;
    }
  };

  return (
    <section 
      ref={sectionRef} 
      id="subjects-reveal" 
      className="relative pt-20 pb-16 bg-slate-50 border-t border-slate-200/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SECTION HEADER */}
        <div className={`flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 pb-6 border-b border-slate-200 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>EDURAH Core Learning Tracks</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Explore Academic & Engineering Domains
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Transition from cinematic theory to rigorous mastery. Choose a curriculum track engineered for depth, mathematical rigor, and foundational comprehension.
            </p>
          </div>

          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 transition-all shadow-2xs group"
          >
            <span>View All 6 Domains</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* PROGRESSIVELY REVEALED SUBJECT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {INITIAL_SUBJECTS.map((subject, index) => {
            const Icon = getSubjectIcon(subject.slug);
            // Staggered delays: 100ms, 200ms, 300ms...
            const delayStyle = { transitionDelay: `${index * 110}ms` };

            return (
              <Link
                key={subject.id}
                href={`/subjects/${subject.slug}`}
                style={delayStyle}
                className={`bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-500 group ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
                      {subject.category}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {subject.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {subject.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">
                    {subject.courseCount} Courses • {subject.lessonCount} Lessons
                  </span>
                  <span className="text-blue-600 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Explore Track <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
