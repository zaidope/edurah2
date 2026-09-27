'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import { ProgressService } from '@/lib/progress';
import VideoPlayer from '@/components/video/VideoPlayer';
import LessonSidebar from '@/components/course/LessonSidebar';
import LessonControls from './LessonControls';
import GradeForbiddenAccess from '@/components/auth/GradeForbiddenAccess';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Award,
  ChevronRight,
  Lightbulb,
  ArrowLeft,
  Lock
} from 'lucide-react';

export default function LessonDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const lessonSlug = params?.lessonSlug as string;
  const { profile, loading } = useAuth();
  const [controlsKey, setControlsKey] = React.useState(0);

  const data = ContentService.getLessonBySlug(slug, lessonSlug);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f2e9]">
        <div className="w-8 h-8 border-2 border-[#d8a471] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  const { lesson, course, nextLesson, prevLesson } = data;
  const courseGradeObj = ContentService.getGradeById(course.gradeId);
  const userGradeObj = profile?.gradeId ? ContentService.getGradeById(profile.gradeId) : null;

  // 1. Unauthenticated users cannot access lesson content!
  if (!profile) {
    return (
      <GradeForbiddenAccess
        isUnauthenticated={true}
        requiredGradeName={courseGradeObj?.name || course.gradeId}
        resourceTitle={lesson.title}
        resourceType="lesson"
      />
    );
  }

  // 2. Grade boundary restriction: Check user grade against course grade!
  const isAllowed = profile.role === 'admin' || profile.gradeId === course.gradeId;

  if (!isAllowed) {
    return (
      <GradeForbiddenAccess
        requiredGradeName={courseGradeObj?.name || course.gradeId}
        userGradeName={userGradeObj?.name || profile.gradeId}
        userRole={profile.role}
        resourceTitle={lesson.title}
        resourceType="lesson"
      />
    );
  }

  // 3. Server-side / Authoritative Prerequisite Enforcement
  if (lesson.prerequisiteLessonId && profile.role !== 'admin' && profile.role !== 'teacher') {
    const isPrereqDone = ProgressService.isLessonCompleted(lesson.prerequisiteLessonId, profile.id);
    if (!isPrereqDone) {
      const allLessons = course.chapters.flatMap((ch) => ch.lessons);
      const prereqLesson = allLessons.find((l) => l.id === lesson.prerequisiteLessonId);
      return (
        <div className="min-h-screen bg-[#f6f2e9] flex flex-col lg:flex-row text-[#171819]">
          <LessonSidebar course={course} currentLessonSlug={lesson.slug} />
          <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full flex items-center justify-center">
            <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-3xl p-8 max-w-lg text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#fff5f5] text-[#c53030] flex items-center justify-center mx-auto border border-[#feb2b2]">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-serif text-[#171819]">Prerequisite Lesson Required</h2>
              <p className="text-sm text-[#706b63] leading-relaxed">
                In accordance with academic progression standards, you must complete the prerequisite lesson{' '}
                <strong>&quot;{prereqLesson?.title || 'Prerequisite Lesson'}&quot;</strong> before unlocking this module.
              </p>
              {prereqLesson && (
                <div className="pt-2">
                  <Link
                    href={`/courses/${course.slug}/lessons/${prereqLesson.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#81512f] text-white text-sm font-medium hover:bg-[#6c4326] transition-colors"
                  >
                    Go to Prerequisite Lesson
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </main>
        </div>
      );
    }
  }

  const storedRecord = ProgressService.getLessonRecord(lesson.id);
  const initialPosition = storedRecord?.lastPositionSeconds || 0;

  const handleVideoProgress = (position: number, duration: number, interval?: [number, number], rate?: number) => {
    void ProgressService.saveVideoProgress(course, lesson.id, position, duration, interval, rate);
  };

  const handleVideoCompleted = () => {
    setControlsKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-[#f6f2e9] flex flex-col lg:flex-row text-[#171819]">
      {/* PERSISTENT SIDEBAR */}
      <LessonSidebar course={course} currentLessonSlug={lesson.slug} />

      {/* MAIN LESSON CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8">
        {/* BREADCRUMB HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#706b63] border-b border-[#d8d0c2] pb-4">
          <div className="flex items-center gap-2">
            <Link href={`/courses/${course.slug}`} className="text-[#81512f] hover:text-[#171819] font-bold uppercase tracking-wider">
              {course.title}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#a59e93]" />
            <span className="text-[#171819] font-medium truncate max-w-xs">{lesson.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#81512f] uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-[#81512f]" /> {lesson.duration}
            </span>
          </div>
        </div>

        {/* VIDEO PLAYER COMPONENT */}
        <div className="space-y-5">
          <div className="border border-[#d8d0c2] bg-[#101719] shadow-lg overflow-hidden">
            <VideoPlayer
              videoId={lesson.videoId}
              title={lesson.title}
              initialPositionSeconds={initialPosition}
              onProgressUpdate={handleVideoProgress}
              onCompleted={handleVideoCompleted}
            />
          </div>

          {/* TITLE & LESSON CONTROLS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-[#d8d0c2] pb-6">
            <div className="space-y-1">
              <p className="edurah-eyebrow">
                <span /> Active Unit Lesson
              </p>
              <h1 className="font-serif-heading text-2xl sm:text-3xl font-normal text-[#171819]">
                {lesson.title}
              </h1>
            </div>

            {/* INTERACTIVE MARK COMPLETE & NEXT BUTTONS */}
            <LessonControls
              key={controlsKey}
              lessonId={lesson.id}
              lessonType={lesson.type || 'video'}
              course={course}
              nextLessonSlug={nextLesson?.slug}
              prevLessonSlug={prevLesson?.slug}
            />
          </div>
        </div>

        {/* CONTENT SECTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
          {/* MAIN LESSON DETAILS */}
          <div className="lg:col-span-2 space-y-6">
            {/* ABOUT THIS LESSON */}
            <div className="bg-white p-6 border border-[#d8d0c2] space-y-3">
              <h2 className="font-serif-heading text-lg font-normal text-[#171819] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#81512f]" /> Lesson Overview
              </h2>
              <p className="text-xs sm:text-sm text-[#555048] leading-relaxed">
                {lesson.description}
              </p>
            </div>

            {/* LEARNING OBJECTIVES */}
            {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
              <div className="bg-white p-6 border border-[#d8d0c2] space-y-4">
                <h2 className="font-serif-heading text-lg font-normal text-[#171819] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#81512f]" /> Key Competencies & Objectives
                </h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-[#555048]">
                  {lesson.learningObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-[#f6f2e9] text-[#171819] border border-[#d8d0c2] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-mono-code">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* KEY CONCEPTS */}
            {lesson.keyConcepts && lesson.keyConcepts.length > 0 && (
              <div className="bg-white p-6 border border-[#d8d0c2] space-y-4">
                <h2 className="font-serif-heading text-lg font-normal text-[#171819] flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#d8a471]" /> Core Structural Concepts
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {lesson.keyConcepts.map((concept, i) => (
                    <div key={i} className="p-4 bg-[#fcfbf9] border border-[#e8e2d5] space-y-1">
                      <h3 className="font-bold text-[#171819] text-xs uppercase tracking-wider">{concept.title}</h3>
                      <p className="text-xs text-[#555048] leading-relaxed">{concept.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: QUIZ & KNOWLEDGE CHECK */}
          <div className="space-y-6">
            {lesson.quizId && (
              <div className="bg-[#101719] text-[#e9e4d7] p-6 border border-[#d8a471]/30 shadow-md space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#d8a471] uppercase tracking-wider">
                  <Award className="w-4 h-4 text-[#d8a471]" /> Knowledge Assessment
                </div>
                <div>
                  <h3 className="font-serif-heading text-xl font-normal text-white">Lesson Quiz Available</h3>
                  <p className="text-xs text-[#e9e4d7]/70 mt-1 leading-relaxed">
                    Verify your understanding of this lesson's core principles.
                  </p>
                </div>
                <Link
                  href={`/quizzes/${lesson.quizId}`}
                  className="w-full py-3 bg-[#d8a471] hover:bg-[#e8b57c] text-[#172020] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Award className="w-4 h-4 text-[#172020]" /> Take Assessment Quiz
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
