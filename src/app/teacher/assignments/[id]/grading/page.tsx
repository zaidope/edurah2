'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Assignment,
  AssignmentSubmission,
  RubricScore,
  SubmissionFile
} from '@/types';
import {
  FileText,
  CheckCircle2,
  RotateCcw,
  Clock,
  Download,
  AlertCircle,
  ChevronLeft,
  Sparkles,
  File,
  ShieldAlert,
  Send,
  UserCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function TeacherGradingQueuePage() {
  const params = useParams();
  const assignmentId = params?.id as string;
  const { profile } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedSub, setSelectedSub] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  // Grading form state
  const [rubricScores, setRubricScores] = useState<Record<string, { points: number; comment: string }>>({});
  const [manualScore, setManualScore] = useState<number>(100);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/assignments/${assignmentId}`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.assignment) {
          setAssignment(json.data.assignment);
          const subs = json.data.submissions || [];
          setSubmissions(subs);
          if (subs.length > 0 && !selectedSub) {
            selectSubmission(subs[0], json.data.assignment);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  const selectSubmission = (sub: AssignmentSubmission, asg?: Assignment) => {
    setSelectedSub(sub);
    setFeedback(sub.feedbackMd || '');
    setSuccessMessage(null);
    setErrorMessage(null);

    const activeAsg = asg || assignment;
    const initialScores: Record<string, { points: number; comment: string }> = {};

    if (activeAsg?.rubric?.criteria) {
      activeAsg.rubric.criteria.forEach((crit) => {
        const existing = sub.rubricScores?.find((s) => s.criterionId === crit.id);
        initialScores[crit.id] = {
          points: existing ? Number(existing.points) : crit.maxPoints,
          comment: existing?.comment || '',
        };
      });
    }

    setRubricScores(initialScores);
    setManualScore(sub.score !== undefined ? sub.score : activeAsg?.points || 100);
  };

  const handleScoreChange = (criterionId: string, pts: number) => {
    setRubricScores((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], points: pts },
    }));
  };

  const handleCommentChange = (criterionId: string, comment: string) => {
    setRubricScores((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], comment },
    }));
  };

  const calculateTotal = () => {
    if (!assignment?.rubric?.criteria?.length) {
      return manualScore;
    }
    return Object.values(rubricScores).reduce((sum, item) => sum + (Number(item.points) || 0), 0);
  };

  const handleDownloadFile = async (file: SubmissionFile) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(
        `/api/storage/signed-download-url?bucket=submissions&path=${encodeURIComponent(file.storagePath)}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const data = await res.json();
      if (data.data?.signedUrl) {
        window.open(data.data.signedUrl, '_blank');
      } else {
        alert(data.error?.message || 'Download error');
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleGradeSubmit = async (status: 'graded' | 'returned') => {
    if (!selectedSub) return;
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    if (status === 'returned' && (!feedback || feedback.trim().length === 0)) {
      setErrorMessage('Detailed feedback is required when returning an assignment for revision.');
      setSaving(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setErrorMessage('Faculty session expired. Please log in.');
        setSaving(false);
        return;
      }

      const formattedRubricScores = Object.entries(rubricScores).map(([critId, val]) => ({
        criterionId: critId,
        points: val.points,
        comment: val.comment,
      }));

      const res = await fetch(`/api/submissions/${selectedSub.id}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status,
          feedbackMd: feedback,
          manualScore: calculateTotal(),
          rubricScores: formattedRubricScores,
        }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error?.message || 'Grading action failed');
      }

      const updatedSub = resData.data.submission;
      setSuccessMessage(
        status === 'graded'
          ? `Grade recorded in gradebook successfully (${updatedSub.score} pts).`
          : 'Assignment returned to student for revision.'
      );
      setSelectedSub(updatedSub);
      setSubmissions((prev) => prev.map((s) => (s.id === updatedSub.id ? updatedSub : s)));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit grade');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-[#6f6b63]">
        <div className="w-8 h-8 rounded-full border-2 border-[#8e5a2b] border-t-transparent animate-spin mx-auto mb-2" />
        Loading faculty grading queue...
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 space-y-6 max-w-7xl mx-auto">
      {/* TOP NAV */}
      <div className="flex items-center justify-between border-b border-[#d8d0c2] pb-4">
        <Link
          href="/teacher/assignments"
          className="edurah-btn-ghost text-xs inline-flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dropboxes
        </Link>
        <span className="text-xs font-mono-code font-bold text-[#8e5a2b] bg-[#ede6d8] px-3 py-1 rounded-full border border-[#d8d0c2]">
          Grading Queue: {assignment?.title}
        </span>
      </div>

      {submissions.length === 0 ? (
        <div className="edurah-card-warm p-12 text-center rounded-3xl border border-[#d8d0c2] space-y-3">
          <Clock className="w-10 h-10 text-[#8e5a2b] mx-auto opacity-40" />
          <h3 className="font-serif-heading text-lg font-normal text-[#171819]">
            No submissions received yet
          </h3>
          <p className="text-xs text-[#6f6b63] max-w-md mx-auto">
            When students submit their work for this assignment, their submissions will appear here for rubric evaluation.
          </p>
        </div>
      ) : (
        /* SIDE-BY-SIDE GRADING INTERFACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANE: SUBMISSION SELECTOR & PREVIEW */}
          <div className="lg:col-span-5 space-y-4">
            <div className="edurah-card-warm p-4 rounded-2xl border border-[#d8d0c2] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f6b63] font-mono-code block">
                Submissions ({submissions.length})
              </span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {submissions.map((sub) => {
                  const isSelected = selectedSub?.id === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => selectSubmission(sub)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#ede6d8] border-[#8e5a2b] font-semibold'
                          : 'bg-[#faf8f5] border-[#d8d0c2] hover:bg-[#ede6d8]/40'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="block truncate text-[#171819]">
                          {sub.studentName || sub.studentEmail || 'Student'}
                        </span>
                        <span className="text-[10px] text-[#6f6b63]">
                          Attempt #{sub.attemptNo} · {new Date(sub.submittedAt || '').toLocaleDateString()}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.status === 'graded'
                            ? 'bg-emerald-100 text-emerald-900'
                            : sub.status === 'returned'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {sub.status === 'graded' ? `${sub.score} pts` : sub.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SELECTED SUBMISSION ARTIFACTS */}
            {selectedSub && (
              <div className="edurah-card-warm p-6 rounded-3xl border border-[#d8d0c2] space-y-4 shadow-sm">
                <div className="border-b border-[#e5ded0] pb-3">
                  <h4 className="font-serif-heading text-lg font-normal text-[#171819]">
                    {selectedSub.studentName || selectedSub.studentEmail}
                  </h4>
                  <span className="text-xs text-[#6f6b63]">
                    Attempt #{selectedSub.attemptNo} · Submitted {new Date(selectedSub.submittedAt || '').toLocaleString()}
                    {selectedSub.isLate && ' (Late Submission)'}
                  </span>
                </div>

                {selectedSub.textBodyMd && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f6b63] font-mono-code block">
                      Student Text Response:
                    </span>
                    <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-xs text-[#171819] leading-relaxed whitespace-pre-wrap">
                      {selectedSub.textBodyMd}
                    </div>
                  </div>
                )}

                {/* ATTACHED FILES */}
                {selectedSub.files && selectedSub.files.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f6b63] font-mono-code block">
                      Attached File Artifacts:
                    </span>
                    <div className="space-y-2">
                      {selectedSub.files.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <File className="w-4 h-4 text-[#8e5a2b] flex-shrink-0" />
                            <span className="truncate font-semibold text-[#171819]">
                              {file.filename}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDownloadFile(file)}
                            className="edurah-btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1 flex-shrink-0 cursor-pointer"
                          >
                            <Download className="w-3 h-3" /> View / Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#6f6b63] italic">No file attachments included.</p>
                )}
              </div>
            )}
          </div>

          {/* RIGHT PANE: RUBRIC SCORING & EVALUATION */}
          <div className="lg:col-span-7">
            {selectedSub ? (
              <div className="edurah-card-warm p-6 sm:p-8 rounded-3xl border border-[#d8d0c2] shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#e5ded0] pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#8e5a2b]" />
                    <h3 className="font-serif-heading text-xl font-normal text-[#171819]">
                      Rubric Scoring & Assessment
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#6f6b63] block font-mono-code">
                      Total Calculated Score
                    </span>
                    <span className="text-2xl font-serif-heading font-normal text-[#171819]">
                      {calculateTotal()} / {assignment?.points}
                    </span>
                  </div>
                </div>

                {successMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* RUBRIC CRITERIA MATRIX */}
                {assignment?.rubric?.criteria && assignment.rubric.criteria.length > 0 ? (
                  <div className="space-y-4">
                    {assignment.rubric.criteria.map((crit) => {
                      const currentScore = rubricScores[crit.id]?.points ?? crit.maxPoints;
                      const currentComment = rubricScores[crit.id]?.comment ?? '';

                      return (
                        <div
                          key={crit.id}
                          className="p-4 rounded-2xl bg-[#faf8f5] border border-[#d8d0c2] space-y-2.5 text-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="font-bold text-[#171819] text-sm block">
                                {crit.title}
                              </span>
                              {crit.description && (
                                <span className="text-[#6f6b63] text-[11px] block mt-0.5">
                                  {crit.description}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <input
                                type="number"
                                min="0"
                                max={crit.maxPoints}
                                value={currentScore}
                                onChange={(e) =>
                                  handleScoreChange(crit.id, Number(e.target.value))
                                }
                                className="w-16 p-2 rounded-xl bg-white border border-[#d8d0c2] text-center font-mono-code font-bold text-sm"
                              />
                              <span className="text-xs text-[#6f6b63]">/ {crit.maxPoints} pts</span>
                            </div>
                          </div>

                          <input
                            type="text"
                            placeholder="Criterion commentary or justification..."
                            value={currentComment}
                            onChange={(e) => handleCommentChange(crit.id, e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-white border border-[#d8d0c2] text-xs"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#171819] font-mono-code block">
                      Awarded Points:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={assignment?.points || 100}
                      value={manualScore}
                      onChange={(e) => setManualScore(Number(e.target.value))}
                      className="w-32 p-3 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-center font-mono-code font-bold text-lg"
                    />
                  </div>
                )}

                {/* OVERALL FEEDBACK */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#171819] font-mono-code block">
                    Comprehensive Instructor Feedback & Next Steps:
                  </label>
                  <textarea
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide constructive feedback, highlight strengths, or detail required revisions..."
                    className="w-full p-3.5 rounded-2xl bg-[#faf8f5] border border-[#d8d0c2] text-xs text-[#171819] focus:outline-none focus:border-[#8e5a2b]"
                  />
                </div>

                {/* GRADING ACTIONS */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#e5ded0]">
                  <button
                    onClick={() => handleGradeSubmit('returned')}
                    disabled={saving}
                    className="w-full sm:w-auto edurah-btn-secondary text-xs px-5 py-2.5 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>Return for Revision</span>
                  </button>

                  <button
                    onClick={() => handleGradeSubmit('graded')}
                    disabled={saving}
                    className="w-full sm:w-auto edurah-btn-primary text-xs px-6 py-2.5 inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Record Grade in Gradebook</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="edurah-card-warm p-10 rounded-3xl border border-[#d8d0c2] text-center text-xs text-[#6f6b63]">
                Select a student submission from the left queue to begin rubric grading.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
