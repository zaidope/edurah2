'use client';

import React, { useState, useEffect } from 'react';
import { Subject } from '@/types';
import { ContentService } from '@/lib/content';
import { Layers, Plus, Edit2, Trash2, X } from 'lucide-react';

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Partial<Subject> | null>(null);

  const refreshData = () => {
    setSubjects(ContentService.getSubjects());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject?.name || !editingSubject?.slug) return;

    const subjectToSave: Subject = {
      id: editingSubject.id || `sub-${Date.now()}`,
      name: editingSubject.name,
      slug: editingSubject.slug.toLowerCase().replace(/\s+/g, '-'),
      description: editingSubject.description || '',
      shortDescription: editingSubject.shortDescription || '',
      icon: editingSubject.icon || 'Code2',
      color: editingSubject.color || 'from-blue-600 to-indigo-600',
      category: editingSubject.category || 'General',
      courseCount: editingSubject.courseCount || 0,
      lessonCount: editingSubject.lessonCount || 0,
      featured: editingSubject.featured ?? true,
      bannerImage: editingSubject.bannerImage || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'
    };

    ContentService.saveSubject(subjectToSave);
    refreshData();
    setIsModalOpen(false);
    setEditingSubject(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      ContentService.deleteSubject(id);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" /> Subject Management
          </h1>
          <p className="text-xs text-slate-600 mt-1">Manage learning specialization categories and metadata.</p>
        </div>

        <button
          onClick={() => {
            setEditingSubject({
              name: '',
              slug: '',
              description: '',
              shortDescription: '',
              category: 'Engineering',
              featured: true
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" /> Create New Subject
        </button>
      </div>

      {/* TABLE LIST */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="p-4">Subject Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Courses</th>
                <th className="p-4">Featured</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-semibold text-slate-900">
                    <div>{s.name}</div>
                    <div className="text-[10px] text-slate-500">slug: /subjects/{s.slug}</div>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{s.category}</td>
                  <td className="p-4 text-slate-600 font-medium">{s.courseCount} Courses</td>
                  <td className="p-4">
                    {s.featured ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Featured
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md text-[10px] text-slate-600 bg-slate-100 border border-slate-200">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingSubject(s);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-md bg-slate-100 hover:bg-rose-600 text-slate-700 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                {editingSubject?.id ? 'Edit Subject' : 'Create New Subject'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Subject Name</label>
                <input
                  type="text"
                  required
                  value={editingSubject?.name || ''}
                  onChange={e => setEditingSubject({ ...editingSubject, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g. Quantum Computing"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Slug</label>
                <input
                  type="text"
                  required
                  value={editingSubject?.slug || ''}
                  onChange={e => setEditingSubject({ ...editingSubject, slug: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Category Tag</label>
                <input
                  type="text"
                  value={editingSubject?.category || ''}
                  onChange={e => setEditingSubject({ ...editingSubject, category: e.target.value })}
                  placeholder="Engineering, Sciences, etc."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Short Description</label>
                <input
                  type="text"
                  value={editingSubject?.shortDescription || ''}
                  onChange={e => setEditingSubject({ ...editingSubject, shortDescription: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Full Description</label>
                <textarea
                  rows={3}
                  value={editingSubject?.description || ''}
                  onChange={e => setEditingSubject({ ...editingSubject, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featCheck"
                  checked={editingSubject?.featured ?? true}
                  onChange={e => setEditingSubject({ ...editingSubject, featured: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <label htmlFor="featCheck" className="text-slate-700 font-medium">Show on Homepage Featured Section</label>
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
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

