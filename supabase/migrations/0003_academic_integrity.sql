-- ============================================================================
-- 0003_academic_integrity.sql: PHASE 2 ACADEMIC INTEGRITY HARDENING
-- QUIZ ATTEMPTS, SERVER-SIDE GRADING, & CUMULATIVE WATCH TRACKING
-- ============================================================================

-- 1. QUIZ ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_no INT NOT NULL DEFAULT 1,
  served_question_ids TEXT[] NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  score NUMERIC,
  max_score NUMERIC,
  percentage INT,
  passed BOOLEAN,
  integrity_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. QUIZ ANSWERS TABLE (AUTHORITATIVE PER-QUESTION EVALUATIONS)
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  response JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points_awarded NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. LESSON WATCH INTERVALS TABLE (PHYSICALLY VERIFIED WATCH TRACKING)
CREATE TABLE IF NOT EXISTS public.lesson_watch_intervals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  intervals JSONB NOT NULL DEFAULT '[]'::jsonb, -- [[start, end], [start, end]]
  unique_seconds INT NOT NULL DEFAULT 0,
  duration_seconds INT NOT NULL DEFAULT 0,
  watch_percentage NUMERIC NOT NULL DEFAULT 0,
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (lesson_id, student_id)
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON public.quiz_attempts(student_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON public.quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_lesson_watch_intervals_user ON public.lesson_watch_intervals(student_id, lesson_id);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_watch_intervals ENABLE ROW LEVEL SECURITY;

-- QUIZ ATTEMPTS POLICIES:
-- Students can only select their own attempts
DROP POLICY IF EXISTS "Attempts student select" ON public.quiz_attempts;
CREATE POLICY "Attempts student select" ON public.quiz_attempts FOR SELECT USING (
  student_id = auth.uid()
  OR public.is_admin()
  OR (public.is_teacher() AND EXISTS (
    SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.grade_id = public.get_teacher_assigned_grade()
  ))
);

DROP POLICY IF EXISTS "Attempts admin teacher manage" ON public.quiz_attempts;
CREATE POLICY "Attempts admin teacher manage" ON public.quiz_attempts FOR ALL USING (
  public.is_admin() OR public.is_teacher()
);

-- QUIZ ANSWERS POLICIES:
DROP POLICY IF EXISTS "Answers student select own" ON public.quiz_answers;
CREATE POLICY "Answers student select own" ON public.quiz_answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts a
    WHERE a.id = attempt_id AND a.student_id = auth.uid() AND a.submitted_at IS NOT NULL
  )
  OR public.is_admin()
  OR (public.is_teacher() AND EXISTS (
    SELECT 1 FROM public.quiz_attempts a
    JOIN public.quizzes q ON q.id = a.quiz_id
    WHERE a.id = attempt_id AND q.grade_id = public.get_teacher_assigned_grade()
  ))
);

DROP POLICY IF EXISTS "Answers admin manage" ON public.quiz_answers;
CREATE POLICY "Answers admin manage" ON public.quiz_answers FOR ALL USING (public.is_admin() OR public.is_teacher());

-- LESSON WATCH INTERVALS POLICIES:
DROP POLICY IF EXISTS "Watch intervals select" ON public.lesson_watch_intervals;
CREATE POLICY "Watch intervals select" ON public.lesson_watch_intervals FOR SELECT USING (
  student_id = auth.uid() OR public.is_admin() OR public.is_teacher()
);

DROP POLICY IF EXISTS "Watch intervals admin teacher manage" ON public.lesson_watch_intervals;
CREATE POLICY "Watch intervals admin teacher manage" ON public.lesson_watch_intervals FOR ALL USING (
  public.is_admin() OR public.is_teacher()
);
