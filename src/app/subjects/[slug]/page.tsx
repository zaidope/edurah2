import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentService } from '@/lib/content';
import CourseCard from '@/components/course/CourseCard';
import { BookOpen, Film, Award, ChevronLeft, ArrowRight } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedPage from '@/components/layout/AnimatedPage';
import { getSubjectIdentity } from '@/components/subjects/SubjectMotif';

interface SubjectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SubjectDetailPage({ params }: SubjectPageProps) {
  const { slug } = await params;
  const subject = ContentService.getSubjectBySlug(slug);

  if (!subject) {
    notFound();
  }

  const identity = getSubjectIdentity(slug);
  const courses = ContentService.getCoursesBySubject(subject.id);
  const quizzes = ContentService.getQuizzes().filter((q) => q.subjectId === subject.id);

  return (
    <PageTransition>
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-10">
          {/* BREADCRUMB */}
          <div>
            <Link
              href="/subjects"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#81512f] hover:text-[#171819] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> All Subject Tracks
            </Link>
          </div>

          {/* SUBJECT HERO HEADER WITH DISCIPLINE IDENTITY */}
          <div className={`p-8 sm:p-12 border border-[#d8d0c2] ${identity.heroBackground} shadow-lg relative overflow-hidden`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${identity.badgeBg}`}>
                  {subject.category} · {identity.discipline}
                </span>

                <h1 className="font-serif-hero text-3xl sm:text-5xl font-normal tracking-tight text-white leading-tight">
                  {subject.name}
                </h1>

                <p className="text-sm sm:text-base opacity-90 leading-relaxed max-w-xl">
                  {subject.description}
                </p>

                <div className="flex flex-wrap items-center gap-6 pt-3 text-xs opacity-80 border-t border-white/15">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#d8a471]" />
                    <span>{subject.courseCount} Courses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#d8a471]" />
                    <span>{subject.lessonCount} Video Lectures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#dca66c]" />
                    <span>{quizzes.length} Quizzes</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                {identity.renderVisual()}
              </div>
            </div>
          </div>

          {/* COURSES IN THIS SUBJECT */}
          <section className="space-y-6">
            <div className="border-b border-[#d8d0c2] pb-4">
              <p className="edurah-eyebrow">
                <span /> Structured Curricula
              </p>
              <h2 className="font-serif-heading text-2xl sm:text-3xl font-normal text-[#171819]">
                Courses in {subject.name}
              </h2>
              <p className="text-xs text-[#555048] mt-1">
                Sequenced learning paths ordered by foundational concepts through advanced mastery.
              </p>
            </div>

            {courses.length === 0 ? (
              <div className="p-10 bg-white border border-[#d8d0c2] text-center space-y-2">
                <p className="text-xs text-[#706b63]">No courses published under this discipline yet.</p>
                <Link href="/courses" className="text-xs font-bold uppercase tracking-wider text-[#81512f] hover:underline">
                  Browse all active courses →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>
        </div>
      </AnimatedPage>
    </PageTransition>
  );
}
