'use client';

import React from 'react';
import Link from 'next/link';
import { Play, ArrowRight, Sparkles, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export default function HeroPlaceholder() {
  return (
    <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 overflow-hidden bg-slate-50/50 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* TOP BRAND BADGE */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Structured Video & Learning Platform</span>
          </div>
        </div>

        {/* HERO TITLE */}
        <div className="text-center max-w-4xl mx-auto mt-6 space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Master Complex Concepts Through <br className="hidden sm:inline" />
            <span className="text-blue-600">Structured Video & Interactive Practice</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Edurah is built for engineers, scientists, and ambitious learners. Deep-dive into computer science, artificial intelligence, and engineering with curriculum designed for mastery.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
          <Link
            href="/courses"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all cursor-pointer shadow-xs group"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explore Courses</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/subjects"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-medium text-sm transition-all cursor-pointer shadow-xs"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span>Browse Subjects</span>
          </Link>
        </div>

        {/* FEATURE HIGHLIGHT PILLS */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>HD Video Lessons</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Interactive Quizzes & Feedback</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Progress Persistence</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Curriculum Syllabi</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HERO SCROLL ANIMATION STAGE CONTAINER (RESERVED FOR FUTURE VIDEO ANIMATION) */}
        {/* ========================================================================= */}
        <div 
          id="hero-scroll-animation-stage"
          className="mt-12 relative max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white p-2 sm:p-3 shadow-md overflow-hidden group"
        >
          {/* PLACEHOLDER VISUAL PREVIEW & VIDEO CANVAS MOUNT TARGET */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 flex flex-col items-center justify-center border border-slate-800">
            {/* Background graphic */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

            {/* INTERACTIVE PLAY STAGE OVERLAY */}
            <div className="relative z-10 text-center p-6 space-y-3">
              <Link href="/courses/cs-algorithm-essentials/lessons/how-computers-think">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-105 hover:bg-blue-500 transition-all cursor-pointer group/btn">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 text-white fill-white group-hover/btn:scale-110 transition-transform" />
                </div>
              </Link>
              <div className="space-y-1">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-blue-200 border border-white/20 backdrop-blur-xs">
                  Featured Lesson • Computer Science 101
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  How Computers Think: Memory, Registers, and Execution
                </h3>
              </div>
            </div>

            {/* FOOTER BAR ON VIDEO STAGE */}
            <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-xs px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-slate-200 text-[11px]">Edurah Learning Stage</span>
              </div>
              <span className="hidden sm:inline font-mono text-slate-400 text-[11px]">
                [Scroll-Based Hero Animation Target Container]
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

