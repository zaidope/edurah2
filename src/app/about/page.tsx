import React from 'react';
import { Sparkles, Target, Shield, BrainCircuit, Compass, Award, BookOpen } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedPage from '@/components/layout/AnimatedPage';

export default function AboutPage() {
  return (
    <PageTransition>
      <AnimatedPage>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-16">
          
          {/* HERO STATEMENT */}
          <div className="text-center space-y-5 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#d8a471]" /> Pedagogical Philosophy
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif-hero font-normal text-[#171819] tracking-tight leading-[1.15]">
              Mastery Through Intuition, Rigor, & Purposeful Practice
            </h1>
            <p className="text-sm sm:text-base text-[#6f6b63] leading-relaxed max-w-2xl mx-auto">
              Edurah was founded on an enduring educational premise: profound technical and scientific understanding cannot be nurtured through fragmented trivia or superficial clips.
            </p>
          </div>

          {/* CORE VALUES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Rigorous Foundations',
                desc: 'We begin from first principles and conceptual models, building upwards to creative synthesis and academic confidence.',
                icon: Target,
              },
              {
                title: 'Curated Environments',
                desc: 'Each grade cohort enters a tailored visual world designed specifically for their developmental stage and attention architecture.',
                icon: Compass,
              },
              {
                title: 'Active Memory Retrieval',
                desc: 'Every unit is reinforced with immediate interactive assessments to synthesize knowledge into durable long-term retention.',
                icon: BrainCircuit,
              }
            ].map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="edurah-card-warm p-8 rounded-2xl space-y-4 shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-serif-heading font-normal text-[#171819]">{v.title}</h3>
                  <p className="text-xs sm:text-sm text-[#6f6b63] leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>

          {/* METHODOLOGY SECTION */}
          <div className="edurah-card-warm p-8 sm:p-12 rounded-3xl space-y-8 shadow-xs border border-[#d8d0c2]">
            <div className="space-y-2 border-b border-[#e5ded0] pb-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8e5a2b]">The Edurah Method</span>
              <h2 className="text-2xl sm:text-3xl font-serif-heading font-normal text-[#171819]">
                Our Pedagogical Architecture
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs sm:text-sm text-[#6f6b63] leading-relaxed">
              <div className="space-y-2">
                <span className="font-mono-code text-[#8e5a2b] font-bold text-xs">01</span>
                <h4 className="font-serif-heading font-normal text-base text-[#171819]">Visual Intuition First</h4>
                <p>
                  Concepts in mathematics, computational thinking, and the sciences are visualized intuitively before formal mathematical syntax is introduced.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono-code text-[#8e5a2b] font-bold text-xs">02</span>
                <h4 className="font-serif-heading font-normal text-base text-[#171819]">Developmental Worlds</h4>
                <p>
                  A 7-year-old and a 16-year-old learn differently. Edurah crafts distinct visual languages and interaction models across Junior, Middle, and Senior tiers.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono-code text-[#8e5a2b] font-bold text-xs">03</span>
                <h4 className="font-serif-heading font-normal text-base text-[#171819]">Strict Grade Isolation</h4>
                <p>
                  Learners are focused solely on the curriculum aligned with their academic level, eliminating cognitive clutter and competitive comparison.
                </p>
              </div>
            </div>
          </div>

        </div>
      </AnimatedPage>
    </PageTransition>
  );
}
