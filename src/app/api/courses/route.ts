import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { INITIAL_COURSES } from '@/content/courses';

const CourseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().optional(),
  gradeId: z.string().min(1, 'Grade is required'),
  subjectId: z.string().optional(),
  subjectName: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Beginner'),
  duration: z.string().default('2h 30m'),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  featured: z.boolean().default(true),
  order: z.number().default(1),
  chapters: z.array(z.any()).optional(),
  instructor: z.any().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const gradeId = url.searchParams.get('gradeId');
    const status = url.searchParams.get('status') || 'published';

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      // Fallback to initial courses if DB unavailable
      const filtered = gradeId ? INITIAL_COURSES.filter(c => c.gradeId === gradeId) : INITIAL_COURSES;
      return NextResponse.json({ data: { courses: filtered }, error: null });
    }

    let query = supabaseAdmin
      .from('courses')
      .select(`
        *,
        chapters:chapters(
          *,
          lessons:lessons(*)
        )
      `)
      .order('position', { ascending: true });

    if (gradeId && gradeId !== 'all') {
      query = query.eq('grade_id', gradeId);
    }
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: dbCourses, error } = await query;

    // If database has courses, format and return them
    if (!error && dbCourses && dbCourses.length > 0) {
      const formattedCourses = dbCourses.map((c: any) => {
        const sortedChapters = (c.chapters || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
        const formattedChapters = sortedChapters.map((ch: any) => ({
          id: ch.id,
          title: ch.title,
          description: ch.description || '',
          order: ch.position || 1,
          lessons: (ch.lessons || [])
            .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
            .map((l: any) => ({
              id: l.id,
              title: l.title,
              slug: l.slug,
              description: l.description || '',
              type: l.type || 'video',
              videoUrl: l.video_url || '',
              videoId: l.video_id || '',
              duration: l.duration || '10:00',
              durationSeconds: l.duration_seconds || 0,
              chapterId: l.chapter_id,
              order: l.position || 1,
              isPublished: l.is_published ?? true,
              quizId: l.quiz_id || undefined,
              learningObjectives: l.learning_objectives || [],
              keyConcepts: l.key_concepts || [],
              prerequisiteLessonId: l.prerequisite_lesson_id || undefined,
            })),
        }));

        return {
          id: c.id,
          slug: c.slug,
          title: c.title,
          gradeId: c.grade_id,
          subjectId: c.subject_id || '',
          subjectName: c.subject_name || 'General',
          shortDescription: c.short_description || '',
          description: c.description || '',
          thumbnail: c.thumbnail || '',
          level: c.level || 'Beginner',
          duration: c.duration || '2h 30m',
          lessonCount: c.lesson_count || 0,
          rating: Number(c.rating) || 5.0,
          studentsEnrolled: Number(c.students_enrolled) || 0,
          featured: Boolean(c.featured),
          status: c.status || 'published',
          order: c.position || 1,
          instructor: c.instructor,
          chapters: formattedChapters,
        };
      });

      return NextResponse.json({ data: { courses: formattedCourses }, error: null });
    }

    // If database table is empty or error, return initial seed courses
    const filtered = gradeId && gradeId !== 'all' ? INITIAL_COURSES.filter(c => c.gradeId === gradeId) : INITIAL_COURSES;
    return NextResponse.json({ data: { courses: filtered }, error: null });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Error fetching courses' } },
      { status: 500 }
    );
  }
}

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
        { data: null, error: { code: 'UNAVAILABLE', message: 'Database client unavailable' } },
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

    // Verify role & grade
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, grade_id')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;
    if (role !== 'admin' && role !== 'teacher') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Only faculty and administrators can author courses' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = CourseSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid course payload' } },
        { status: 400 }
      );
    }

    const courseData = parseResult.data;

    // Enforce teacher grade lock
    const teacherGrade = profile?.grade_id || user.user_metadata?.grade_id;
    if (role === 'teacher' && teacherGrade && courseData.gradeId !== teacherGrade) {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only author courses for their assigned grade.' } },
        { status: 403 }
      );
    }

    const courseId = courseData.id || `course-${Date.now()}`;
    const slug = courseData.slug || courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Upsert course into Supabase
    const { data: courseRow, error: cErr } = await supabaseAdmin
      .from('courses')
      .upsert({
        id: courseId,
        slug,
        title: courseData.title,
        description: courseData.description || '',
        short_description: courseData.shortDescription || '',
        grade_id: courseData.gradeId,
        subject_id: courseData.subjectId || null,
        subject_name: courseData.subjectName || 'General',
        thumbnail: courseData.thumbnail || '',
        status: courseData.status,
        level: courseData.level,
        duration: courseData.duration,
        position: courseData.order,
        instructor: courseData.instructor || {
          name: profile ? user.user_metadata?.full_name || 'Faculty Educator' : 'Edurah Instructor',
          role: 'Faculty Educator',
        },
        created_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    if (cErr) {
      return NextResponse.json(
        { data: null, error: { code: 'DB_ERROR', message: cErr.message } },
        { status: 500 }
      );
    }

    // Upsert chapters and lessons if provided
    if (Array.isArray(courseData.chapters) && courseData.chapters.length > 0) {
      for (let chIdx = 0; chIdx < courseData.chapters.length; chIdx++) {
        const ch = courseData.chapters[chIdx];
        const chapterId = ch.id || `${courseId}-ch-${chIdx + 1}`;
        const chapterPosition = ch.order || chIdx + 1;

        await supabaseAdmin.from('chapters').upsert({
          id: chapterId,
          course_id: courseId,
          title: ch.title || `Module ${chIdx + 1}`,
          description: ch.description || '',
          position: chapterPosition,
        }, { onConflict: 'id' });

        if (Array.isArray(ch.lessons)) {
          for (let lIdx = 0; lIdx < ch.lessons.length; lIdx++) {
            const l = ch.lessons[lIdx];
            const lessonId = l.id || `${chapterId}-les-${lIdx + 1}`;
            const lessonPosition = l.order || lIdx + 1;

            await supabaseAdmin.from('lessons').upsert({
              id: lessonId,
              chapter_id: chapterId,
              course_id: courseId,
              slug: l.slug || `lesson-${lIdx + 1}`,
              title: l.title || `Lesson ${lIdx + 1}`,
              description: l.description || '',
              type: l.type || 'video',
              video_url: l.videoUrl || '',
              video_id: l.videoId || '',
              duration: l.duration || '10:00',
              duration_seconds: Number(l.durationSeconds) || 0,
              position: lessonPosition,
              is_published: l.isPublished ?? true,
              quiz_id: l.quizId || null,
              learning_objectives: l.learningObjectives || [],
              key_concepts: l.keyConcepts || [],
              prerequisite_lesson_id: l.prerequisiteLessonId || null,
            }, { onConflict: 'id' });
          }
        }
      }
    }

    return NextResponse.json({
      data: {
        success: true,
        courseId,
        slug,
      },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to save course' } },
      { status: 500 }
    );
  }
}
