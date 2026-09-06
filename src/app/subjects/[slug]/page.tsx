import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentService } from '@/lib/content';
import CourseCard from '@/components/course/CourseCard';
import { BookOpen, Film, Award, ChevronLeft, ArrowRight } from 'lucide-react';

interface SubjectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SubjectDetailPage({ params }: SubjectPageProps) {
  const { slug } = await params;
  const subject = ContentService.getSubjectBySlug(slug);

  if (!subject) {
    notFound();
  }

  const courses = ContentService.getCoursesBySubject(subject.id);
  const quizzes = ContentService.getQuizzes().filter(q => q.subjectId === subject.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* BREADCRUMB */}
      <div>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="w-4 h-4" /> All Subjects
        </Link>
      </div>

      {/* SUBJECT HERO HEADER */}
      <div className="rounded-2xl bg-white border border-slate-200 p-8 sm:p-12 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
              {subject.category} Specialization
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              {subject.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {subject.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>{subject.courseCount} Courses</span>
              </div>
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-slate-400" />
                <span>{subject.lessonCount} Video Lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span>{quizzes.length} Quizzes</span>
              </div>
            </div>
          </div>

          <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
            <img
              src={subject.bannerImage}
              alt={subject.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* COURSES IN THIS SUBJECT */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold text-slate-900">Courses in {subject.name}</h2>
          <p className="text-xs text-slate-500 mt-1">Structured learning paths ordered by depth and progression.</p>
        </div>

        {courses.length === 0 ? (
          <div className="p-8 rounded-xl bg-white border border-slate-200 text-center text-slate-500 space-y-2">
            <p>No courses available in this subject track yet.</p>
            <Link href="/courses" className="text-xs font-medium text-blue-600 hover:underline">
              Browse all courses →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* SUBJECT QUIZZES */}
      {quizzes.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Subject Assessment Quizzes</h2>
              <p className="text-xs text-slate-500 mt-1">Test your mastery of core principles in this subject.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizzes.map(quiz => (
              <Link
                key={quiz.id}
                href={`/quizzes/${quiz.id}`}
                className="p-5 rounded-xl bg-white border border-slate-200 flex items-center justify-between group edurah-card-hover"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold">
                    <Award className="w-4 h-4" /> {quiz.questions.length} Questions
                  </div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-800 transition-colors">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{quiz.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

