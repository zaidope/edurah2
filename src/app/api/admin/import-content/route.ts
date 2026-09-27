import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      return NextResponse.json({ error: { code: 'UNAVAILABLE', message: 'Database service unavailable' } }, { status: 503 });
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid session' } }, { status: 401 });
    }

    // Role check: Only admin can import/rescue content
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin' && user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin role required' } }, { status: 403 });
    }

    const body = await req.json();
    const { subjects = [], courses = [], quizzes = [] } = body;

    let subjectsCount = 0;
    let coursesCount = 0;
    let chaptersCount = 0;
    let lessonsCount = 0;
    let quizzesCount = 0;
    let questionsCount = 0;

    // 1. Upsert Subjects
    for (const sub of subjects) {
      if (!sub.id || !sub.slug || !sub.name) continue;
      const { error } = await supabaseAdmin.from('subjects').upsert({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        description: sub.description || '',
        short_description: sub.shortDescription || '',
        icon: sub.icon || 'BookOpen',
        color: sub.color || 'from-blue-600 to-indigo-600',
        category: sub.category || 'General',
        course_count: sub.courseCount || 0,
        lesson_count: sub.lessonCount || 0,
        featured: Boolean(sub.featured),
        banner_image: sub.bannerImage || null,
      }, { onConflict: 'id' });

      if (!error) subjectsCount++;
    }

    // 2. Upsert Courses, Chapters, and Lessons
    for (const c of courses) {
      if (!c.id || !c.slug || !c.title || !c.gradeId) continue;

      const courseRow = {
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description || '',
        short_description: c.shortDescription || '',
        grade_id: c.gradeId,
        subject_id: c.subjectId || null,
        subject_name: c.subjectName || 'General',
        thumbnail: c.thumbnail || '',
        status: c.status || 'published',
        level: c.level || 'Beginner',
        duration: c.duration || '2h 30m',
        lesson_count: c.lessonCount || (c.chapters ? c.chapters.reduce((acc: number, ch: any) => acc + (ch.lessons?.length || 0), 0) : 0),
        rating: Number(c.rating) || 5.0,
        students_enrolled: Number(c.studentsEnrolled) || 0,
        featured: c.featured ?? true,
        position: Number(c.order) || 1,
        instructor: c.instructor || {
          name: 'Edurah Lead Instructor',
          role: 'Senior Educator',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          bio: 'Curriculum expert.',
        },
        created_by: user.id,
      };

      const { error: cErr } = await supabaseAdmin.from('courses').upsert(courseRow, { onConflict: 'id' });
      if (cErr) {
        console.error('Course upsert error:', cErr);
        continue;
      }
      coursesCount++;

      // Upsert Chapters
      if (Array.isArray(c.chapters)) {
        for (let chIdx = 0; chIdx < c.chapters.length; chIdx++) {
          const ch = c.chapters[chIdx];
          const chapterId = ch.id || `${c.id}-ch-${chIdx + 1}`;
          const chapterPosition = ch.order || chIdx + 1;

          const { error: chErr } = await supabaseAdmin.from('chapters').upsert({
            id: chapterId,
            course_id: c.id,
            title: ch.title || `Chapter ${chIdx + 1}`,
            description: ch.description || '',
            position: chapterPosition,
          }, { onConflict: 'id' });

          if (!chErr) chaptersCount++;

          // Upsert Lessons
          if (Array.isArray(ch.lessons)) {
            for (let lIdx = 0; lIdx < ch.lessons.length; lIdx++) {
              const l = ch.lessons[lIdx];
              const lessonId = l.id || `${chapterId}-les-${lIdx + 1}`;
              const lessonPosition = l.order || lIdx + 1;

              const { error: lErr } = await supabaseAdmin.from('lessons').upsert({
                id: lessonId,
                chapter_id: chapterId,
                course_id: c.id,
                slug: l.slug || `lesson-${lIdx + 1}`,
                title: l.title || `Lesson ${lIdx + 1}`,
                description: l.description || '',
                type: l.type || 'video',
                video_url: l.videoUrl || '',
                video_id: l.videoId || '',
                duration_seconds: Number(l.durationSeconds) || 0,
                duration: l.duration || '10:00',
                body_md: l.bodyMd || '',
                position: lessonPosition,
                is_published: l.isPublished ?? true,
                quiz_id: l.quizId || null,
                learning_objectives: l.learningObjectives || [],
                key_concepts: l.keyConcepts || [],
                prerequisite_lesson_id: l.prerequisiteLessonId || null,
              }, { onConflict: 'id' });

              if (!lErr) lessonsCount++;
            }
          }
        }
      }
    }

    // 3. Upsert Quizzes and Questions
    for (const q of quizzes) {
      if (!q.id || !q.title || !q.gradeId) continue;

      const { error: qErr } = await supabaseAdmin.from('quizzes').upsert({
        id: q.id,
        course_id: q.courseId || null,
        lesson_id: q.lessonId || null,
        grade_id: q.gradeId,
        subject_id: q.subjectId || null,
        title: q.title,
        description: q.description || '',
        pass_percent: Number(q.passingScore) || 60,
        total_marks: Number(q.totalMarks) || 100,
        time_limit_seconds: q.durationMinutes ? q.durationMinutes * 60 : null,
        questions_to_serve: null,
        shuffle_questions: false,
        shuffle_options: false,
        max_attempts: 1,
        start_date: q.startDate || null,
        start_time: q.startTime || null,
        deadline_date: q.deadlineDate || null,
        deadline_time: q.deadlineTime || null,
        status: 'published',
        created_by: user.id,
      }, { onConflict: 'id' });

      if (qErr) {
        console.error('Quiz upsert error:', qErr);
        continue;
      }
      quizzesCount++;

      // Upsert Questions with AUTHORITATIVE answer key
      if (Array.isArray(q.questions)) {
        for (let qIdx = 0; qIdx < q.questions.length; qIdx++) {
          const item = q.questions[qIdx];
          const questionId = item.id || `${q.id}-q-${qIdx + 1}`;

          const { error: itemErr } = await supabaseAdmin.from('questions').upsert({
            id: questionId,
            quiz_id: q.id,
            type: 'single',
            prompt_md: item.question || item.promptMd || '',
            options: item.options || [],
            correct: item.correctAnswerIndex !== undefined ? item.correctAnswerIndex : item.correct,
            explanation_md: item.explanation || item.explanationMd || '',
            points: Number(item.marks) || 1,
            position: qIdx + 1,
          }, { onConflict: 'id' });

          if (!itemErr) questionsCount++;
        }
      }
    }

    return NextResponse.json({
      data: {
        success: true,
        counts: {
          subjects: subjectsCount,
          courses: coursesCount,
          chapters: chaptersCount,
          lessons: lessonsCount,
          quizzes: quizzesCount,
          questions: questionsCount,
        },
      },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message || 'Import failed' } },
      { status: 500 }
    );
  }
}
