'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, BookOpen, Star, ArrowUpRight } from 'lucide-react';
import { Course } from '@/types';
import { ProgressService } from '@/lib/progress';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const progressPercent = ProgressService.getCourseProgress(course.id);

  return (
    <div className="bg-white border border-[#d8d0c2] overflow-hidden flex flex-col group edurah-card-hover">
      {/* THUMBNAIL */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#ede8dc]">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d0e]/60 via-transparent to-transparent" />

        {/* SUBJECT TAG & LEVEL BADGE */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#f6f2e9]/95 text-[#171819] border border-[#d8d0c2] shadow-xs">
            {course.subjectName}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#101719]/80 text-[#e6b981] border border-[#d8a471]/30">
            {course.level}
          </span>
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-serif-heading text-lg font-normal text-[#171819] group-hover:text-[#81512f] transition-colors line-clamp-2 leading-snug">
            {course.title}
          </h3>
          <p className="text-xs text-[#555048] line-clamp-2 leading-relaxed">
            {course.shortDescription}
          </p>
        </div>

        {/* METADATA BAR */}
        <div className="space-y-3 pt-3 border-t border-[#e8e2d5]">
          {/* INSTRUCTOR & RATING */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-5 h-5 rounded-full object-cover border border-[#d8d0c2]"
              />
              <span className="text-[#555048] font-medium text-[11px] truncate max-w-[130px]">{course.instructor.name}</span>
            </div>
            <div className="flex items-center gap-1 text-[#81512f] font-semibold text-[11px]">
              <Star className="w-3 h-3 fill-[#d8a471] text-[#d8a471]" />
              <span>{course.rating}</span>
            </div>
          </div>

          {/* DURATION & LESSONS */}
          <div className="flex items-center justify-between text-[11px] text-[#706b63]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#a59e93]" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-[#a59e93]" />
              <span>{course.lessonCount} Lessons</span>
            </div>
          </div>

          {/* PROGRESS BAR IF STARTED */}
          {progressPercent > 0 && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-[#555048] uppercase tracking-wider">
                <span>Progress</span>
                <span className="text-[#81512f]">{progressPercent}%</span>
              </div>
              <div className="w-full bg-[#ede8dc] h-1.5 overflow-hidden">
                <div
                  className="bg-[#d8a471] h-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* LINK TO COURSE OVERVIEW */}
          <Link
            href={`/courses/${course.slug}`}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#f6f2e9] hover:bg-[#ede8dc] text-[#171819] text-xs font-bold uppercase tracking-wider border border-[#d8d0c2] transition-colors"
          >
            <span>Overview & Syllabus</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#81512f]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
