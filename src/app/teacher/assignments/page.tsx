'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import { Assignment, Course } from '@/types';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  FolderCheck,
  RotateCcw,
  X,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function TeacherAssignmentsPage() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [instructionsMd, setInstructionsMd] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [closeAt, setCloseAt] = useState('');
  const [points, setPoints] = useState(100);
  const [latePenalty, setLatePenalty] = useState(5);
  const [criteria, setCriteria] = useState<Array<{ title: string; description: string; maxPoints: number }>>([
    { title: 'Core Requirements & Execution', description: 'Meets primary prompt objectives.', maxPoints: 50 },
    { title: 'Quality, Structure & Clarity', description: 'Demonstrates clear reasoning and modular organization.', maxPoints: 50 },
  ]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const teacherGradeId = profile?.gradeId;
  const gradeObj = teacherGradeId ? ContentService.getGradeById(teacherGradeId) : null;
  const gradeCourses = teacherGradeId ? ContentService.getCoursesByGrade(teacherGradeId) : ContentService.getCourses();

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assignments');
      if (res.ok) {
        const json = await res.json();
        if (json.data?.assignments) {
          setAssignments(json.data.assignments);
        }
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
    if (gradeCourses.length > 0 && !courseId) {
      setCourseId(gradeCourses[0].id);
    }
  }, [teacherGradeId]);

  const handleAddCriterion = () => {
    setCriteria([...criteria, { title: 'New Criterion', description: '', maxPoints: 20 }]);
  };

  const handleRemoveCriterion = (idx: number) => {
    setCriteria(criteria.filter((_, i) => i !== idx));
  };

  const handleCriterionChange = (idx: number, field: string, val: any) => {
    const next = [...criteria];
    next[idx] = { ...next[idx], [field]: val };
    setCriteria(next);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!courseId) {
      setFormError('Please select a course');
      return;
    }

    if (!dueAt) {
      setFormError('Due date is required');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setFormError('Faculty session expired. Please refresh.');
        setSaving(false);
        return;
      }

      const totalCriteriaPoints = criteria.reduce((sum, c) => sum + Number(c.maxPoints || 0), 0);

      const payload = {
        title,
        courseId,
        instructionsMd,
        dueAt: new Date(dueAt).toISOString(),
        closeAt: closeAt ? new Date(closeAt).toISOString() : undefined,
        points: totalCriteriaPoints > 0 ? totalCriteriaPoints : points,
        latePenaltyPercentPerDay: Number(latePenalty) || 0,
        allowedMime: ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'],
        maxFileMb: 25,
        rubric: {
          title: `${title} Rubric`,
          criteria,
        },
      };

      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error?.message || 'Failed to publish assignment');
      }

      setShowCreateModal(false);
      setTitle('');
      setInstructionsMd('');
      setDueAt('');
      setCloseAt('');
      loadAssignments();
    } catch (err: any) {
      setFormError(err.message || 'Submission error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8d0c2] pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] text-[10px] font-bold uppercase tracking-wider font-mono-code">
            <FolderCheck className="w-3.5 h-3.5" />
            <span>{gradeObj ? `${gradeObj.name} Assignment Hub` : 'Faculty Assignment Hub'}</span>
          </div>
          <h1 className="text-3xl font-serif-heading font-normal text-[#171819]">
            Assignments & Dropboxes
          </h1>
          <p className="text-xs text-[#6f6b63]">
            Author assignment instructions, attach custom scoring rubrics, and access the grading queue.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="edurah-btn-primary text-xs px-5 py-2.5 inline-flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" /> Create Assignment
        </button>
      </div>

      {/* ASSIGNMENTS LIST */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#6f6b63]">
          <div className="w-8 h-8 rounded-full border-2 border-[#8e5a2b] border-t-transparent animate-spin mx-auto mb-2" />
          Loading course dropboxes...
        </div>
      ) : assignments.length === 0 ? (
        <div className="edurah-card-warm p-12 rounded-3xl border border-[#d8d0c2] text-center space-y-3">
          <FileText className="w-10 h-10 text-[#8e5a2b] mx-auto opacity-40" />
          <h3 className="font-serif-heading text-lg font-normal text-[#171819]">No assignments created yet</h3>
          <p className="text-xs text-[#6f6b63] max-w-md mx-auto">
            Create an assignment with instructions and a rubric to collect student project submissions.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="edurah-btn-primary text-xs px-5 py-2 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create First Assignment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((asg) => {
            const course = ContentService.getCourseById(asg.courseId);
            const dueDateFormatted = new Date(asg.dueAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={asg.id}
                className="edurah-card-warm p-6 rounded-3xl border border-[#d8d0c2] shadow-xs flex flex-col justify-between space-y-5 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono-code text-[#8e5a2b] bg-[#ede6d8] px-2.5 py-0.5 rounded-full border border-[#d8d0c2]">
                      {course?.title || asg.courseTitle || 'Curriculum Course'}
                    </span>
                    <span className="text-xs font-mono-code font-bold text-[#171819]">
                      {asg.points} pts
                    </span>
                  </div>

                  <h3 className="text-lg font-serif-heading font-normal text-[#171819] leading-snug">
                    {asg.title}
                  </h3>

                  <p className="text-xs text-[#6f6b63] line-clamp-2 leading-relaxed">
                    {asg.instructionsMd}
                  </p>

                  <div className="pt-2 text-[11px] text-[#6f6b63] space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#8e5a2b]" />
                      <span>Due: <strong>{dueDateFormatted}</strong></span>
                    </div>
                    {asg.rubric && (
                      <div className="flex items-center gap-1.5 text-emerald-800">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Rubric attached ({asg.rubric.criteria?.length || 0} criteria)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e5ded0] flex items-center justify-between">
                  <Link
                    href={`/assignments/${asg.id}`}
                    className="text-xs font-bold text-[#8e5a2b] hover:underline inline-flex items-center gap-1"
                  >
                    Student View
                  </Link>

                  <Link
                    href={`/teacher/assignments/${asg.id}/grading`}
                    className="edurah-btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Grading Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#fcfbf9] rounded-3xl border border-[#d8d0c2] shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e5ded0] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#ede6d8] border border-[#d8d0c2] flex items-center justify-center text-[#8e5a2b]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-serif-heading font-normal text-[#171819]">
                    Create Assignment & Rubric
                  </h3>
                  <span className="text-xs text-[#6f6b63]">
                    Configure submission requirements and scoring matrix.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-[#6f6b63] hover:text-[#171819] rounded-xl hover:bg-[#ede6d8]/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-[#171819] block font-mono-code">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Plate Tectonics Laboratory Report"
                  className="w-full p-3.5 rounded-2xl bg-[#faf8f5] border border-[#d8d0c2] focus:outline-none focus:border-[#8e5a2b]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-[#171819] block font-mono-code">
                    Curriculum Course *
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-[#faf8f5] border border-[#d8d0c2] focus:outline-none focus:border-[#8e5a2b]"
                  >
                    {gradeCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-[#171819] block font-mono-code">
                    Late Penalty (% per day)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={latePenalty}
                    onChange={(e) => setLatePenalty(Number(e.target.value))}
                    className="w-full p-3.5 rounded-2xl bg-[#faf8f5] border border-[#d8d0c2] focus:outline-none focus:border-[#8e5a2b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-[#171819] block font-mono-code">
                    Due Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-[#faf8f5] border border-[#d8d0c2] focus:outline-none focus:border-[#8e5a2b]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-[#171819] block font-mono-code">
                    Hard Close Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={closeAt}
                    onChange={(e) => setCloseAt(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-[#faf8f5] border border-[#d8d0c2] focus:outline-none focus:border-[#8e5a2b]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-[#171819] block font-mono-code">
                  Instructions & Guidelines (Markdown) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={instructionsMd}
                  onChange={(e) => setInstructionsMd(e.target.value)}
                  placeholder="Outline objectives, formatting specifications, and required questions..."
                  className="w-full p-3.5 rounded-2xl bg-[#faf8f5] border border-[#d8d0c2] focus:outline-none focus:border-[#8e5a2b]"
                />
              </div>

              {/* RUBRIC BUILDER */}
              <div className="p-4 rounded-2xl bg-[#ede6d8]/40 border border-[#d8d0c2] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#8e5a2b]">
                    <Sparkles className="w-4 h-4 text-[#d8a471]" />
                    <span>Grading Rubric Criteria</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCriterion}
                    className="text-xs font-bold text-[#8e5a2b] hover:underline"
                  >
                    + Add Criterion
                  </button>
                </div>

                <div className="space-y-2.5">
                  {criteria.map((crit, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={crit.title}
                          onChange={(e) => handleCriterionChange(idx, 'title', e.target.value)}
                          placeholder="Criterion title"
                          className="flex-1 p-2 rounded-xl bg-white border border-[#d8d0c2]"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={crit.maxPoints}
                            onChange={(e) => handleCriterionChange(idx, 'maxPoints', Number(e.target.value))}
                            className="w-16 p-2 rounded-xl bg-white border border-[#d8d0c2] text-center font-mono-code"
                          />
                          <span className="text-[10px] text-[#6f6b63]">pts</span>
                        </div>
                        {criteria.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCriterion(idx)}
                            className="text-rose-600 hover:text-rose-800 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={crit.description}
                        onChange={(e) => handleCriterionChange(idx, 'description', e.target.value)}
                        placeholder="Description / benchmark expectation"
                        className="w-full p-2 rounded-xl bg-white border border-[#d8d0c2] text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5ded0]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="edurah-btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="edurah-btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {saving ? <span>Publishing...</span> : <span>Publish Assignment</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
