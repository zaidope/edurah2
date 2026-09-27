'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import { User, LogOut, ShieldCheck, GraduationCap, Calendar, Mail, Hash } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedPage from '@/components/layout/AnimatedPage';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <p className="text-[#6f6b63] text-sm">Please sign in to view your institutional credentials.</p>
        <button
          onClick={() => router.push('/login')}
          className="edurah-btn-primary text-xs px-5 py-2.5"
        >
          Sign In to Edurah
        </button>
      </div>
    );
  }

  const gradeName = profile.gradeId ? ContentService.getGradeById(profile.gradeId)?.name : (profile.classGroup || 'Standard Cohort');

  return (
    <PageTransition>
      <AnimatedPage>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          
          {/* HEADER CARD */}
          <div className="edurah-card-warm p-8 rounded-3xl space-y-6 shadow-xs border border-[#d8d0c2]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-[#0b0d0e] text-[#f6f2e9] flex items-center justify-center text-2xl font-serif-heading font-normal border border-[#26282a] shadow-xs shrink-0">
                  {profile.fullName.charAt(0)}
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-serif-heading font-normal text-[#171819]">{profile.fullName}</h1>
                  <p className="text-xs text-[#6f6b63]">{profile.email}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ede6d8] text-[#8e5a2b] border border-[#d8d0c2]">
                      Role: {profile.role}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]">
                      Active Enrolled ✓
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#fee2e2] hover:bg-[#ef4444] text-[#991b1b] hover:text-white border border-[#fca5a5] text-xs font-semibold transition-all cursor-pointer shadow-xs self-start sm:self-center"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>

          {/* CREDENTIAL DETAILS */}
          <div className="edurah-card-warm p-6 sm:p-8 rounded-3xl space-y-5 shadow-xs border border-[#d8d0c2]">
            <h2 className="text-lg font-serif-heading font-normal text-[#171819] flex items-center gap-2 border-b border-[#e5ded0] pb-4">
              <User className="w-5 h-5 text-[#8e5a2b]" /> Institutional Record Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] space-y-1">
                <div className="flex items-center gap-1.5 text-[#6f6b63] font-bold uppercase text-[10px]">
                  <Hash className="w-3.5 h-3.5 text-[#8e5a2b]" /> Student Identifier
                </div>
                <div className="text-sm font-bold font-mono-code text-[#171819]">{profile.studentId}</div>
              </div>

              <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] space-y-1">
                <div className="flex items-center gap-1.5 text-[#6f6b63] font-bold uppercase text-[10px]">
                  <GraduationCap className="w-3.5 h-3.5 text-[#8e5a2b]" /> Assigned Curriculum Cohort
                </div>
                <div className="text-sm font-bold text-[#8e5a2b]">{gradeName}</div>
              </div>

              <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] space-y-1">
                <div className="flex items-center gap-1.5 text-[#6f6b63] font-bold uppercase text-[10px]">
                  <Mail className="w-3.5 h-3.5 text-[#8e5a2b]" /> Primary Account Email
                </div>
                <div className="text-sm font-semibold text-[#171819] truncate">{profile.email}</div>
              </div>

              <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] space-y-1">
                <div className="flex items-center gap-1.5 text-[#6f6b63] font-bold uppercase text-[10px]">
                  <Calendar className="w-3.5 h-3.5 text-[#8e5a2b]" /> Registration Timestamp
                </div>
                <div className="text-sm font-medium text-[#171819]">{profile.createdAt || 'Active Academic Session'}</div>
              </div>
            </div>
          </div>

        </div>
      </AnimatedPage>
    </PageTransition>
  );
}
