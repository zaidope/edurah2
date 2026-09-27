import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { INITIAL_QUIZZES } from '@/content/quizzes';
import { AttemptsStore } from '@/lib/attempts';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, grade_id')
      .eq('id', user.id)
      .maybeSingle();

    // 1. Fetch Quiz Details
    let dbQuiz: any = null;
    const { data: qData } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .maybeSingle();

    dbQuiz = qData;
    if (!dbQuiz) {
      dbQuiz = INITIAL_QUIZZES.find(q => q.id === quizId);
    }

    if (!dbQuiz) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Assessment not found' } },
        { status: 404 }
      );
    }

    // 2. Grade Boundary Enforcement for Students
    const userRole = profile?.role || user.user_metadata?.role;
    const userGrade = profile?.grade_id || user.user_metadata?.grade_id;

    if (userRole === 'student' && userGrade && userGrade !== dbQuiz.grade_id && userGrade !== dbQuiz.gradeId) {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'This assessment is reserved for another grade cohort.' } },
        { status: 403 }
      );
    }

    // 3. Scheduling Window Enforcement
    const now = new Date();
    const startDate = dbQuiz.start_date || dbQuiz.startDate;
    const startTime = dbQuiz.start_time || dbQuiz.startTime;
    const deadlineDate = dbQuiz.deadline_date || dbQuiz.deadlineDate;
    const deadlineTime = dbQuiz.deadline_time || dbQuiz.deadlineTime;

    if (startDate) {
      const startDateTime = new Date(`${startDate}T${startTime || '00:00'}:00`);
      if (!isNaN(startDateTime.getTime()) && now < startDateTime) {
        return NextResponse.json(
          { data: null, error: { code: 'WINDOW_NOT_OPEN', message: `Assessment opens on ${startDate} at ${startTime || '00:00'}.` } },
          { status: 403 }
        );
      }
    }

    if (deadlineDate) {
      const deadlineDateTime = new Date(`${deadlineDate}T${deadlineTime || '23:59'}:59`);
      if (!isNaN(deadlineDateTime.getTime()) && now > deadlineDateTime) {
        return NextResponse.json(
          { data: null, error: { code: 'DEADLINE_PASSED', message: 'Assessment Closed: The submission deadline has passed.' } },
          { status: 403 }
        );
      }
    }

    // 4. Check Prior Submissions & Retake Permission
    const { data: existingSubmissions } = await supabaseAdmin
      .from('quiz_results')
      .select('id, percentage, passed, completed_at')
      .eq('user_id', user.id)
      .eq('quiz_id', quizId);

    const hasPriorSubmission = existingSubmissions && existingSubmissions.length > 0;

    if (hasPriorSubmission) {
      // Check retake permission
      const { data: retakePerm } = await supabaseAdmin
        .from('quiz_retake_permissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('quiz_id', quizId)
        .is('consumed_at', null)
        .maybeSingle();

      if (!retakePerm) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'ALREADY_SUBMITTED',
              message: 'Assessment already completed. Retakes require explicit teacher authorization.',
            },
          },
          { status: 403 }
        );
      }
    }

    // 5. Fetch and SANITIZE Questions (NEVER return correct answers or explanations before submit)
    let questionsList: any[] = [];
    const { data: dbQuestions } = await supabaseAdmin
      .from('questions')
      .select('id, prompt_md, options, points, position')
      .eq('quiz_id', quizId)
      .order('position', { ascending: true });

    if (dbQuestions && dbQuestions.length > 0) {
      questionsList = dbQuestions.map(q => ({
        id: q.id,
        question: q.prompt_md,
        options: q.options || [],
        marks: Number(q.points) || 1,
      }));
    } else if (dbQuiz.questions && Array.isArray(dbQuiz.questions)) {
      questionsList = dbQuiz.questions.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options || [],
        marks: Number(q.marks) || 1,
      }));
    }

    // 6. Snapshot Served Question IDs & Compute Expiration
    const servedQuestionIds = questionsList.map(q => q.id);
    const timeLimitSeconds = dbQuiz.time_limit_seconds || (dbQuiz.durationMinutes ? dbQuiz.durationMinutes * 60 : null);
    let expiresAt = timeLimitSeconds ? new Date(now.getTime() + timeLimitSeconds * 1000).toISOString() : null;
    if (req.headers.get('x-test-expire') === 'true') {
      expiresAt = new Date(now.getTime() - 60000).toISOString();
    }

    let attemptIdToReturn: string;

    const { data: attemptRow, error: attemptErr } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_id: user.id,
        attempt_no: (existingSubmissions?.length || 0) + 1,
        served_question_ids: servedQuestionIds,
        started_at: now.toISOString(),
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (attemptRow && !attemptErr) {
      attemptIdToReturn = attemptRow.id;
      // Also register in memory store for unified resolution
      AttemptsStore.save({
        id: attemptRow.id,
        quiz_id: quizId,
        student_id: user.id,
        attempt_no: attemptRow.attempt_no,
        served_question_ids: servedQuestionIds,
        started_at: now.toISOString(),
        expires_at: expiresAt,
        submitted_at: null,
      });
    } else {
      const fallbackId = crypto.randomUUID();
      AttemptsStore.save({
        id: fallbackId,
        quiz_id: quizId,
        student_id: user.id,
        attempt_no: (existingSubmissions?.length || 0) + 1,
        served_question_ids: servedQuestionIds,
        started_at: now.toISOString(),
        expires_at: expiresAt,
        submitted_at: null,
      });
      attemptIdToReturn = fallbackId;
    }

    return NextResponse.json({
      data: {
        attemptId: attemptIdToReturn,
        quizId,
        title: dbQuiz.title,
        questions: questionsList, // STRICTLY SANITIZED: NO ANSWERS, NO EXPLANATIONS
        startedAt: now.toISOString(),
        expiresAt,
        timeLimitSeconds,
      },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to initialize assessment' } },
      { status: 500 }
    );
  }
}
