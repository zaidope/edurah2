-- ============================================================================
-- EDURAH COMPLETE FIX: MULTI-GRADE SCHEMA, PERMISSIONS & TEACHER ACCESS
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Ensure grades table exists (required for foreign key reference)
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

-- 2. Seed standard grades 1 through 10 if not present
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

-- 3. Add grade_id column to public.profiles if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'grade_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN grade_id TEXT REFERENCES public.grades(id) ON DELETE SET NULL;
  END IF;

  -- Ensure role check constraint includes 'teacher'
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'teacher', 'student'));
END $$;

-- 4. SYNCHRONIZE TRUE GRADE & ROLE FROM AUTH USER METADATA
-- This ensures Grade 6 teachers & Grade 6 students get their actual assigned grade
UPDATE public.profiles p
SET grade_id = u.raw_user_meta_data->>'grade_id'
FROM auth.users u
WHERE p.id = u.id
  AND u.raw_user_meta_data->>'grade_id' IS NOT NULL;

UPDATE public.profiles p
SET role = u.raw_user_meta_data->>'role'
FROM auth.users u
WHERE p.id = u.id
  AND u.raw_user_meta_data->>'role' IS NOT NULL
  AND u.raw_user_meta_data->>'role' IN ('admin', 'teacher', 'student');

-- Fallback for any records still missing grade_id: extract from class_group
UPDATE public.profiles
SET grade_id = class_group
WHERE grade_id IS NULL AND class_group LIKE 'grade-%';

-- 5. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_grade ON public.profiles(grade_id);

-- 6. SECURITY DEFINER FUNCTIONS (ALLOW TEACHERS TO ACCESS THEIR COHORT)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
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
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher' AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'teacher'
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
  -- First try profiles table
  SELECT grade_id INTO v_grade_id
  FROM public.profiles
  WHERE id = auth.uid() AND role = 'teacher' AND is_active = true;

  -- If not found in profiles, check auth metadata
  IF v_grade_id IS NULL THEN
    SELECT raw_user_meta_data->>'grade_id' INTO v_grade_id
    FROM auth.users
    WHERE id = auth.uid();
  END IF;

  RETURN v_grade_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_teacher_assigned_grade() TO authenticated, service_role;

-- 7. ENABLE ROW LEVEL SECURITY AND CONFIGURE POLICIES
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Grades read policy
DROP POLICY IF EXISTS "Grades read policy" ON public.grades;
CREATE POLICY "Grades read policy" ON public.grades FOR SELECT USING (true);

-- Profiles policies (TEACHERS CAN READ STUDENTS IN THEIR ASSIGNED GRADE)
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
CREATE POLICY "Profiles select policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR public.is_admin()
    OR (
      public.is_teacher()
      AND role = 'student'
      AND (
        grade_id = public.get_teacher_assigned_grade()
        OR class_group = public.get_teacher_assigned_grade()
      )
    )
  );

-- Lesson Progress policies
DROP POLICY IF EXISTS "Lesson progress select policy" ON public.lesson_progress;
CREATE POLICY "Lesson progress select policy" ON public.lesson_progress
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR (
      public.is_teacher()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = lesson_progress.user_id
          AND (
            p.grade_id = public.get_teacher_assigned_grade()
            OR p.class_group = public.get_teacher_assigned_grade()
          )
      )
    )
  );

-- Quiz Results policies
DROP POLICY IF EXISTS "Quiz results select policy" ON public.quiz_results;
CREATE POLICY "Quiz results select policy" ON public.quiz_results
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR (
      public.is_teacher()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = quiz_results.user_id
          AND (
            p.grade_id = public.get_teacher_assigned_grade()
            OR p.class_group = public.get_teacher_assigned_grade()
          )
      )
    )
  );

-- 8. REFRESH SCHEMA CACHE IMMEDIATELY
NOTIFY pgrst, 'reload schema';
