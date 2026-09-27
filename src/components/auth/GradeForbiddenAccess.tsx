'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, LayoutDashboard, Lock, LogIn, ArrowRight } from 'lucide-react';

interface GradeForbiddenAccessProps {
  requiredGradeName: string;
  userGradeName?: string;
  userRole?: string;
  resourceTitle?: string;
  resourceType?: 'course' | 'lesson' | 'quiz';
  isUnauthenticated?: boolean;
}

export default function GradeForbiddenAccess({
  requiredGradeName,
  userGradeName,
  userRole = 'student',
  resourceTitle,
  resourceType = 'lesson',
  isUnauthenticated = false,
}: GradeForbiddenAccessProps) {
  if (isUnauthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-[#fcfbf9] p-8 sm:p-10 border border-[#d8d0c2] shadow-sm max-w-md w-full text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#d8a471]" />

          <div className="w-12 h-12 bg-[#f3e5d4] border border-[#d8a471]/40 text-[#81512f] flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>

          <div className="space-y-2">
            <p className="edurah-eyebrow justify-center flex items-center">
              <span /> Enrolled Space
            </p>
            <h2 className="font-serif-heading text-2xl font-normal text-[#171819] tracking-tight">
              Sign in to continue learning
            </h2>
            <p className="text-xs text-[#555048] leading-relaxed">
              {resourceTitle ? (
                <>
                  To access <strong>{resourceTitle}</strong>, please sign in with your verified student or faculty account.
                </>
              ) : (
                <>
                  Video lessons, interactive quizzes, and personalized progress tracking are reserved for enrolled learners.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#171819] hover:bg-[#0b0d0e] text-[#f6f2e9] font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <LogIn className="w-4 h-4 text-[#d8a471]" /> Sign In to Learning Space
            </Link>
            <Link
              href="/courses"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-transparent hover:bg-[#ede8dc] text-[#171819] font-semibold text-xs border border-[#d8d0c2] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Course Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user attempting to access a different grade's protected lesson/quiz
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-[#fcfbf9] p-8 sm:p-10 border border-[#d8d0c2] shadow-sm max-w-md w-full text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#ba6c45]" />

        <div className="w-12 h-12 bg-[#fbeae2] border border-[#ba6c45]/40 text-[#ba6c45] flex items-center justify-center mx-auto">
          <Shield className="w-5 h-5" />
        </div>

        <div className="space-y-2">
          <p className="edurah-eyebrow justify-center flex items-center">
            <span /> Grade Boundary Notice
          </p>
          <h2 className="font-serif-heading text-2xl font-normal text-[#171819] tracking-tight">
            Curriculum for {requiredGradeName}
          </h2>
          <p className="text-xs text-[#555048] leading-relaxed">
            {resourceTitle ? (
              <>
                <strong>{resourceTitle}</strong> belongs to the curriculum for{' '}
                <span className="font-bold text-[#171819]">{requiredGradeName}</span>.
              </>
            ) : (
              <>This {resourceType} is part of the curriculum for {requiredGradeName}.</>
            )}
          </p>
          <p className="text-xs text-[#7f786e]">
            Your profile is enrolled in{' '}
            <strong className="text-[#171819]">{userGradeName || 'your assigned grade'}</strong>. Your dashboard displays your active courses.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Link
            href={userRole === 'teacher' ? '/teacher' : '/dashboard'}
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#171819] hover:bg-[#0b0d0e] text-[#f6f2e9] font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-[#d8a471]" /> Return to My{' '}
            {userRole === 'teacher' ? 'Faculty Hub' : 'Grade Dashboard'}
          </Link>
          <Link
            href="/courses"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-transparent hover:bg-[#ede8dc] text-[#171819] font-semibold text-xs border border-[#d8d0c2] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
