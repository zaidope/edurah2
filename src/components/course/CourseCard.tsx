'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, BookOpen, Star, ArrowRight } from 'lucide-react';
import { Course } from '@/types';
import { ProgressService } from '@/lib/progress';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const progressPercent = ProgressService.getCourseProgress(course.id);

  const levelColor = {
    Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
    Advanced: 'bg-purple-50 text-purple-700 border-purple-200'
  }[course.level];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col group edurah-card-hover">
      
      {/* THUMBNAIL */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
        
        {/* SUBJECT TAG & LEVEL BADGE */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/90 backdrop-blur-xs text-slate-800 border border-slate-200 shadow-xs">
            {course.subjectName}
          </span>
          <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${levelColor}`}>
            {course.level}
          </span>
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
            {course.title}
          </h3>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {course.shortDescription}
          </p>
        </div>

        {/* METADATA BAR */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          
          {/* INSTRUCTOR & RATING */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-6 h-6 rounded-full object-cover border border-slate-200"
              />
              <span className="text-slate-700 font-medium truncate max-w-[130px]">{course.instructor.name}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-600 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{course.rating}</span>
            </div>
          </div>

          {/* DURATION & LESSONS */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>{course.lessonCount} Lessons</span>
            </div>
          </div>

          {/* PROGRESS BAR IF STARTED */}
          {progressPercent > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Progress</span>
                <span className="text-blue-600 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* ACTION BUTTON */}
          <Link
            href={`/courses/${course.slug}`}
            className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white transition-all cursor-pointer shadow-xs group/btn"
          >
            <span>{progressPercent > 0 ? 'Continue Course' : 'View Syllabus & Lessons'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>

        </div>

      </div>
    </div>
  );
}

