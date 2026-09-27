'use client';

import React from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import EdurahLogo from '@/components/branding/EdurahLogo';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();

  // Show loading spinner while AuthContext checks Supabase session
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f6f2e9] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#8e5a2b] border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-[#6f6b63]">Verifying Administrative Privileges...</p>
      </div>
    );
  }

  // Access Restricted if user is not logged in or profile role is not 'admin'
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f6f2e9] flex items-center justify-center p-4">
        <div className="edurah-card-warm p-8 sm:p-10 rounded-2xl border border-[#d8d0c2] shadow-sm max-w-md w-full text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#fee2e2] border border-[#fca5a5] text-[#b91c1c] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-serif-heading font-normal text-[#171819]">Access Restricted</h2>
            <p className="text-xs sm:text-sm text-[#6f6b63] leading-relaxed">
              The Edurah Administration Console is reserved for institutional administrators and curriculum directors. Please sign in with an administrator account to continue.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/login"
              className="edurah-btn-primary w-full py-2.5 justify-center text-xs"
            >
              <LogIn className="w-4 h-4" /> Sign In as Administrator
            </Link>
            <Link
              href="/"
              className="edurah-btn-secondary w-full py-2.5 justify-center text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f6f2e9] flex flex-col md:flex-row">
      <div className="md:hidden bg-[#0b0d0e] px-4 py-3 border-b border-[#26282a] flex items-center justify-between">
        <EdurahLogo size="sm" showBadge badgeText="GOVERNANCE" href="/admin" />
        <span className="text-[11px] text-[#d8a471] font-mono-code font-bold">Admin Console</span>
      </div>
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
