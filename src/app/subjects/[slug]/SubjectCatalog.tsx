'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, BookOpen } from 'lucide-react';
import CourseCard from '@/components/course/CourseCard';
import { ContentService } from '@/lib/content';
import { Course, Quiz } from '@/types';

interface SubjectCatalogProps {
  subjectId: string;
  subjectName: string;
}

export default function SubjectCatalog({ subjectId, subjectName }: SubjectCatalogProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.all([
      ContentService.loadCourses(undefined, 'published'),
      ContentService.loadQuizzes(undefined, undefined, 'published'),
    ]).then(([allCourses, allQuizzes]) => {
      if (!active) return;
      setCourses(allCourses.filter((course) => course.subjectId === subjectId));
      setQuizzes(allQuizzes.filter((quiz) => quiz.subjectId === subjectId));
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : 'Could not load this subject catalog.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [subjectId]);

  const lessonCount = courses.reduce((total, course) => total + course.chapters.reduce((chapterTotal, chapter) => chapterTotal + chapter.lessons.length, 0), 0);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-3 border-y border-[#d8d0c2] py-4 text-center">
        <div><strong className="block text-xl font-serif-heading text-[#171819]">{courses.length}</strong><span className="text-[10px] uppercase tracking-wider text-[#6f6b63]">Published Courses</span></div>
        <div><strong className="block text-xl font-serif-heading text-[#171819]">{lessonCount}</strong><span className="text-[10px] uppercase tracking-wider text-[#6f6b63]">Video Lectures</span></div>
        <div><strong className="block text-xl font-serif-heading text-[#171819]">{quizzes.length}</strong><span className="text-[10px] uppercase tracking-wider text-[#6f6b63]">Assessments</span></div>
      </div>

      {loadError && <div role="alert" className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{loadError}</div>}
      {loading && <p className="text-xs text-[#706b63]">Loading published subject content…</p>}

      <section className="space-y-6">
        <div className="border-b border-[#d8d0c2] pb-4">
          <p className="edurah-eyebrow"><span /> Structured Curricula</p>
          <h2 className="font-serif-heading text-2xl sm:text-3xl font-normal text-[#171819]">Courses in {subjectName}</h2>
          <p className="text-xs text-[#555048] mt-1">Sequenced learning paths ordered by foundational concepts through advanced mastery.</p>
        </div>

        {courses.length === 0 ? (
          <div className="p-10 bg-white border border-[#d8d0c2] text-center space-y-2">
            <BookOpen className="w-8 h-8 text-[#9d978c] mx-auto" />
            <p className="text-xs text-[#706b63]">{loading ? 'Loading published courses…' : 'No courses published under this discipline yet.'}</p>
            <Link href="/courses" className="text-xs font-bold uppercase tracking-wider text-[#81512f] hover:underline">Browse all active courses</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => <CourseCard key={course.id} course={course} />)}
          </div>
        )}
      </section>

      <section className="space-y-6 border-t border-[#d8d0c2] pt-8">
        <div className="flex items-center gap-3 border-b border-[#d8d0c2] pb-4">
          <Award className="w-5 h-5 text-[#d8a471]" />
          <div><h2 className="font-serif-heading text-2xl font-normal text-[#171819]">Subject Assessments</h2><p className="text-xs text-[#6f6b63] mt-1">Published checks for this subject.</p></div>
        </div>
        {quizzes.length === 0 ? (
          <p className="text-xs text-[#706b63]">{loading ? 'Loading assessments…' : 'No assessments published under this discipline yet.'}</p>
        ) : (
          <ul className="divide-y divide-[#e5ded0] border-y border-[#d8d0c2]">
            {quizzes.map((quiz) => (
              <li key={quiz.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                <div><h3 className="text-sm font-semibold text-[#171819]">{quiz.title}</h3><p className="text-xs text-[#6f6b63] mt-1">{quiz.description}</p></div>
                <Link href={`/quizzes/${quiz.id}`} className="inline-flex items-center gap-2 text-xs font-semibold text-[#81512f] hover:text-[#171819]">Open assessment <span aria-hidden="true">→</span></Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
