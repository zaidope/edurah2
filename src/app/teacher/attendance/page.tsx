'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Section, AttendanceStatus, AttendanceRecord } from '@/types';
import {
  Clock,
  ArrowLeft,
  Save,
  AlertTriangle,
  Lock
} from 'lucide-react';

async function getSessionHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Your session has ended. Please sign in again.');
  return { Authorization: `Bearer ${session.access_token}` };
}

export default function TeacherAttendancePage() {
  const { profile, loading: authLoading } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [roster, setRoster] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [justification, setJustification] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Determine if date is past 48 hours
  const recordDate = new Date(`${selectedDate}T23:59:59`);
  const now = new Date();
  const isPast48h = now.getTime() - recordDate.getTime() > 48 * 60 * 60 * 1000;
  const isLockedForTeacher = isPast48h && profile?.role !== 'admin';

  // Load sections
  useEffect(() => {
    async function loadSections() {
      try {
        const gradeParam = profile?.gradeId ? `?gradeId=${profile.gradeId}` : '';
        const res = await fetch(`/api/sections${gradeParam}`, { headers: await getSessionHeaders() });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Unable to load sections.');
        if (json.data?.sections && json.data.sections.length > 0) {
          setSections(json.data.sections);
          setSelectedSectionId(json.data.sections[0].id);
        } else {
          setSections([]);
          setLoading(false);
          setMessage({ text: 'No sections are assigned to your grade yet.', type: 'error' });
        }
      } catch (error) {
        setLoading(false);
        setMessage({ text: error instanceof Error ? error.message : 'Unable to load sections.', type: 'error' });
      }
    }
    if (!authLoading) {
      void loadSections();
    }
  }, [authLoading, profile]);

  // Load roster and current attendance for section and date
  useEffect(() => {
    if (!selectedSectionId) return;

    async function loadRosterAndAttendance() {
      setLoading(true);
      setMessage(null);
      try {
        // 1. Fetch roster
        const headers = await getSessionHeaders();
        const rosterRes = await fetch(`/api/sections/${selectedSectionId}/roster`, { headers });
        const rosterJson = await rosterRes.json();
        if (!rosterRes.ok) throw new Error(rosterJson.error?.message || 'Unable to load the section roster.');
        const students = rosterJson.data?.students || [];
        setRoster(students);

        // 2. Fetch existing attendance records
        const attRes = await fetch(`/api/attendance?sectionId=${selectedSectionId}&date=${selectedDate}`, { headers });
        const attJson = await attRes.json();
        if (!attRes.ok) throw new Error(attJson.error?.message || 'Unable to load attendance records.');
        const existingRecords: AttendanceRecord[] = attJson.data?.records || [];

        const statusMap: Record<string, AttendanceStatus> = {};
        for (const s of students) {
          const rec = existingRecords.find((r) => r.studentId === s.id);
          statusMap[s.id] = rec ? rec.status : 'present'; // Default to present
        }
        setStatuses(statusMap);
      } catch (error) {
        setMessage({ text: error instanceof Error ? error.message : 'Unable to load attendance records.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    void loadRosterAndAttendance();
  }, [selectedSectionId, selectedDate]);

  // Keyboard navigation for fast roll call (P, A, T, E, Arrow keys)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isLockedForTeacher) return;
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      const key = e.key.toUpperCase();
      if (key === 'P' || key === 'A' || key === 'T' || key === 'E') {
        e.preventDefault();
        const student = roster[focusedIndex];
        if (student) {
          let status: AttendanceStatus = 'present';
          if (key === 'P') status = 'present';
          if (key === 'A') status = 'absent';
          if (key === 'T') status = 'tardy';
          if (key === 'E') status = 'excused';

          setStatuses((prev) => ({ ...prev, [student.id]: status }));
          // Auto-advance to next student
          if (focusedIndex < roster.length - 1) {
            setFocusedIndex(focusedIndex + 1);
          }
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, roster.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roster, focusedIndex, isLockedForTeacher]);

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    if (isLockedForTeacher) return;
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSectionId || roster.length === 0) return;
    if (isPast48h && profile?.role === 'admin' && !justification.trim()) {
      setMessage({
        text: 'Administrator justification comment is mandatory when editing attendance records past 48 hours.',
        type: 'error',
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const records = roster.map((s) => ({
        studentId: s.id,
        status: statuses[s.id] || 'present',
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...await getSessionHeaders(),
        },
        body: JSON.stringify({
          sectionId: selectedSectionId,
          date: selectedDate,
          records,
          justification: isPast48h ? justification : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to record roll call.');
      }

      setMessage({
        text: `Successfully saved roll call for ${json.data?.savedCount || records.length} students.`,
        type: 'success',
      });
    } catch (error: unknown) {
      setMessage({ text: error instanceof Error ? error.message : 'Error recording roll call', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const counts = {
    present: Object.values(statuses).filter((s) => s === 'present').length,
    absent: Object.values(statuses).filter((s) => s === 'absent').length,
    tardy: Object.values(statuses).filter((s) => s === 'tardy').length,
    excused: Object.values(statuses).filter((s) => s === 'excused').length,
  };

  return (
    <div className="min-h-screen bg-[#f6f2e9] text-[#171819] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* TOP BREADCRUMB */}
        <div className="flex items-center justify-between">
          <Link
            href="/teacher"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#81512f] hover:text-[#171819] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Faculty Console
          </Link>
          <div className="text-xs text-[#706b63] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Roll-call hotkeys: <strong>P</strong> (Present) • <strong>A</strong> (Absent) • <strong>T</strong> (Tardy) • <strong>E</strong> (Excused)</span>
          </div>
        </div>

        {/* HEADER */}
        <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#81512f]">
              Institutional Operations
            </span>
            <h1 className="text-2xl font-serif text-[#171819] mt-1">
              Section Attendance & Daily Roll Call
            </h1>
            <p className="text-sm text-[#706b63] mt-1">
              Record verified cohort attendance. In accordance with institutional policy, records older than 48 hours are immutable.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAttendance}
              disabled={saving || isLockedForTeacher || roster.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#81512f] text-white font-medium hover:bg-[#6c4326] transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Roll Call'}
            </button>
          </div>
        </div>

        {/* CONTROLS BAR: Section & Date Selection */}
        <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#706b63] mb-1.5">
              Assigned Cohort / Section
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full bg-[#f6f2e9] border border-[#d8d0c2] rounded-xl px-3 py-2 text-sm text-[#171819] focus:outline-none focus:ring-2 focus:ring-[#81512f]"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} ({sec.gradeId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#706b63] mb-1.5">
              Roll Call Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-[#f6f2e9] border border-[#d8d0c2] rounded-xl px-3 py-2 text-sm text-[#171819] focus:outline-none focus:ring-2 focus:ring-[#81512f]"
            />
          </div>
        </div>

        {/* 48-HOUR LOCK BANNER */}
        {isPast48h && (
          <div
            className={`rounded-2xl p-4 border flex items-start gap-3 ${
              profile?.role === 'admin'
                ? 'bg-[#fef9f0] border-[#d8a471] text-[#81512f]'
                : 'bg-[#fff5f5] border-[#feb2b2] text-[#9b2c2c]'
            }`}
          >
            {profile?.role === 'admin' ? (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-2 flex-1">
              <div className="font-bold text-sm">
                {profile?.role === 'admin'
                  ? 'Administrator Attendance Override Mode'
                  : '48-Hour Institutional Policy Lock Active'}
              </div>
              <p className="text-xs leading-relaxed">
                {profile?.role === 'admin'
                  ? 'This roll-call is older than 48 hours. As an administrator, you may modify these records. A formal justification comment is mandatory and will be permanently recorded in the immutable audit ledger.'
                  : 'This attendance record is older than 48 hours and has been locked to maintain academic integrity. Please request an administrator override to make retro-active amendments.'}
              </p>

              {profile?.role === 'admin' && (
                <div className="mt-2">
                  <textarea
                    placeholder="Enter mandatory justification for attendance correction past 48h..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-[#d8d0c2] rounded-xl p-2 text-xs text-[#171819] focus:outline-none focus:ring-2 focus:ring-[#81512f]"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STATUS COUNTS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-xl p-3 text-center">
            <span className="text-xs text-[#706b63] uppercase font-bold">Present</span>
            <div className="text-xl font-bold text-[#2b6cb0] mt-0.5">{counts.present}</div>
          </div>
          <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-xl p-3 text-center">
            <span className="text-xs text-[#706b63] uppercase font-bold">Absent</span>
            <div className="text-xl font-bold text-[#c53030] mt-0.5">{counts.absent}</div>
          </div>
          <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-xl p-3 text-center">
            <span className="text-xs text-[#706b63] uppercase font-bold">Tardy</span>
            <div className="text-xl font-bold text-[#dd6b20] mt-0.5">{counts.tardy}</div>
          </div>
          <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-xl p-3 text-center">
            <span className="text-xs text-[#706b63] uppercase font-bold">Excused</span>
            <div className="text-xl font-bold text-[#38a169] mt-0.5">{counts.excused}</div>
          </div>
        </div>

        {/* FEEDBACK MESSAGE */}
        {message && (
          <div
            className={`p-3 rounded-xl text-xs font-medium border ${
              message.type === 'success'
                ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]'
                : 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* ROSTER ROLL CALL TABLE */}
        <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-[#706b63]">
              Loading section roster and attendance...
            </div>
          ) : roster.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#706b63]">
              No students enrolled in this section.
            </div>
          ) : (
            <div className="divide-y divide-[#e8e2d5]">
              {roster.map((student, idx) => {
                const isFocused = focusedIndex === idx;
                const currentStatus = statuses[student.id] || 'present';

                return (
                  <div
                    key={student.id}
                    onClick={() => setFocusedIndex(idx)}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isFocused ? 'bg-[#f5eedf]' : 'hover:bg-[#f9f6f0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-xs text-[#a59e93] font-mono text-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-medium text-sm text-[#171819] flex items-center gap-2">
                          {student.fullName}
                          {isFocused && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#81512f] text-white font-bold uppercase">
                              Active Row
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#706b63]">{student.email}</div>
                      </div>
                    </div>

                    {/* STATUS BUTTONS (Tap & Keyboard) */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isLockedForTeacher}
                        onClick={() => setStudentStatus(student.id, 'present')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          currentStatus === 'present'
                            ? 'bg-[#2b6cb0] text-white shadow-sm'
                            : 'bg-[#ede7db] text-[#4a5568] hover:bg-[#e2d9c8]'
                        } disabled:opacity-50`}
                      >
                        [P] Present
                      </button>
                      <button
                        type="button"
                        disabled={isLockedForTeacher}
                        onClick={() => setStudentStatus(student.id, 'absent')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          currentStatus === 'absent'
                            ? 'bg-[#c53030] text-white shadow-sm'
                            : 'bg-[#ede7db] text-[#4a5568] hover:bg-[#e2d9c8]'
                        } disabled:opacity-50`}
                      >
                        [A] Absent
                      </button>
                      <button
                        type="button"
                        disabled={isLockedForTeacher}
                        onClick={() => setStudentStatus(student.id, 'tardy')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          currentStatus === 'tardy'
                            ? 'bg-[#dd6b20] text-white shadow-sm'
                            : 'bg-[#ede7db] text-[#4a5568] hover:bg-[#e2d9c8]'
                        } disabled:opacity-50`}
                      >
                        [T] Tardy
                      </button>
                      <button
                        type="button"
                        disabled={isLockedForTeacher}
                        onClick={() => setStudentStatus(student.id, 'excused')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          currentStatus === 'excused'
                            ? 'bg-[#38a169] text-white shadow-sm'
                            : 'bg-[#ede7db] text-[#4a5568] hover:bg-[#e2d9c8]'
                        } disabled:opacity-50`}
                      >
                        [E] Excused
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
