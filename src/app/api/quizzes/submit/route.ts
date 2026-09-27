import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const {
      quizId,
      quizName,
      courseId,
      questions,
      selectedAnswers,
      passingScore = 70,
      startedAt,
      schedule,
    } = body;

    // TAMPERING REJECTION: Client is forbidden from providing answer keys, scores, or pass states
    if ('correct' in body || 'correctAnswerIndex' in body || 'score' in body || 'passed' in body ||
        (Array.isArray(questions) && questions.some((q: any) => 'correctAnswerIndex' in q || 'correct' in q))) {
      return NextResponse.json(
        { success: false, error: 'Academic integrity violation: Grading and answer keys cannot be submitted by client.' },
        { status: 400 }
      );
    }

    if (!quizId || !Array.isArray(questions)) {
      return NextResponse.json({ success: false, error: 'Invalid quiz payload' }, { status: 400 });
    }

    // 1. SERVER-SIDE TIMING / SCHEDULING VALIDATION
    const now = new Date();
    if (schedule?.startDate) {
      const startDateTimeStr = `${schedule.startDate}T${schedule.startTime || '00:00'}:00`;
      const startWindow = new Date(startDateTimeStr);
      if (!isNaN(startWindow.getTime()) && now < startWindow) {
        return NextResponse.json(
          { success: false, error: `Assessment opens on ${schedule.startDate} at ${schedule.startTime || '00:00'}. Submissions are not yet accepted.` },
          { status: 403 }
        );
      }
    }

    if (schedule?.deadlineDate) {
      const deadlineDateTimeStr = `${schedule.deadlineDate}T${schedule.deadlineTime || '23:59'}:59`;
      const deadlineWindow = new Date(deadlineDateTimeStr);
      if (!isNaN(deadlineWindow.getTime()) && now > deadlineWindow) {
        return NextResponse.json(
          { success: false, error: 'Assessment Closed: The submission deadline for this assessment has passed.' },
          { status: 403 }
        );
      }
    }

    // 2. CHECK FOR EXISTING SUBMISSION & RETAKE PERMISSION
    const { data: existingResults } = await supabaseAdmin
      .from('quiz_results')
      .select('id, percentage, passed, completed_at')
      .eq('user_id', user.id)
      .eq('quiz_id', quizId)
      .maybeSingle();

    let retakePermissionId: string | null = null;
    if (existingResults) {
      // Check if user has explicit unconsumed retake permission
      const { data: retakePerm } = await supabaseAdmin
        .from('quiz_retake_permissions')
        .select('id')
        .eq('user_id', user.id)
        .eq('quiz_id', quizId)
        .is('consumed_at', null)
        .maybeSingle();

      if (!retakePerm) {
        return NextResponse.json(
          {
            success: false,
            error: 'Assessment Completed: You have already submitted this assessment. Retakes must be authorized by your teacher or administrator.',
            existingResult: existingResults,
          },
          { status: 403 }
        );
      }

      retakePermissionId = retakePerm.id;
    }

    // 3. EVALUATE QUIZ QUESTIONS & MARKS
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let totalMarksEarned = 0;
    let maxPossibleMarks = 0;

    const questionResults = questions.map((q: any) => {
      const questionMaxMarks = Number(q.marks) || 1;
      maxPossibleMarks += questionMaxMarks;

      const studentAnsIndex = selectedAnswers[q.id];
      const isAnswered = studentAnsIndex !== undefined && studentAnsIndex !== null;
      const isCorrect = isAnswered && studentAnsIndex === q.correctAnswerIndex;

      let marksAwarded = 0;
      if (isCorrect) {
        correctCount++;
        marksAwarded = questionMaxMarks;
        totalMarksEarned += marksAwarded;
      } else if (isAnswered) {
        incorrectCount++;
      } else {
        unansweredCount++;
      }

      return {
        questionId: q.id,
        questionText: q.question,
        studentAnswerIndex: isAnswered ? studentAnsIndex : -1,
        correctAnswerIndex: q.correctAnswerIndex,
        studentAnswerText: isAnswered ? (q.options[studentAnsIndex] || 'Selected Option') : 'Unanswered',
        correctAnswerText: q.options[q.correctAnswerIndex] || '',
        isCorrect,
        marksAwarded,
        maxMarks: questionMaxMarks,
        explanation: q.explanation || '',
      };
    });

    const percentage = maxPossibleMarks > 0
      ? Math.round((totalMarksEarned / maxPossibleMarks) * 100)
      : Math.round((correctCount / questions.length) * 100);

    const passed = percentage >= passingScore;

    // Time calculation
    const startTimeObj = startedAt ? new Date(startedAt) : now;
    const timeTakenSeconds = Math.max(0, Math.round((now.getTime() - startTimeObj.getTime()) / 1000));

    // 4. PERSIST RESULT TO SUPABASE
    const resultPayload = {
      user_id: user.id,
      quiz_id: quizId,
      quiz_name: quizName || quizId,
      course_id: courseId || null,
      score: totalMarksEarned,
      max_score: maxPossibleMarks,
      total_questions: questions.length,
      percentage,
      passed,
      answers: selectedAnswers,
      question_results: questionResults,
      started_at: startTimeObj.toISOString(),
      time_taken_seconds: timeTakenSeconds,
      correct_answers: correctCount,
      incorrect_answers: incorrectCount,
      unanswered: unansweredCount,
      completed_at: now.toISOString(),
    };

    const { data: savedResult, error: saveErr } = await supabaseAdmin
      .from('quiz_results')
      .upsert(resultPayload, { onConflict: 'user_id,quiz_id' })
      .select()
      .single();

    if (saveErr) {
      // Fallback if extended columns are not yet applied in remote Supabase
      const fallbackPayload = {
        user_id: user.id,
        quiz_id: quizId,
        score: correctCount,
        total_questions: questions.length,
        percentage,
        passed,
        answers: selectedAnswers,
        completed_at: now.toISOString(),
      };
      await supabaseAdmin.from('quiz_results').upsert(fallbackPayload, { onConflict: 'user_id,quiz_id' });
    }

    // 5. CONSUME RETAKE PERMISSION IF ONE WAS USED
    if (retakePermissionId) {
      await supabaseAdmin
        .from('quiz_retake_permissions')
        .update({ consumed_at: now.toISOString() })
        .eq('id', retakePermissionId);
    }

    return NextResponse.json({
      success: true,
      result: {
        id: savedResult?.id,
        userId: user.id,
        quizId,
        quizName: quizName || quizId,
        courseId,
        score: totalMarksEarned,
        maxScore: maxPossibleMarks,
        total: questions.length,
        percentage,
        passed,
        completedAt: now.toISOString(),
        startedAt: startTimeObj.toISOString(),
        timeTakenSeconds,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        unanswered: unansweredCount,
        answers: selectedAnswers,
        questionResults,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
