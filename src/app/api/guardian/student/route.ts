import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { InstitutionalService } from '@/lib/institutional';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { data: null, error: { code: 'BAD_REQUEST', message: 'studentId query parameter is required' } },
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

    // Fetch target student profile
    const { data: targetStudent } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, grade_id, role, academic_batch')
      .eq('id', studentId)
      .maybeSingle();

    if (!targetStudent) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Student profile not found' } },
        { status: 404 }
      );
    }

    try {
      const dossier = InstitutionalService.getGuardianStudentDossier(
        user.id,
        studentId,
        {
          fullName: targetStudent.full_name,
          email: targetStudent.email,
          gradeId: targetStudent.grade_id || 'grade-1',
          academicBatch: targetStudent.academic_batch,
        }
      );

      return NextResponse.json({
        data: { dossier },
        error: null,
      });
    } catch (err: any) {
      if (err.code === 'GUARDIAN_UNAUTHORIZED') {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'GUARDIAN_UNAUTHORIZED',
              message: 'Active guardian authorization link required to inspect student records.',
            },
          },
          { status: 403 }
        );
      }
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch student dossier' } },
      { status: 500 }
    );
  }
}
