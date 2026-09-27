-- ============================================================================
-- EDURAH LMS FEATURE & UX SCHEMA MIGRATION
-- Run this in Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. ACADEMIC BATCH ON PROFILES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'academic_batch'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN academic_batch TEXT DEFAULT '2025–2026';
  END IF;
END $$;

UPDATE public.profiles
SET academic_batch = '2025–2026'
WHERE academic_batch IS NULL;

-- 2. EXTEND LESSON PROGRESS FOR ACCURATE VIDEO TRACKING & RESUME POSITION
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lesson_progress' AND column_name = 'last_position_seconds'
  ) THEN
    ALTER TABLE public.lesson_progress
      ADD COLUMN started_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN last_position_seconds NUMERIC DEFAULT 0,
      ADD COLUMN duration_seconds NUMERIC DEFAULT 0,
      ADD COLUMN watch_percentage NUMERIC DEFAULT 0,
      ADD COLUMN last_accessed_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 3. EXTEND QUIZ RESULTS FOR EXACT MARKS & QUESTION-LEVEL RESULTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quiz_results' AND column_name = 'question_results'
  ) THEN
    ALTER TABLE public.quiz_results
      ADD COLUMN quiz_name TEXT,
      ADD COLUMN course_id TEXT,
      ADD COLUMN max_score INT DEFAULT 100,
      ADD COLUMN started_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN time_taken_seconds INT DEFAULT 0,
      ADD COLUMN correct_answers INT DEFAULT 0,
      ADD COLUMN incorrect_answers INT DEFAULT 0,
      ADD COLUMN unanswered INT DEFAULT 0,
      ADD COLUMN question_results JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 4. ASSESSMENT RETAKE PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_retake_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  allowed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ,
  UNIQUE (user_id, quiz_id)
);

-- 5. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_batch ON public.profiles(academic_batch);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lookup ON public.lesson_progress(user_id, course_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_quiz ON public.quiz_results(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_retakes_lookup ON public.quiz_retake_permissions(user_id, quiz_id);

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.quiz_retake_permissions ENABLE ROW LEVEL SECURITY;

-- Retake permissions policies
DROP POLICY IF EXISTS "Quiz retakes select policy" ON public.quiz_retake_permissions;
CREATE POLICY "Quiz retakes select policy" ON public.quiz_retake_permissions
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR public.is_teacher()
  );

DROP POLICY IF EXISTS "Quiz retakes modify policy" ON public.quiz_retake_permissions;
CREATE POLICY "Quiz retakes modify policy" ON public.quiz_retake_permissions
  FOR ALL USING (
    public.is_admin() OR public.is_teacher()
  );

-- 7. REFRESH SCHEMA CACHE IMMEDIATELY
NOTIFY pgrst, 'reload schema';
