import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { InstitutionalService } from '@/lib/institutional';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await context.params;
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { data: null, error: { code: 'BAD_REQUEST', message: 'courseId query parameter is required' } },
        { status: 400 }
      );
    }

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
    // Admins and teachers bypass prerequisites
    if (role === 'admin' || role === 'teacher') {
      return NextResponse.json({
        data: { allowed: true },
        error: null,
      });
    }

    const result = await InstitutionalService.verifyLessonAccess(user.id, courseId, lessonId);
    if (!result.allowed) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'PREREQUISITE_NOT_MET',
            message: `You must complete "${result.prerequisiteLessonTitle}" before accessing this lesson.`,
            prerequisiteLessonId: result.prerequisiteLessonId,
            prerequisiteLessonTitle: result.prerequisiteLessonTitle,
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      data: { allowed: true },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to verify lesson access' } },
      { status: 500 }
    );
  }
}
