'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-slate-600 text-sm">Please sign in to view your profile.</p>
        <button
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* HEADER */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold border border-blue-500 shadow-xs">
              {profile.fullName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{profile.fullName}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                  Role: {profile.role}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Account Active ✓
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* ACCOUNT DETAILS */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" /> Student Profile Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Student ID</span>
            <div className="text-sm font-bold text-slate-900">{profile.studentId}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Class / Group</span>
            <div className="text-sm font-bold text-blue-600">{profile.classGroup || 'General Batch'}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Registered Email</span>
            <div className="text-sm font-bold text-slate-900 truncate">{profile.email}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Created Date</span>
            <div className="text-sm font-bold text-slate-900">{profile.createdAt}</div>
          </div>
        </div>
      </div>

    </div>
  );
}

