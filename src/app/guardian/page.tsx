'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { GuardianStudentDossier } from '@/types';
import {
  Users,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  KeyRound,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Download,
  Award
} from 'lucide-react';

export default function GuardianPortalPage() {
  const { profile, loading: authLoading } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [dossier, setDossier] = useState<GuardianStudentDossier | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'deadlines' | 'grades'>('overview');

  useEffect(() => {
    async function loadGuardianData() {
      if (!profile) return;
      setLoadingDossier(true);
      try {
        // Attempt to fetch first linked student
        const studentId = localStorage.getItem('edurah_guardian_active_student') || '';
        if (studentId) {
          const res = await fetch(`/api/guardian/student?studentId=${studentId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            },
          });
          if (res.ok) {
            const json = await res.json();
            setDossier(json.data?.dossier);
          }
        }
      } catch {
        // Fallback
      } finally {
        setLoadingDossier(false);
      }
    }

    if (!authLoading) {
      void loadGuardianData();
    }
  }, [authLoading, profile]);

  const handleClaimStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setClaiming(true);
    setClaimMessage(null);

    try {
      const res = await fetch('/api/guardian/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          action: 'claim',
          inviteCode: inviteCode.trim().toUpperCase(),
          relationship: 'parent',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Invalid or expired invitation code.');
      }

      setClaimMessage({
        text: 'Invitation claimed successfully! Status is pending approval from the student or an administrator.',
        type: 'success',
      });
      setInviteCode('');
    } catch (err: any) {
      setClaimMessage({ text: err.message || 'Error claiming student code', type: 'error' });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f2e9] text-[#171819] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* PORTAL HEADER */}
        <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#81512f] bg-[#f5eedf] px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Guardian Academic Portal
            </div>
            <h1 className="text-2xl font-serif text-[#171819] mt-2">
              Scholar Academic Oversight & Progress
            </h1>
            <p className="text-sm text-[#706b63] mt-1">
              Read-only parental oversight into verified attendance records, course outcomes, and upcoming assessment deadlines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#706b63] bg-[#ede7db] px-3 py-1.5 rounded-xl font-mono">
              Role: Guardian (Read-Only)
            </span>
          </div>
        </div>

        {/* CLAIM CODE SECTION IF NOT LINKED */}
        {!dossier && (
          <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f5eedf] flex items-center justify-center text-[#81512f]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#171819]">Connect with Your Scholar</h2>
                <p className="text-xs text-[#706b63]">
                  Enter the official guardian invite code issued by your child or school administration.
                </p>
              </div>
            </div>

            <form onSubmit={handleClaimStudent} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g. EDURAH-GRD-X8K2M1"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="flex-1 bg-[#f6f2e9] border border-[#d8d0c2] rounded-xl px-4 py-2 text-sm text-[#171819] uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#81512f]"
              />
              <button
                type="submit"
                disabled={claiming || !inviteCode.trim()}
                className="px-5 py-2 rounded-xl bg-[#81512f] text-white text-sm font-medium hover:bg-[#6c4326] transition-colors disabled:opacity-50"
              >
                {claiming ? 'Verifying...' : 'Connect Scholar'}
              </button>
            </form>

            {claimMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  claimMessage.type === 'success'
                    ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]'
                    : 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]'
                }`}
              >
                {claimMessage.text}
              </div>
            )}
          </div>
        )}

        {/* DOSSIER DASHBOARD (WHEN LINKED) */}
        {dossier && (
          <div className="space-y-6">
            {/* SCHOLAR BANNER */}
            <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#81512f] text-white flex items-center justify-center font-serif text-2xl font-bold">
                  {dossier.student.fullName[0]}
                </div>
                <div>
                  <h2 className="text-xl font-serif text-[#171819]">{dossier.student.fullName}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#706b63] mt-1">
                    <span>{dossier.student.gradeName}</span>
                    <span>•</span>
                    <span>Cohort: {dossier.student.academicBatch || '2025–2026'}</span>
                    <span>•</span>
                    <span className="font-mono">{dossier.student.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#d8d0c2] bg-[#f6f2e9] text-xs font-medium text-[#171819] hover:bg-[#ede7db] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Print Weekly Digest
                </button>
              </div>
            </div>

            {/* KEY METRICS GAUGES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#706b63] font-bold uppercase">
                  <span>Attendance Rate</span>
                  <Calendar className="w-4 h-4 text-[#81512f]" />
                </div>
                <div className="text-3xl font-serif font-bold text-[#171819] mt-2">
                  {dossier.attendance.attendancePercentage}%
                </div>
                <p className="text-xs text-[#706b63] mt-1">
                  {dossier.attendance.presentCount} days present of {dossier.attendance.totalDays} sessions
                </p>
              </div>

              <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#706b63] font-bold uppercase">
                  <span>Upcoming Deadlines</span>
                  <Clock className="w-4 h-4 text-[#81512f]" />
                </div>
                <div className="text-3xl font-serif font-bold text-[#171819] mt-2">
                  {dossier.upcomingDeadlines.length}
                </div>
                <p className="text-xs text-[#706b63] mt-1">Due within the next 14 academic days</p>
              </div>

              <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#706b63] font-bold uppercase">
                  <span>Enrolled Courses</span>
                  <Award className="w-4 h-4 text-[#81512f]" />
                </div>
                <div className="text-3xl font-serif font-bold text-[#171819] mt-2">
                  {dossier.publishedGrades.length}
                </div>
                <p className="text-xs text-[#706b63] mt-1">Active gradebook standings</p>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 border-b border-[#d8d0c2] pb-1">
              {(['overview', 'attendance', 'deadlines', 'grades'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-colors ${
                    activeTab === tab
                      ? 'bg-[#fcfbf9] text-[#81512f] border-t-2 border-[#81512f]'
                      : 'text-[#706b63] hover:text-[#171819]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: OVERVIEW & GRADES */}
            {(activeTab === 'overview' || activeTab === 'grades') && (
              <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-serif font-bold text-[#171819]">
                  Published Academic Standings
                </h3>
                <div className="divide-y divide-[#e8e2d5]">
                  {dossier.publishedGrades.map((g) => (
                    <div key={g.courseId} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-[#171819]">{g.courseTitle}</div>
                        <div className="text-xs text-[#706b63]">
                          Missing items: {g.missingCount}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-serif font-bold text-[#81512f]">
                          {g.weightedPercentage}%
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#ede7db] font-mono text-xs font-bold text-[#171819]">
                          Grade {g.letterGrade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: ATTENDANCE LOG */}
            {(activeTab === 'overview' || activeTab === 'attendance') && (
              <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-serif font-bold text-[#171819]">
                  Recent Roll-Call Log
                </h3>
                {dossier.attendance.recentRecords.length === 0 ? (
                  <p className="text-xs text-[#706b63]">No recent attendance records logged.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {dossier.attendance.recentRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className="bg-[#f6f2e9] border border-[#d8d0c2] rounded-xl p-2.5 text-center"
                      >
                        <div className="text-[11px] font-mono text-[#706b63]">{rec.date}</div>
                        <div
                          className={`text-xs font-bold uppercase mt-1 ${
                            rec.status === 'present'
                              ? 'text-[#2b6cb0]'
                              : rec.status === 'absent'
                              ? 'text-[#c53030]'
                              : rec.status === 'tardy'
                              ? 'text-[#dd6b20]'
                              : 'text-[#38a169]'
                          }`}
                        >
                          {rec.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: DEADLINES */}
            {(activeTab === 'overview' || activeTab === 'deadlines') && (
              <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-serif font-bold text-[#171819]">
                  Upcoming Assignment Deadlines
                </h3>
                {dossier.upcomingDeadlines.length === 0 ? (
                  <p className="text-xs text-[#706b63]">No pending deadlines due in this period.</p>
                ) : (
                  <div className="divide-y divide-[#e8e2d5]">
                    {dossier.upcomingDeadlines.map((dl) => (
                      <div key={dl.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-[#171819]">{dl.title}</div>
                          <div className="text-xs text-[#706b63]">{dl.courseTitle}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#706b63]">
                            Due {new Date(dl.dueAt).toLocaleDateString()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                              dl.submitted
                                ? 'bg-[#f0fdf4] text-[#166534]'
                                : 'bg-[#fff5f5] text-[#9b2c2c]'
                            }`}
                          >
                            {dl.submitted ? 'Submitted' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
