import React from 'react';
import { Sparkles, Target, Shield, BrainCircuit } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      
      {/* HERO STATEMENT */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Educational Philosophy
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Democratizing Deep Technical Knowledge Through Video & Active Practice
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Edurah was founded on a simple realization: modern software engineering, computer science, and AI cannot be mastered through 30-second clips or shallow code snippets alone.
        </p>
      </div>

      {/* CORE VALUES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Rigorous Depth',
            desc: 'We start from mathematical equations and hardware execution boundaries, building up to full production software.',
            icon: Target,
            color: 'text-blue-600'
          },
          {
            title: 'Zero Distractions',
            desc: 'Clean user interfaces with zero annoying popups, aggressive paywalls, or algorithm-driven recommendation traps.',
            icon: Shield,
            color: 'text-blue-600'
          },
          {
            title: 'Active Memory Retrieval',
            desc: 'Every chapter is paired with instant conceptual quizzes so learners encode models into long-term memory.',
            icon: BrainCircuit,
            color: 'text-amber-600'
          }
        ].map((v, i) => {
          const Icon = v.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${v.color}`} />
              </div>
              <h3 className="text-base font-bold text-slate-900">{v.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{v.desc}</p>
            </div>
          );
        })}
      </div>

      {/* METHODOLOGY SECTION */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 space-y-6 shadow-xs">
        <h2 className="text-2xl font-bold text-slate-900">Our Pedagogical Framework</h2>
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            1. <strong className="text-slate-900">Visual Intuition First:</strong> Concepts like CPU instruction cycles, neural weight matrices, or linear span are visualized geometrically before diving into syntax.
          </p>
          <p>
            2. <strong className="text-slate-900">Incremental Complexity:</strong> Lessons are ordered strictly by dependency, ensuring learners never hit a wall due to unexplained prerequisite terms.
          </p>
          <p>
            3. <strong className="text-slate-900">Open Data Abstraction:</strong> Edurah uses transparent structured data schemas, making all progress, content, and quiz results easily transferable and cost-efficient.
          </p>
        </div>
      </div>

    </div>
  );
}

