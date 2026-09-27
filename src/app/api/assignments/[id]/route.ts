import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { AssignmentsRepository } from '@/lib/assignments';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      // Offline fallback
    }

    let user: any = null;
    let role = 'student';

    if (token && supabaseAdmin) {
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (userData?.user) {
        user = userData.user;
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        role = prof?.role || user.user_metadata?.role || 'student';
      }
    }

    let assignment = AssignmentsRepository.getAssignmentById(assignmentId);

    if (supabaseAdmin) {
      try {
        const { data: dbAsg } = await supabaseAdmin
          .from('assignments')
          .select(`
            *,
            rubrics:rubrics (
              id,
              title,
              criteria:rubric_criteria (*)
            )
          `)
          .eq('id', assignmentId)
          .maybeSingle();

        if (dbAsg) {
          assignment = {
            id: dbAsg.id,
            courseId: dbAsg.course_id,
            lessonId: dbAsg.lesson_id,
            title: dbAsg.title,
            instructionsMd: dbAsg.instructions_md,
            dueAt: dbAsg.due_at,
            closeAt: dbAsg.close_at,
            points: Number(dbAsg.points) || 100,
            latePenaltyPercentPerDay: Number(dbAsg.late_penalty_percent_per_day) || 0,
            allowedMime: dbAsg.allowed_mime || ['application/pdf'],
            maxFileMb: dbAsg.max_file_mb || 25,
            rubricId: dbAsg.rubric_id,
            rubric: dbAsg.rubrics
              ? {
                  id: dbAsg.rubrics.id,
                  courseId: dbAsg.course_id,
                  title: dbAsg.rubrics.title,
                  criteria: (dbAsg.rubrics.criteria || []).map((c: any) => ({
                    id: c.id,
                    title: c.title,
                    description: c.description,
                    maxPoints: Number(c.max_points) || 10,
                    position: c.position || 0,
                  })),
                }
              : undefined,
            createdAt: dbAsg.created_at,
          };
        }
      } catch {
        // Table may be syncing
      }
    }

    if (!assignment) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Assignment not found' } },
        { status: 404 }
      );
    }

    // Attach student submission if user is logged in
    let studentSubmission = null;
    let allSubmissions: any[] = [];

    if (user) {
      if (role === 'student') {
        studentSubmission = AssignmentsRepository.getLatestSubmission(assignmentId, user.id);
        allSubmissions = AssignmentsRepository.getSubmissionsByStudent(user.id).filter(
          s => s.assignmentId === assignmentId
        );
      } else {
        // Teachers/Admins see all student submissions
        allSubmissions = AssignmentsRepository.getSubmissionsByAssignment(assignmentId);
      }
    }

    return NextResponse.json({
      data: {
        assignment,
        submission: studentSubmission,
        submissions: allSubmissions,
      },
      error: null,
      success: true,
      assignment,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to get assignment' } },
      { status: 500 }
    );
  }
}
