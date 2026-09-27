'use client';

import { useEffect, useState, useRef, useMemo, type RefObject } from 'react';

/* ═══════════════════════════════════════════════════
   EASING CURVES
   Consistent across the entire site.
   ═══════════════════════════════════════════════════ */
export const ease = {
  /** Smooth deceleration — default for most entrances */
  outCubic: [0.33, 1, 0.68, 1] as [number, number, number, number],
  /** Dramatic deceleration — hero reveals, major statements */
  outExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Gentle acceleration+deceleration — slides, morphs */
  inOutCubic: [0.65, 0, 0.35, 1] as [number, number, number, number],
  /** Quick snap — micro-interactions, hovers */
  outQuart: [0.25, 1, 0.5, 1] as [number, number, number, number],
  /** Elastic spring feel — modal/drawer entrances */
  spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
  /** Gentle spring — cards, subtle depth */
  gentleSpring: { type: 'spring' as const, stiffness: 200, damping: 25 },
};

/* ═══════════════════════════════════════════════════
   DURATION TOKENS (seconds)
   ═══════════════════════════════════════════════════ */
export const duration = {
  fast: 0.15,
  normal: 0.3,
  medium: 0.5,
  slow: 0.7,
  cinematic: 1.0,
};

/* ═══════════════════════════════════════════════════
   STAGGER CONFIG
   ═══════════════════════════════════════════════════ */
export const stagger = {
  /** Fast stagger for lists (cards, nav items) */
  fast: 0.05,
  /** Normal stagger for section content */
  normal: 0.08,
  /** Slow dramatic stagger for hero reveals */
  dramatic: 0.12,
};

/* ═══════════════════════════════════════════════════
   COMMON ANIMATION VARIANTS (framer-motion)
   ═══════════════════════════════════════════════════ */
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const slideLeft = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};

export const slideRight = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
};

export const blurIn = {
  hidden: { opacity: 0, filter: 'blur(8px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
};

/* ═══════════════════════════════════════════════════
   CONTAINER VARIANTS (stagger children)
   ═══════════════════════════════════════════════════ */
export const staggerContainer = (staggerDelay = stagger.normal) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.1,
    },
  },
});

/* ═══════════════════════════════════════════════════
   useReducedMotion()
   ═══════════════════════════════════════════════════ */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/* ═══════════════════════════════════════════════════
   useInView()
   GPU-friendly IntersectionObserver trigger.
   ═══════════════════════════════════════════════════ */
export function useInView(
  ref: RefObject<HTMLElement | null>,
  options: { threshold?: number; once?: boolean; rootMargin?: string } = {}
): boolean {
  const { threshold = 0.15, once = true, rootMargin = '0px' } = options;
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold, once, rootMargin]);

  return isInView;
}

/* ═══════════════════════════════════════════════════
   useIsMobile()
   For simplifying animations on small viewports.
   ═══════════════════════════════════════════════════ */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}

/* ═══════════════════════════════════════════════════
   useCountUp()
   Animate a number from 0 to target when triggered.
   ═══════════════════════════════════════════════════ */
export function useCountUp(target: number, triggered: boolean, durationMs = 1200): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!triggered) return;
    let start: number | null = null;
    let raf: number;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / durationMs, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, triggered, durationMs]);

  return value;
}
