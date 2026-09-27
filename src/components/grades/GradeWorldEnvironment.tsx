'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GradeTier } from '@/types';
import { useReducedMotion } from '@/lib/motion';

interface GradeWorldEnvironmentProps {
  tier: GradeTier;
  children: React.ReactNode;
}

export default function GradeWorldEnvironment({ tier, children }: GradeWorldEnvironmentProps) {
  const reducedMotion = useReducedMotion();

  if (tier === 'junior') {
    return (
      <div className="grade-world-junior min-h-screen relative overflow-hidden transition-colors duration-500">
        {/* BACKGROUND FLOATING EDUCATIONAL OBJECTS */}
        {!reducedMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
            {/* Gentle Warm Sun / Moon */}
            <div className="absolute top-8 right-[10%] w-44 h-44 rounded-full bg-[#fbe7cb]/60 blur-xl" />
            <div className="absolute top-1/3 left-[-5%] w-72 h-72 rounded-full bg-[#fde9d9]/40 blur-2xl" />

            {/* Floating Soft Stars */}
            <motion.svg
              className="absolute top-16 left-[8%] w-8 h-8 text-[#dca66c]/60 junior-star"
              viewBox="0 0 24 24"
              fill="currentColor"
              animate={{ y: [0, -10, 0], rotate: [0, 15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" />
            </motion.svg>

            <motion.svg
              className="absolute top-36 right-[18%] w-6 h-6 text-[#ba6c45]/40 junior-star"
              viewBox="0 0 24 24"
              fill="currentColor"
              animate={{ y: [0, -8, 0], rotate: [0, -20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" />
            </motion.svg>

            {/* Gentle Floating Cloud / Bubble */}
            <motion.div
              className="absolute top-28 left-[22%] w-24 h-12 rounded-full bg-white/70 border border-[#e8e2d5] shadow-xs junior-cloud"
              animate={{ x: [0, 15, 0], y: [0, -6, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Whimsical Small Pencil Icon Silhouette */}
            <motion.svg
              className="absolute top-[45%] right-[6%] w-7 h-7 text-[#d8a471]/40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              animate={{ y: [0, -12, 0], rotate: [-10, 5, -10] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </motion.svg>

            {/* Floating Planet Ring */}
            <motion.div
              className="absolute bottom-24 left-[10%] w-20 h-20 rounded-full border-2 border-dashed border-[#dca66c]/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}

        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  if (tier === 'middle') {
    return (
      <div className="grade-world-middle min-h-screen relative overflow-hidden transition-colors duration-500">
        {/* COORDINATE GRID & ORBITAL ARCHITECTURE */}
        <div className="absolute inset-0 pointer-events-none middle-grid opacity-70 z-0" aria-hidden="true" />

        {!reducedMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
            {/* Subtle Rotating Orbital Ring */}
            <div className="absolute top-[8%] right-[5%] w-[420px] h-[420px] rounded-full border border-[#d8a471]/25 middle-orbital pointer-events-none" />
            <div className="absolute top-[14%] right-[10%] w-[300px] h-[300px] rounded-full border border-[#b4a082]/20 middle-orbital pointer-events-none" />

            {/* Diagrammatic Compass Vector */}
            <svg
              className="absolute bottom-16 right-[8%] w-32 h-32 text-[#81512f]/15"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="50" cy="50" r="45" />
              <line x1="50" y1="5" x2="50" y2="95" />
              <line x1="5" y1="50" x2="95" y2="50" />
              <circle cx="50" cy="50" r="20" strokeDasharray="3 3" />
            </svg>
          </div>
        )}

        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  // SENIOR WORLD (Grades 8–10) — Focused, rigorous, obsidian/slate textures
  return (
    <div className="grade-world-senior min-h-screen relative overflow-hidden transition-colors duration-500">
      {/* MATHEMATICAL & LATTICE PATTERN */}
      <div className="absolute inset-0 pointer-events-none senior-grid z-0" aria-hidden="true" />

      {!reducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[#1e2e30]/30 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-[#152125]/40 blur-3xl" />

          {/* Precision Calculus Grid Curves */}
          <svg
            className="absolute top-20 right-[4%] w-96 h-64 text-[#dca66c]/10"
            viewBox="0 0 400 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path d="M 0 100 Q 100 20, 200 100 T 400 100" />
            <path d="M 0 130 Q 100 50, 200 130 T 400 130" opacity="0.6" />
            <line x1="0" y1="100" x2="400" y2="100" strokeDasharray="4 4" />
          </svg>
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}
