import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      return NextResponse.json({ success: false, error: 'Admin client unavailable' }, { status: 503 });
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication token required' }, { status: 401 });
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const url = new URL(req.url);
    const targetUserId = url.searchParams.get('userId') || user.id;

    // If querying another user, verify caller is teacher or admin
    if (targetUserId !== user.id) {
      const { data: callerProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const role = callerProfile?.role || user.user_metadata?.role;
      if (role !== 'admin' && role !== 'teacher') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    // 1. Fetch lesson progress from Supabase
    const { data: lessonProgressRows, error: lpError } = await supabaseAdmin
      .from('lesson_progress')
      .select('*')
      .eq('user_id', targetUserId)
      .order('last_accessed_at', { ascending: false });

    // 2. Fetch quiz results from Supabase
    const { data: quizResultRows, error: qrError } = await supabaseAdmin
      .from('quiz_results')
      .select('*')
      .eq('user_id', targetUserId)
      .order('completed_at', { ascending: false });

    const completedLessons: string[] = [];
    const lessonRecords: Record<string, any> = {};
    let lastViewedLesson = undefined;

    (lessonProgressRows || []).forEach((row: any, index: number) => {
      if (row.completed) {
        completedLessons.push(row.lesson_id);
      }
      lessonRecords[row.lesson_id] = {
        lessonId: row.lesson_id,
        courseId: row.course_id,
        lastPositionSeconds: Number(row.last_position_seconds) || 0,
        durationSeconds: Number(row.duration_seconds) || 0,
        watchPercentage: Number(row.watch_percentage) || 0,
        completed: Boolean(row.completed),
        lastAccessedAt: row.last_accessed_at,
        completedAt: row.completed_at,
      };

      if (index === 0 && row.last_accessed_at) {
        lastViewedLesson = {
          courseSlug: row.course_id,
          lessonSlug: row.lesson_id,
          title: row.lesson_id,
          timestamp: row.last_accessed_at,
          lastPositionSeconds: Number(row.last_position_seconds) || 0,
          durationSeconds: Number(row.duration_seconds) || 0,
          watchPercentage: Number(row.watch_percentage) || 0,
        };
      }
    });

    const quizResults: Record<string, any> = {};
    (quizResultRows || []).forEach((row: any) => {
      quizResults[row.quiz_id] = {
        id: row.id,
        userId: row.user_id,
        quizId: row.quiz_id,
        quizName: row.quiz_name || row.quiz_id,
        courseId: row.course_id,
        score: row.score,
        maxScore: row.max_score || 100,
        total: row.total_questions,
        percentage: row.percentage,
        passed: row.passed,
        completedAt: row.completed_at,
        startedAt: row.started_at,
        timeTakenSeconds: row.time_taken_seconds || 0,
        correctAnswers: row.correct_answers || 0,
        incorrectAnswers: row.incorrect_answers || 0,
        unanswered: row.unanswered || 0,
        answers: row.answers || {},
        questionResults: row.question_results || [],
      };
    });

    const quizResultsList = Object.values(quizResults);

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      completedLessons,
      lessonRecords,
      quizResults: quizResultsList,
      quizResultsMap: quizResults,
      lastViewedLesson,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
