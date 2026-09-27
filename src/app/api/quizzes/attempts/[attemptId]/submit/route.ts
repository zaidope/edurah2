import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { INITIAL_QUIZZES } from '@/content/quizzes';
import { AttemptsStore } from '@/lib/attempts';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
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

    const body = await req.json();

    // 1. TAMPERING DEFENSE: Reject requests containing forbidden client-forged grading fields!
    if ('correct' in body || 'correctAnswerIndex' in body || 'score' in body || 'passed' in body) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'ATTEMPT_TAMPERING',
            message: 'Academic integrity violation: Grading and answer keys cannot be submitted by client.',
          },
        },
        { status: 400 }
      );
    }

    const answersInput = body.answers || body.selectedAnswers || {};
    const integrityEvents = Array.isArray(body.integrityEvents) ? body.integrityEvents : [];

    // 2. Load Attempt Record
    let attempt: any = null;

    try {
      const { data: dbAttempt } = await supabaseAdmin
        .from('quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .maybeSingle();
      if (dbAttempt) attempt = dbAttempt;
    } catch {
      // Table may be pending migration
    }

    if (!attempt) {
      attempt = AttemptsStore.get(attemptId);
    }

    if (!attempt) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Assessment attempt not found' } },
        { status: 404 }
      );
    }

    // 3. Ownership Verification (Submit for another student's attemptId -> 403)
    if (attempt.student_id !== user.id) {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'You are not authorized to submit this assessment attempt.' } },
        { status: 403 }
      );
    }

    // 4. Double-Submission Prevention
    if (attempt.submitted_at) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'ALREADY_SUBMITTED',
            message: 'This attempt has already been submitted and finalized.',
          },
        },
        { status: 400 }
      );
    }

    // 5. Expiration / Time Limit Check (15s grace period for network latency)
    const now = new Date();
    if (attempt.expires_at) {
      const expirationDate = new Date(new Date(attempt.expires_at).getTime() + 15000);
      if (now > expirationDate) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'TIME_EXPIRED',
              message: 'Assessment time limit has expired. Submission rejected.',
            },
          },
          { status: 400 }
        );
      }
    }

    // 6. Fetch authoritative Quiz & Questions from Server Database
    const { data: quiz } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', attempt.quiz_id)
      .maybeSingle();

    const fallbackQuiz = INITIAL_QUIZZES.find(q => q.id === attempt.quiz_id);
    const passPercent = quiz?.pass_percent || fallbackQuiz?.passingScore || 60;

    let dbQuestions: any[] = [];
    const { data: qRows } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('quiz_id', attempt.quiz_id);

    if (qRows && qRows.length > 0) {
      dbQuestions = qRows;
    } else if (fallbackQuiz && Array.isArray(fallbackQuiz.questions)) {
      dbQuestions = fallbackQuiz.questions.map((q: any) => ({
        id: q.id,
        prompt_md: q.question,
        options: q.options,
        correct: q.correctAnswerIndex,
        explanation_md: q.explanation || '',
        points: q.marks || 1,
      }));
    }

    // Filter to questions served in this attempt
    const questionsToGrade = attempt.served_question_ids && attempt.served_question_ids.length > 0
      ? dbQuestions.filter(q => attempt.served_question_ids.includes(q.id))
      : dbQuestions;

    // 7. Authoritative Server-Side Evaluation
    let totalMarksEarned = 0;
    let maxPossibleMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const questionResults: any[] = [];
    const answersToInsert: any[] = [];

    for (const q of questionsToGrade) {
      const qMax = Number(q.points) || 1;
      maxPossibleMarks += qMax;

      const studentResponse = Array.isArray(answersInput)
        ? answersInput.find((a: any) => a.questionId === q.id)?.response
        : answersInput[q.id];

      const isAnswered = studentResponse !== undefined && studentResponse !== null && studentResponse !== -1;
      
      // Compare strictly with authoritative database answer key
      const isCorrect = isAnswered && (
        studentResponse === q.correct ||
        String(studentResponse) === String(q.correct)
      );

      let marksAwarded = 0;
      if (isCorrect) {
        correctCount++;
        marksAwarded = qMax;
        totalMarksEarned += marksAwarded;
      } else if (isAnswered) {
        incorrectCount++;
      } else {
        unansweredCount++;
      }

      const optionsList = Array.isArray(q.options) ? q.options : [];
      const studentAnswerText = isAnswered ? (optionsList[studentResponse] || String(studentResponse)) : 'Unanswered';
      const correctAnswerText = optionsList[q.correct] || String(q.correct);

      questionResults.push({
        questionId: q.id,
        questionText: q.prompt_md,
        studentAnswerIndex: isAnswered ? Number(studentResponse) : -1,
        correctAnswerIndex: typeof q.correct === 'number' ? q.correct : 0,
        studentAnswerText,
        correctAnswerText,
        isCorrect,
        marksAwarded,
        maxMarks: qMax,
        explanation: q.explanation_md || '', // Released safely after submission
      });

      answersToInsert.push({
        attempt_id: attempt.id,
        question_id: q.id,
        response: isAnswered ? { selectedIndex: studentResponse } : { unanswered: true },
        is_correct: isCorrect,
        points_awarded: marksAwarded,
      });
    }

    const percentage = maxPossibleMarks > 0
      ? Math.round((totalMarksEarned / maxPossibleMarks) * 100)
      : 0;
    const passed = percentage >= passPercent;
    const startTimeObj = new Date(attempt.started_at);
    const timeTakenSeconds = Math.max(0, Math.round((now.getTime() - startTimeObj.getTime()) / 1000));

    // 8. Atomically Update Attempt & Insert Answers in Supabase
    try {
      await supabaseAdmin
        .from('quiz_attempts')
        .update({
          submitted_at: now.toISOString(),
          score: totalMarksEarned,
          max_score: maxPossibleMarks,
          percentage,
          passed,
          integrity_events: integrityEvents,
        })
        .eq('id', attempt.id);

      if (answersToInsert.length > 0) {
        await supabaseAdmin.from('quiz_answers').insert(answersToInsert);
      }
    } catch {
      // Table may be pending migration
    }

    AttemptsStore.update(attempt.id, {
      submitted_at: now.toISOString(),
      score: totalMarksEarned,
      max_score: maxPossibleMarks,
      percentage,
      passed,
      integrity_events: integrityEvents,
    });

    // 9. Sync into legacy quiz_results table for uninterrupted dashboard/grade reporting
    const normalizedAnswers: Record<string, number> = {};
    if (Array.isArray(answersInput)) {
      answersInput.forEach((a: any) => { normalizedAnswers[a.questionId] = a.response; });
    } else {
      Object.assign(normalizedAnswers, answersInput);
    }

    await supabaseAdmin.from('quiz_results').upsert({
      user_id: user.id,
      quiz_id: attempt.quiz_id,
      quiz_name: quiz?.title || fallbackQuiz?.title || attempt.quiz_id,
      course_id: quiz?.course_id || fallbackQuiz?.courseId || null,
      score: totalMarksEarned,
      max_score: maxPossibleMarks,
      total_questions: questionsToGrade.length,
      percentage,
      passed,
      answers: normalizedAnswers,
      question_results: questionResults,
      started_at: attempt.started_at,
      completed_at: now.toISOString(),
      time_taken_seconds: timeTakenSeconds,
      correct_answers: correctCount,
      incorrect_answers: incorrectCount,
      unanswered: unansweredCount,
    }, { onConflict: 'user_id,quiz_id' });

    // 10. Consume any active retake permission
    await supabaseAdmin
      .from('quiz_retake_permissions')
      .update({ consumed_at: now.toISOString() })
      .eq('user_id', user.id)
      .eq('quiz_id', attempt.quiz_id)
      .is('consumed_at', null);

    // Return authenticated result with explanations
    return NextResponse.json({
      data: {
        success: true,
        attemptId: attempt.id,
        score: totalMarksEarned,
        maxScore: maxPossibleMarks,
        percentage,
        passed,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        unanswered: unansweredCount,
        timeTakenSeconds,
        completedAt: now.toISOString(),
        questionResults,
      },
      error: null,
      // Backward-compatibility aliases
      result: {
        score: totalMarksEarned,
        maxScore: maxPossibleMarks,
        percentage,
        passed,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        unanswered: unansweredCount,
        timeTakenSeconds,
        completedAt: now.toISOString(),
        questionResults,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Submission failed' } },
      { status: 500 }
    );
  }
}
