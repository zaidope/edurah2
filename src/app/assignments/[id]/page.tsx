'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Assignment, AssignmentSubmission } from '@/types';
import StudentAssignmentDropbox from '@/components/assignments/StudentAssignmentDropbox';
import { ChevronLeft, FileText } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedPage from '@/components/layout/AnimatedPage';
import { supabase } from '@/lib/supabase/client';

export default function AssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params?.id as string;
  const { profile, loading: authLoading } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssignmentData() {
      if (!assignmentId) return;
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const res = await fetch(`/api/assignments/${assignmentId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.data?.assignment) {
            setAssignment(data.data.assignment);
            setSubmission(data.data.submission || null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch assignment:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAssignmentData();
  }, [assignmentId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f6f2e9]">
        <div className="w-8 h-8 rounded-full border-2 border-[#8e5a2b] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    notFound();
  }

  return (
    <PageTransition>
      <AnimatedPage>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
          <div className="flex items-center justify-between">
            <Link
              href="/my-learning"
              className="edurah-btn-ghost text-xs inline-flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back to My Learning
            </Link>
            <span className="px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#ede6d8] text-[#8e5a2b] border border-[#d8d0c2]">
              Course Assignment
            </span>
          </div>

          <StudentAssignmentDropbox
            assignment={assignment}
            initialSubmission={submission}
            onSubmissionSuccess={(newSub) => setSubmission(newSub)}
          />
        </div>
      </AnimatedPage>
    </PageTransition>
  );
}
