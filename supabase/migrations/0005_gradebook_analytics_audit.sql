-- ============================================================================
-- 0005_gradebook_analytics_audit.sql
-- EDURAH LMS: Weighted Gradebook, Grade Scales, Audit Logs & Outcome Topics
-- ============================================================================

-- 1. INSTITUTIONAL GRADE SCALES TABLE
CREATE TABLE IF NOT EXISTS public.grade_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_percentage NUMERIC NOT NULL,
  max_percentage NUMERIC NOT NULL,
  letter_grade TEXT NOT NULL,
  gpa_points NUMERIC NOT NULL DEFAULT 0.0,
  is_passing BOOLEAN NOT NULL DEFAULT true,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default institutional standard grade scale (if empty)
INSERT INTO public.grade_scales (name, min_percentage, max_percentage, letter_grade, gpa_points, is_passing, position)
SELECT * FROM (VALUES
  ('Standard High Honor', 97.0, 100.0, 'A+', 4.0, true, 1),
  ('Standard Excellent', 93.0, 96.99, 'A', 4.0, true, 2),
  ('Standard Near Honors', 90.0, 92.99, 'A-', 3.7, true, 3),
  ('Standard Very Good', 87.0, 89.99, 'B+', 3.3, true, 4),
  ('Standard Good', 83.0, 86.99, 'B', 3.0, true, 5),
  ('Standard Above Average', 80.0, 82.99, 'B-', 2.7, true, 6),
  ('Standard Competent', 77.0, 79.99, 'C+', 2.3, true, 7),
  ('Standard Average', 73.0, 76.99, 'C', 2.0, true, 8),
  ('Standard Below Average', 70.0, 72.99, 'C-', 1.7, true, 9),
  ('Standard Passing Minimum', 60.0, 69.99, 'D', 1.0, true, 10),
  ('Standard Failing', 0.0, 59.99, 'F', 0.0, false, 11)
) AS v(name, min_percentage, max_percentage, letter_grade, gpa_points, is_passing, position)
WHERE NOT EXISTS (SELECT 1 FROM public.grade_scales LIMIT 1);

-- 2. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before JSONB,
  after JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. GRADE ENTRIES COLUMNS (status, is_excused, is_missing)
ALTER TABLE public.grade_entries ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'graded';
ALTER TABLE public.grade_entries ADD COLUMN IF NOT EXISTS is_excused BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.grade_entries ADD COLUMN IF NOT EXISTS is_missing BOOLEAN NOT NULL DEFAULT false;

-- 4. TOPIC TAGGING ON LESSONS & QUESTIONS
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS topic TEXT;

-- Recreate questions_public view to include topic
CREATE OR REPLACE VIEW public.questions_public AS
SELECT
  id,
  quiz_id,
  type,
  prompt_md,
  options,
  points,
  position,
  topic,
  created_at
FROM public.questions;

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON public.audit_logs(actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_grade_scales_min_max ON public.grade_scales(min_percentage, max_percentage);
CREATE INDEX IF NOT EXISTS idx_lessons_topic ON public.lessons(topic);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.grade_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- GRADE SCALES POLICIES
DROP POLICY IF EXISTS "Grade scales select all" ON public.grade_scales;
CREATE POLICY "Grade scales select all" ON public.grade_scales FOR SELECT USING (true);

DROP POLICY IF EXISTS "Grade scales admin manage" ON public.grade_scales;
CREATE POLICY "Grade scales admin manage" ON public.grade_scales FOR ALL USING (public.is_admin());

-- AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Audit logs admin view" ON public.audit_logs;
CREATE POLICY "Audit logs admin view" ON public.audit_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Audit logs insert" ON public.audit_logs;
CREATE POLICY "Audit logs insert" ON public.audit_logs FOR INSERT WITH CHECK (
  actor_id = auth.uid() OR public.is_admin() OR public.is_teacher()
);
