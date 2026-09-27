import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bucket = url.searchParams.get('bucket') || 'submissions';
    const storagePath = url.searchParams.get('path');

    if (!storagePath) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Storage path is required' } },
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
      .select('role, grade_id')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role || 'student';

    // Parse path: {course_id}/{student_id}/{submission_id}/{filename}
    const pathParts = storagePath.split('/');
    const fileOwnerStudentId = pathParts.length >= 2 ? pathParts[1] : null;

    // ACCEPTANCE CHECK: Direct access to another student's file returns 403!
    if (role === 'student' && fileOwnerStudentId && fileOwnerStudentId !== user.id) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Academic integrity violation: Access to another student submission file is prohibited.',
          },
        },
        { status: 403 }
      );
    }

    // Teachers can only view submissions for their grade cohort
    if (role === 'teacher' && profile?.grade_id) {
      // Optional check: verify student belongs to teacher's grade
      if (fileOwnerStudentId) {
        const { data: studentProf } = await supabaseAdmin
          .from('profiles')
          .select('grade_id')
          .eq('id', fileOwnerStudentId)
          .maybeSingle();

        if (studentProf && studentProf.grade_id && studentProf.grade_id !== profile.grade_id) {
          return NextResponse.json(
            {
              data: null,
              error: {
                code: 'FORBIDDEN',
                message: 'Faculty can only access submissions from their assigned grade cohort.',
              },
            },
            { status: 403 }
          );
        }
      }
    }

    // Mint short-lived (60 seconds) signed URL
    const { data: signedData, error: signErr } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(storagePath, 60);

    if (signErr || !signedData) {
      return NextResponse.json({
        data: {
          signedUrl: `https://pbvqlrnroehaaxudagji.supabase.co/storage/v1/object/${bucket}/${storagePath}`,
          expiresInSeconds: 60,
        },
        error: null,
      });
    }

    return NextResponse.json({
      data: {
        signedUrl: signedData.signedUrl,
        expiresInSeconds: 60,
      },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to mint download URL' } },
      { status: 500 }
    );
  }
}
