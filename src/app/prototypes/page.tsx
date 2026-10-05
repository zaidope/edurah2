import Link from 'next/link';
import { ArrowUpRight, BookOpen, Building2, GraduationCap, Settings2, UserRound } from 'lucide-react';

const groups = [
  {
    title: 'Student',
    icon: BookOpen,
    pages: [
      ['student-dashboard.html', 'Student Dashboard', 'Learning overview and daily activity.'],
      ['my-learning.html', 'My Learning', 'Courses, milestones, and current progress.'],
      ['rah-activity-studio.html', 'RAH Activity Studio', 'Personalized practice activities.'],
      ['skill-insights.html', 'Skill Insights', 'Skill development and learning signals.'],
      ['speaking-studio.html', 'Speaking Studio', 'Speech practice and feedback.'],
      ['edurah-passport.html', 'Edurah Passport', 'A summary of learning achievements.'],
    ],
  },
  {
    title: 'Teacher',
    icon: GraduationCap,
    pages: [
      ['teacher-dashboard.html', 'Teacher Dashboard', 'Class overview and quick actions.'],
      ['teacher-my-classes.html', 'My Classes', 'Class roster and cohort summaries.'],
      ['class-intelligence.html', 'Class Intelligence', 'Class-level learning insights.'],
      ['at-risk-detection.html', 'At-Risk Detection', 'Students who may need timely support.'],
      ['rah-interventions.html', 'RAH Interventions', 'Suggested intervention plans.'],
      ['ai-activity-assignment.html', 'AI Activity Assignment', 'Prepare and assign targeted activities.'],
      ['student-growth-reports.html', 'Student Growth Reports', 'Individual learner progress reports.'],
    ],
  },
  {
    title: 'School',
    icon: Building2,
    pages: [
      ['school-dashboard.html', 'School Dashboard', 'Institution overview and activity.'],
      ['school-intelligence.html', 'School Intelligence', 'School-wide learning signals.'],
      ['school-students.html', 'School Students', 'Student directory and filters.'],
      ['school-teachers.html', 'School Teachers', 'Teacher directory and filters.'],
      ['school-reports.html', 'School Reports', 'Institutional reporting views.'],
    ],
  },
  {
    title: 'Getting started',
    icon: Settings2,
    pages: [
      ['index.html', 'Edurah Home', 'The original public experience.'],
      ['login.html', 'Prototype Login', 'Sign-in screen for the prototype.'],
      ['setup.html', 'Supabase Setup', 'Browser-side connection configuration.'],
    ],
  },
];

export default function PrototypesPage() {
  return (
    <main className="min-h-[calc(100vh-4.5rem)] bg-[#f6f2e9] px-5 py-10 text-[#171819] sm:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="max-w-3xl space-y-3 border-b border-[#d8d0c2] pb-7">
          <p className="edurah-eyebrow"><span /> EXPERIENCE LIBRARY</p>
          <h1 className="font-serif-hero text-3xl font-normal sm:text-5xl">Edurah portal pages</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[#555048]">
            These links open role-protected workspaces in the Edurah application. Student, teacher, and admin views use the application’s authenticated data paths.
          </p>
        </header>

        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <section key={group.title} className="space-y-4">
              <h2 className="flex items-center gap-2 border-b border-[#d8d0c2] pb-3 font-serif-heading text-xl font-normal">
                <Icon className="h-5 w-5 text-[#81512f]" /> {group.title}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.pages.map(([slug, title, description]) => (
                  <Link
                    key={slug}
                    href={`/prototypes/${slug}`}
                    className="group flex min-h-28 items-start justify-between gap-4 border border-[#d8d0c2] bg-white p-4 transition-colors hover:border-[#b98555] hover:bg-[#fcfbf9]"
                  >
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold">{title}</h3>
                      <p className="text-xs leading-relaxed text-[#706b63]">{description}</p>
                    </div>
                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#81512f] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <div className="flex items-center gap-2 border-t border-[#d8d0c2] pt-5 text-xs text-[#706b63]">
          <UserRound className="h-4 w-4" /> Access is checked by the destination workspace.
        </div>
      </div>
    </main>
  );
}