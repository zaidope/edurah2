import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch (err: any) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAVAILABLE', message: 'Database service role client unavailable' }, success: false },
        { status: 503 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication token is required.' }, success: false },
        { status: 401 }
      );
    }

    // Verify caller session
    const { data: { user: callerUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
    if (tokenError || !callerUser) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session token.' }, success: false },
        { status: 401 }
      );
    }

    // Verify caller profile
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, grade_id, is_active')
      .eq('id', callerUser.id)
      .maybeSingle();

    const role = callerProfile?.role || callerUser.user_metadata?.role;
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Only teachers and administrators can view cohort student rosters.' }, success: false },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const queryGrade = url.searchParams.get('gradeId');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    // Scope target grade: Teachers can ONLY see their assigned grade
    const teacherGrade = callerProfile?.grade_id || callerUser.user_metadata?.grade_id;
    const targetGrade = role === 'admin' ? (queryGrade || 'grade-1') : (teacherGrade || 'grade-1');

    // Query profiles directly by indexed columns (role, grade_id) with range pagination
    const { data: students, count, error: studentFetchError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'student')
      .eq('grade_id', targetGrade)
      .order('full_name')
      .range(offset, offset + limit - 1);

    if (studentFetchError) {
      return NextResponse.json(
        { data: null, error: { code: 'DB_ERROR', message: studentFetchError.message }, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        students: students || [],
        gradeId: targetGrade,
        total: count || 0,
        page,
        limit,
      },
      error: null,
      // Backward-compatibility aliases
      success: true,
      gradeId: targetGrade,
      students: students || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal server error' }, success: false },
      { status: 500 }
    );
  }
}
