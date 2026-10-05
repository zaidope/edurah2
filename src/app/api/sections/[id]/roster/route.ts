import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const EnrollStudentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await context.params;
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

    const { data: section, error: sectionError } = await supabaseAdmin
      .from('sections')
      .select('id,grade_id,name,class_teacher_id,created_at')
      .eq('id', sectionId)
      .maybeSingle();
    if (sectionError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: sectionError.message } }, { status: 500 });
    if (!section) return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Section not found' } }, { status: 404 });
    if (profile.role === 'teacher' && (!profile.grade_id || section.grade_id !== profile.grade_id)) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only view rosters for their assigned grade.' } }, { status: 403 });
    }

    const { data: enrollments, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('student_id,status')
      .eq('section_id', sectionId)
      .eq('status', 'active');
    if (enrollmentError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: enrollmentError.message } }, { status: 500 });
    const studentIds = [...new Set((enrollments || []).map((enrollment) => enrollment.student_id))];
    const [studentResult, attendanceResult] = await Promise.all([
      studentIds.length ? supabaseAdmin.from('profiles').select('id,full_name,email').in('id', studentIds) : Promise.resolve({ data: [], error: null }),
      studentIds.length ? supabaseAdmin.from('attendance').select('student_id,status').in('student_id', studentIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (studentResult.error || attendanceResult.error) {
      const message = studentResult.error?.message || attendanceResult.error?.message || 'Unable to load roster details';
      return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message } }, { status: 500 });
    }

    const attendanceStats = new Map<string, { present: number; tardy: number; excused: number; total: number }>();
    for (const record of attendanceResult.data || []) {
      const stats = attendanceStats.get(record.student_id) || { present: 0, tardy: 0, excused: 0, total: 0 };
      stats.total++;
      if (record.status === 'present') stats.present++;
      if (record.status === 'tardy') stats.tardy++;
      if (record.status === 'excused') stats.excused++;
      attendanceStats.set(record.student_id, stats);
    }
    const students = (studentResult.data || []).map((student) => {
      const stats = attendanceStats.get(student.id);
      const attendancePercentage = !stats?.total ? 100 : Math.round(((stats.present + stats.excused + stats.tardy * 0.8) / stats.total) * 100);
      return {
        id: student.id,
        fullName: student.full_name || '',
        email: student.email || '',
        attendancePercentage,
        enrollmentStatus: 'active',
      };
    });
    const roster = {
      section: {
        id: section.id,
        gradeId: section.grade_id,
        name: section.name,
        classTeacherId: section.class_teacher_id || undefined,
        studentCount: students.length,
        createdAt: section.created_at,
      },
      students,
    };

    return NextResponse.json({
      data: roster,
      error: null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Section roster not found';
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await context.params;
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid session' } }, { status: 401 });

    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role,grade_id').eq('id', user.id).maybeSingle();
    if (profileError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: profileError.message } }, { status: 500 });
    const role = profile?.role;
    if (role !== 'admin' && role !== 'teacher') {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Faculty privileges required' } }, { status: 403 });
    }

    const json = await req.json();
    const parseResult = EnrollStudentSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid enrollment payload',
          },
        },
        { status: 400 }
      );
    }

    const { data: section, error: sectionError } = await supabaseAdmin.from('sections').select('id,grade_id,name').eq('id', sectionId).maybeSingle();
    if (sectionError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: sectionError.message } }, { status: 500 });
    if (!section) return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Section not found' } }, { status: 404 });
    if (role === 'teacher' && (!profile?.grade_id || section.grade_id !== profile.grade_id)) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only manage enrollments for their assigned grade.' } }, { status: 403 });
    }

    const { data: student, error: studentError } = await supabaseAdmin.from('profiles').select('id,role,grade_id').eq('id', parseResult.data.studentId).maybeSingle();
    if (studentError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: studentError.message } }, { status: 500 });
    if (student?.role !== 'student' || student.grade_id !== section.grade_id) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Student must belong to the section grade.' } }, { status: 400 });
    }

    const { data: course, error: courseError } = await supabaseAdmin.from('courses').select('grade_id').eq('id', parseResult.data.courseId).maybeSingle();
    if (courseError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: courseError.message } }, { status: 500 });
    if (!course || course.grade_id !== section.grade_id) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Course must belong to the section grade.' } }, { status: 400 });
    }

    const { data: enrollmentRow, error: enrollmentError } = await supabaseAdmin.from('enrollments').upsert({
      student_id: student.id,
      course_id: parseResult.data.courseId,
      section_id: sectionId,
      status: 'active',
    }, { onConflict: 'student_id,course_id' }).select('id,student_id,course_id,section_id,status,created_at').single();
    if (enrollmentError) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: enrollmentError.message } }, { status: 500 });
    const enrollment = {
      id: enrollmentRow.id,
      studentId: enrollmentRow.student_id,
      courseId: enrollmentRow.course_id,
      sectionId: enrollmentRow.section_id,
      sectionName: section.name,
      status: enrollmentRow.status,
      createdAt: enrollmentRow.created_at,
    };

    return NextResponse.json({
      data: { enrollment },
      error: null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to enroll student';
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
