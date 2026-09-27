'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import {
  Course,
  GradeCategory,
  GradeItem,
  GradeEntry,
  GradeScale
} from '@/types';
import {
  Table,
  Sliders,
  Download,
  Plus,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Award,
  BookOpen,
  ArrowUpDown,
  Save,
  X,
  ChevronRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface StudentMatrixRow {
  student: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    gradeId?: string;
  };
  calculation: {
    weightedPercentage: number;
    letterGrade: string;
    gpaPoints: number;
    isPassing: boolean;
    missingCount: number;
    categoryBreakdown: {
      categoryId: string;
      categoryName: string;
      weightPercent: number;
      earnedPoints: number;
      possiblePoints: number;
      categoryPercentage: number;
    }[];
  };
}

export default function TeacherGradebookPage() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [categories, setCategories] = useState<GradeCategory[]>([]);
  const [items, setItems] = useState<GradeItem[]>([]);
  const [entries, setEntries] = useState<GradeEntry[]>([]);
  const [students, setStudents] = useState<StudentMatrixRow[]>([]);
  const [scales, setScales] = useState<GradeScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState<GradeCategory[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemDraft, setNewItemDraft] = useState({
    title: '',
    maxPoints: 100,
    categoryId: '',
    topic: '',
  });

  // Cell editing state
  const [editingCell, setEditingCell] = useState<{ studentId: string; itemId: string } | null>(null);
  const [cellValue, setCellValue] = useState<string>('');
  const [savingCell, setSavingCell] = useState(false);

  const teacherGradeId = profile?.gradeId || 'grade-6';

  // Load available courses for the teacher
  useEffect(() => {
    const gradeCourses = ContentService.getCoursesByGrade(teacherGradeId);
    setCourses(gradeCourses);
    if (gradeCourses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(gradeCourses[0].id);
    }
  }, [teacherGradeId, selectedCourseId]);

  // Load gradebook matrix when course changes
  const loadGradebook = async (courseId: string) => {
    if (!courseId) return;
    setLoading(true);
    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch(`/api/gradebook?courseId=${courseId}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setCategories(json.data.categories || []);
          setCategoryDraft(json.data.categories || []);
          setItems(json.data.items || []);
          setEntries(json.data.entries || []);
          setStudents(json.data.students || []);
          setScales(json.data.scales || []);
        }
      } else {
        setFeedbackMsg({ type: 'error', text: 'Failed to load gradebook matrix.' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Network error connecting to gradebook.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      void loadGradebook(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Handle cell edit save
  const handleSaveCell = async (
    studentId: string,
    itemId: string,
    points: number,
    status: 'graded' | 'missing' | 'excused' = 'graded'
  ) => {
    setSavingCell(true);
    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch('/api/gradebook/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          gradeItemId: itemId,
          studentId,
          points,
          status,
          isExcused: status === 'excused',
          isMissing: status === 'missing',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const updatedEntry = json.data?.entry;
        if (updatedEntry) {
          setEntries((prev) => {
            const idx = prev.findIndex((e) => e.gradeItemId === itemId && e.studentId === studentId);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = updatedEntry;
              return copy;
            }
            return [...prev, updatedEntry];
          });

          // Refresh student calculation locally or re-fetch
          void loadGradebook(selectedCourseId);
        }
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to save grade cell.' });
    } finally {
      setSavingCell(false);
      setEditingCell(null);
    }
  };

  // Toggle publish status of a column
  const handleTogglePublish = async (itemId: string, currentStatus: boolean) => {
    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch(`/api/gradebook/items/${itemId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ published: !currentStatus }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, published: !currentStatus } : i))
        );
        setFeedbackMsg({
          type: 'success',
          text: !currentStatus ? 'Grade item published to students.' : 'Grade item hidden from students.',
        });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to toggle publish status.' });
    }
  };

  // Save updated category weights
  const handleSaveCategories = async () => {
    const total = categoryDraft.reduce((s, c) => s + (Number(c.weightPercent) || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
      setFeedbackMsg({
        type: 'error',
        text: `Weights must sum to exactly 100%. Current total: ${total.toFixed(1)}%`,
      });
      return;
    }

    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch('/api/gradebook/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
          categories: categoryDraft,
        }),
      });

      if (res.ok) {
        setCategories(categoryDraft);
        setShowCategoryModal(false);
        setFeedbackMsg({ type: 'success', text: 'Category weights saved successfully.' });
        void loadGradebook(selectedCourseId);
      } else {
        const errJson = await res.json();
        setFeedbackMsg({ type: 'error', text: errJson.error?.message || 'Failed to save categories.' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Network error saving categories.' });
    }
  };

  // Add manual grade item
  const handleAddManualItem = async () => {
    if (!newItemDraft.title.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Item title is required.' });
      return;
    }

    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch('/api/gradebook/items/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
          title: newItemDraft.title,
          maxPoints: Number(newItemDraft.maxPoints) || 100,
          categoryId: newItemDraft.categoryId || undefined,
          topic: newItemDraft.topic || undefined,
        }),
      });

      if (res.ok) {
        setShowAddItemModal(false);
        setNewItemDraft({ title: '', maxPoints: 100, categoryId: '', topic: '' });
        setFeedbackMsg({ type: 'success', text: 'Manual grade item added to gradebook.' });
        void loadGradebook(selectedCourseId);
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to create manual item.' });
    }
  };

  // Trigger CSV export
  const handleExportCSV = async () => {
    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch(`/api/gradebook/export?courseId=${selectedCourseId}&format=csv`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Gradebook_${selectedCourseId}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setFeedbackMsg({ type: 'success', text: 'Gradebook CSV exported and logged to audit ledger.' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to export gradebook CSV.' });
    }
  };

  // Filter students by search
  const filteredStudents = students.filter((row) =>
    row.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (row.student.email && row.student.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16">
      {/* HEADER BANNER */}
      <div className="bg-[#171819] border border-[#d8a471]/30 p-6 sm:p-8 text-[#f6f2e9] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#d8a471]" />

        <div className="space-y-2 relative z-10">
          <p className="edurah-eyebrow-dark">
            <span /> Academic Integrity & Assessment
          </p>
          <h1 className="font-serif-hero text-2xl sm:text-3xl font-normal text-white tracking-tight">
            Institutional Weighted Gradebook
          </h1>
          <p className="text-xs sm:text-sm text-[#e9e4d7]/75 max-w-2xl leading-relaxed">
            Manage course category weighting, inline assessment scores, excused/missing status, and export official SIS rosters with immutable audit logging.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2.5 bg-[#f6f2e9]/10 hover:bg-[#f6f2e9]/20 text-[#f6f2e9] border border-[#d8d0c2]/30 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#d8a471]" /> Category Weights
          </button>

          <button
            onClick={() => setShowAddItemModal(true)}
            className="px-4 py-2.5 bg-[#f6f2e9]/10 hover:bg-[#f6f2e9]/20 text-[#f6f2e9] border border-[#d8d0c2]/30 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#d8a471]" /> Add Manual Item
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-[#d8a471] hover:bg-[#e8b57c] text-[#172020] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#172020]" /> Export SIS CSV
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedbackMsg && (
        <div
          className={`p-4 border flex items-center justify-between text-xs ${
            feedbackMsg.type === 'success'
              ? 'bg-[#edf7ed] border-[#c8e6c9] text-[#1e4620]'
              : 'bg-[#fdecea] border-[#f5c6cb] text-[#611a15]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#2e7d32]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#c62828]" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CONTROLS BAR: COURSE SELECTOR & SEARCH */}
      <div className="bg-white border border-[#d8d0c2] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label htmlFor="course-select" className="text-xs font-bold uppercase tracking-wider text-[#81512f] whitespace-nowrap">
            Curriculum Course:
          </label>
          <select
            id="course-select"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full sm:w-72 bg-[#fcfbf9] border border-[#d8d0c2] px-3 py-2 text-xs font-medium text-[#171819] focus:outline-none focus:border-[#81512f]"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8376]" />
            <input
              type="text"
              placeholder="Filter roster students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#fcfbf9] border border-[#d8d0c2] text-xs text-[#171819] placeholder-[#8a8376] focus:outline-none focus:border-[#81512f]"
            />
          </div>
          <button
            onClick={() => loadGradebook(selectedCourseId)}
            className="p-2 border border-[#d8d0c2] bg-[#fcfbf9] hover:bg-[#ede8dc] text-[#555048] transition-colors cursor-pointer"
            title="Refresh Spreadsheet"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CATEGORY WEIGHT SUMMARY BADGES */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#555048]">
          Category Weights:
        </span>
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fcfbf9] border border-[#d8d0c2] text-xs"
          >
            <span className="font-semibold text-[#171819]">{cat.name}</span>
            <span className="font-mono-code font-bold text-[#81512f] bg-[#f6f2e9] px-1.5 py-0.5 border border-[#d8d0c2]">
              {cat.weightPercent}%
            </span>
          </div>
        ))}
      </div>

      {/* SPREADSHEET MATRIX VIEW */}
      {loading ? (
        <div className="bg-white border border-[#d8d0c2] p-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#d8a471] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-[#555048]">Assembling Cohort Grade Matrix...</p>
        </div>
      ) : (
        <div className="bg-white border border-[#d8d0c2] shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full border-collapse text-left text-xs">
              {/* TABLE HEADER */}
              <thead className="sticky top-0 bg-[#f6f2e9] z-20 border-b border-[#d8d0c2]">
                <tr>
                  {/* FIXED STUDENT COLUMN */}
                  <th className="sticky left-0 bg-[#f6f2e9] z-30 p-3.5 font-bold uppercase tracking-wider text-[#171819] border-r border-[#d8d0c2] min-w-[220px]">
                    Student Roster ({filteredStudents.length})
                  </th>

                  {/* OVERALL WEIGHTED GRADE */}
                  <th className="p-3.5 font-bold uppercase tracking-wider text-[#81512f] border-r border-[#d8d0c2] text-center min-w-[130px] bg-[#f3e5d4]/40">
                    Weighted Grade
                  </th>

                  {/* DYNAMIC GRADE ITEM COLUMNS */}
                  {items.map((item) => (
                    <th
                      key={item.id}
                      className={`p-3 font-semibold border-r border-[#d8d0c2] min-w-[140px] text-center relative ${
                        !item.published ? 'bg-[#ede8dc]/40 opacity-75' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#81512f] truncate">
                            {item.categoryName || item.sourceType}
                          </span>
                          <button
                            onClick={() => handleTogglePublish(item.id, item.published)}
                            title={item.published ? 'Published to students (Click to hide)' : 'Hidden from students (Click to publish)'}
                            className="p-0.5 hover:bg-[#d8d0c2] rounded text-[#555048] cursor-pointer"
                          >
                            {item.published ? (
                              <Eye className="w-3 h-3 text-[#2e7d32]" />
                            ) : (
                              <EyeOff className="w-3 h-3 text-[#8a8376]" />
                            )}
                          </button>
                        </div>
                        <div className="font-semibold text-[#171819] truncate max-w-[130px]" title={item.title}>
                          {item.title}
                        </div>
                        <div className="text-[10px] text-[#706b63] font-mono-code">
                          Max: {item.maxPoints} pts
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody className="divide-y divide-[#e8e2d5]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={items.length + 2}
                      className="p-12 text-center text-[#706b63] italic"
                    >
                      No students found in this cohort matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((row) => {
                    const student = row.student;
                    const calc = row.calculation;
                    const studentEntries = entries.filter((e) => e.studentId === student.id);

                    return (
                      <tr key={student.id} className="hover:bg-[#fcfbf9] transition-colors">
                        {/* STUDENT INFO CELL */}
                        <td className="sticky left-0 bg-white hover:bg-[#fcfbf9] z-10 p-3 border-r border-[#d8d0c2]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-[#171819] text-[#f6f2e9] font-bold text-xs flex items-center justify-center font-mono-code flex-shrink-0">
                              {student.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[#171819] truncate">{student.name}</div>
                              <div className="text-[10px] text-[#706b63] truncate">{student.email || 'No email'}</div>
                            </div>
                          </div>
                        </td>

                        {/* WEIGHTED GRADE COMPUTED CELL */}
                        <td className="p-3 text-center border-r border-[#d8d0c2] bg-[#fcfbf9]">
                          <div className="space-y-0.5">
                            <div className="font-serif-hero text-sm font-bold text-[#171819]">
                              {calc.weightedPercentage}%
                            </div>
                            <div className="flex items-center justify-center gap-1">
                              <span
                                className={`text-[10px] px-1.5 py-0.2 font-bold font-mono-code ${
                                  calc.isPassing
                                    ? 'bg-[#e8f5e9] text-[#2e7d32]'
                                    : 'bg-[#ffebee] text-[#c62828]'
                                }`}
                              >
                                {calc.letterGrade}
                              </span>
                              <span className="text-[10px] text-[#8a8376]">({calc.gpaPoints} GPA)</span>
                            </div>
                          </div>
                        </td>

                        {/* ITEM SCORE CELLS */}
                        {items.map((item) => {
                          const entry = studentEntries.find((e) => e.gradeItemId === item.id);
                          const isEditing =
                            editingCell?.studentId === student.id && editingCell?.itemId === item.id;

                          return (
                            <td
                              key={item.id}
                              className={`p-2 border-r border-[#d8d0c2] text-center transition-colors relative ${
                                !item.published ? 'bg-[#ede8dc]/15' : ''
                              }`}
                            >
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    autoFocus
                                    value={cellValue}
                                    onChange={(e) => setCellValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        void handleSaveCell(student.id, item.id, Number(cellValue) || 0);
                                      } else if (e.key === 'Escape') {
                                        setEditingCell(null);
                                      }
                                    }}
                                    className="w-16 p-1 border border-[#81512f] bg-white text-center font-mono-code text-xs font-bold focus:outline-none"
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      onClick={() => void handleSaveCell(student.id, item.id, Number(cellValue) || 0)}
                                      className="p-0.5 bg-[#81512f] text-white hover:bg-[#683f23] cursor-pointer"
                                      title="Save Score"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setEditingCell(null)}
                                      className="p-0.5 bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={() => {
                                    setEditingCell({ studentId: student.id, itemId: item.id });
                                    setCellValue(entry ? String(entry.points) : '');
                                  }}
                                  className="group cursor-pointer p-1.5 rounded hover:bg-[#ede8dc]/50 transition-colors flex flex-col items-center justify-center min-h-[36px]"
                                  title="Click to edit grade"
                                >
                                  {entry?.isExcused || entry?.status === 'excused' ? (
                                    <span className="px-2 py-0.5 bg-[#ede8dc] text-[#555048] font-bold font-mono-code text-[11px] rounded">
                                      EXCUSED
                                    </span>
                                  ) : entry?.isMissing || entry?.status === 'missing' ? (
                                    <span className="px-2 py-0.5 bg-[#ffebee] text-[#c62828] font-bold font-mono-code text-[11px] rounded">
                                      MISSING
                                    </span>
                                  ) : entry ? (
                                    <div className="space-y-0.5">
                                      <span className="font-mono-code font-bold text-xs text-[#171819]">
                                        {entry.points}
                                      </span>
                                      <span className="text-[10px] text-[#8a8376] block">
                                        / {item.maxPoints}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[#a8a29e] font-mono-code text-xs group-hover:text-[#171819]">
                                      —
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORY WEIGHT CONFIGURATION MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#fcfbf9] border border-[#d8d0c2] max-w-lg w-full p-6 space-y-5 relative shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#81512f]" />
            <div className="flex items-center justify-between pb-3 border-b border-[#e8e2d5]">
              <div className="space-y-0.5">
                <h3 className="font-serif-heading text-lg font-normal text-[#171819]">
                  Course Category Weights
                </h3>
                <p className="text-xs text-[#706b63]">
                  All active category weights must sum to exactly 100%.
                </p>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-[#706b63] hover:text-[#171819] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* WEIGHT INPUTS */}
            <div className="space-y-3">
              {categoryDraft.map((cat, idx) => (
                <div key={cat.id} className="p-3 bg-white border border-[#d8d0c2] space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => {
                        const copy = [...categoryDraft];
                        copy[idx].name = e.target.value;
                        setCategoryDraft(copy);
                      }}
                      className="font-bold text-xs text-[#171819] bg-transparent border-b border-transparent focus:border-[#81512f] focus:outline-none flex-1"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={cat.weightPercent}
                        onChange={(e) => {
                          const copy = [...categoryDraft];
                          copy[idx].weightPercent = Number(e.target.value) || 0;
                          setCategoryDraft(copy);
                        }}
                        className="w-16 p-1 border border-[#d8d0c2] text-center font-mono-code text-xs font-bold focus:border-[#81512f] focus:outline-none"
                      />
                      <span className="font-bold text-xs text-[#81512f]">%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TOTAL SUM BAR */}
            {(() => {
              const total = categoryDraft.reduce((s, c) => s + (Number(c.weightPercent) || 0), 0);
              const isValid = Math.abs(total - 100) < 0.01;
              return (
                <div
                  className={`p-3 border flex items-center justify-between text-xs font-bold ${
                    isValid
                      ? 'bg-[#e8f5e9] border-[#c8e6c9] text-[#2e7d32]'
                      : 'bg-[#ffebee] border-[#ffcdd2] text-[#c62828]'
                  }`}
                >
                  <span>Total Weight: {total.toFixed(1)}%</span>
                  <span>{isValid ? '✓ Valid (100%)' : `Must equal 100% (Diff: ${(100 - total).toFixed(1)}%)`}</span>
                </div>
              );
            })()}

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 border border-[#d8d0c2] text-xs font-semibold text-[#555048] hover:bg-[#ede8dc] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategories}
                className="px-5 py-2 bg-[#81512f] hover:bg-[#683f23] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Save Category Weights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MANUAL GRADE ITEM MODAL */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#fcfbf9] border border-[#d8d0c2] max-w-md w-full p-6 space-y-4 relative shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#d8a471]" />
            <div className="flex items-center justify-between pb-2 border-b border-[#e8e2d5]">
              <h3 className="font-serif-heading text-lg font-normal text-[#171819]">
                Add Manual Grade Item
              </h3>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="text-[#706b63] hover:text-[#171819] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#81512f] block mb-1">
                  Item Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Laboratory Practical & Viva"
                  value={newItemDraft.title}
                  onChange={(e) => setNewItemDraft({ ...newItemDraft, title: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#d8d0c2] text-xs focus:outline-none focus:border-[#81512f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#81512f] block mb-1">
                    Max Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItemDraft.maxPoints}
                    onChange={(e) =>
                      setNewItemDraft({ ...newItemDraft, maxPoints: Number(e.target.value) || 100 })
                    }
                    className="w-full p-2.5 bg-white border border-[#d8d0c2] text-xs font-mono-code focus:outline-none focus:border-[#81512f]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#81512f] block mb-1">
                    Category
                  </label>
                  <select
                    value={newItemDraft.categoryId}
                    onChange={(e) => setNewItemDraft({ ...newItemDraft, categoryId: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#d8d0c2] text-xs focus:outline-none focus:border-[#81512f]"
                  >
                    <option value="">Default Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.weightPercent}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#81512f] block mb-1">
                  Curriculum Topic Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Laboratory Practice, Mechanics"
                  value={newItemDraft.topic}
                  onChange={(e) => setNewItemDraft({ ...newItemDraft, topic: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#d8d0c2] text-xs focus:outline-none focus:border-[#81512f]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 border border-[#d8d0c2] text-xs font-semibold text-[#555048] hover:bg-[#ede8dc] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddManualItem}
                className="px-5 py-2 bg-[#d8a471] hover:bg-[#e8b57c] text-[#172020] text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Create Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
