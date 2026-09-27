import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      return NextResponse.json({ success: false, error: 'Admin client unavailable' }, { status: 503 });
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication token required' }, { status: 401 });
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    // Verify caller is admin or teacher
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, grade_id')
      .eq('id', user.id)
      .maybeSingle();

    const role = callerProfile?.role || user.user_metadata?.role;
    if (role !== 'admin' && role !== 'teacher') {
      return NextResponse.json({ success: false, error: 'Forbidden: Only teachers and administrators can authorize retakes.' }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, quizId } = body;

    if (!studentId || !quizId) {
      return NextResponse.json({ success: false, error: 'studentId and quizId are required' }, { status: 400 });
    }

    // Insert or renew retake permission
    const { error: upsertErr } = await supabaseAdmin
      .from('quiz_retake_permissions')
      .upsert({
        user_id: studentId,
        quiz_id: quizId,
        allowed_by: user.id,
        created_at: new Date().toISOString(),
        consumed_at: null,
      }, { onConflict: 'user_id,quiz_id' });

    if (upsertErr) {
      return NextResponse.json({ success: false, error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Assessment retake successfully authorized for this student.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      return NextResponse.json({ success: false, error: 'Admin client unavailable' }, { status: 503 });
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication token required' }, { status: 401 });
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const url = new URL(req.url);
    const quizId = url.searchParams.get('quizId');
    const studentId = url.searchParams.get('studentId') || user.id;

    if (!quizId) {
      return NextResponse.json({ success: false, error: 'quizId is required' }, { status: 400 });
    }

    const { data: perm } = await supabaseAdmin
      .from('quiz_retake_permissions')
      .select('*')
      .eq('user_id', studentId)
      .eq('quiz_id', quizId)
      .is('consumed_at', null)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      canRetake: Boolean(perm),
      permission: perm || null,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
