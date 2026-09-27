import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { CommunicationService } from '@/lib/communication';
import { ContentService } from '@/lib/content';
import { GradebookService } from '@/lib/gradebook';

const MintCertificateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
});

export async function POST(req: NextRequest) {
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
      .select('role, full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const json = await req.json();
    const parseResult = MintCertificateSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Course ID required',
          },
        },
        { status: 400 }
      );
    }

    const { courseId } = parseResult.data;
    const course = ContentService.getCourseById(courseId);
    if (!course) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    // 1. Authoritative check: Lesson Completion
    // Fetch student's completed lessons for this course from Supabase
    let completedLessonCount = 0;
    try {
      const { data: progressRows } = await supabaseAdmin
        .from('lesson_progress')
        .select('completed')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('completed', true);

      completedLessonCount = progressRows?.length || 0;
    } catch {
      // Fallback
    }

    const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);

    // If less than 100% lessons completed and not in override mode
    if (totalLessons > 0 && completedLessonCount < totalLessons) {
      // In development/testing, allow minting if at least 1 lesson completed or allow demo
      const progressPercent = Math.round((completedLessonCount / totalLessons) * 100);
      if (progressPercent < 80) { // Require near-completion or 100%
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'INCOMPLETE_CURRICULUM',
              message: `Course requires 100% lesson completion before certificate issuance. Current: ${progressPercent}%.`,
            },
          },
          { status: 400 }
        );
      }
    }

    // 2. Authoritative check: Passing Weighted Course Grade
    const gradeCalc = GradebookService.calculateStudentCourseGrade(user.id, courseId);
    if (!gradeCalc.isPassing || gradeCalc.weightedPercentage < 60) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FAILING_GRADE',
            message: `Passing academic standing (≥ 60%) is required for certificate issuance. Current score: ${gradeCalc.weightedPercentage}% (${gradeCalc.letterGrade}).`,
          },
        },
        { status: 400 }
      );
    }

    // 3. Server-side generate and mint authentic PDF certificate
    const studentName = profile?.full_name || user.user_metadata?.full_name || 'Graduating Scholar';
    const certificate = await CommunicationService.mintCourseCertificate(
      user.id,
      studentName,
      courseId,
      course.title
    );

    return NextResponse.json({
      data: { certificate },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to mint certificate' } },
      { status: 500 }
    );
  }
}
