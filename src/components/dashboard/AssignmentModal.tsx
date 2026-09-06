'use client';

import React, { useState } from 'react';
import { X, FileText, CheckCircle2, Upload, Calendar, AlertCircle } from 'lucide-react';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AssignmentModal({ isOpen, onClose }: AssignmentModalProps) {
  const [submissionText, setSubmissionText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSubmissionText('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">My School Project</h3>
              <p className="text-xs text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" /> Due Tomorrow, 11:59 PM
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* INSTRUCTIONS */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px]">Assignment Prompt</h4>
          <p className="text-slate-600 leading-relaxed">
            Write a 3-paragraph essay describing your school, your favorite subjects, and your classmates using the vocabulary words learned in <strong>Lesson 12 & 13</strong>.
          </p>
        </div>

        {submitted ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="font-extrabold text-slate-900 text-sm">Assignment Submitted Successfully!</h4>
            <p className="text-xs text-slate-600">Your instructor will review and grade your submission within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">Your Submission Text *</label>
              <textarea
                required
                rows={5}
                value={submissionText}
                onChange={e => setSubmissionText(e.target.value)}
                placeholder="Type your response here..."
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Upload className="w-3.5 h-3.5 text-slate-400" /> Optional attachment supported
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Submit Assignment
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
