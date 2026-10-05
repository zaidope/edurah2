import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const QuizQuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(3, 'Question prompt is required'),
  options: z.array(z.string()).min(2, 'At least 2 options are required'),
  correctAnswerIndex: z.number().int().min(0),
  explanation: z.string().optional(),
  marks: z.number().min(0).default(1),
});

const QuizSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Assessment title must be at least 3 characters'),
  description: z.string().optional(),
  gradeId: z.string().min(1, 'Grade is required'),
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  subjectId: z.string().optional(),
  passingScore: z.number().min(0).max(100).default(60),
  totalMarks: z.number().min(0).default(100),
  durationMinutes: z.number().min(1).optional(),
  startDate: z.string().optional(),
  startTime: z.string().optional(),
  deadlineDate: z.string().optional(),
  deadlineTime: z.string().optional(),
  questions: z.array(QuizQuestionSchema).min(1, 'Assessment must contain at least 1 question'),
});

type QuizDatabaseRow = {
  id: string;
  title: string;
  description: string | null;
  grade_id: string;
  course_id: string | null;
  lesson_id: string | null;
  subject_id: string | null;
  pass_percent: number | null;
  total_marks: number | string | null;
  time_limit_seconds: number | null;
  start_date: string | null;
  start_time: string | null;
  deadline_date: string | null;
  deadline_time: string | null;
  questions: Array<{
    id: string;
    prompt_md: string;
    options: string[] | null;
    points: number | string | null;
    position: number;
    correct: unknown;
    explanation_md: string | null;
  }>;
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let gradeId = url.searchParams.get('gradeId');
    const courseId = url.searchParams.get('courseId');
    const status = url.searchParams.get('status') || 'published';

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      return NextResponse.json({ data: null, error: { code: 'UNAVAILABLE', message: 'Database client unavailable' } }, { status: 503 });
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

    const isStaff = role === 'admin' || role === 'teacher';
    if (status !== 'published' && !isStaff) {
      return NextResponse.json({ data: null, error: { code: token ? 'FORBIDDEN' : 'UNAUTHORIZED', message: 'Faculty access required' } }, { status: token ? 403 : 401 });
    }
    if (role === 'teacher') {
      if (!teacherGradeId || (gradeId && gradeId !== 'all' && gradeId !== teacherGradeId)) {
        return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only access quizzes for their assigned grade.' } }, { status: 403 });
      }
      gradeId = teacherGradeId;
    }
    if (role === 'student') {
      if (!teacherGradeId || (gradeId && gradeId !== 'all' && gradeId !== teacherGradeId)) {
        return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Students may only access quizzes for their assigned grade.' } }, { status: 403 });
      }
      gradeId = teacherGradeId;
    }

    let query = supabaseAdmin
      .from('quizzes')
      .select(`
        *,
        questions:questions(*)
      `)
      .order('created_at', { ascending: false });

    if (gradeId && gradeId !== 'all') {
      query = query.eq('grade_id', gradeId);
    }
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: dbQuizzes, error } = await query;

    if (error) {
      return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
    }

    if (dbQuizzes) {
      const formatted = (dbQuizzes as unknown as QuizDatabaseRow[]).map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description || '',
        gradeId: q.grade_id,
        courseId: q.course_id || undefined,
        lessonId: q.lesson_id || undefined,
        subjectId: q.subject_id || undefined,
        passingScore: q.pass_percent || 60,
        totalMarks: Number(q.total_marks) || 100,
        durationMinutes: q.time_limit_seconds ? Math.round(q.time_limit_seconds / 60) : undefined,
        startDate: q.start_date || undefined,
        startTime: q.start_time || undefined,
        deadlineDate: q.deadline_date || undefined,
        deadlineTime: q.deadline_time || undefined,
        questions: [...(q.questions || [])].sort((a, b) => a.position - b.position).map((item) => {
          const baseQ: {
            id: string;
            question: string;
            options: string[];
            marks: number;
            correctAnswerIndex?: number;
            explanation?: string;
          } = {
            id: item.id,
            question: item.prompt_md,
            options: item.options || [],
            marks: Number(item.points) || 1,
          };
          if (isStaff) {
            baseQ.correctAnswerIndex = typeof item.correct === 'number' ? item.correct : 0;
            baseQ.explanation = item.explanation_md || '';
          }
          return baseQ;
        }),
      }));

      return NextResponse.json({ data: { quizzes: formatted }, error: null });
    }
    return NextResponse.json({ data: { quizzes: [] }, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching quizzes';
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

    // Role check
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, grade_id')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) {
      return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: profileError.message } }, { status: 500 });
    }

    const role = profile?.role;
    if (role !== 'admin' && role !== 'teacher') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Only faculty and administrators can author assessments' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = QuizSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid quiz payload' } },
        { status: 400 }
      );
    }

    const quizData = parseResult.data;

    // Enforce teacher grade restriction
    const teacherGrade = profile?.grade_id;
    if (role === 'teacher' && (!teacherGrade || quizData.gradeId !== teacherGrade)) {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only create assessments for their assigned grade.' } },
        { status: 403 }
      );
    }

    const quizId = quizData.id || `quiz-${Date.now()}`;
    const submittedQuestionIds = quizData.questions.map((question, index) => question.id || `${quizId}-q-${index + 1}`);
    const { data: matchedQuestions, error: matchedQuestionsError } = await supabaseAdmin
      .from('questions')
      .select('id, quiz_id')
      .in('id', submittedQuestionIds);
    if (matchedQuestionsError) {
      return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: matchedQuestionsError.message } }, { status: 500 });
    }
    if (matchedQuestions?.some((question) => question.quiz_id !== quizId)) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'A question belongs to a different quiz.' } }, { status: 403 });
    }

    if (quizData.id) {
      const { data: existingQuiz, error: existingQuizError } = await supabaseAdmin
        .from('quizzes')
        .select('grade_id')
        .eq('id', quizId)
        .maybeSingle();
      if (existingQuizError) {
        return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: existingQuizError.message } }, { status: 500 });
      }
      if (role === 'teacher' && existingQuiz && existingQuiz.grade_id !== teacherGrade) {
        return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only update quizzes for their assigned grade.' } }, { status: 403 });
      }
    }

    const { data: existingQuestions, error: existingQuestionsError } = await supabaseAdmin
      .from('questions')
      .select('id')
      .eq('quiz_id', quizId);
    if (existingQuestionsError) {
      return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: existingQuestionsError.message } }, { status: 500 });
    }

    // 1. Upsert Quiz
    const { error: qErr } = await supabaseAdmin
      .from('quizzes')
      .upsert({
        id: quizId,
        course_id: quizData.courseId || null,
        lesson_id: quizData.lessonId || null,
        grade_id: quizData.gradeId,
        subject_id: quizData.subjectId || null,
        title: quizData.title,
        description: quizData.description || '',
        pass_percent: quizData.passingScore,
        total_marks: quizData.totalMarks,
        time_limit_seconds: quizData.durationMinutes ? quizData.durationMinutes * 60 : null,
        start_date: quizData.startDate || null,
        start_time: quizData.startTime || null,
        deadline_date: quizData.deadlineDate || null,
        deadline_time: quizData.deadlineTime || null,
        status: 'published',
        created_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (qErr) {
      return NextResponse.json(
        { data: null, error: { code: 'DB_ERROR', message: qErr.message } },
        { status: 500 }
      );
    }

    // 2. Upsert Questions with AUTHORITATIVE Answer Key
    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      const questionId = q.id || `${quizId}-q-${i + 1}`;

      const { error: questionError } = await supabaseAdmin
        .from('questions')
        .upsert({
          id: questionId,
          quiz_id: quizId,
          type: 'single',
          prompt_md: q.question,
          options: q.options,
          correct: q.correctAnswerIndex,
          explanation_md: q.explanation || '',
          points: q.marks,
          position: i + 1,
        }, { onConflict: 'id' });
      if (questionError) {
        return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: questionError.message } }, { status: 500 });
      }
    }

    const removedQuestionIds = (existingQuestions || []).map((question) => question.id).filter((id) => !submittedQuestionIds.includes(id));
    if (removedQuestionIds.length) {
      const { error: removeQuestionsError } = await supabaseAdmin.from('questions').delete().in('id', removedQuestionIds);
      if (removeQuestionsError) {
        return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: removeQuestionsError.message } }, { status: 500 });
      }
    }

    return NextResponse.json({
      data: {
        success: true,
        quizId,
      },
      error: null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save quiz';
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
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Only faculty and administrators can delete quizzes' } }, { status: 403 });
    }

    const quizId = req.nextUrl.searchParams.get('id');
    if (!quizId) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Quiz ID is required' } }, { status: 400 });
    }
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('id, grade_id')
      .eq('id', quizId)
      .maybeSingle();
    if (quizError) {
      return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: quizError.message } }, { status: 500 });
    }
    if (!quiz) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Quiz not found' } }, { status: 404 });
    }
    if (profile.role === 'teacher' && (!profile.grade_id || quiz.grade_id !== profile.grade_id)) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only delete quizzes for their assigned grade.' } }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin.from('quizzes').delete().eq('id', quizId);
    if (deleteError) {
      return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: deleteError.message } }, { status: 500 });
    }
    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete quiz';
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}
