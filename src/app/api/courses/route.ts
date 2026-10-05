import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const LessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['video', 'reading', 'assignment', 'quiz']).optional(),
  videoUrl: z.string().optional(),
  videoId: z.string().optional(),
  duration: z.string().optional(),
  durationSeconds: z.number().optional(),
  order: z.number().optional(),
  isPublished: z.boolean().optional(),
  quizId: z.string().optional(),
  learningObjectives: z.array(z.string()).optional(),
  keyConcepts: z.array(z.object({ title: z.string(), detail: z.string() })).optional(),
  prerequisiteLessonId: z.string().optional(),
});

const ChapterSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
  lessons: z.array(LessonSchema).optional(),
});

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
  chapters: z.array(ChapterSchema).optional(),
  instructor: z.object({
    name: z.string(),
    role: z.string(),
    avatar: z.string().optional(),
    bio: z.string().optional(),
  }).optional(),
});

type CourseDatabaseRow = {
  id: string;
  slug: string;
  title: string;
  grade_id: string;
  subject_id: string | null;
  subject_name: string | null;
  short_description: string | null;
  description: string | null;
  thumbnail: string | null;
  level: string | null;
  duration: string | null;
  lesson_count: number | null;
  rating: number | string | null;
  students_enrolled: number | null;
  featured: boolean | null;
  status: string | null;
  position: number | null;
  instructor: unknown;
  chapters: Array<{
    id: string;
    title: string;
    description: string | null;
    position: number | null;
    lessons: Array<{
      id: string;
      title: string;
      slug: string;
      description: string | null;
      type: string | null;
      video_url: string | null;
      video_id: string | null;
      duration: string | null;
      duration_seconds: number | null;
      chapter_id: string;
      position: number | null;
      is_published: boolean | null;
      quiz_id: string | null;
      learning_objectives: string[] | null;
      key_concepts: Array<{ title: string; detail: string }> | null;
      prerequisite_lesson_id: string | null;
    }>;
  }>;
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let gradeId = url.searchParams.get('gradeId');
    const status = url.searchParams.get('status') || 'published';

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      return NextResponse.json(
        { data: null, error: { code: 'UNAVAILABLE', message: 'Database client unavailable' } },
        { status: 503 }
      );
    }

    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    let role: string | null = null;
    let teacherGradeId: string | null = null;

    if (token) {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid session' } }, { status: 401 });
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role, grade_id')
        .eq('id', user.id)
        .maybeSingle();
      if (profileError) {
        return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: profileError.message } }, { status: 500 });
      }
      role = profile?.role || null;
      teacherGradeId = profile?.grade_id || null;
    }

    if (status !== 'published' && role !== 'admin' && role !== 'teacher') {
      return NextResponse.json({ data: null, error: { code: token ? 'FORBIDDEN' : 'UNAUTHORIZED', message: 'Faculty access required' } }, { status: token ? 403 : 401 });
    }

    if (role === 'teacher') {
      if (!teacherGradeId || (gradeId && gradeId !== 'all' && gradeId !== teacherGradeId)) {
        return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only access courses for their assigned grade.' } }, { status: 403 });
      }
      gradeId = teacherGradeId;
    }
    if (role === 'student') {
      if (!teacherGradeId || (gradeId && gradeId !== 'all' && gradeId !== teacherGradeId)) {
        return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Students may only access courses for their assigned grade.' } }, { status: 403 });
      }
      gradeId = teacherGradeId;
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

    if (error) {
      return NextResponse.json(
        { data: null, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    if (dbCourses) {
      const formattedCourses = (dbCourses as unknown as CourseDatabaseRow[]).map((c) => {
        const sortedChapters = [...(c.chapters || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
        const formattedChapters = sortedChapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          description: ch.description || '',
          order: ch.position || 1,
          lessons: (ch.lessons || [])
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map((l) => ({
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

    return NextResponse.json({ data: { courses: [] }, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching courses';
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message } },
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
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, grade_id')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) {
      return NextResponse.json(
        { data: null, error: { code: 'DB_ERROR', message: profileError.message } },
        { status: 500 }
      );
    }

    const role = profile?.role;
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
    const teacherGrade = profile?.grade_id;
    if (role === 'teacher' && (!teacherGrade || courseData.gradeId !== teacherGrade)) {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only author courses for their assigned grade.' } },
        { status: 403 }
      );
    }

    const courseId = courseData.id || `course-${Date.now()}`;
    if (courseData.id) {
      const { data: existingCourse, error: existingCourseError } = await supabaseAdmin
        .from('courses')
        .select('grade_id')
        .eq('id', courseId)
        .maybeSingle();
      if (existingCourseError) {
        return NextResponse.json(
          { data: null, error: { code: 'DB_ERROR', message: existingCourseError.message } },
          { status: 500 }
        );
      }
      if (role === 'teacher' && existingCourse && existingCourse.grade_id !== teacherGrade) {
        return NextResponse.json(
          { data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only update courses for their assigned grade.' } },
          { status: 403 }
        );
      }
    }

    const slug = courseData.slug || courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const lessonCount = courseData.chapters?.reduce((total, chapter) => total + (Array.isArray(chapter.lessons) ? chapter.lessons.length : 0), 0);

    // Upsert course into Supabase
    const { error: cErr } = await supabaseAdmin
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
        ...(lessonCount !== undefined ? { lesson_count: lessonCount } : {}),
        featured: courseData.featured,
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

    if (Array.isArray(courseData.chapters)) {
      const { data: currentChapters, error: currentChaptersError } = await supabaseAdmin
        .from('chapters')
        .select('id, course_id')
        .eq('course_id', courseId);
      if (currentChaptersError) {
        return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: currentChaptersError.message } }, { status: 500 });
      }

      const suppliedChapterIds = courseData.chapters.map((chapter) => chapter.id).filter((id): id is string => typeof id === 'string');
      if (suppliedChapterIds.length) {
        const { data: matchedChapters, error: matchedChaptersError } = await supabaseAdmin
          .from('chapters')
          .select('id, course_id')
          .in('id', suppliedChapterIds);
        if (matchedChaptersError) {
          return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: matchedChaptersError.message } }, { status: 500 });
        }
        if (matchedChapters?.some((chapter) => chapter.course_id !== courseId)) {
          return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'A chapter belongs to a different course.' } }, { status: 403 });
        }
      }

      const suppliedLessonIds = courseData.chapters.flatMap((chapter) => Array.isArray(chapter.lessons) ? chapter.lessons.map((lesson: { id?: unknown }) => lesson.id) : []).filter((id): id is string => typeof id === 'string');
      if (suppliedLessonIds.length) {
        const { data: matchedLessons, error: matchedLessonsError } = await supabaseAdmin
          .from('lessons')
          .select('id, course_id')
          .in('id', suppliedLessonIds);
        if (matchedLessonsError) {
          return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: matchedLessonsError.message } }, { status: 500 });
        }
        if (matchedLessons?.some((lesson) => lesson.course_id !== courseId)) {
          return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'A lesson belongs to a different course.' } }, { status: 403 });
        }
      }

      const { data: currentLessons, error: currentLessonsError } = await supabaseAdmin
        .from('lessons')
        .select('id')
        .eq('course_id', courseId);
      if (currentLessonsError) {
        return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: currentLessonsError.message } }, { status: 500 });
      }
      for (let index = 0; index < (currentLessons || []).length; index++) {
        const { error: positionError } = await supabaseAdmin
          .from('lessons')
          .update({ position: 1000000 + index })
          .eq('id', currentLessons![index].id);
        if (positionError) {
          return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: positionError.message } }, { status: 500 });
        }
      }

      const savedChapterIds: string[] = [];
      const savedLessonIds: string[] = [];
      for (let chIdx = 0; chIdx < courseData.chapters.length; chIdx++) {
        const chapter = courseData.chapters[chIdx];
        const chapterId = chapter.id || `${courseId}-ch-${chIdx + 1}`;
        const { error: chapterWriteError } = await supabaseAdmin.from('chapters').upsert({
          id: chapterId,
          course_id: courseId,
          title: chapter.title || `Module ${chIdx + 1}`,
          description: chapter.description || '',
          position: chapter.order || chIdx + 1,
        }, { onConflict: 'id' });
        if (chapterWriteError) {
          return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: chapterWriteError.message } }, { status: 500 });
        }
        savedChapterIds.push(chapterId);

        if (Array.isArray(chapter.lessons)) {
          for (let lessonIndex = 0; lessonIndex < chapter.lessons.length; lessonIndex++) {
            const lesson = chapter.lessons[lessonIndex];
            const lessonId = lesson.id || `${chapterId}-les-${lessonIndex + 1}`;
            const { error: lessonWriteError } = await supabaseAdmin.from('lessons').upsert({
              id: lessonId,
              chapter_id: chapterId,
              course_id: courseId,
              slug: lesson.slug || `lesson-${lessonIndex + 1}`,
              title: lesson.title || `Lesson ${lessonIndex + 1}`,
              description: lesson.description || '',
              type: lesson.type || 'video',
              video_url: lesson.videoUrl || '',
              video_id: lesson.videoId || '',
              duration: lesson.duration || '10:00',
              duration_seconds: Number(lesson.durationSeconds) || 0,
              position: lesson.order || lessonIndex + 1,
              is_published: lesson.isPublished ?? true,
              quiz_id: lesson.quizId || null,
              learning_objectives: lesson.learningObjectives || [],
              key_concepts: lesson.keyConcepts || [],
              prerequisite_lesson_id: lesson.prerequisiteLessonId || null,
            }, { onConflict: 'id' });
            if (lessonWriteError) {
              return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: lessonWriteError.message } }, { status: 500 });
            }
            savedLessonIds.push(lessonId);
          }
        }
      }

      const removedChapterIds = (currentChapters || []).map((chapter) => chapter.id).filter((id) => !savedChapterIds.includes(id));
      if (removedChapterIds.length) {
        const { error: removeChaptersError } = await supabaseAdmin.from('chapters').delete().in('id', removedChapterIds);
        if (removeChaptersError) {
          return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: removeChaptersError.message } }, { status: 500 });
        }
      }

      const { data: persistedLessons, error: persistedLessonsError } = await supabaseAdmin
        .from('lessons')
        .select('id')
        .eq('course_id', courseId);
      if (persistedLessonsError) {
        return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: persistedLessonsError.message } }, { status: 500 });
      }
      const removedLessonIds = (persistedLessons || []).map((lesson) => lesson.id).filter((id) => !savedLessonIds.includes(id));
      if (removedLessonIds.length) {
        const { error: removeLessonsError } = await supabaseAdmin.from('lessons').delete().in('id', removedLessonIds);
        if (removeLessonsError) {
          return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: removeLessonsError.message } }, { status: 500 });
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save course';
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid session' } }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, grade_id')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) {
      return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: profileError.message } }, { status: 500 });
    }
    if (profile?.role !== 'admin' && profile?.role !== 'teacher') {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Only faculty and administrators can delete courses' } }, { status: 403 });
    }

    const courseId = req.nextUrl.searchParams.get('id');
    if (!courseId) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Course ID is required' } }, { status: 400 });
    }

    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, grade_id')
      .eq('id', courseId)
      .maybeSingle();
    if (courseError) {
      return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: courseError.message } }, { status: 500 });
    }
    if (!course) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Course not found' } }, { status: 404 });
    }
    if (profile.role === 'teacher' && (!profile.grade_id || course.grade_id !== profile.grade_id)) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only delete courses for their assigned grade.' } }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin.from('courses').delete().eq('id', courseId);
    if (deleteError) {
      return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: deleteError.message } }, { status: 500 });
    }
    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete course';
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}
