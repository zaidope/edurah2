-- ============================================================================
-- EDURAH SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- 1. PROFILES TABLE (Tied to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  student_id TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  class_group TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. LESSON PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

-- 3. QUIZ RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 0),
  total_questions INT NOT NULL CHECK (total_questions > 0),
  percentage INT NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON public.lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz ON public.quiz_results(quiz_id);

-- 5. SECURITY DEFINER HELPER FUNCTION (PREVENTS RLS RECURSION)
-- Checks whether auth.uid() is an admin without triggering RLS recursion on public.profiles
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

-- Restrict execution permission
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 6. AUTOMATIC TIMESTAMP TRIGGER
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

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if re-applying
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;

DROP POLICY IF EXISTS "Users can read own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can insert/update own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Admins can view all lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Lesson progress select policy" ON public.lesson_progress;
DROP POLICY IF EXISTS "Lesson progress insert policy" ON public.lesson_progress;
DROP POLICY IF EXISTS "Lesson progress update policy" ON public.lesson_progress;
DROP POLICY IF EXISTS "Lesson progress delete policy" ON public.lesson_progress;

DROP POLICY IF EXISTS "Users can read own quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can insert own quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Admins can view all quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Quiz results select policy" ON public.quiz_results;
DROP POLICY IF EXISTS "Quiz results insert policy" ON public.quiz_results;
DROP POLICY IF EXISTS "Quiz results update policy" ON public.quiz_results;
DROP POLICY IF EXISTS "Quiz results delete policy" ON public.quiz_results;

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES:
-- ----------------------------------------------------------------------------
-- SELECT: Students read own profile; Admins read all profiles.
CREATE POLICY "Profiles select policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
  );

-- INSERT: Only Admins (or service role) can create profiles during student provisioning.
CREATE POLICY "Profiles insert policy" ON public.profiles
  FOR INSERT WITH CHECK (
    public.is_admin()
  );

-- UPDATE: Admins can update any profile; Students can update own non-sensitive profile fields.
CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.is_admin()
  )
  WITH CHECK (
    public.is_admin() OR (
      auth.uid() = id AND role = 'student'
    )
  );

-- DELETE: Only Admins can delete student profiles.
CREATE POLICY "Profiles delete policy" ON public.profiles
  FOR DELETE USING (
    public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- LESSON PROGRESS POLICIES:
-- ----------------------------------------------------------------------------
-- SELECT: Students read own lesson progress; Admins view all student progress.
CREATE POLICY "Lesson progress select policy" ON public.lesson_progress
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- INSERT: Students record own lesson progress; Admins can record.
CREATE POLICY "Lesson progress insert policy" ON public.lesson_progress
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_admin()
  );

-- UPDATE: Students update own lesson progress; Admins can update.
CREATE POLICY "Lesson progress update policy" ON public.lesson_progress
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id OR public.is_admin()
  );

-- DELETE: Students delete own lesson progress; Admins can delete.
CREATE POLICY "Lesson progress delete policy" ON public.lesson_progress
  FOR DELETE USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- QUIZ RESULTS POLICIES:
-- ----------------------------------------------------------------------------
-- SELECT: Students read own quiz results; Admins view all student quiz results.
CREATE POLICY "Quiz results select policy" ON public.quiz_results
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- INSERT: Students insert own completed quiz results; Admins can insert.
CREATE POLICY "Quiz results insert policy" ON public.quiz_results
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_admin()
  );

-- UPDATE: Only Admins can modify quiz results (student scores are immutable for students).
CREATE POLICY "Quiz results update policy" ON public.quiz_results
  FOR UPDATE USING (
    public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
  );

-- DELETE: Only Admins can delete quiz results.
CREATE POLICY "Quiz results delete policy" ON public.quiz_results
  FOR DELETE USING (
    public.is_admin()
  );
