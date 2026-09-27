import React from 'react';
import {
  Binary,
  Code2,
  BrainCircuit,
  Globe,
  Palette,
  Database,
  BookOpen,
  Atom,
  Sigma,
  Sparkles
} from 'lucide-react';

export interface SubjectIdentity {
  slug: string;
  name: string;
  discipline: string;
  tagline: string;
  accentText: string;
  badgeBg: string;
  cardBorder: string;
  heroBackground: string;
  renderVisual: () => React.ReactNode;
}

export function getSubjectIdentity(slug: string): SubjectIdentity {
  switch (slug) {
    case 'mathematics':
      return {
        slug,
        name: 'Mathematics & Logic',
        discipline: 'Analytical Sciences',
        tagline: 'Precision geometry, algebraic proof, coordinate geometry, and discrete logic.',
        accentText: 'text-[#81512f]',
        badgeBg: 'bg-[#f3e5d4] text-[#81512f] border-[#d8a471]/50',
        cardBorder: 'hover:border-[#d8a471]',
        heroBackground: 'bg-gradient-to-br from-[#1b2123] via-[#151c1d] to-[#0f1415] text-[#ede8dc]',
        renderVisual: () => (
          <div className="relative w-full aspect-[16/9] flex items-center justify-center overflow-hidden border border-[#d8a471]/30 bg-[#0d1214]">
            {/* Coordinate axes */}
            <svg className="w-full h-full text-[#dca66c]/30" viewBox="0 0 300 180" fill="none" stroke="currentColor">
              {/* Grid lines */}
              <line x1="0" y1="90" x2="300" y2="90" strokeWidth="1.5" />
              <line x1="150" y1="0" x2="150" y2="180" strokeWidth="1.5" />
              {/* Sinusoidal wave */}
              <path d="M 10 90 Q 75 10, 150 90 T 290 90" stroke="#dca66c" strokeWidth="2.5" />
              {/* Geometric triangle */}
              <polygon points="150,90 230,90 230,30" fill="rgba(220,166,108,0.12)" stroke="#e2a369" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="230" cy="30" r="3" fill="#dca66c" />
              <circle cx="150" cy="90" r="3" fill="#dca66c" />
            </svg>
            <span className="absolute bottom-2 right-3 font-mono-code text-[10px] text-[#dca66c]/70">
              f(x) = sin(θ) + Δx
            </span>
          </div>
        ),
      };

    case 'natural-sciences':
    case 'science':
      return {
        slug,
        name: 'Natural Sciences',
        discipline: 'Empirical Discovery',
        tagline: 'Planetary mechanics, ecosystems, cellular biology, and physical matter.',
        accentText: 'text-[#2e5d4f]',
        badgeBg: 'bg-[#e2ede8] text-[#1b4337] border-[#93c6ae]/50',
        cardBorder: 'hover:border-[#93c6ae]',
        heroBackground: 'bg-gradient-to-br from-[#132223] via-[#101b1c] to-[#0a1213] text-[#e3ece7]',
        renderVisual: () => (
          <div className="relative w-full aspect-[16/9] flex items-center justify-center overflow-hidden border border-[#93c6ae]/30 bg-[#0d1717]">
            {/* Orbital Rings / Atomic Model */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div className="absolute w-36 h-36 rounded-full border border-[#93c6ae]/40 rotate-45 animate-spin" style={{ animationDuration: '30s' }} />
              <div className="absolute w-28 h-28 rounded-full border border-[#dca66c]/30 -rotate-30 animate-spin" style={{ animationDuration: '24s' }} />
              <div className="w-8 h-8 rounded-full bg-[#93c6ae] shadow-lg shadow-[#93c6ae]/30" />
            </div>
            <span className="absolute bottom-2 right-3 font-mono-code text-[10px] text-[#93c6ae]/70">
              E = mc² · Bohr Orbit
            </span>
          </div>
        ),
      };

    case 'computer-science':
      return {
        slug,
        name: 'Computer Science',
        discipline: 'Computational Systems',
        tagline: 'Algorithms, memory registers, computational complexity, and systems architecture.',
        accentText: 'text-[#1e3a8a]',
        badgeBg: 'bg-[#e7eefb] text-[#1e3a8a] border-[#93b4e6]/50',
        cardBorder: 'hover:border-[#93b4e6]',
        heroBackground: 'bg-gradient-to-br from-[#0e1626] via-[#0b101c] to-[#070b13] text-[#dce6f6]',
        renderVisual: () => (
          <div className="relative w-full aspect-[16/9] flex items-center justify-center overflow-hidden border border-[#93b4e6]/30 bg-[#080d18] p-4 font-mono-code text-xs">
            <div className="w-full space-y-1 text-[#8baedb]/80">
              <div className="text-[10px] text-[#e6b981] flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" /> <span>sys::algorithm_core.py</span>
              </div>
              <p className="text-[11px] text-[#dce6f6]">
                <span className="text-[#e2a369]">def</span> binary_search(arr, target):
              </p>
              <p className="text-[11px] pl-3 text-[#8baedb]">
                mid = len(arr) // <span className="text-[#93c6ae]">2</span>
              </p>
              <p className="text-[11px] pl-3 text-[#dce6f6]">
                <span className="text-[#e2a369]">return</span> arr[mid] == target
              </p>
            </div>
            <span className="absolute bottom-2 right-3 text-[10px] text-[#8baedb]/60">O(log n) Asymptote</span>
          </div>
        ),
      };

    case 'artificial-intelligence':
      return {
        slug,
        name: 'Artificial Intelligence & ML',
        discipline: 'Machine Cognition',
        tagline: 'Deep neural networks, backpropagation, generative models, and algorithmic learning.',
        accentText: 'text-[#6b21a8]',
        badgeBg: 'bg-[#f4eafc] text-[#6b21a8] border-[#c084fc]/50',
        cardBorder: 'hover:border-[#c084fc]',
        heroBackground: 'bg-gradient-to-br from-[#1a1226] via-[#130d1e] to-[#09060e] text-[#f2e7fa]',
        renderVisual: () => (
          <div className="relative w-full aspect-[16/9] flex items-center justify-center overflow-hidden border border-[#c084fc]/30 bg-[#100b19] p-4">
            {/* Neural Net Nodes and Synapses */}
            <svg className="w-full h-full" viewBox="0 0 260 140" fill="none" stroke="currentColor">
              {/* Layer connections */}
              <line x1="40" y1="40" x2="130" y2="30" stroke="rgba(192,132,252,0.3)" strokeWidth="1" />
              <line x1="40" y1="40" x2="130" y2="70" stroke="rgba(192,132,252,0.5)" strokeWidth="1.5" />
              <line x1="40" y1="100" x2="130" y2="70" stroke="rgba(192,132,252,0.5)" strokeWidth="1.5" />
              <line x1="40" y1="100" x2="130" y2="110" stroke="rgba(192,132,252,0.3)" strokeWidth="1" />
              <line x1="130" y1="30" x2="220" y2="70" stroke="rgba(226,163,105,0.6)" strokeWidth="1.5" />
              <line x1="130" y1="70" x2="220" y2="70" stroke="rgba(226,163,105,0.8)" strokeWidth="2" />
              <line x1="130" y1="110" x2="220" y2="70" stroke="rgba(226,163,105,0.6)" strokeWidth="1.5" />
              {/* Nodes */}
              <circle cx="40" cy="40" r="7" fill="#c084fc" />
              <circle cx="40" cy="100" r="7" fill="#c084fc" />
              <circle cx="130" cy="30" r="8" fill="#a855f7" />
              <circle cx="130" cy="70" r="8" fill="#a855f7" />
              <circle cx="130" cy="110" r="8" fill="#a855f7" />
              <circle cx="220" cy="70" r="9" fill="#e3ac72" />
            </svg>
            <span className="absolute bottom-2 right-3 font-mono-code text-[10px] text-[#c084fc]/70">
              Dense(Weights, Bias)
            </span>
          </div>
        ),
      };

    case 'web-development':
      return {
        slug,
        name: 'Modern Web Development',
        discipline: 'Client & Server Engineering',
        tagline: 'Reactive state machines, edge rendering, APIs, and accessible interface systems.',
        accentText: 'text-[#0e7490]',
        badgeBg: 'bg-[#e0f7fa] text-[#0e7490] border-[#67e8f9]/50',
        cardBorder: 'hover:border-[#67e8f9]',
        heroBackground: 'bg-gradient-to-br from-[#0c1c24] via-[#09151c] to-[#050e13] text-[#e0f2fe]',
        renderVisual: () => (
          <div className="relative w-full aspect-[16/9] flex items-center justify-center overflow-hidden border border-[#67e8f9]/30 bg-[#081318] p-4">
            {/* Viewport Frame with DOM tree */}
            <div className="w-full h-full border border-[#67e8f9]/40 bg-[#0c1d25] p-2 space-y-1 font-mono-code text-[10px]">
              <div className="flex items-center gap-1.5 pb-1 border-b border-[#67e8f9]/20">
                <span className="w-2 h-2 rounded-full bg-[#e2a369]" />
                <span className="w-2 h-2 rounded-full bg-[#93c6ae]" />
                <span className="text-[9px] text-[#67e8f9]/70 ml-1">https://edurah.edu/app</span>
              </div>
              <p className="text-[#e2a369] pt-1">&lt;Layout viewport=&quot;responsive&quot;&gt;</p>
              <p className="pl-3 text-[#67e8f9]">&lt;Component state=&#123;active&#125; /&gt;</p>
              <p className="text-[#e2a369]">&lt;/Layout&gt;</p>
            </div>
          </div>
        ),
      };

    default:
      return {
        slug,
        name: 'Curriculum Discipline',
        discipline: 'Academic Studies',
        tagline: 'Structured learning sequences designed for deep conceptual retention.',
        accentText: 'text-[#81512f]',
        badgeBg: 'bg-[#f3e5d4] text-[#81512f] border-[#d8a471]/50',
        cardBorder: 'hover:border-[#d8a471]',
        heroBackground: 'bg-gradient-to-br from-[#171819] via-[#101416] to-[#0b0e0f] text-[#ede8dc]',
        renderVisual: () => (
          <div className="relative w-full aspect-[16/9] flex items-center justify-center overflow-hidden border border-[#d8a471]/30 bg-[#101416]">
            <BookOpen className="w-12 h-12 text-[#d8a471]/40" />
          </div>
        ),
      };
  }
}
