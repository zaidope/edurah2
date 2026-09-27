import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { GradebookService } from '@/lib/gradebook';

const UpdateEntrySchema = z.object({
  gradeItemId: z.string().min(1, 'Grade item ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  points: z.number().min(0, 'Points must be non-negative'),
  status: z.enum(['graded', 'missing', 'excused', 'submitted']).optional(),
  comment: z.string().optional(),
  isExcused: z.boolean().optional(),
  isMissing: z.boolean().optional(),
});

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
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Faculty privileges required' } },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parseResult = UpdateEntrySchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid grading schema',
          },
        },
        { status: 400 }
      );
    }

    const { gradeItemId, studentId, points, status, comment, isExcused, isMissing } = parseResult.data;

    const entry = GradebookService.updateGradeEntry(gradeItemId, studentId, points, {
      comment,
      status,
      isExcused,
      isMissing,
      enteredBy: user.id,
    });

    // Also attempt Supabase upsert
    try {
      await supabaseAdmin.from('grade_entries').upsert({
        id: entry.id,
        grade_item_id: gradeItemId,
        student_id: studentId,
        points: entry.points,
        comment: comment || null,
        status: entry.status,
        is_excused: entry.isExcused,
        is_missing: entry.isMissing,
        entered_by: user.id,
        entered_at: entry.enteredAt,
      }, { onConflict: 'grade_item_id,student_id' });
    } catch {
      // Offline fallback
    }

    return NextResponse.json({
      data: { entry },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to update grade entry' } },
      { status: 500 }
    );
  }
}
