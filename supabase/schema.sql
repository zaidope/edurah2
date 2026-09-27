-- ============================================================================
-- EDURAH SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- MULTI-GRADE ARCHITECTURE WITH ROLE-BASED ACCESS CONTROL (ADMIN, TEACHER, STUDENT)
-- ============================================================================

-- 1. GRADES TABLE
CREATE TABLE IF NOT EXISTS public.grades (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('junior', 'middle', 'senior')),
  order_index INT NOT NULL,
  age_range TEXT,
  description TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed standard grades 1 through 10
INSERT INTO public.grades (id, name, tier, order_index, age_range, description, color) VALUES
  ('grade-1', 'Grade 1', 'junior', 1, 'Ages 6–7', 'Foundational literacy, primary arithmetic, and world curiosity.', '#38bdf8'),
  ('grade-2', 'Grade 2', 'junior', 2, 'Ages 7–8', 'Addition, subtraction, reading comprehension, and natural sciences.', '#34d399'),
  ('grade-3', 'Grade 3', 'junior', 3, 'Ages 8–9', 'Multiplication basics, reading fluency, and introductory earth science.', '#fbbf24'),
  ('grade-4', 'Grade 4', 'junior', 4, 'Ages 9–10', 'Fractions, creative writing, regional geography, and ecosystems.', '#f87171'),
  ('grade-5', 'Grade 5', 'middle', 5, 'Ages 10–11', 'Pre-algebraic thinking, literary analysis, and physical sciences.', '#818cf8'),
  ('grade-6', 'Grade 6', 'middle', 6, 'Ages 11–12', 'Ratios & proportions, earth systems, and introductory logic.', '#6366f1'),
  ('grade-7', 'Grade 7', 'middle', 7, 'Ages 12–13', 'Linear equations, cellular biology, and structured debate.', '#06b6d4'),
  ('grade-8', 'Grade 8', 'middle', 8, 'Ages 13–14', 'Algebra fundamentals, chemical reactions, and intro Python.', '#0d9488'),
  ('grade-9', 'Grade 9', 'senior', 9, 'Ages 14–15', 'Coordinate geometry, classical mechanics, and algorithmic thinking.', '#475569'),
  ('grade-10', 'Grade 10', 'senior', 10, 'Ages 15–16', 'Trigonometry, advanced physics, chemistry, and academic rigor.', '#1e293b')
ON CONFLICT (id) DO NOTHING;

-- 2. PROFILES TABLE (Tied to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  student_id TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
  grade_id TEXT REFERENCES public.grades(id) ON DELETE SET NULL,
  academic_batch TEXT DEFAULT '2025–2026',
  class_group TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration safety for existing tables without grade_id or teacher role or academic_batch
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'grade_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN grade_id TEXT REFERENCES public.grades(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'academic_batch'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN academic_batch TEXT DEFAULT '2025–2026';
  END IF;

  -- Ensure role check allows teacher
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'teacher', 'student'));
END $$;

-- 3. LESSON PROGRESS TABLE (ACCURATE WATCH & PLAYBACK TRACKING)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_position_seconds NUMERIC NOT NULL DEFAULT 0,
  duration_seconds NUMERIC NOT NULL DEFAULT 0,
  watch_percentage NUMERIC NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

-- 4. QUIZ RESULTS TABLE (EXACT MARKS & QUESTION-LEVEL RESULTS)
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  quiz_name TEXT,
  course_id TEXT,
  score INT NOT NULL CHECK (score >= 0),
  max_score INT NOT NULL DEFAULT 100,
  total_questions INT NOT NULL CHECK (total_questions > 0),
  percentage INT NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB DEFAULT '{}'::jsonb,
  question_results JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  time_taken_seconds INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  incorrect_answers INT DEFAULT 0,
  unanswered INT DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. QUIZ RETAKE PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_retake_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  allowed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ,
  UNIQUE (user_id, quiz_id)
);

-- 5. INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_grade ON public.profiles(grade_id);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON public.lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz ON public.quiz_results(quiz_id);

-- 6. SECURITY DEFINER HELPER FUNCTIONS (PREVENT RLS RECURSION)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'teacher'
      AND is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_teacher_assigned_grade()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_grade_id TEXT;
BEGIN
  SELECT grade_id INTO v_grade_id
  FROM public.profiles
  WHERE id = auth.uid()
    AND role = 'teacher'
    AND is_active = true;
  RETURN v_grade_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_teacher() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_teacher_assigned_grade() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_teacher_assigned_grade() TO authenticated, service_role;

-- 7. AUTOMATIC TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_lesson_progress_updated_at ON public.lesson_progress;
CREATE TRIGGER set_lesson_progress_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies
DROP POLICY IF EXISTS "Grades read policy" ON public.grades;
DROP POLICY IF EXISTS "Grades admin modify policy" ON public.grades;

DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;

DROP POLICY IF EXISTS "Lesson progress select policy" ON public.lesson_progress;
DROP POLICY IF EXISTS "Lesson progress insert policy" ON public.lesson_progress;
DROP POLICY IF EXISTS "Lesson progress update policy" ON public.lesson_progress;
DROP POLICY IF EXISTS "Lesson progress delete policy" ON public.lesson_progress;

DROP POLICY IF EXISTS "Quiz results select policy" ON public.quiz_results;
DROP POLICY IF EXISTS "Quiz results insert policy" ON public.quiz_results;
DROP POLICY IF EXISTS "Quiz results update policy" ON public.quiz_results;
DROP POLICY IF EXISTS "Quiz results delete policy" ON public.quiz_results;

-- ----------------------------------------------------------------------------
-- GRADES POLICIES
-- ----------------------------------------------------------------------------
-- Everyone authenticated can read the grades list
CREATE POLICY "Grades read policy" ON public.grades
  FOR SELECT USING (true);

CREATE POLICY "Grades admin modify policy" ON public.grades
  FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------------------
-- SELECT:
-- 1. Students read own profile
-- 2. Teachers read profiles in their assigned grade
-- 3. Admins read all profiles
CREATE POLICY "Profiles select policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR public.is_admin()
    OR (
      public.is_teacher()
      AND grade_id = public.get_teacher_assigned_grade()
      AND role = 'student'
    )
  );

-- INSERT: Admins (or service role) provision accounts
CREATE POLICY "Profiles insert policy" ON public.profiles
  FOR INSERT WITH CHECK (
    public.is_admin()
  );

-- UPDATE:
-- Admins can update any profile
-- Users can update non-sensitive info on their own profile
CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.is_admin()
  )
  WITH CHECK (
    public.is_admin() OR (auth.uid() = id)
  );

-- DELETE: Only Admins can delete profiles
CREATE POLICY "Profiles delete policy" ON public.profiles
  FOR DELETE USING (
    public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- LESSON PROGRESS POLICIES
-- ----------------------------------------------------------------------------
-- SELECT:
-- 1. Student reads own progress
-- 2. Admin reads all progress
-- 3. Teacher reads progress for students enrolled in their assigned grade
CREATE POLICY "Lesson progress select policy" ON public.lesson_progress
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR (
      public.is_teacher()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = lesson_progress.user_id
          AND p.grade_id = public.get_teacher_assigned_grade()
      )
    )
  );

CREATE POLICY "Lesson progress insert policy" ON public.lesson_progress
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_admin()
  );

CREATE POLICY "Lesson progress update policy" ON public.lesson_progress
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id OR public.is_admin()
  );

CREATE POLICY "Lesson progress delete policy" ON public.lesson_progress
  FOR DELETE USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- QUIZ RESULTS POLICIES
-- ----------------------------------------------------------------------------
-- SELECT:
-- 1. Student reads own results
-- 2. Admin reads all results
-- 3. Teacher reads results for students in their assigned grade
CREATE POLICY "Quiz results select policy" ON public.quiz_results
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR (
      public.is_teacher()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = quiz_results.user_id
          AND p.grade_id = public.get_teacher_assigned_grade()
      )
    )
  );

CREATE POLICY "Quiz results insert policy" ON public.quiz_results
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_admin()
  );

CREATE POLICY "Quiz results update policy" ON public.quiz_results
  FOR UPDATE USING (
    public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
  );

CREATE POLICY "Quiz results delete policy" ON public.quiz_results
  FOR DELETE USING (
    public.is_admin()
  );

-- 11. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

