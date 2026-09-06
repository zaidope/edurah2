import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AuthService } from '@/lib/auth';
import { ContentService } from '@/lib/content';
import { ChevronLeft, BookOpen } from 'lucide-react';

interface StudentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { id } = await params;
  const student = await AuthService.getStudentById(id);

  if (!student) {
    notFound();
  }

  const courses = ContentService.getCourses();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* BREADCRUMB */}
      <div>
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Students List
        </Link>
      </div>

      {/* STUDENT PROFILE CARD */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold border border-blue-500 shadow-xs">
              {student.fullName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{student.fullName}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{student.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                  ID: {student.studentId}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {student.classGroup || 'General Batch'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
              student.isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {student.isActive ? 'Active Student' : 'Account Deactivated'}
            </span>
          </div>
        </div>
      </div>

      {/* COURSE PROGRESS BREAKDOWN */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" /> Enrolled Course Progress
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-600 font-bold uppercase">{course.subjectName}</span>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">{course.title}</h3>
                </div>
                <span className="text-lg font-bold text-emerald-600">Active</span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '50%' }} />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>{course.lessonCount} Lessons Total</span>
                <span className="text-blue-600 font-semibold">{course.level} Track</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
