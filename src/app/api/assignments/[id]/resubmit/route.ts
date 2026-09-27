import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { AssignmentsRepository } from '@/lib/assignments';
import crypto from 'crypto';

const ResubmitSchema = z.object({
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
    const parsed = ResubmitSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid payload',
          },
        },
        { status: 400 }
      );
    }

    const { textBodyMd, files } = parsed.data;
    const assignment = AssignmentsRepository.getAssignmentById(assignmentId);
    if (!assignment) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Assignment not found' } },
        { status: 404 }
      );
    }

    // Must verify previous submission has status = 'returned'
    const latestSub = AssignmentsRepository.getLatestSubmission(assignmentId, user.id);
    if (!latestSub || latestSub.status !== 'returned') {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'NOT_RETURNED',
            message: 'Resubmission is only permitted when a previous attempt has been returned for revision by an instructor.',
          },
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const newAttemptNo = latestSub.attemptNo + 1;
    const submissionId = crypto.randomUUID();

    const formattedFiles = files.map(f => ({
      id: crypto.randomUUID(),
      submissionId,
      storagePath: f.storagePath,
      filename: f.filename,
      mime: f.mime,
      sizeBytes: f.sizeBytes,
    }));

    const resubmission = {
      id: submissionId,
      assignmentId,
      assignmentTitle: assignment.title,
      courseId: assignment.courseId,
      studentId: user.id,
      studentName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
      studentEmail: user.email,
      status: 'submitted' as const,
      submittedAt: now.toISOString(),
      attemptNo: newAttemptNo,
      textBodyMd: textBodyMd || '',
      files: formattedFiles,
      createdAt: now.toISOString(),
    };

    AssignmentsRepository.saveSubmission(resubmission);

    try {
      await supabaseAdmin.from('submissions').insert({
        id: submissionId,
        assignment_id: assignmentId,
        student_id: user.id,
        status: 'submitted',
        submitted_at: now.toISOString(),
        attempt_no: newAttemptNo,
        text_body_md: textBodyMd,
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
    } catch {
      // Table may be syncing
    }

    return NextResponse.json({
      data: { submission: resubmission },
      error: null,
      success: true,
      submission: resubmission,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Resubmission failed' } },
      { status: 500 }
    );
  }
}
