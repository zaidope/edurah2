'use client';

import React, { useState } from 'react';
import {
  Assignment,
  AssignmentSubmission,
  SubmissionFile
} from '@/types';
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  File,
  Sparkles,
  Download,
  RotateCcw,
  ShieldCheck,
  Send
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface StudentAssignmentDropboxProps {
  assignment: Assignment;
  initialSubmission?: AssignmentSubmission | null;
  allSubmissions?: AssignmentSubmission[];
  onSubmissionSuccess?: (sub: AssignmentSubmission) => void;
}

export default function StudentAssignmentDropbox({
  assignment,
  initialSubmission = null,
  allSubmissions = [],
  onSubmissionSuccess,
}: StudentAssignmentDropboxProps) {
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(initialSubmission);
  const [textBody, setTextBody] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Check deadline
  const now = new Date();
  const dueDate = new Date(assignment.dueAt);
  const isPastDue = now > dueDate;
  const closeDate = assignment.closeAt ? new Date(assignment.closeAt) : null;
  const isClosed = closeDate ? now > closeDate : false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 25 MB default)
    const maxBytes = (assignment.maxFileMb || 25) * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(`File exceeds ${assignment.maxFileMb || 25} MB maximum limit.`);
      setSelectedFile(null);
      return;
    }

    // Check MIME allowlist
    const allowed = assignment.allowedMime || ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'];
    if (allowed.length > 0 && !allowed.includes(file.type)) {
      setErrorMessage(`File type '${file.type || 'unknown'}' is not allowed. Supported formats: ${allowed.join(', ')}`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!textBody.trim() && !selectedFile) {
      setErrorMessage('Please provide response text or attach a project file.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setErrorMessage('You must be signed in to submit assignments.');
        setUploading(false);
        return;
      }

      const filesPayload: any[] = [];
      const submissionTempId = `sub-${Date.now()}`;

      // 1. Upload File via Signed Upload URL if file selected
      if (selectedFile) {
        setUploadProgress(25);
        const signedRes = await fetch('/api/storage/signed-upload-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            bucket: 'submissions',
            courseId: assignment.courseId,
            submissionId: submissionTempId,
            filename: selectedFile.name,
            mimeType: selectedFile.type || 'application/octet-stream',
            sizeBytes: selectedFile.size,
          }),
        });

        const signedData = await signedRes.json();
        if (!signedRes.ok || signedData.error) {
          throw new Error(signedData.error?.message || 'Storage upload authorization failed.');
        }

        setUploadProgress(50);

        // Upload to signed URL or Supabase storage
        const { error: sUploadErr } = await supabase.storage
          .from('submissions')
          .uploadToSignedUrl(signedData.data.storagePath, signedData.data.token, selectedFile);

        if (sUploadErr) {
          // Fallback direct upload via token
          await supabase.storage
            .from('submissions')
            .upload(signedData.data.storagePath, selectedFile, { upsert: true });
        }

        setUploadProgress(75);

        filesPayload.push({
          storagePath: signedData.data.storagePath,
          filename: selectedFile.name,
          mime: selectedFile.type || 'application/octet-stream',
          sizeBytes: selectedFile.size,
        });
      }

      // 2. Submit Assignment Payload to Server
      const endpoint = isResubmitting
        ? `/api/assignments/${assignment.id}/resubmit`
        : `/api/assignments/${assignment.id}/submit`;

      const submitRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          textBodyMd: textBody,
          files: filesPayload,
        }),
      });

      const submitData = await submitRes.json();
      if (!submitRes.ok || submitData.error) {
        throw new Error(submitData.error?.message || 'Submission rejected by server.');
      }

      setUploadProgress(100);
      const newSub = submitData.data.submission;
      setSubmission(newSub);
      setIsResubmitting(false);
      setTextBody('');
      setSelectedFile(null);

      if (onSubmissionSuccess) {
        onSubmissionSuccess(newSub);
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMessage(err.message || 'Failed to complete assignment submission.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
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
        alert(data.error?.message || 'Unauthorized download');
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ASSIGNMENT BRIEF CARD */}
      <div className="edurah-card-warm p-6 sm:p-8 rounded-3xl border border-[#d8d0c2] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5ded0] pb-5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e5a2b] block font-mono-code">
              Assignment Dropbox
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-heading font-normal text-[#171819]">
              {assignment.title}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="px-3.5 py-1.5 rounded-full bg-[#ede6d8] border border-[#d8d0c2] text-xs font-mono-code font-bold text-[#171819]">
              {assignment.points} Total Points
            </div>
            {isPastDue && (
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                Late Window Active ({assignment.latePenaltyPercentPerDay}% penalty/day)
              </span>
            )}
          </div>
        </div>

        {/* INSTRUCTIONS */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6f6b63] font-mono-code">
            Instructions & Prompt:
          </h4>
          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#d8d0c2] text-xs sm:text-sm text-[#171819] leading-relaxed whitespace-pre-wrap">
            {assignment.instructionsMd}
          </div>
        </div>

        {/* RUBRIC PREVIEW IF ATTACHED */}
        {assignment.rubric && assignment.rubric.criteria?.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#8e5a2b] font-mono-code">
              <Sparkles className="w-4 h-4 text-[#d8a471]" />
              <span>Grading Rubric Criteria ({assignment.rubric.title})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {assignment.rubric.criteria.map((crit) => (
                <div
                  key={crit.id}
                  className="p-3.5 rounded-2xl bg-[#ede6d8]/60 border border-[#d8d0c2] space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-[#171819]">{crit.title}</span>
                    <span className="text-[11px] font-mono-code font-bold text-[#8e5a2b]">
                      {crit.maxPoints} pts
                    </span>
                  </div>
                  {crit.description && (
                    <p className="text-[11px] text-[#6f6b63] leading-relaxed">{crit.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ERROR ALERT */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ACTIVE SUBMISSION VIEW (LOCKED / GRADED / RETURNED) */}
      {submission && !isResubmitting ? (
        <div className="edurah-card-warm p-6 sm:p-8 rounded-3xl border border-[#d8d0c2] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#e5ded0] pb-4">
            <div className="flex items-center gap-2.5">
              {submission.status === 'graded' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : submission.status === 'returned' ? (
                <RotateCcw className="w-6 h-6 text-amber-600" />
              ) : (
                <Clock className="w-6 h-6 text-[#8e5a2b]" />
              )}
              <div>
                <h3 className="text-lg font-serif-heading font-normal text-[#171819]">
                  Submission (Attempt #{submission.attemptNo})
                </h3>
                <span className="text-xs text-[#6f6b63]">
                  Submitted on {new Date(submission.submittedAt || '').toLocaleString()}
                  {submission.isLate && ' · Submitted Late'}
                </span>
              </div>
            </div>

            <span
              className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                submission.status === 'graded'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : submission.status === 'returned'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'bg-[#ede6d8] text-[#8e5a2b] border border-[#d8d0c2]'
              }`}
            >
              {submission.status === 'graded'
                ? 'Graded'
                : submission.status === 'returned'
                ? 'Returned for Revision'
                : 'Under Review'}
            </span>
          </div>

          {/* GRADED SCORE CARD */}
          {submission.status === 'graded' && (
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider font-mono-code">
                  Final Evaluated Grade
                </span>
                <span className="text-3xl font-serif-heading font-normal text-emerald-950">
                  {submission.score} / {assignment.points}
                </span>
              </div>

              {submission.latePenaltyApplied ? (
                <p className="text-xs text-amber-800">
                  ⚠️ Note: {submission.latePenaltyApplied}% late penalty applied based on submission timestamp.
                </p>
              ) : null}

              {submission.feedbackMd && (
                <div className="p-3.5 rounded-xl bg-white/90 border border-emerald-200 text-xs text-[#171819] space-y-1">
                  <span className="font-bold block text-emerald-900">Faculty Feedback:</span>
                  <p className="leading-relaxed whitespace-pre-wrap">{submission.feedbackMd}</p>
                </div>
              )}
            </div>
          )}

          {/* RETURNED REVISION REQUEST */}
          {submission.status === 'returned' && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs uppercase tracking-wider">
                <RotateCcw className="w-4 h-4 text-amber-700" />
                <span>Instructor Requested Revisions</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/90 border border-amber-200 text-xs text-amber-950 leading-relaxed whitespace-pre-wrap">
                {submission.feedbackMd || 'Please revise and resubmit your assignment according to instructions.'}
              </div>

              <button
                onClick={() => setIsResubmitting(true)}
                className="edurah-btn-primary text-xs px-5 py-2.5 inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-4 h-4" /> Start Attempt #{submission.attemptNo + 1}
              </button>
            </div>
          )}

          {/* SUBMITTED TEXT */}
          {submission.textBodyMd && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#6f6b63] uppercase tracking-wider font-mono-code">
                Your Submitted Text:
              </span>
              <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#d8d0c2] text-xs text-[#171819] leading-relaxed whitespace-pre-wrap">
                {submission.textBodyMd}
              </div>
            </div>
          )}

          {/* ATTACHED FILES WITH SIGNED DOWNLOAD */}
          {submission.files && submission.files.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#6f6b63] uppercase tracking-wider font-mono-code">
                Attached Files ({submission.files.length}):
              </span>
              <div className="space-y-2">
                {submission.files.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#d8d0c2] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <File className="w-4 h-4 text-[#8e5a2b] flex-shrink-0" />
                      <span className="font-semibold text-[#171819] truncate">{file.filename}</span>
                      <span className="text-[10px] text-[#6f6b63]">
                        ({(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>

                    <button
                      onClick={() => handleDownloadFile(file)}
                      className="edurah-btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* SUBMISSION INPUT FORM (DRAFT / INITIAL / RESUBMISSION) */
        <div className="edurah-card-warm p-6 sm:p-8 rounded-3xl border border-[#d8d0c2] shadow-sm space-y-6">
          <div className="border-b border-[#e5ded0] pb-4">
            <h3 className="text-xl font-serif-heading font-normal text-[#171819]">
              {isResubmitting
                ? `Resubmit Assignment (Attempt #${(submission?.attemptNo || 1) + 1})`
                : 'Submit Your Assignment'}
            </h3>
            <p className="text-xs text-[#6f6b63] mt-1">
              Upload documents, code, or type your response. Once submitted, your work is locked for evaluation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#171819] block font-mono-code">
                Response / Writeup:
              </label>
              <textarea
                rows={5}
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
                placeholder="Enter markdown or text response..."
                className="w-full p-4 rounded-2xl bg-[#faf8f5] border border-[#d8d0c2] text-xs text-[#171819] focus:outline-none focus:border-[#8e5a2b] transition-all"
              />
            </div>

            {/* FILE UPLOAD INPUT */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#171819] block font-mono-code">
                Attach Document / Project File (Max {assignment.maxFileMb || 25} MB):
              </label>

              <div className="p-5 rounded-2xl border-2 border-dashed border-[#d8d0c2] bg-[#faf8f5] hover:bg-[#ede6d8]/40 transition-colors text-center space-y-3">
                <input
                  type="file"
                  id="assignment-file-input"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="assignment-file-input"
                  className="cursor-pointer inline-flex flex-col items-center gap-2"
                >
                  <Upload className="w-7 h-7 text-[#8e5a2b]" />
                  <span className="text-xs font-bold text-[#8e5a2b] hover:underline">
                    {selectedFile ? selectedFile.name : 'Choose a file to upload'}
                  </span>
                  <span className="text-[10px] text-[#6f6b63]">
                    Allowed formats: PDF, PNG, JPG, Text, ZIP
                  </span>
                </label>

                {selectedFile && (
                  <div className="text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5 pt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* PROGRESS BAR */}
            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-[#6f6b63]">
                  <span>Securing & Uploading to Storage...</span>
                  <span className="font-mono-code font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#ede6d8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8e5a2b] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex items-center justify-between pt-3 border-t border-[#e5ded0]">
              {isResubmitting ? (
                <button
                  type="button"
                  onClick={() => setIsResubmitting(false)}
                  className="edurah-btn-secondary text-xs px-4 py-2"
                >
                  Cancel Resubmission
                </button>
              ) : (
                <span className="text-xs text-[#6f6b63]">
                  {isPastDue ? '⚠️ Late submission flag will be logged.' : 'Ready to submit.'}
                </span>
              )}

              <button
                type="submit"
                disabled={uploading || isClosed}
                className="edurah-btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {uploading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{isResubmitting ? 'Submit Revised Attempt' : 'Submit Assignment'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
