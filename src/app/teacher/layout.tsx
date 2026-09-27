'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import EdurahLogo from '@/components/branding/EdurahLogo';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Award,
  FileQuestion,
  GraduationCap,
  FolderCheck,
  Table,
  LogOut,
  Shield,
  LogIn,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, loading, logout } = useAuth();

  // If on teacher login page, render children directly
  if (pathname === '/teacher/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f2e9] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#d8a471] border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-[#555048]">Verifying Faculty Credentials...</p>
      </div>
    );
  }

  // Check role: teacher or admin allowed
  const isTeacherOrAdmin = profile && (profile.role === 'teacher' || profile.role === 'admin');

  if (!isTeacherOrAdmin) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] bg-[#f6f2e9] flex items-center justify-center p-4">
        <div className="bg-[#fcfbf9] p-8 sm:p-10 border border-[#d8d0c2] shadow-sm max-w-md w-full text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#81512f]" />

          <div className="w-12 h-12 bg-[#f3e5d4] border border-[#d8a471]/40 text-[#81512f] flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <p className="edurah-eyebrow justify-center flex items-center">
              <span /> Faculty Verification
            </p>
            <h2 className="font-serif-heading text-2xl font-normal text-[#171819] tracking-tight">
              Educator Portal Access
            </h2>
            <p className="text-xs text-[#555048] leading-relaxed">
              The Edurah Faculty Hub is reserved for assigned educators and curriculum coordinators. Please sign in with your faculty credentials.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/teacher/login"
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#171819] hover:bg-[#0b0d0e] text-[#f6f2e9] font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <LogIn className="w-4 h-4 text-[#d8a471]" /> Sign In as Faculty
            </Link>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-transparent hover:bg-[#ede8dc] text-[#171819] font-semibold text-xs border border-[#d8d0c2] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const assignedGrade = profile.gradeId ? ContentService.getGradeById(profile.gradeId) : null;
  const gradeDisplay = assignedGrade
    ? assignedGrade.name
    : profile.role === 'admin'
    ? 'All Grades (Global Administrator)'
    : 'Assigned Grade 1';

  const navItems = [
    { name: 'Faculty Overview', href: '/teacher', icon: LayoutDashboard },
    { name: 'Grade Courses', href: '/teacher/courses', icon: BookOpen },
    { name: 'Student Roster', href: '/teacher/students', icon: Users },
    { name: 'Grade Quizzes', href: '/teacher/quizzes', icon: Award },
    { name: 'Assignments & Grading', href: '/teacher/assignments', icon: FolderCheck },
    { name: 'Weighted Gradebook', href: '/teacher/gradebook', icon: Table },
    { name: 'PDF Quiz Maker', href: '/teacher/quiz-maker', icon: FileQuestion },
  ];

  return (
    <div className="min-h-screen bg-[#f6f2e9] flex flex-col md:flex-row text-[#171819]">
      {/* TEACHER SIDEBAR */}
      <aside className="w-64 bg-[#fcfbf9] border-r border-[#d8d0c2] flex flex-col justify-between hidden md:flex min-h-screen flex-shrink-0">
        <div className="p-5 space-y-6">
          {/* LOGO & FACULTY BADGE */}
          <div className="pb-4 border-b border-[#e8e2d5] space-y-3">
            <EdurahLogo size="sm" theme="light" href="/teacher" />
            <div className="p-3 bg-[#f6f2e9] border border-[#d8d0c2] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#81512f] block flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Assigned Faculty Cohort
              </span>
              <span className="font-serif-heading text-sm font-normal text-[#171819] block truncate">
                {gradeDisplay}
              </span>
            </div>
          </div>

          {/* NAV LINKS */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border ${
                    isActive
                      ? 'bg-[#171819] text-[#f6f2e9] border-[#171819]'
                      : 'bg-transparent border-transparent text-[#555048] hover:bg-[#ede8dc] hover:text-[#171819]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#d8a471]' : 'text-[#8a8376]'}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#d8a471]" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* TEACHER USER FOOTER */}
        <div className="p-5 border-t border-[#e8e2d5] space-y-3 bg-[#f6f2e9]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#171819] text-[#f6f2e9] flex items-center justify-center font-bold text-xs font-mono-code border border-[#d8d0c2]">
              {profile.fullName.charAt(0)}
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-[#171819] block truncate">{profile.fullName}</span>
              <span className="text-[10px] text-[#706b63] block truncate">{profile.email}</span>
            </div>
          </div>

          <button
            onClick={() => void logout()}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#555048] hover:text-[#171819] hover:bg-[#ede8dc] transition-colors cursor-pointer border border-[#d8d0c2]"
          >
            <span>Sign Out</span>
            <LogOut className="w-3.5 h-3.5 text-[#8a8376]" />
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER FOR TEACHER */}
      <div className="md:hidden bg-[#fcfbf9] border-b border-[#d8d0c2] px-4 py-3 flex items-center justify-between">
        <EdurahLogo size="sm" href="/teacher" />
        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`p-1.5 text-xs ${pathname === item.href ? 'text-[#81512f] font-bold' : 'text-[#706b63]'}`}
            >
              {item.name.split(' ')[0]}
            </Link>
          ))}
        </div>
      </div>

      {/* MAIN TEACHER CONTENT */}
      <main className="flex-1 p-5 sm:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
