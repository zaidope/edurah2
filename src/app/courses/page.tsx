import React from 'react';
import { ContentService } from '@/lib/content';
import CourseCard from '@/components/course/CourseCard';
import { BookOpen } from 'lucide-react';

export default function CoursesPage() {
  const courses = ContentService.getCourses();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* HEADER */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Full Course Catalog
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Browse All Courses</h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Structured video curricula with chapter breakdowns, code resources, and interactive quizzes.
        </p>
      </div>

      {/* COURSES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

    </div>
  );
}

