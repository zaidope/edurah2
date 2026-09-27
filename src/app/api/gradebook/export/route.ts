import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { GradebookService } from '@/lib/gradebook';
import { AuthService } from '@/lib/auth';
import { ContentService } from '@/lib/content';

const ExportQuerySchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  format: z.enum(['csv', 'xlsx']).default('csv'),
});

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

    const role = profile?.role || user.user_metadata?.role;
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Faculty privileges required' } },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const parseResult = ExportQuerySchema.safeParse({
      courseId: url.searchParams.get('courseId'),
      format: url.searchParams.get('format') || 'csv',
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid parameters',
          },
        },
        { status: 400 }
      );
    }

    const { courseId, format } = parseResult.data;
    const course = ContentService.getCourseById(courseId);
    const courseGradeId = course?.gradeId || profile?.grade_id || 'grade-6';
    let students: any[] = [];
    try {
      const { data: dbStudents } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .eq('grade_id', courseGradeId);
      if (dbStudents && dbStudents.length > 0) {
        students = dbStudents.map((s: any) => ({
          id: s.id,
          fullName: s.full_name,
          email: s.email,
          avatar: s.avatar_url,
          gradeId: s.grade_id,
        }));
      }
    } catch {
      // Fallback
    }

    if (students.length === 0) {
      const authStudents = await AuthService.getStudentsByGrade(courseGradeId);
      students = authStudents.map((s: any) => ({
        id: s.id,
        fullName: s.fullName,
        email: s.email,
        avatar: s.avatar,
        gradeId: s.gradeId,
      }));
    }

    const csvData = GradebookService.generateGradebookCSV(courseId, students, user.id);

    const cleanCourseName = (course?.title || 'Course').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Gradebook_${cleanCourseName}_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to export gradebook' } },
      { status: 500 }
    );
  }
}
