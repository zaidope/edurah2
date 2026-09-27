'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, Grade } from '@/types';
import { AuthService } from '@/lib/auth';
import { ContentService } from '@/lib/content';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  X,
  Sparkles,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Mail,
  ShieldCheck,
  Building
} from 'lucide-react';

export default function AdminTeachersPage() {
  const grades = ContentService.getGrades();
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<UserProfile | null>(null);

  const [createFormData, setCreateFormData] = useState({
    fullName: '',
    email: '',
    gradeId: 'grade-1',
    department: 'General Faculty',
    password: 'EdurahTeacher2026!'
  });

  const [newAssignedGrade, setNewAssignedGrade] = useState('grade-1');
  const [formMsg, setFormMsg] = useState('');

  const refreshData = async () => {
    setLoading(true);
    const data = await AuthService.searchTeachers(searchQuery, filterStatus, filterGrade);
    setTeachers(data);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [searchQuery, filterStatus, filterGrade]);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');

    const res = await AuthService.provisionTeacher(createFormData);
    if (res.success) {
      setFormMsg('Teacher account successfully provisioned!');
      await refreshData();
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateFormData({
          fullName: '',
          email: '',
          gradeId: 'grade-1',
          department: 'General Faculty',
          password: 'EdurahTeacher2026!'
        });
        setFormMsg('');
      }, 1000);
    } else {
      setFormMsg(res.error || 'Failed to create teacher account');
    }
  };

  const handleSaveGradeChange = async () => {
    if (!editingTeacher) return;
    await AuthService.updateTeacherGrade(editingTeacher.id, newAssignedGrade);
    setIsEditModalOpen(false);
    setEditingTeacher(null);
    await refreshData();
  };

  const handleToggleStatus = async (id: string) => {
    await AuthService.toggleTeacherStatus(id);
    await refreshData();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-600" /> Faculty & Teacher Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision teacher accounts, assign mandatory grade cohorts, and manage active status.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateFormData({
              fullName: '',
              email: '',
              gradeId: 'grade-1',
              department: 'Primary Division',
              password: 'EdurahTeacher2026!'
            });
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Provision New Teacher
        </button>
      </div>

      {/* CONTROLS: SEARCH & FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by teacher name, email, or ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Grade Filter */}
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

        {/* Status Filter */}
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

      {/* TEACHERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Teacher</th>
                <th className="px-6 py-3.5">Assigned Grade</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No faculty accounts found matching criteria.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => {
                  const assignedGrade = grades.find(g => g.id === teacher.gradeId);

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {teacher.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{teacher.fullName}</span>
                            <span className="text-slate-500 text-[11px] block">{teacher.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {assignedGrade ? assignedGrade.name : (teacher.gradeId || 'Unassigned')}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {teacher.classGroup || 'Faculty'}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(teacher.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            teacher.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {teacher.isActive ? 'Active' : 'Deactivated'}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditingTeacher(teacher);
                            setNewAssignedGrade(teacher.gradeId || 'grade-1');
                            setIsEditModalOpen(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Reassign Grade
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TEACHER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" /> Provision Teacher Account
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

            <form onSubmit={handleCreateTeacher} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={createFormData.fullName}
                  onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
                  placeholder="e.g. Dr. Sarah Connor"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Teacher Email</label>
                <input
                  type="email"
                  required
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  placeholder="sarah.connor@edurah.edu"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Mandatory Assigned Grade</label>
                <select
                  value={createFormData.gradeId}
                  onChange={(e) => setCreateFormData({ ...createFormData, gradeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                >
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.tier.toUpperCase()})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  The teacher will be strictly restricted to accessing and managing courses for this grade.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Department / Division</label>
                <input
                  type="text"
                  value={createFormData.department}
                  onChange={(e) => setCreateFormData({ ...createFormData, department: e.target.value })}
                  placeholder="e.g. Mathematics Department"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Initial Password</label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-600"
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Provision Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN GRADE MODAL */}
      {isEditModalOpen && editingTeacher && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" /> Reassign Teacher Grade
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <span className="font-bold text-slate-900 block">{editingTeacher.fullName}</span>
              <span className="text-slate-500 block">{editingTeacher.email}</span>
              <div className="pt-1 text-[11px] text-slate-600">
                Current Assigned Grade:{' '}
                <strong>
                  {grades.find(g => g.id === editingTeacher.gradeId)?.name || editingTeacher.gradeId}
                </strong>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Select New Assigned Grade</label>
              <select
                value={newAssignedGrade}
                onChange={(e) => setNewAssignedGrade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                {grades.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.tier.toUpperCase()})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                The teacher’s access will immediately update to courses, students, and quizzes for this new grade.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGradeChange}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
