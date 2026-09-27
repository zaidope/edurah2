'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserProfile, Grade } from '@/types';
import { AuthService } from '@/lib/auth';
import { ContentService } from '@/lib/content';
import {
  Users,
  Plus,
  Search,
  Filter,
  X,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Award,
  AlertTriangle,
  Calendar
} from 'lucide-react';

export default function AdminStudentsPage() {
  const grades = ContentService.getGrades();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterBatch, setFilterBatch] = useState<string>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState<UserProfile | null>(null);
  const [newGradeId, setNewGradeId] = useState<string>('grade-1');
  const [newBatch, setNewBatch] = useState<string>('2025–2026');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studentId: '',
    gradeId: 'grade-1',
    classGroup: '',
    academicBatch: '2025–2026',
    password: ''
  });
  const [formMsg, setFormMsg] = useState('');

  const refreshData = async () => {
    setLoading(true);
    const data = await AuthService.searchStudents(searchQuery, filterStatus, filterGrade, filterBatch);
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [searchQuery, filterStatus, filterGrade, filterBatch]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');

    const res = await AuthService.provisionStudent(formData);
    if (res.success) {
      setFormMsg(res.error ? res.error : 'Student account successfully provisioned!');
      await refreshData();
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setFormData({
          fullName: '',
          email: '',
          studentId: '',
          gradeId: 'grade-1',
          classGroup: '',
          academicBatch: '2025–2026',
          password: ''
        });
        setFormMsg('');
      }, 1000);
    } else {
      setFormMsg(res.error || 'Failed to create student account');
    }
  };

  const handlePromoteStudent = async () => {
    if (!targetStudent) return;
    await AuthService.updateStudentGradeAndBatch(targetStudent.id, newGradeId, newBatch);
    setIsPromoteModalOpen(false);
    setTargetStudent(null);
    await refreshData();
  };

  const handleToggleStatus = async (id: string) => {
    await AuthService.toggleStudentStatus(id);
    await refreshData();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Student Account & Grade Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision student profiles with mandatory grade assignments, manage grade promotions, and preserve academic records.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              fullName: '',
              email: '',
              studentId: `EDU-2026-${Math.floor(100 + Math.random() * 900)}`,
              gradeId: 'grade-1',
              classGroup: 'Primary Cohort A',
              academicBatch: '2025–2026',
              password: 'EdurahPass2026!'
            });
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Provision New Student
        </button>
      </div>

      {/* CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, email, or student ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Grades</option>
            {grades.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Batches</option>
            <option value="2025–2026">2025–2026</option>
            <option value="2026–2027">2026–2027</option>
            <option value="2024–2025">2024–2025</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e: any) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* STUDENTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Student ID</th>
                <th className="px-6 py-3.5">Current Grade</th>
                <th className="px-6 py-3.5">Academic Batch</th>
                <th className="px-6 py-3.5">Cohort Group</th>
                <th className="px-6 py-3.5">Account Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No student accounts found matching criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const assignedGrade = grades.find(g => g.id === student.gradeId);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {student.fullName.charAt(0)}
                          </div>
                          <div>
                            <Link
                              href={`/admin/students/${student.id}`}
                              className="font-bold text-slate-900 hover:text-blue-600 block"
                            >
                              {student.fullName}
                            </Link>
                            <span className="text-slate-500 text-[11px] block">{student.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono font-semibold text-slate-700">
                        {student.studentId}
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                          {assignedGrade ? assignedGrade.name : (student.gradeId || 'Grade 1')}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          {student.academicBatch || '2025–2026'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {student.classGroup || 'General Cohort'}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(student.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            student.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {student.isActive ? 'Active' : 'Deactivated'}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setTargetStudent(student);
                              setNewGradeId(student.gradeId || 'grade-1');
                              setNewBatch(student.academicBatch || '2025–2026');
                              setIsPromoteModalOpen(true);
                            }}
                            className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <TrendingUp className="w-3 h-3" /> Edit Grade / Batch
                          </button>
                          <Link
                            href={`/admin/students/${student.id}`}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE STUDENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Provision Student Account
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formMsg && (
              <div className="p-3 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold">
                {formMsg}
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Maya Lin"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Student Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="maya.lin@edurah.edu"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Student ID</label>
                <input
                  type="text"
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mandatory Grade</label>
                  <select
                    value={formData.gradeId}
                    onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600"
                  >
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Academic Batch</label>
                  <select
                    value={formData.academicBatch}
                    onChange={(e) => setFormData({ ...formData, academicBatch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="2025–2026">2025–2026</option>
                    <option value="2026–2027">2026–2027</option>
                    <option value="2024–2025">2024–2025</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Class Cohort / Section</label>
                <input
                  type="text"
                  value={formData.classGroup}
                  onChange={(e) => setFormData({ ...formData, classGroup: e.target.value })}
                  placeholder="e.g. Grade 4 - Section B"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Initial Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  Provision Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE GRADE / PROMOTION CONFIRMATION MODAL */}
      {isPromoteModalOpen && targetStudent && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> Student Grade & Batch Reassignment
              </h3>
              <button
                onClick={() => setIsPromoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <span className="font-bold text-slate-900 block">{targetStudent.fullName}</span>
              <span className="text-slate-500 block">ID: {targetStudent.studentId} · {targetStudent.email}</span>
              <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-700 font-semibold">
                <div>
                  Grade:{' '}
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-extrabold">
                    {grades.find(g => g.id === targetStudent.gradeId)?.name || targetStudent.gradeId}
                  </span>
                </div>
                <div>
                  Batch:{' '}
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-extrabold">
                    {targetStudent.academicBatch || '2025–2026'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Select Target Grade</label>
              <select
                value={newGradeId}
                onChange={(e) => setNewGradeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                {grades.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.tier.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Select Academic Batch</label>
              <select
                value={newBatch}
                onChange={(e) => setNewBatch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="2025–2026">2025–2026</option>
                <option value="2026–2027">2026–2027</option>
                <option value="2024–2025">2024–2025</option>
              </select>
            </div>

            {/* SAFETY PRESERVATION NOTICE */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Academic History Preserved</span>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Changing the grade or batch updates the student’s active catalog immediately. All previously completed lessons, watch progress, and assessment records remain safely intact in Supabase.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPromoteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePromoteStudent}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Update Grade & Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
