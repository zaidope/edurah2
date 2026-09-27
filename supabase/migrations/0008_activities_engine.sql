-- ============================================================================
-- 0008_activities_engine.sql: EDURAH EXTENSIBLE ACTIVITIES & PUZZLES ENGINE
-- SUBJECT-AGNOSTIC INTERACTIVE EDUCATIONAL ACTIVITIES WITH RLS
-- ============================================================================

-- 1. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'match_pairs',
    'drag_drop',
    'fill_blanks',
    'word_scramble',
    'arrange_order',
    'category_sort',
    'sequence'
  )),
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
  grade_id TEXT NOT NULL REFERENCES public.grades(id) ON DELETE RESTRICT,
  course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id TEXT REFERENCES public.lessons(id) ON DELETE SET NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points NUMERIC NOT NULL DEFAULT 100 CHECK (points >= 0),
  time_limit_seconds INT,
  hints JSONB DEFAULT '[]'::jsonb,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ACTIVITY ATTEMPTS TABLE (STUDENT RESULTS & DETAILED PERFORMANCE)
CREATE TABLE IF NOT EXISTS public.activity_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id TEXT NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL DEFAULT 1,
  score NUMERIC NOT NULL DEFAULT 0 CHECK (score >= 0),
  max_score NUMERIC NOT NULL DEFAULT 100 CHECK (max_score >= 0),
  percentage NUMERIC NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  completed BOOLEAN NOT NULL DEFAULT true,
  time_taken_seconds INT NOT NULL DEFAULT 0,
  hints_used INT NOT NULL DEFAULT 0,
  student_answers JSONB DEFAULT '{}'::jsonb,
  evaluation_details JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES FOR HIGH-THROUGHPUT RETRIEVAL & FILTERING
CREATE INDEX IF NOT EXISTS idx_activities_grade_status ON public.activities(grade_id, status);
CREATE INDEX IF NOT EXISTS idx_activities_subject ON public.activities(subject_id);
CREATE INDEX IF NOT EXISTS idx_activities_course ON public.activities(course_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_student ON public.activity_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_activity ON public.activity_attempts(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_completed_at ON public.activity_attempts(completed_at);

-- 4. AUTOMATIC TIMESTAMP TRIGGER ON ACTIVITIES
DROP TRIGGER IF EXISTS set_activities_updated_at ON public.activities;
CREATE TRIGGER set_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_attempts ENABLE ROW LEVEL SECURITY;

-- ACTIVITIES POLICIES
DROP POLICY IF EXISTS "Activities read policy" ON public.activities;
CREATE POLICY "Activities read policy" ON public.activities FOR SELECT USING (
  public.is_admin()
  OR (public.is_teacher() AND grade_id = public.get_teacher_assigned_grade())
  OR (status = 'published' AND (
      auth.role() = 'anon'
      OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
      OR grade_id = (SELECT grade_id FROM public.profiles WHERE id = auth.uid())
  ))
);

DROP POLICY IF EXISTS "Activities admin manage" ON public.activities;
CREATE POLICY "Activities admin manage" ON public.activities FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Activities teacher manage" ON public.activities;
CREATE POLICY "Activities teacher manage" ON public.activities FOR ALL USING (
  public.is_teacher() AND grade_id = public.get_teacher_assigned_grade()
);

-- ACTIVITY ATTEMPTS POLICIES
DROP POLICY IF EXISTS "Activity attempts select policy" ON public.activity_attempts;
CREATE POLICY "Activity attempts select policy" ON public.activity_attempts FOR SELECT USING (
  auth.uid() = student_id
  OR public.is_admin()
  OR (
    public.is_teacher()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = activity_attempts.student_id
        AND p.grade_id = public.get_teacher_assigned_grade()
    )
  )
);

DROP POLICY IF EXISTS "Activity attempts insert policy" ON public.activity_attempts;
CREATE POLICY "Activity attempts insert policy" ON public.activity_attempts FOR INSERT WITH CHECK (
  auth.uid() = student_id OR public.is_admin()
);

DROP POLICY IF EXISTS "Activity attempts admin delete policy" ON public.activity_attempts;
CREATE POLICY "Activity attempts admin delete policy" ON public.activity_attempts FOR DELETE USING (
  public.is_admin()
);

-- REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
