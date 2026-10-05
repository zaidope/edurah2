import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const CreateSectionSchema = z.object({
  gradeId: z.string().min(1, 'Grade ID is required'),
  name: z.string().min(2, 'Section name must be at least 2 characters').max(100),
  classTeacherId: z.string().optional(),
  classTeacherName: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid session' } }, { status: 401 });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, grade_id')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: profileError.message } }, { status: 500 });
    if (profile?.role !== 'admin' && profile?.role !== 'teacher') {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Faculty access required' } }, { status: 403 });
    }

    const requestedGrade = req.nextUrl.searchParams.get('gradeId');
    if (profile.role === 'teacher' && (!profile.grade_id || (requestedGrade && requestedGrade !== profile.grade_id))) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only view sections for their assigned grade.' } }, { status: 403 });
    }

    let query = supabaseAdmin.from('sections').select('id,grade_id,name,class_teacher_id,created_at').order('created_at', { ascending: false });
    const gradeId = profile.role === 'teacher' ? profile.grade_id : requestedGrade;
    if (gradeId) query = query.eq('grade_id', gradeId);
    const { data: rows, error } = await query;
    if (error) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });

    const sectionIds = (rows || []).map((row) => row.id);
    const teacherIds = [...new Set((rows || []).map((row) => row.class_teacher_id).filter((id): id is string => Boolean(id)))];
    const [enrollmentResult, teacherResult] = await Promise.all([
      sectionIds.length ? supabaseAdmin.from('enrollments').select('section_id').eq('status', 'active').in('section_id', sectionIds) : Promise.resolve({ data: [], error: null }),
      teacherIds.length ? supabaseAdmin.from('profiles').select('id,full_name').in('id', teacherIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (enrollmentResult.error || teacherResult.error) {
      const message = enrollmentResult.error?.message || teacherResult.error?.message || 'Unable to load section details';
      return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message } }, { status: 500 });
    }
    const enrollmentCounts = new Map<string, number>();
    for (const enrollment of enrollmentResult.data || []) {
      if (enrollment.section_id) enrollmentCounts.set(enrollment.section_id, (enrollmentCounts.get(enrollment.section_id) || 0) + 1);
    }
    const teacherNames = new Map((teacherResult.data || []).map((teacher) => [teacher.id, teacher.full_name]));
    const sections = (rows || []).map((row) => ({
      id: row.id,
      gradeId: row.grade_id,
      name: row.name,
      classTeacherId: row.class_teacher_id || undefined,
      classTeacherName: row.class_teacher_id ? teacherNames.get(row.class_teacher_id) || undefined : undefined,
      studentCount: enrollmentCounts.get(row.id) || 0,
      createdAt: row.created_at,
    }));
    return NextResponse.json({
      data: { sections },
      error: null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch sections';
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
      .select('role, grade_id, full_name')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: profileError.message } }, { status: 500 });

    const role = profile?.role;
    if (role !== 'admin' && role !== 'teacher') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Faculty or administrator privileges required' } },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parseResult = CreateSectionSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid section payload',
          },
        },
        { status: 400 }
      );
    }

    if (role === 'teacher' && (!profile?.grade_id || parseResult.data.gradeId !== profile.grade_id)) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only create sections for their assigned grade.' } }, { status: 403 });
    }

    const classTeacherId = role === 'teacher' ? user.id : parseResult.data.classTeacherId || null;
    let classTeacherName = role === 'teacher' ? profile?.full_name || undefined : undefined;
    if (classTeacherId && role === 'admin') {
      const { data: teacher, error: teacherError } = await supabaseAdmin.from('profiles').select('full_name,role').eq('id', classTeacherId).maybeSingle();
      if (teacherError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: teacherError.message } }, { status: 500 });
      if (teacher?.role !== 'teacher') return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Assigned profile must be a teacher.' } }, { status: 400 });
      classTeacherName = teacher.full_name || undefined;
    }

    const { data: sectionRow, error: insertError } = await supabaseAdmin
      .from('sections')
      .insert({
        grade_id: parseResult.data.gradeId,
        name: parseResult.data.name.trim(),
        class_teacher_id: classTeacherId,
      })
      .select('id,grade_id,name,class_teacher_id,created_at')
      .single();
    if (insertError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: insertError.message } }, { status: 500 });

    const section = {
      id: sectionRow.id,
      gradeId: sectionRow.grade_id,
      name: sectionRow.name,
      classTeacherId: sectionRow.class_teacher_id || undefined,
      classTeacherName,
      studentCount: 0,
      createdAt: sectionRow.created_at,
    };

    return NextResponse.json({
      data: { section },
      error: null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create section';
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message } },
      { status: 400 }
    );
  }
}
