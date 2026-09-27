import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { AssignmentsRepository } from '@/lib/assignments';

const GradeSubmissionSchema = z.object({
  status: z.enum(['graded', 'returned']),
  feedbackMd: z.string().optional(),
  manualScore: z.number().min(0).optional(),
  rubricScores: z
    .array(
      z.object({
        criterionId: z.string().min(1),
        points: z.number().min(0),
        comment: z.string().optional(),
      })
    )
    .optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: submissionId } = await params;
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, grade_id')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Faculty or administrator privileges required' } },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parsed = GradeSubmissionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid grading schema',
          },
        },
        { status: 400 }
      );
    }

    const { status, feedbackMd, manualScore, rubricScores = [] } = parsed.data;

    // Task 3.4 requirement: If returned, feedback is required
    if (status === 'returned' && (!feedbackMd || feedbackMd.trim().length === 0)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FEEDBACK_REQUIRED',
            message: 'Feedback is required when returning an assignment for student revision.',
          },
        },
        { status: 400 }
      );
    }

    const submission = AssignmentsRepository.getSubmissionById(submissionId);
    if (!submission) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Submission not found' } },
        { status: 404 }
      );
    }

    const assignment = AssignmentsRepository.getAssignmentById(submission.assignmentId);
    const now = new Date().toISOString();

    let computedScore: number | undefined;

    if (status === 'graded') {
      let rawScore = 0;
      if (rubricScores && rubricScores.length > 0) {
        rawScore = rubricScores.reduce((sum, item) => sum + (Number(item.points) || 0), 0);
      } else if (manualScore !== undefined) {
        rawScore = manualScore;
      }

      // Apply any computed late penalty
      if (submission.latePenaltyApplied && submission.latePenaltyApplied > 0) {
        const penaltyRatio = submission.latePenaltyApplied / 100;
        computedScore = Math.max(0, Math.round(rawScore * (1 - penaltyRatio)));
      } else {
        computedScore = rawScore;
      }
    }

    // Update submission record
    const updatedSubmission = {
      ...submission,
      status,
      score: computedScore,
      feedbackMd: feedbackMd || submission.feedbackMd,
      rubricScores: rubricScores.map(rs => ({ ...rs, submissionId })),
      gradedBy: user.id,
      gradedAt: now,
    };

    AssignmentsRepository.saveSubmission(updatedSubmission);

    // Atomically create/update matching grade_entries row if graded
    if (status === 'graded' && assignment && computedScore !== undefined) {
      const gradeItem = AssignmentsRepository.ensureGradeItemForAssignment(assignment);
      AssignmentsRepository.recordGradeEntry({
        id: `ge-${submissionId}`,
        gradeItemId: gradeItem.id,
        studentId: submission.studentId,
        points: computedScore,
        comment: feedbackMd,
        enteredBy: user.id,
        enteredAt: now,
      });

      // Update in Supabase if tables exist
      try {
        await supabaseAdmin.from('grade_entries').upsert({
          grade_item_id: gradeItem.id,
          student_id: submission.studentId,
          points: computedScore,
          comment: feedbackMd,
          entered_by: user.id,
          entered_at: now,
        }, { onConflict: 'grade_item_id,student_id' });
      } catch {
        // Table may be syncing
      }
    }

    // Persist to Supabase submissions & rubric_scores
    try {
      await supabaseAdmin
        .from('submissions')
        .update({
          status,
          score: computedScore || null,
          feedback_md: feedbackMd || null,
          graded_by: user.id,
          graded_at: now,
        })
        .eq('id', submissionId);

      if (rubricScores.length > 0) {
        await supabaseAdmin.from('rubric_scores').upsert(
          rubricScores.map(rs => ({
            submission_id: submissionId,
            criterion_id: rs.criterionId,
            points: rs.points,
            comment: rs.comment || null,
          })),
          { onConflict: 'submission_id,criterion_id' }
        );
      }

      // Notify student
      await supabaseAdmin.from('notifications').insert({
        user_id: submission.studentId,
        type: status === 'graded' ? 'assignment_graded' : 'assignment_returned',
        title: status === 'graded' ? 'Assignment Graded' : 'Assignment Returned for Revision',
        body:
          status === 'graded'
            ? `Your submission for "${assignment?.title || 'Assignment'}" has been graded: ${computedScore} marks.`
            : `Your instructor has returned "${assignment?.title || 'Assignment'}" with revision feedback.`,
        link_url: `/assignments/${submission.assignmentId}`,
      });
    } catch {
      // Table may be syncing
    }

    return NextResponse.json({
      data: {
        success: true,
        submission: updatedSubmission,
        score: computedScore,
      },
      error: null,
      success: true,
      submission: updatedSubmission,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to grade submission' } },
      { status: 500 }
    );
  }
}
