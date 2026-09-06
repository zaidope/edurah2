import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentService } from '@/lib/content';
import CourseSyllabus from '@/components/course/CourseSyllabus';
import { 
  BookOpen, 
  Clock, 
  Star, 
  ChevronLeft, 
  PlayCircle, 
  Calendar 
} from 'lucide-react';

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = ContentService.getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  // Get first lesson to direct user
  const firstLesson = course.chapters[0]?.lessons[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* BREADCRUMB */}
      <div>
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="w-4 h-4" /> All Courses
        </Link>
      </div>

      {/* COURSE HEADER HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: TITLE & OVERVIEW */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              {course.subjectName}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {course.level} Level
            </span>
            <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{course.rating} Rating</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {course.title}
          </h1>

          <p className="text-base text-slate-600 leading-relaxed">
            {course.description}
          </p>

          {/* INSTRUCTOR BADGE */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center gap-4 shadow-xs">
            <img
              src={course.instructor.avatar}
              alt={course.instructor.name}
              className="w-12 h-12 rounded-full object-cover border border-slate-200"
            />
            <div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Instructor</div>
              <div className="font-bold text-slate-900 text-base">{course.instructor.name}</div>
              <div className="text-xs text-slate-500">{course.instructor.bio}</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION CARD */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6 sticky top-24 shadow-xs">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
              <PlayCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-2 text-slate-500"><Clock className="w-4 h-4 text-slate-400" /> Total Duration</span>
              <span className="font-bold text-slate-900">{course.duration}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-2 text-slate-500"><BookOpen className="w-4 h-4 text-slate-400" /> Lessons</span>
              <span className="font-bold text-slate-900">{course.lessonCount} Modules</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-2 text-slate-500"><Calendar className="w-4 h-4 text-slate-400" /> Last Updated</span>
              <span className="font-bold text-slate-900">{course.updatedAt}</span>
            </div>
          </div>

          {firstLesson && (
            <Link
              href={`/courses/${course.slug}/lessons/${firstLesson.slug}`}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all cursor-pointer shadow-xs"
            >
              <PlayCircle className="w-5 h-5 text-white" />
              <span>Start Learning Now</span>
            </Link>
          )}
        </div>

      </div>

      {/* SYLLABUS SECTION */}
      <section className="space-y-6 pt-6 border-t border-slate-200">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold text-slate-900">Course Curriculum & Syllabus</h2>
          <p className="text-xs text-slate-500 mt-1">Explore all chapters, video lessons, and interactive quizzes.</p>
        </div>

        <CourseSyllabus chapters={course.chapters} courseSlug={course.slug} />
      </section>

    </div>
  );
}

