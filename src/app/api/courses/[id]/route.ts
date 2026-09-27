import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ContentService } from '@/lib/content';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let course: any = null;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: dbCourse } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        chapters:chapters(
          *,
          lessons:lessons(*)
        )
      `)
      .or(`id.eq.${id},slug.eq.${id}`)
      .maybeSingle();

    if (dbCourse) {
      const sortedChapters = (dbCourse.chapters || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
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

      course = {
        id: dbCourse.id,
        slug: dbCourse.slug,
        title: dbCourse.title,
        gradeId: dbCourse.grade_id,
        subjectId: dbCourse.subject_id || '',
        subjectName: dbCourse.subject_name || 'General',
        shortDescription: dbCourse.short_description || '',
        description: dbCourse.description || '',
        thumbnail: dbCourse.thumbnail || '',
        level: dbCourse.level || 'Beginner',
        duration: dbCourse.duration || '2h 30m',
        lessonCount: dbCourse.lesson_count || 0,
        rating: Number(dbCourse.rating) || 5.0,
        studentsEnrolled: Number(dbCourse.students_enrolled) || 0,
        featured: Boolean(dbCourse.featured),
        status: dbCourse.status || 'published',
        order: dbCourse.position || 1,
        instructor: dbCourse.instructor,
        chapters: formattedChapters,
      };
    }
  } catch (err) {
    console.warn('Database course fetch failed, checking memory seed:', err);
  }

  if (!course) {
    course = ContentService.getCourseById(id) || ContentService.getCourseBySlug(id);
  }

  if (!course) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: 'Course not found' } },
      { status: 404 }
    );
  }

  // Grade boundary checks
  const userGradeHeader = req.headers.get('x-user-grade');
  const userRoleHeader = req.headers.get('x-user-role');

  if (userRoleHeader === 'student' && userGradeHeader && userGradeHeader !== course.gradeId) {
    return NextResponse.json(
      { 
        data: null,
        error: {
          code: 'GRADE_RESTRICTED',
          message: 'Grade boundary restriction. This course belongs to another cohort curriculum.',
        },
        courseGradeId: course.gradeId,
        userGradeId: userGradeHeader,
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    data: { course },
    error: null,
    success: true,
    course,
  });
}
