'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  ChevronDown, 
  Play, 
  Pause,
  ArrowRight,
  Code2, 
  BrainCircuit, 
  Globe, 
  Binary, 
  Palette, 
  Database,
  Layers,
  Sparkles
} from 'lucide-react';
import { INITIAL_SUBJECTS } from '@/content/subjects';

export default function ScrollVideoHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollPromptRef = useRef<HTMLDivElement>(null);

  // Subject popup refs for direct 60fps DOM style updates
  const subjectsContainerRef = useRef<HTMLDivElement>(null);
  const subjectCardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Animation frame reference
  const rafIdRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number>(0);
  const reducedMotionRef = useRef<boolean>(false);

  // Safe UI state for initial load & user preferences
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isPlayingManual, setIsPlayingManual] = useState(false);

  const subjects = INITIAL_SUBJECTS.slice(0, 6);

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

  // Stagger thresholds across the final 20% of the video timeline (0.78 -> 0.96)
  const cardThresholds = [0.78, 0.81, 0.84, 0.87, 0.90, 0.93];

  // Update floating UI & subject popups without triggering React re-renders
  const updateOverlays = useCallback((progress: number) => {
    // 1. Initial scroll prompt (visible 0 -> 0.08, fades out cleanly)
    if (scrollPromptRef.current) {
      const promptOpacity = Math.max(0, 1 - progress / 0.10);
      scrollPromptRef.current.style.opacity = promptOpacity.toFixed(3);
      scrollPromptRef.current.style.transform = `translate3d(0, ${(progress * 25).toFixed(1)}px, 0)`;
      scrollPromptRef.current.style.pointerEvents = promptOpacity > 0.2 ? 'auto' : 'none';
    }

    // 3. Subject popups container (enters during final 20%: 0.80 -> 1.00)
    if (subjectsContainerRef.current) {
      const containerOpacity = progress >= 0.78 ? Math.min(1, (progress - 0.78) / 0.05) : 0;
      subjectsContainerRef.current.style.opacity = containerOpacity.toFixed(3);
      subjectsContainerRef.current.style.pointerEvents = containerOpacity > 0.3 ? 'auto' : 'none';
    }

    // 4. Staggered individual subject card reveals
    subjectCardRefs.current.forEach((cardEl, idx) => {
      if (!cardEl) return;
      const startT = cardThresholds[idx] || 0.80;
      const endT = startT + 0.035;

      let cardOpacity = 0;
      let cardTranslateY = 20;
      let cardScale = 0.94;

      if (progress >= endT) {
        cardOpacity = 1;
        cardTranslateY = 0;
        cardScale = 1;
      } else if (progress > startT) {
        const factor = (progress - startT) / (endT - startT);
        cardOpacity = factor;
        cardTranslateY = (1 - factor) * 20;
        cardScale = 0.94 + factor * 0.06;
      }

      cardEl.style.opacity = cardOpacity.toFixed(3);
      cardEl.style.transform = `translate3d(0, ${cardTranslateY.toFixed(1)}px, 0) scale(${cardScale.toFixed(3)})`;
      cardEl.style.pointerEvents = cardOpacity > 0.3 ? 'auto' : 'none';
    });
  }, [cardThresholds]);

  // Main scroll coordinator using requestAnimationFrame
  useEffect(() => {
    // Check reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mediaQuery.matches;
    setIsReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
      setIsReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    // Guarantee the video is paused on mount (no autoplay)
    video.pause();

    const onScroll = () => {
      if (reducedMotionRef.current) return;
      if (!container || !video) return;

      const rect = container.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;

      // Progress strictly normalized between 0.0 and 1.0
      const scrolled = -rect.top;
      const rawProgress = scrolled / totalScrollable;
      const progress = Math.min(Math.max(rawProgress, 0), 1);

      const duration = video.duration || 10;
      const targetTime = progress * duration;

      // DIRECT SEEKING: latest scroll position immediately sets video.currentTime
      if (Math.abs(video.currentTime - targetTime) > 0.01) {
        video.currentTime = targetTime;
      }

      // Update floating UI & subject popups
      updateOverlays(progress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Initial check
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mediaQuery.removeEventListener('change', handleMediaChange);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [updateOverlays]);

  // Handle metadata load to ensure ready state & initial sync
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setVideoLoaded(true);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable > 0) {
        const scrolled = -rect.top;
        const progress = Math.min(Math.max(scrolled / totalScrollable, 0), 1);
        const duration = video.duration || 10;
        const targetTime = progress * duration;
        video.currentTime = targetTime;
        updateOverlays(progress);
      }
    }
  };

  // Accessibility toggle for reduced motion users
  const toggleReducedMotionPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlayingManual(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlayingManual(false);
    }
  };

  return (
    <section 
      ref={containerRef}
      id="edurah-hero-section"
      className="relative w-full h-[350vh] bg-slate-900"
      aria-label="EDURAH Fullscreen Cinematic Video Hero"
    >
      {/* FULL-VIEWPORT STICKY CONTAINER */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        
        {/* EDGE-TO-EDGE FULLSCREEN VIDEO CANVAS */}
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          poster="/edurah_hero.jpg"
          onLoadedMetadata={handleLoadedMetadata}
          className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-700 ${
            videoLoaded ? 'opacity-100' : 'opacity-85'
          }`}
        >
          <source src="/videos/edurah-hero.mp4" type="video/mp4" />
        </video>

        {/* ULTRA-SUBTLE VIGNETTE (Keeps transparent floating navbar legible without darkening scene) */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/20 via-black/5 to-transparent pointer-events-none z-10" />

        {/* ========================================================================= */}
        {/* STAGE 2.1: INITIAL SCROLL CUE (Fades out when user begins scrolling) */}
        {/* ========================================================================= */}
        <div 
          ref={scrollPromptRef}
          className="absolute bottom-10 inset-x-0 flex flex-col items-center justify-center gap-2 z-20 pointer-events-auto transition-transform duration-300"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 hover:bg-white/95 text-slate-800 text-xs font-semibold tracking-wide uppercase shadow-lg backdrop-blur-md border border-white/40 transition-all">
            <span>Scroll to navigate</span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-600 animate-bounce" />
          </div>
          <span className="text-[11px] text-white/90 font-medium drop-shadow-sm tracking-wider uppercase">
            EDURAH Cinematic Experience
          </span>
        </div>

        {/* ========================================================================= */}
        {/* STAGE 2.2: FLOATING SUBJECT POPUPS OVER FINAL 20% OF VIDEO (0.80 -> 1.00) */}
        {/* As teacher turns around and reaches final pose, cards appear around scene */}
        {/* ========================================================================= */}
        <div 
          ref={subjectsContainerRef}
          className="absolute inset-0 z-20 flex flex-col justify-center items-end px-4 sm:px-12 lg:px-20 max-w-7xl mx-auto pointer-events-none opacity-0 transition-opacity duration-300"
        >
          <div className="w-full max-w-lg lg:max-w-xl flex flex-col gap-3">
            
            {/* Subject Popups Header Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200/90 text-slate-800 text-xs font-semibold tracking-wide uppercase shadow-md backdrop-blur-md w-fit">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>EDURAH Core Learning Domains</span>
            </div>

            {/* 6 Subject Cards in a 2-Column Responsive Floating Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full">
              {subjects.map((subject, index) => {
                const Icon = getSubjectIcon(subject.slug);
                return (
                  <Link
                    key={subject.id}
                    ref={(el) => { subjectCardRefs.current[index] = el; }}
                    href={`/subjects/${subject.slug}`}
                    className="bg-white/90 hover:bg-white text-slate-800 p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-lg hover:shadow-xl hover:border-blue-400 backdrop-blur-md transition-all duration-200 group flex items-start gap-3 pointer-events-none cursor-pointer"
                    style={{ opacity: 0, transform: 'translate3d(0, 20px, 0) scale(0.94)' }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {subject.category}
                        </span>
                        <ArrowRight className="w-3 h-3 text-blue-600 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {subject.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {subject.courseCount} Courses
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Final Scroll Prompt to proceed to Course Catalog */}
            <div className="text-right pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-800 font-medium bg-white/80 px-2.5 py-1 rounded-md shadow-2xs backdrop-blur-xs border border-white/60">
                Continue scrolling for courses <ChevronDown className="w-3 h-3 animate-bounce text-blue-600" />
              </span>
            </div>

          </div>
        </div>

        {/* ACCESSIBILITY PLAY/PAUSE FOR PREFERS-REDUCED-MOTION */}
        {isReducedMotion && (
          <div className="absolute bottom-5 left-6 z-20">
            <button
              onClick={toggleReducedMotionPlay}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/90 backdrop-blur-md border border-slate-200 text-slate-800 text-xs font-medium shadow-md hover:bg-white cursor-pointer"
              aria-label="Toggle video playback"
            >
              {isPlayingManual ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-slate-600" />
                  <span>Pause Video</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                  <span>Play Video</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
