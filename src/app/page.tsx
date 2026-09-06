import React from 'react';
import Link from 'next/link';
import HeroPlaceholder from '@/components/hero/HeroPlaceholder';
import CourseCard from '@/components/course/CourseCard';
import { ContentService } from '@/lib/content';
import { 
  BookOpen, 
  Layers, 
  Award, 
  PlayCircle, 
  BarChart3, 
  Zap, 
  ArrowRight, 
  Sparkles, 
  BrainCircuit, 
  ShieldCheck, 
  Target 
} from 'lucide-react';

export default function HomePage() {
  const subjects = ContentService.getSubjects().filter(s => s.featured);
  const courses = ContentService.getCourses().filter(c => c.featured);
  const quizzes = ContentService.getQuizzes();

  return (
    <div className="space-y-20 pb-16">
      
      {/* HERO SECTION (ISOLATED PLACEHOLDER FOR FUTURE SCROLL ANIMATION) */}
      <HeroPlaceholder />

      {/* FEATURED SUBJECTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <Layers className="w-4 h-4 text-blue-600" /> Core Learning Domains
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Explore Top Subjects</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Curriculum organized into distinct specialization tracks designed for long-term depth.
            </p>
          </div>
          <Link
            href="/subjects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>View All Subjects</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {subjects.map(subject => (
            <Link
              key={subject.id}
              href={`/subjects/${subject.slug}`}
              className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between space-y-6 group edurah-card-hover"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {subject.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {subject.shortDescription}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{subject.courseCount} Courses</span>
                <span className="text-blue-600 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED COURSES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" /> Featured Syllabi
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Featured Courses</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              High-production video modules with code examples, visual memory breakdowns, and lesson quizzes.
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* HOW EDUURA WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-xs space-y-10 relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
              <Zap className="w-3.5 h-3.5 text-blue-600" /> Pedagogical Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How Edurah Works</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Designed around active retrieval, visual clarity, and progressive building.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {[
              {
                step: '01',
                title: 'Select Track',
                desc: 'Pick your subject domain and choose structured courses suited for your experience level.',
                icon: Layers,
                color: 'text-blue-600'
              },
              {
                step: '02',
                title: 'Watch HD Lessons',
                desc: 'Stream focused video modules breaking down complex theories into clear mental models.',
                icon: PlayCircle,
                color: 'text-blue-600'
              },
              {
                step: '03',
                title: 'Test Understanding',
                desc: 'Take instant quizzes after each chapter to reinforce memory retention and identify gaps.',
                icon: Award,
                color: 'text-amber-600'
              },
              {
                step: '04',
                title: 'Track Progress',
                desc: 'Monitor completed chapters, quiz scores, and maintain learning momentum over time.',
                icon: BarChart3,
                color: 'text-emerald-600'
              }
            ].map((st, i) => {
              const Icon = st.icon;
              return (
                <div key={i} className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-slate-300">{st.step}</span>
                    <Icon className={`w-5 h-5 ${st.color}`} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-base">{st.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY EDURAH - VALUE PROPOSITION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Educational Philosophy
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              Built for Depth, Not Surface Impressions
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generic online platforms bombard learners with shallow introductory summaries. Edurah focuses on conceptual depth, providing complete mathematical derivations and architectural foundations.
            </p>
            <div className="pt-2">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white shadow-xs"
              >
                <span>Read Our Methodology</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: 'No Filler Content',
                desc: 'Every video lesson is edited for maximum information density without marketing bloat.',
                icon: Target
              },
              {
                title: 'Interactive Quizzes',
                desc: 'Check your grasp immediately with explanations explaining why wrong options failed.',
                icon: BrainCircuit
              },
              {
                title: 'Clean Abstraction Architecture',
                desc: 'Built to run seamlessly without expensive paid subscriptions or complex login paywalls.',
                icon: ShieldCheck
              },
              {
                title: 'Extensible Curriculum',
                desc: 'Content models updated regularly with cutting-edge engineering topics and tools.',
                icon: Sparkles
              }
            ].map((v, idx) => {
              const Icon = v.icon;
              return (
                <div key={idx} className="p-6 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{v.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* QUIZ PRACTICE CTA SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white border border-blue-500 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-md">
          <div className="space-y-3 max-w-xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-medium border border-white/20">
              <Award className="w-3.5 h-3.5 text-amber-300" /> Interactive Self-Assessment
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Ready to Test Your Understanding?
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Challenge yourself with our curated quizzes on algorithms, memory architectures, React server components, and neural network math.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full md:w-auto">
            <Link
              href="/quizzes"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white hover:bg-slate-50 text-blue-700 font-bold text-sm shadow-xs cursor-pointer"
            >
              <Award className="w-4 h-4 text-blue-600" />
              <span>Explore All Quizzes ({quizzes.length})</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

