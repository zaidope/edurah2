import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentService } from '@/lib/content';
import VideoPlayer from '@/components/video/VideoPlayer';
import LessonSidebar from '@/components/course/LessonSidebar';
import LessonControls from './LessonControls';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Download, 
  Award, 
  ChevronRight, 
  Lightbulb 
} from 'lucide-react';

interface LessonPageProps {
  params: Promise<{ slug: string; lessonSlug: string }>;
}

export default async function LessonDetailPage({ params }: LessonPageProps) {
  const { slug, lessonSlug } = await params;
  const data = ContentService.getLessonBySlug(slug, lessonSlug);

  if (!data) {
    notFound();
  }

  const { lesson, course, nextLesson, prevLesson } = data;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      
      {/* PERSISTENT LMS SIDEBAR (DESKTOP) / DRAWER (MOBILE) */}
      <LessonSidebar course={course} currentLessonSlug={lesson.slug} />

      {/* MAIN LESSON CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8">
        
        {/* BREADCRUMB HEADER */}
        <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold">{course.title}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 truncate max-w-xs">{lesson.title}</span>
          </div>
          <span className="flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> {lesson.duration}
          </span>
        </div>

        {/* VIDEO PLAYER COMPONENT */}
        <div className="space-y-4">
          <VideoPlayer videoId={lesson.videoId} title={lesson.title} />

          {/* TITLE & LESSON CONTROLS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{lesson.title}</h1>
              <p className="text-xs text-slate-500 mt-1">Duration: {lesson.duration}</p>
            </div>

            {/* INTERACTIVE MARK COMPLETE & NEXT BUTTONS */}
            <LessonControls 
              lessonId={lesson.id} 
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
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" /> About This Lesson
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {lesson.description}
              </p>
            </div>

            {/* LEARNING OBJECTIVES */}
            {lesson.learningObjectives.length > 0 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Learning Objectives
                </h2>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  {lesson.learningObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="leading-snug">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* KEY CONCEPTS */}
            {lesson.keyConcepts.length > 0 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600" /> Key Concepts & Mental Models
                </h2>
                <div className="space-y-3">
                  {lesson.keyConcepts.map((kc, i) => (
                    <div key={i} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                      <div className="font-bold text-sm text-slate-900">{kc.title}</div>
                      <p className="text-xs text-slate-600 leading-relaxed">{kc.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR: RESOURCES & QUIZ ACCESS */}
          <div className="space-y-6">
            
            {/* QUIZ CALLOUT IF LINKED */}
            {lesson.quizId && (
              <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 space-y-3 text-center shadow-xs">
                <Award className="w-8 h-8 text-amber-600 mx-auto" />
                <h3 className="font-bold text-amber-950 text-base">Lesson Knowledge Check</h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Verify your understanding of memory and execution principles before advancing.
                </p>
                <Link
                  href={`/quizzes/${lesson.quizId}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Award className="w-4 h-4" /> Start Lesson Quiz
                </Link>
              </div>
            )}

            {/* DOWNLOADABLE RESOURCES */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Lesson Resources
              </h3>

              {lesson.resources.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No additional files attached for this lesson.</p>
              ) : (
                <div className="space-y-2">
                  {lesson.resources.map(res => (
                    <a
                      key={res.id}
                      href="#"
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <div>
                          <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-600">{res.title}</div>
                          <div className="text-[10px] text-slate-500">{res.type.toUpperCase()} • {res.size}</div>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                    </a>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

