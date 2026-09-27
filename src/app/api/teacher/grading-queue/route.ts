import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { AssignmentsRepository } from '@/lib/assignments';

export async function GET(req: NextRequest) {
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
      // Offline fallback
    }

    if (supabaseAdmin) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const role = profile?.role || user.user_metadata?.role;
        if (role !== 'teacher' && role !== 'admin') {
          return NextResponse.json(
            { data: null, error: { code: 'FORBIDDEN', message: 'Teacher or admin privileges required' } },
            { status: 403 }
          );
        }
      }
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const courseId = url.searchParams.get('courseId');

    let submissions = AssignmentsRepository.getSubmissions();

    if (status && status !== 'all') {
      submissions = submissions.filter(s => s.status === status);
    }
    if (courseId) {
      submissions = submissions.filter(s => s.courseId === courseId);
    }

    return NextResponse.json({
      data: { submissions },
      error: null,
      success: true,
      submissions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch grading queue' } },
      { status: 500 }
    );
  }
}
