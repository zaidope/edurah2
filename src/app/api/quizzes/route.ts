import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { INITIAL_QUIZZES } from '@/content/quizzes';

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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const gradeId = url.searchParams.get('gradeId');
    const courseId = url.searchParams.get('courseId');

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      let filtered = INITIAL_QUIZZES;
      if (gradeId) filtered = filtered.filter(q => q.gradeId === gradeId);
      if (courseId) filtered = filtered.filter(q => q.courseId === courseId);
      return NextResponse.json({ data: { quizzes: filtered }, error: null });
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    let isStaff = false;

    if (token && supabaseAdmin) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          const { data: prof } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          const role = prof?.role || user.user_metadata?.role;
          if (role === 'admin' || role === 'teacher') {
            isStaff = true;
          }
        }
      } catch {
        // Leave isStaff false
      }
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

    const { data: dbQuizzes, error } = await query;

    if (!error && dbQuizzes && dbQuizzes.length > 0) {
      const formatted = dbQuizzes.map((q: any) => ({
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
        questions: (q.questions || []).sort((a: any, b: any) => a.position - b.position).map((item: any) => {
          const baseQ: any = {
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

    let filtered = INITIAL_QUIZZES;
    if (gradeId && gradeId !== 'all') filtered = filtered.filter(q => q.gradeId === gradeId);
    if (courseId) filtered = filtered.filter(q => q.courseId === courseId);

    if (!isStaff) {
      filtered = filtered.map(q => ({
        ...q,
        questions: q.questions.map((item: any) => ({
          id: item.id,
          question: item.question,
          options: item.options || [],
          marks: Number(item.marks) || 1,
        })) as any,
      }));
    }

    return NextResponse.json({ data: { quizzes: filtered }, error: null });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Error fetching quizzes' } },
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
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, grade_id')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;
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
    const teacherGrade = profile?.grade_id || user.user_metadata?.grade_id;
    if (role === 'teacher' && teacherGrade && quizData.gradeId !== teacherGrade) {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Teachers may only create assessments for their assigned grade.' } },
        { status: 403 }
      );
    }

    const quizId = quizData.id || `quiz-${Date.now()}`;

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

      await supabaseAdmin
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
    }

    return NextResponse.json({
      data: {
        success: true,
        quizId,
      },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to save quiz' } },
      { status: 500 }
    );
  }
}
