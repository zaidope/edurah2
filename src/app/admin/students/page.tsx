'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserProfile } from '@/types';
import { AuthService } from '@/lib/auth';
import { Users, Plus, Search, Filter, X, Sparkles, RefreshCw } from 'lucide-react';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studentId: '',
    classGroup: '',
    password: ''
  });
  const [formMsg, setFormMsg] = useState('');

  const refreshData = async () => {
    setLoading(true);
    const data = await AuthService.searchStudents(searchQuery, filterStatus);
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [searchQuery, filterStatus]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');

    const res = await AuthService.provisionStudent(formData);
    if (res.success) {
      setFormMsg(res.error ? res.error : 'Student account successfully provisioned!');
      await refreshData();
      setTimeout(() => {
        setIsModalOpen(false);
        setFormData({ fullName: '', email: '', studentId: '', classGroup: '', password: '' });
        setFormMsg('');
      }, 1200);
    } else {
      setFormMsg(res.error || 'Failed to create student');
    }
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
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Student Account Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision auth accounts, manage student IDs, and update active access states in Supabase.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              fullName: '',
              email: '',
              studentId: `EDU-2026-${Math.floor(100 + Math.random() * 900)}`,
              classGroup: 'Computer Science Cohort A',
              password: 'EdurahPass2026!'
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" /> Provision Student Account
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, or email..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {['all', 'active', 'inactive'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st as any)}
              className={`px-3 py-1 rounded-md uppercase text-[10px] font-semibold transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* STUDENTS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs space-y-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading profiles from Supabase...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Student ID</th>
                  <th className="p-4">Class / Group</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                      No matching student profiles found.
                    </td>
                  </tr>
                ) : (
                  students.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                            {s.fullName.charAt(0)}
                          </div>
                          <div>
                            <div>{s.fullName}</div>
                            <div className="text-[10px] text-slate-500">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 font-mono">{s.studentId}</td>
                      <td className="p-4 text-slate-600">{s.classGroup || 'General Batch'}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                          {s.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-semibold ${
                          s.isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {s.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors inline-block"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(s.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                            s.isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {s.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PROVISION STUDENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Provision Student Account</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formMsg && (
              <div className={`p-3 rounded-lg text-xs font-medium ${
                formMsg.includes('successfully') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}>
                {formMsg}
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Jordan Vance"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Student Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jordan@eduura.edu"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Student ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="EDU-2026-999"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Class / Batch Group</label>
                  <input
                    type="text"
                    value={formData.classGroup}
                    onChange={e => setFormData({ ...formData, classGroup: e.target.value })}
                    placeholder="e.g. CS Batch A"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Initial Password</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="EdurahPass2026!"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
