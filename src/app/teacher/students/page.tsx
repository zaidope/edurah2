'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AuthService } from '@/lib/auth';
import { ContentService } from '@/lib/content';
import { UserProfile, Course } from '@/types';
import {
  Users,
  Search,
  CheckCircle2,
  BookOpen,
  ShieldCheck,
  Filter,
  ArrowRight,
  Eye,
  GraduationCap
} from 'lucide-react';

export default function TeacherStudentsPage() {
  const { profile, loading: authLoading } = useAuth();
  const teacherGradeId = profile?.gradeId || 'grade-1';
  const gradeObj = ContentService.getGradeById(teacherGradeId);

  const [students, setStudents] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBatch, setFilterBatch] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    async function loadData() {
      setLoading(true);
      // Strictly isolate to assigned grade
      const gradeStudents = await AuthService.getStudentsByGrade(teacherGradeId);
      setStudents(gradeStudents);
      setLoading(false);
    }
    loadData();
  }, [teacherGradeId, authLoading]);

  // Extract unique academic batches
  const availableBatches = Array.from(
    new Set(students.map((s) => s.academicBatch || '2025–2026'))
  );
  if (!availableBatches.includes('2025–2026')) availableBatches.push('2025–2026');
  if (!availableBatches.includes('2026–2027')) availableBatches.push('2026–2027');

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBatch =
      filterBatch === 'all' || (s.academicBatch || '2025–2026') === filterBatch;

    return matchesSearch && matchesBatch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#171819]">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8d0c2] pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8e5a2b]" />
            Cohort Roster
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-heading font-normal text-[#171819] tracking-tight">
            Enrolled Students — {gradeObj?.name || 'Assigned Grade'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6f6b63] mt-1 leading-relaxed">
            Manage cohort accounts, review verified watch progress, and inspect assessment marks for students in your assigned grade.
          </p>
        </div>

        {/* SEARCH & BATCH FILTER CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#faf8f5] border border-[#d8d0c2] rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#8e5a2b]" />
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="bg-transparent border-0 text-xs font-semibold text-[#171819] focus:outline-none cursor-pointer"
            >
              <option value="all">All Academic Batches</option>
              {availableBatches.map((b) => (
                <option key={b} value={b}>
                  Batch {b}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#9d978c] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-xs text-[#171819] placeholder:text-[#9d978c] focus:outline-none focus:border-[#d8a471] shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* ROSTER TABLE */}
      <div className="edurah-card-warm rounded-2xl overflow-hidden shadow-xs border border-[#d8d0c2]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#ede6d8]/60 border-b border-[#d8d0c2] text-[#6f6b63] font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Student Profile</th>
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Assigned Grade</th>
                <th className="px-6 py-4">Academic Batch</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ded0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#6f6b63]">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#8e5a2b] border-t-transparent rounded-full animate-spin" />
                      Loading cohort records...
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#6f6b63]">
                    <Users className="w-8 h-8 text-[#9d978c] mx-auto mb-2" />
                    No students currently enrolled in {gradeObj?.name} matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-[#faf8f5] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/teacher/students/${student.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-full bg-[#ede6d8] text-[#8e5a2b] font-bold text-xs flex items-center justify-center shrink-0 border border-[#d8d0c2] group-hover:scale-105 transition-transform">
                            {student.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-[#171819] block group-hover:text-[#8e5a2b] transition-colors">
                              {student.fullName}
                            </span>
                            <span className="text-[#6f6b63] text-[11px] block">{student.email}</span>
                          </div>
                        </Link>
                      </td>

                      <td className="px-6 py-4 font-mono-code font-semibold text-[#171819]">
                        {student.studentId}
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ede6d8] text-[#171819] border border-[#d8d0c2]">
                          {gradeObj?.name || student.gradeId}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono-code text-xs font-semibold text-[#8e5a2b]">
                          {student.academicBatch || '2025–2026'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            student.isActive
                              ? 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]'
                              : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                          }`}
                        >
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/teacher/students/${student.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#ede8dc] border border-[#d8d0c2] rounded-lg text-xs font-bold text-[#8e5a2b] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Progress
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
