import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/lib/content';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let userRole = 'student';
    let userGrade: string | null = null;

    if (token) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          const { data: prof } = await supabaseAdmin
            .from('profiles')
            .select('role, grade_id')
            .eq('id', user.id)
            .maybeSingle();
          userRole = prof?.role || user.user_metadata?.role || 'student';
          userGrade = prof?.grade_id || user.user_metadata?.grade_id || null;
        }
      } catch {
        // Continue with header fallbacks
      }
    } else {
      userRole = req.headers.get('x-user-role') || 'student';
      userGrade = req.headers.get('x-user-grade');
    }

    const quiz = ContentService.getQuizById(id);
    if (!quiz) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Assessment not found' } },
        { status: 404 }
      );
    }

    // Grade cohort check for students
    if (userRole === 'student' && userGrade && userGrade !== quiz.gradeId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'This assessment is configured for a different grade cohort.',
          },
        },
        { status: 403 }
      );
    }

    const isStaff = userRole === 'admin' || userRole === 'teacher';
    const payload = isStaff ? quiz : ContentService.getQuizForStudent(id);

    return NextResponse.json({
      data: { quiz: payload },
      error: null,
      // Backward compatibility aliases
      success: true,
      quiz: payload,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch quiz' } },
      { status: 500 }
    );
  }
}
