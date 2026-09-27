import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { GradebookService } from '@/lib/gradebook';
import { AuthService } from '@/lib/auth';
import { ContentService } from '@/lib/content';

const GradebookQuerySchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
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
      .select('role, grade_id, full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;
    const url = new URL(req.url);
    const parseResult = GradebookQuerySchema.safeParse({
      courseId: url.searchParams.get('courseId'),
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

    const { courseId } = parseResult.data;
    const course = ContentService.getCourseById(courseId);

    // If caller is student: strictly isolate and return only own published grades!
    if (role === 'student') {
      const calculation = GradebookService.calculateStudentCourseGrade(user.id, courseId);
      const allItems = GradebookService.syncCourseGradeItems(courseId).filter(i => i.published);
      const studentEntries = GradebookService.getGradeEntriesForCourse(courseId)
        .filter(e => e.studentId === user.id);

      return NextResponse.json({
        data: {
          isStudentView: true,
          course,
          calculation,
          items: allItems,
          entries: studentEntries,
        },
        error: null,
      });
    }

    // Teacher or Admin: returns full spreadsheet matrix for cohort
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Faculty privileges required' } },
        { status: 403 }
      );
    }

    const categories = GradebookService.getGradeCategories(courseId);
    const items = GradebookService.syncCourseGradeItems(courseId);
    const entries = GradebookService.getGradeEntriesForCourse(courseId);
    const scales = GradebookService.getGradeScales();

    // Get enrolled students for the course cohort
    const courseGradeId = course?.gradeId || profile?.grade_id || 'grade-6';
    let students: { id: string; fullName?: string; email?: string; avatar?: string; gradeId?: string }[] = [];
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

    // Calculate matrix rows
    const studentRows = students.map(student => {
      const calc = GradebookService.calculateStudentCourseGrade(student.id, courseId);
      return {
        student: {
          id: student.id,
          name: student.fullName || 'Student',
          email: student.email,
          avatar: student.avatar,
          gradeId: student.gradeId,
        },
        calculation: calc,
      };
    });

    return NextResponse.json({
      data: {
        isStudentView: false,
        course,
        categories,
        items,
        entries,
        students: studentRows,
        scales,
      },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch gradebook' } },
      { status: 500 }
    );
  }
}
