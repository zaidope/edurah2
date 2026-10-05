'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import { Course } from '@/types';
import CourseCard from '@/components/course/CourseCard';
import { BookOpen, Filter, Search } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedPage from '@/components/layout/AnimatedPage';

export default function CoursesPage() {
  const { profile } = useAuth();
  const grades = ContentService.getGrades();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseLoadError, setCourseLoadError] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;
    ContentService.loadCourses(undefined, 'published')
      .then((loadedCourses) => {
        if (active) setAllCourses(loadedCourses);
      })
      .catch((error: unknown) => {
        if (active) setCourseLoadError(error instanceof Error ? error.message : 'Unable to load courses.');
      })
      .finally(() => {
        if (active) setLoadingCourses(false);
      });
    return () => { active = false; };
  }, []);

  const isAdmin = profile?.role === 'admin';
  const assignedGradeObj = profile?.gradeId ? ContentService.getGradeById(profile.gradeId) : null;

  // Grade-level course access control:
  // Enrolled students only see their assigned grade's curriculum.
  // Guests and administrators can explore the entire multi-grade catalog.
  const visibleCourses = !profile || isAdmin
    ? (filterGrade === 'all' ? allCourses : allCourses.filter((c) => c.gradeId === filterGrade))
    : allCourses.filter((c) => c.gradeId === profile.gradeId);

  const filtered = visibleCourses.filter(
    (c) =>
      !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 space-y-10">
          
          {/* HEADER HERO */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#d8d0c2] pb-8">
            <div className="space-y-3 max-w-2xl">
              <p className="edurah-eyebrow">
                <span />
                {!profile
                  ? 'Open Curriculum Catalog'
                  : isAdmin
                  ? 'Global Curriculum Administration'
                  : `${assignedGradeObj?.name || 'Assigned Grade'} Curriculum`}
              </p>

              <h1 className="font-serif-hero text-4xl sm:text-5xl font-normal text-[#171819] tracking-tight">
                {!profile ? 'Find a path that fits.' : isAdmin ? 'All Grade Curricula' : `Courses for ${assignedGradeObj?.name || 'Your Grade'}`}
              </h1>

              <p className="text-xs sm:text-sm text-[#555048] leading-relaxed max-w-xl">
                {!profile
                  ? 'Explore our structured video lessons, syllabus outlines, and core subjects across all primary and senior academic tiers.'
                  : isAdmin
                  ? 'Review and manage published course curricula across all 10 grades.'
                  : `You are enrolled in ${assignedGradeObj?.name}. Below is your grade's verified sequence of study.`}
              </p>
            </div>

            {/* FILTERING (GUESTS & ADMIN) */}
            {(!profile || isAdmin) && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-2 border border-[#d8d0c2] shadow-xs">
                  <Filter className="w-3.5 h-3.5 text-[#81512f]" />
                  <label htmlFor="grade-filter" className="text-[11px] font-bold uppercase tracking-wider text-[#555048]">
                    Grade:
                  </label>
                  <select
                    id="grade-filter"
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-[#171819] focus:outline-none cursor-pointer pr-2"
                  >
                    <option value="all">All Grades ({allCourses.length})</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({allCourses.filter((c) => c.gradeId === g.id).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {courseLoadError && <div role="alert" className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{courseLoadError}</div>}
          {loadingCourses && <p className="text-xs text-[#706b63]">Loading published courses…</p>}

          {/* SEARCH & DISCOVERY BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8a8376] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses by title, topic, or subject..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#d8d0c2] text-xs text-[#171819] placeholder:text-[#9e978b] focus:outline-none focus:border-[#d8a471] transition-colors"
              />
            </div>

            <div className="text-[11px] text-[#706b63] font-medium self-end sm:self-center">
              Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'course' : 'courses'}
            </div>
          </div>

          {/* COURSES GRID */}
          {!loadingCourses && !courseLoadError && filtered.length === 0 ? (
            <div className="bg-white p-12 text-center border border-[#d8d0c2] space-y-3">
              <BookOpen className="w-10 h-10 text-[#a59e93] mx-auto" />
              <h3 className="font-serif-heading text-xl text-[#171819]">No Courses Found</h3>
              <p className="text-xs text-[#555048] max-w-sm mx-auto">
                No active courses matched your search criteria in this view.
              </p>
            </div>
          ) : !loadingCourses && !courseLoadError ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : null}

        </div>
      </AnimatedPage>
    </PageTransition>
  );
}
