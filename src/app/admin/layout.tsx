'use client';

import React from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, LogIn, ArrowLeft, RefreshCw } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();

  // Show loading spinner while AuthContext checks Supabase session
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-slate-600">Verifying Administrative Privileges...</p>
      </div>
    );
  }

  // Access Restricted if user is not logged in or profile role is not 'admin'
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              The Eduura Admin Panel requires an authenticated user account with administrator privileges in <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">public.profiles</code>.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs"
            >
              <LogIn className="w-4 h-4" /> Sign In with Admin Account
            </Link>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
