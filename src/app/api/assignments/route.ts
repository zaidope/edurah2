import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { AssignmentsRepository } from '@/lib/assignments';
import crypto from 'crypto';

const CreateAssignmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  courseId: z.string().min(1, 'Course ID is required'),
  lessonId: z.string().optional(),
  instructionsMd: z.string().min(5, 'Instructions must be at least 5 characters'),
  dueAt: z.string().datetime({ message: 'dueAt must be a valid ISO timestamp' }),
  closeAt: z.string().datetime({ message: 'closeAt must be a valid ISO timestamp' }).optional(),
  points: z.number().positive().default(100),
  latePenaltyPercentPerDay: z.number().min(0).max(100).default(0),
  allowedMime: z.array(z.string()).default(['application/pdf', 'image/png', 'image/jpeg', 'text/plain']),
  maxFileMb: z.number().int().min(1).max(100).default(25),
  rubric: z
    .object({
      title: z.string().min(3),
      criteria: z.array(
        z.object({
          title: z.string().min(2),
          description: z.string().optional(),
          maxPoints: z.number().positive(),
        })
      ).min(1),
    })
    .optional(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');
    const gradeId = url.searchParams.get('gradeId');

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      // Offline fallback
    }

    let assignments = AssignmentsRepository.getAssignments();

    if (supabaseAdmin) {
      try {
        let query = supabaseAdmin
          .from('assignments')
          .select(`
            *,
            rubrics:rubrics (
              id,
              title,
              criteria:rubric_criteria (*)
            )
          `)
          .order('created_at', { ascending: false });

        if (courseId) {
          query = query.eq('course_id', courseId);
        }

        const { data: dbAsgs, error } = await query;
        if (!error && dbAsgs && dbAsgs.length > 0) {
          assignments = dbAsgs.map((a: any) => ({
            id: a.id,
            courseId: a.course_id,
            lessonId: a.lesson_id,
            title: a.title,
            instructionsMd: a.instructions_md,
            dueAt: a.due_at,
            closeAt: a.close_at,
            points: Number(a.points) || 100,
            latePenaltyPercentPerDay: Number(a.late_penalty_percent_per_day) || 0,
            allowedMime: a.allowed_mime || ['application/pdf'],
            maxFileMb: a.max_file_mb || 25,
            rubricId: a.rubric_id,
            rubric: a.rubrics
              ? {
                  id: a.rubrics.id,
                  courseId: a.course_id,
                  title: a.rubrics.title,
                  criteria: (a.rubrics.criteria || []).map((c: any) => ({
                    id: c.id,
                    title: c.title,
                    description: c.description,
                    maxPoints: Number(c.max_points) || 10,
                    position: c.position || 0,
                  })),
                }
              : undefined,
            createdAt: a.created_at,
          }));
        }
      } catch {
        // Fallback to in-memory store
      }
    }

    if (courseId) {
      assignments = assignments.filter(a => a.courseId === courseId);
    }

    return NextResponse.json({
      data: { assignments },
      error: null,
      success: true,
      assignments,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to list assignments' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
    const parsed = CreateAssignmentSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid assignment schema',
          },
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const assignmentId = crypto.randomUUID();
    let createdRubricId: string | undefined;
    let formattedRubric: any = undefined;

    // Handle Rubric Creation if specified
    if (input.rubric) {
      const rubricId = crypto.randomUUID();
      createdRubricId = rubricId;

      formattedRubric = {
        id: rubricId,
        courseId: input.courseId,
        title: input.rubric.title,
        criteria: input.rubric.criteria.map((c, idx) => ({
          id: crypto.randomUUID(),
          rubricId,
          title: c.title,
          description: c.description || '',
          maxPoints: c.maxPoints,
          position: idx,
        })),
      };

      AssignmentsRepository.saveRubric(formattedRubric);

      try {
        await supabaseAdmin.from('rubrics').insert({
          id: rubricId,
          course_id: input.courseId,
          title: input.rubric.title,
        });

        const criteriaRows = formattedRubric.criteria.map((c: any) => ({
          id: c.id,
          rubric_id: rubricId,
          title: c.title,
          description: c.description,
          max_points: c.maxPoints,
          position: c.position,
        }));
        await supabaseAdmin.from('rubric_criteria').insert(criteriaRows);
      } catch {
        // Table may be syncing
      }
    }

    const newAssignment = {
      id: assignmentId,
      courseId: input.courseId,
      lessonId: input.lessonId || undefined,
      title: input.title,
      instructionsMd: input.instructionsMd,
      dueAt: input.dueAt,
      closeAt: input.closeAt || undefined,
      points: input.points,
      latePenaltyPercentPerDay: input.latePenaltyPercentPerDay,
      allowedMime: input.allowedMime,
      maxFileMb: input.maxFileMb,
      rubricId: createdRubricId,
      rubric: formattedRubric,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };

    AssignmentsRepository.saveAssignment(newAssignment);
    AssignmentsRepository.ensureGradeItemForAssignment(newAssignment);

    try {
      await supabaseAdmin.from('assignments').insert({
        id: assignmentId,
        course_id: input.courseId,
        lesson_id: input.lessonId || null,
        title: input.title,
        instructions_md: input.instructionsMd,
        due_at: input.dueAt,
        close_at: input.closeAt || null,
        points: input.points,
        late_penalty_percent_per_day: input.latePenaltyPercentPerDay,
        allowed_mime: input.allowedMime,
        max_file_mb: input.maxFileMb,
        rubric_id: createdRubricId || null,
        created_by: user.id,
      });

      // Also create grade item row in gradebook
      await supabaseAdmin.from('grade_items').insert({
        id: `gi-${assignmentId}`,
        course_id: input.courseId,
        source_type: 'assignment',
        source_id: assignmentId,
        title: input.title,
        max_points: input.points,
        published: true,
      });
    } catch {
      // Table may be syncing
    }

    return NextResponse.json({
      data: { assignment: newAssignment },
      error: null,
      success: true,
      assignment: newAssignment,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to create assignment' } },
      { status: 500 }
    );
  }
}
