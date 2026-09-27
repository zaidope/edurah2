import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { AssignmentsRepository } from '@/lib/assignments';
import crypto from 'crypto';

const SubmitAssignmentSchema = z.object({
  textBodyMd: z.string().optional(),
  files: z
    .array(
      z.object({
        storagePath: z.string().min(1),
        filename: z.string().min(1),
        mime: z.string().min(1),
        sizeBytes: z.number().int().positive(),
      })
    )
    .default([]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      return NextResponse.json(
        { data: null, error: { code: 'UNAVAILABLE', message: 'Database service unavailable' } },
        { status: 503 }
      );
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid session' } },
        { status: 401 }
      );
    }

    const json = await req.json();
    const parsed = SubmitAssignmentSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid submission payload',
          },
        },
        { status: 400 }
      );
    }

    const { textBodyMd, files } = parsed.data;

    // Must submit at least some text or file
    if (!textBodyMd?.trim() && (!files || files.length === 0)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'EMPTY_SUBMISSION',
            message: 'Submission must contain a response text or at least one file attachment.',
          },
        },
        { status: 400 }
      );
    }

    const assignment = AssignmentsRepository.getAssignmentById(assignmentId);
    if (!assignment) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Assignment not found' } },
        { status: 404 }
      );
    }

    const now = new Date();

    // 1. Hard Close Window Enforcement
    if (assignment.closeAt) {
      const closeDate = new Date(assignment.closeAt);
      if (now > closeDate) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'ASSIGNMENT_CLOSED',
              message: 'The hard closing deadline for this assignment has passed. Submissions are locked.',
            },
          },
          { status: 400 }
        );
      }
    }

    // 2. Check for existing submission to prevent overwriting submitted work without return
    const latestSub = AssignmentsRepository.getLatestSubmission(assignmentId, user.id);
    if (latestSub && (latestSub.status === 'submitted' || latestSub.status === 'graded')) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'ALREADY_SUBMITTED',
            message: 'Assignment has already been submitted and is locked. Resubmission requires instructor return.',
          },
        },
        { status: 400 }
      );
    }

    // 3. Server-authoritative Lateness Calculation
    const dueDate = new Date(assignment.dueAt);
    const isLate = now > dueDate;
    let latePenaltyApplied = 0;

    if (isLate && assignment.latePenaltyPercentPerDay > 0) {
      const msLate = now.getTime() - dueDate.getTime();
      const daysLate = Math.max(1, Math.ceil(msLate / (1000 * 60 * 60 * 24)));
      latePenaltyApplied = Math.min(100, daysLate * assignment.latePenaltyPercentPerDay);
    }

    const attemptNo = latestSub ? latestSub.attemptNo + 1 : 1;
    const submissionId = crypto.randomUUID();

    const formattedFiles = files.map(f => ({
      id: crypto.randomUUID(),
      submissionId,
      storagePath: f.storagePath,
      filename: f.filename,
      mime: f.mime,
      sizeBytes: f.sizeBytes,
    }));

    const newSubmission = {
      id: submissionId,
      assignmentId,
      assignmentTitle: assignment.title,
      courseId: assignment.courseId,
      studentId: user.id,
      studentName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
      studentEmail: user.email,
      status: 'submitted' as const,
      submittedAt: now.toISOString(),
      attemptNo,
      textBodyMd: textBodyMd || '',
      isLate,
      latePenaltyApplied,
      files: formattedFiles,
      createdAt: now.toISOString(),
    };

    AssignmentsRepository.saveSubmission(newSubmission);

    // Persist to Supabase if tables exist
    try {
      await supabaseAdmin.from('submissions').insert({
        id: submissionId,
        assignment_id: assignmentId,
        student_id: user.id,
        status: 'submitted',
        submitted_at: now.toISOString(),
        attempt_no: attemptNo,
        text_body_md: textBodyMd,
        is_late: isLate,
        late_penalty_applied: latePenaltyApplied,
      });

      if (formattedFiles.length > 0) {
        await supabaseAdmin.from('submission_files').insert(
          formattedFiles.map(f => ({
            id: f.id,
            submission_id: submissionId,
            storage_path: f.storagePath,
            filename: f.filename,
            mime: f.mime,
            size_bytes: f.sizeBytes,
          }))
        );
      }

      // Notification event
      await supabaseAdmin.from('notifications').insert({
        user_id: user.id,
        type: 'assignment_submitted',
        title: 'Assignment Submitted',
        body: `Your submission for "${assignment.title}" (Attempt #${attemptNo}) was recorded successfully.`,
        link_url: `/assignments/${assignmentId}`,
      });
    } catch {
      // Table may be syncing
    }

    return NextResponse.json({
      data: { submission: newSubmission },
      error: null,
      success: true,
      submission: newSubmission,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Submission failed' } },
      { status: 500 }
    );
  }
}
