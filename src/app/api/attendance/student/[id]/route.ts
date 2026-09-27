import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { InstitutionalService } from '@/lib/institutional';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await context.params;
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
    // Student can view own; staff can view any; guardian with active link can view
    const isSelf = user.id === studentId;
    const isStaff = role === 'admin' || role === 'teacher';

    if (!isSelf && !isStaff) {
      // Check active guardian link
      const links = InstitutionalService.getGuardianStudentDossier; // Just checking permission
      try {
        InstitutionalService.getGuardianStudentDossier(user.id, studentId, {
          fullName: '',
          email: '',
          gradeId: '',
        });
      } catch {
        return NextResponse.json(
          { data: null, error: { code: 'FORBIDDEN', message: 'Not authorized to view student attendance' } },
          { status: 403 }
        );
      }
    }

    const summary = InstitutionalService.getStudentAttendanceSummary(studentId);
    return NextResponse.json({
      data: { summary },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch student attendance' } },
      { status: 500 }
    );
  }
}
