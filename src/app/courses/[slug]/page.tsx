'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import { Course } from '@/types';
import CourseSyllabus from '@/components/course/CourseSyllabus';
import {
  BookOpen,
  Clock,
  Star,
  ChevronLeft,
  PlayCircle,
  Calendar,
  Lock,
  ArrowRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedPage from '@/components/layout/AnimatedPage';
import CourseDiscussionBoard from '@/components/discussions/CourseDiscussionBoard';
import AnnouncementsFeed from '@/components/announcements/AnnouncementsFeed';

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { profile, loading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseLoadError, setCourseLoadError] = useState('');

  useEffect(() => {
    if (loading || !slug) return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setCourseLoading(true);
      setCourseLoadError('');
      try {
        const gradeId = profile?.role === 'student' || profile?.role === 'teacher' ? profile.gradeId : undefined;
        const status = profile?.role === 'admin' || profile?.role === 'teacher' ? 'all' : 'published';
        const courses = await ContentService.loadCourses(gradeId, status);
        if (active) setCourse(courses.find((item) => item.slug === slug) || null);
      } catch (error: unknown) {
        if (active) setCourseLoadError(error instanceof Error ? error.message : 'Could not load this course.');
      } finally {
        if (active) setCourseLoading(false);
      }
    });
    return () => { active = false; };
  }, [slug, loading, profile?.gradeId, profile?.role]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#d8a471] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (courseLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#d8a471] border-t-transparent animate-spin" /></div>;
  }

  if (courseLoadError) {
    return <div role="alert" className="max-w-3xl mx-auto my-16 border border-rose-300 bg-rose-50 px-5 py-4 text-sm text-rose-900">{courseLoadError}</div>;
  }

  if (!course) {
    notFound();
  }

  const courseGradeObj = ContentService.getGradeById(course.gradeId);
  const userGradeObj = profile?.gradeId ? ContentService.getGradeById(profile.gradeId) : null;

  // Grade boundary status
  const isEnrolledInGrade = profile && (profile.role === 'admin' || profile.gradeId === course.gradeId);
  const isEnrolledInOtherGrade = profile && profile.role === 'student' && profile.gradeId !== course.gradeId;

  // First lesson target
  const firstLesson = course.chapters[0]?.lessons[0];
  const lessonHref = firstLesson ? `/courses/${course.slug}/lessons/${firstLesson.slug}` : '#';

  return (
    <PageTransition>
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-10">
          
          {/* BREADCRUMB & GRADE BADGE */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d8d0c2] pb-4">
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#81512f] hover:text-[#171819] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Course Catalog
            </Link>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#f3e5d4] text-[#81512f] border border-[#d8a471]/40">
                {courseGradeObj?.name} Curriculum
              </span>
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#101719] text-[#e6b981] border border-[#d8a471]/30">
                {course.subjectName}
              </span>
            </div>
          </div>

          {/* COURSE HEADER HERO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            
            {/* LEFT COLUMN: TITLE & OVERVIEW */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <p className="edurah-eyebrow">
                  <span /> Course Overview & Syllabus
                </p>

                <h1 className="font-serif-hero text-3xl sm:text-5xl font-normal text-[#171819] tracking-tight leading-tight">
                  {course.title}
                </h1>
              </div>

              <p className="text-sm sm:text-base text-[#555048] leading-relaxed">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-xs text-[#706b63] pt-4 border-t border-[#e8e2d5]">
                <div className="flex items-center gap-2 font-medium">
                  <Clock className="w-4 h-4 text-[#a59e93]" />
                  <span>{course.duration} Total Duration</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <BookOpen className="w-4 h-4 text-[#a59e93]" />
                  <span>{course.lessonCount} Structured Lessons</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Star className="w-4 h-4 fill-[#d8a471] text-[#d8a471]" />
                  <span>{course.rating} Student Rating</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Calendar className="w-4 h-4 text-[#a59e93]" />
                  <span>Curriculum Verified for 2026</span>
                </div>
              </div>

              {/* GUEST BANNER / OTHER GRADE BANNER */}
              {!profile && (
                <div className="p-4 bg-[#fcfbf9] border border-[#d8d0c2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#171819] block">
                      Exploring Edurah Curriculum
                    </span>
                    <p className="text-xs text-[#555048]">
                      You can review all lesson outlines and objectives below. Sign in to watch video lectures, take quizzes, and track completion.
                    </p>
                  </div>
                  <Link
                    href={`/login?returnUrl=${encodeURIComponent(lessonHref)}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#d8a471] hover:bg-[#e8b57c] text-[#172020] text-xs font-bold uppercase tracking-wider transition-colors flex-shrink-0"
                  >
                    <span>Sign In to Learn</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {isEnrolledInOtherGrade && (
                <div className="p-4 bg-[#fbf9f5] border border-[#d8d0c2] text-xs text-[#555048] space-y-1">
                  <div className="font-bold text-[#81512f] uppercase tracking-wider">
                    Grade Notice
                  </div>
                  <p>
                    You are enrolled in <strong>{userGradeObj?.name}</strong>. You are currently reviewing the public syllabus for <strong>{courseGradeObj?.name}</strong>. Your active learning dashboard is tailored to your assigned grade.
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: ACTION CARD */}
            <div className="bg-white p-6 border border-[#d8d0c2] shadow-sm space-y-6">
              <div className="relative aspect-video overflow-hidden bg-[#ede8dc] border border-[#d8d0c2]">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                {/* PRIMARY ACTION BUTTON */}
                {profile ? (
                  isEnrolledInGrade ? (
                    <Link
                      href={lessonHref}
                      className="w-full py-3.5 bg-[#171819] hover:bg-[#0b0d0e] text-[#f6f2e9] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4 text-[#d8a471]" /> Start Lesson Sequence
                    </Link>
                  ) : (
                    <div className="text-center p-3 bg-[#fbf9f5] border border-[#d8d0c2] text-xs text-[#706b63]">
                      Restricted to {courseGradeObj?.name} enrolled students
                    </div>
                  )
                ) : (
                  <Link
                    href={`/login?returnUrl=${encodeURIComponent(lessonHref)}`}
                    className="w-full py-3.5 bg-[#d8a471] hover:bg-[#e8b57c] text-[#172020] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Lock className="w-4 h-4" /> Sign In to Access Lessons
                  </Link>
                )}

                {/* INSTRUCTOR CARD */}
                <div className="p-4 bg-[#fcfbf9] border border-[#e8e2d5] space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#81512f] block">
                    Curriculum Instructor
                  </span>
                  <div className="flex items-start gap-3">
                    <img
                      src={course.instructor.avatar}
                      alt={course.instructor.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#d8d0c2] flex-shrink-0"
                    />
                    <div className="space-y-1">
                      <span className="font-bold text-xs text-[#171819] block">{course.instructor.name}</span>
                      <span className="text-[#706b63] text-[11px] block">{course.instructor.role}</span>
                      <p className="text-[11px] text-[#555048] leading-relaxed pt-1">{course.instructor.bio}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COURSE ANNOUNCEMENTS */}
          <div className="space-y-4 pt-8 border-t border-[#d8d0c2]">
            <AnnouncementsFeed scope="course" courseId={course.id} />
          </div>

          {/* SYLLABUS BREAKDOWN */}
          <div className="space-y-6 pt-8 border-t border-[#d8d0c2]">
            <div className="space-y-1">
              <p className="edurah-eyebrow">
                <span /> Structured Units
              </p>
              <h2 className="font-serif-heading text-2xl sm:text-3xl font-normal text-[#171819]">
                Course Chapters & Lesson Breakdown
              </h2>
            </div>
            <CourseSyllabus chapters={course.chapters} courseSlug={course.slug} />
          </div>

          {/* COURSE DISCUSSION FORUM */}
          <div className="space-y-6 pt-8 border-t border-[#d8d0c2]">
            <CourseDiscussionBoard courseId={course.id} />
          </div>

        </div>
      </AnimatedPage>
    </PageTransition>
  );
}
