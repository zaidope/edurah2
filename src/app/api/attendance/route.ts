import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const RollCallSchema = z.object({
  sectionId: z.string().min(1, 'Section ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(['present', 'absent', 'tardy', 'excused']),
    })
  ).min(1, 'At least one student record is required'),
  justification: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const sectionId = req.nextUrl.searchParams.get('sectionId');
    const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];
    if (!sectionId) {
      return NextResponse.json(
        { data: null, error: { code: 'BAD_REQUEST', message: 'sectionId query parameter is required' } },
        { status: 400 }
      );
    }

    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid session' } }, { status: 401 });

    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role,grade_id').eq('id', user.id).maybeSingle();
    if (profileError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: profileError.message } }, { status: 500 });
    if (profile?.role !== 'admin' && profile?.role !== 'teacher') {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Faculty access required' } }, { status: 403 });
    }
    const { data: section, error: sectionError } = await supabaseAdmin.from('sections').select('grade_id').eq('id', sectionId).maybeSingle();
    if (sectionError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: sectionError.message } }, { status: 500 });
    if (!section) return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Section not found' } }, { status: 404 });
    if (profile.role === 'teacher' && (!profile.grade_id || section.grade_id !== profile.grade_id)) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only view attendance for their assigned grade.' } }, { status: 403 });
    }

    const { data: rows, error } = await supabaseAdmin.from('attendance')
      .select('id,section_id,student_id,date,status,marked_by,marked_at')
      .eq('section_id', sectionId)
      .eq('date', date)
      .order('marked_at', { ascending: true });
    if (error) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
    const records = (rows || []).map((row) => ({
      id: row.id,
      sectionId: row.section_id,
      studentId: row.student_id,
      date: row.date,
      status: row.status,
      markedBy: row.marked_by || undefined,
      markedAt: row.marked_at,
    }));
    return NextResponse.json({
      data: { records, date, sectionId },
      error: null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch attendance';
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message } },
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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role,grade_id')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: profileError.message } }, { status: 500 });

    const role = profile?.role;
    if (role !== 'admin' && role !== 'teacher') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Faculty privileges required to record attendance' } },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parseResult = RollCallSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid roll call payload',
          },
        },
        { status: 400 }
      );
    }

    const { sectionId, date, records, justification } = parseResult.data;
    const today = new Date().toISOString().slice(0, 10);
    if (date > today) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Attendance cannot be recorded for a future date.' } }, { status: 400 });
    }
    const recordDate = new Date(`${date}T23:59:59.999Z`);
    const isPast48Hours = Date.now() - recordDate.getTime() > 48 * 60 * 60 * 1000;
    if (isPast48Hours && role !== 'admin') {
      return NextResponse.json({ data: null, error: { code: 'ATTENDANCE_LOCKED', message: 'Attendance records older than 48 hours are locked. Administrator amendment required.' } }, { status: 403 });
    }
    if (isPast48Hours && !justification?.trim()) {
      return NextResponse.json({ data: null, error: { code: 'JUSTIFICATION_REQUIRED', message: 'Administrator justification is required for attendance changes older than 48 hours.' } }, { status: 400 });
    }

    const { data: section, error: sectionError } = await supabaseAdmin.from('sections').select('grade_id').eq('id', sectionId).maybeSingle();
    if (sectionError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: sectionError.message } }, { status: 500 });
    if (!section) return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Section not found' } }, { status: 404 });
    if (role === 'teacher' && (!profile?.grade_id || profile.grade_id !== section.grade_id)) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only record attendance for their assigned grade.' } }, { status: 403 });
    }

    const studentIds = [...new Set(records.map((record) => record.studentId))];
    const { data: enrollments, error: enrollmentError } = await supabaseAdmin.from('enrollments')
      .select('student_id')
      .eq('section_id', sectionId)
      .eq('status', 'active');
    if (enrollmentError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: enrollmentError.message } }, { status: 500 });
    const enrolledIds = new Set((enrollments || []).map((enrollment) => enrollment.student_id));
    if (enrolledIds.size !== studentIds.length || studentIds.some((studentId) => !enrolledIds.has(studentId)) || studentIds.length !== records.length) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Attendance records must contain each active section student exactly once.' } }, { status: 400 });
    }

    const { data: beforeRows, error: beforeError } = await supabaseAdmin.from('attendance')
      .select('id,student_id,status,marked_by,marked_at')
      .eq('section_id', sectionId)
      .eq('date', date);
    if (beforeError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: beforeError.message } }, { status: 500 });

    const markedAt = new Date().toISOString();
    const { data: savedRows, error: saveError } = await supabaseAdmin.from('attendance').upsert(
      records.map((record) => ({
        section_id: sectionId,
        student_id: record.studentId,
        date,
        status: record.status,
        marked_by: user.id,
        marked_at: markedAt,
      })),
      { onConflict: 'section_id,student_id,date' }
    ).select('id,section_id,student_id,date,status,marked_by,marked_at');
    if (saveError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: saveError.message } }, { status: 500 });

    const auditResult = isPast48Hours
      ? await supabaseAdmin.from('audit_logs').insert((savedRows || []).map((row) => ({
          actor_id: user.id,
          action: 'attendance_past_48h_override',
          entity_type: 'attendance',
          entity_id: row.id,
          before: (beforeRows || []).find((before) => before.student_id === row.student_id) || null,
          after: { ...row, justification: justification?.trim() },
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        })))
      : await supabaseAdmin.from('audit_logs').insert({
          actor_id: user.id,
          action: 'attendance_roll_call_submitted',
          entity_type: 'section_attendance',
          entity_id: `${sectionId}_${date}`,
          before: null,
          after: { sectionId, date, count: savedRows?.length || 0 },
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        });
    const { error: auditError } = auditResult;
    if (auditError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: `Attendance saved, but its audit entry failed: ${auditError.message}` } }, { status: 500 });

    const result = {
      savedCount: savedRows?.length || 0,
      records: (savedRows || []).map((row) => ({
        id: row.id,
        sectionId: row.section_id,
        studentId: row.student_id,
        date: row.date,
        status: row.status,
        markedBy: row.marked_by || undefined,
        markedAt: row.marked_at,
      })),
    };
    return NextResponse.json({ data: result, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit roll call';
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
