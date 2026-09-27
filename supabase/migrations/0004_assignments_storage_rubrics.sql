-- ============================================================================
-- 0004_assignments_storage_rubrics.sql: PHASE 3 ASSIGNMENTS, STORAGE & RUBRICS
-- ============================================================================

-- 1. RUBRICS TABLE
CREATE TABLE IF NOT EXISTS public.rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RUBRIC CRITERIA TABLE
CREATE TABLE IF NOT EXISTS public.rubric_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID NOT NULL REFERENCES public.rubrics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  max_points NUMERIC NOT NULL DEFAULT 10,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES public.lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  instructions_md TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  close_at TIMESTAMPTZ,
  points NUMERIC NOT NULL DEFAULT 100,
  late_penalty_percent_per_day NUMERIC NOT NULL DEFAULT 0,
  allowed_mime TEXT[] NOT NULL DEFAULT '{"application/pdf","image/png","image/jpeg","text/plain"}'::text[],
  max_file_mb INT NOT NULL DEFAULT 25,
  rubric_id UUID REFERENCES public.rubrics(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'returned', 'graded')),
  submitted_at TIMESTAMPTZ,
  attempt_no INT NOT NULL DEFAULT 1,
  text_body_md TEXT,
  score NUMERIC,
  feedback_md TEXT,
  is_late BOOLEAN NOT NULL DEFAULT false,
  late_penalty_applied NUMERIC NOT NULL DEFAULT 0,
  graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SUBMISSION FILES TABLE
CREATE TABLE IF NOT EXISTS public.submission_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. RUBRIC SCORES TABLE
CREATE TABLE IF NOT EXISTS public.rubric_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES public.rubric_criteria(id) ON DELETE CASCADE,
  points NUMERIC NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, criterion_id)
);

-- 7. GRADEBOOK TABLES
CREATE TABLE IF NOT EXISTS public.grade_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight_percent NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grade_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.grade_categories(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('quiz', 'assignment', 'manual')),
  source_id UUID,
  title TEXT NOT NULL,
  max_points NUMERIC NOT NULL DEFAULT 100,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grade_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_item_id UUID NOT NULL REFERENCES public.grade_items(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points NUMERIC NOT NULL,
  comment TEXT,
  entered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (grade_item_id, student_id)
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_assignments_course ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submission_files_submission ON public.submission_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_rubric_criteria_rubric ON public.rubric_criteria(rubric_id);
CREATE INDEX IF NOT EXISTS idx_rubric_scores_submission ON public.rubric_scores(submission_id);
CREATE INDEX IF NOT EXISTS idx_grade_items_course ON public.grade_items(course_id);
CREATE INDEX IF NOT EXISTS idx_grade_entries_student ON public.grade_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read_at);

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ASSIGNMENTS POLICIES:
DROP POLICY IF EXISTS "Assignments select" ON public.assignments;
CREATE POLICY "Assignments select" ON public.assignments FOR SELECT USING (
  public.is_admin() OR public.is_teacher() OR EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.id = course_id AND (c.grade_id = p.grade_id OR public.is_admin())
  )
);

DROP POLICY IF EXISTS "Assignments admin teacher manage" ON public.assignments;
CREATE POLICY "Assignments admin teacher manage" ON public.assignments FOR ALL USING (
  public.is_admin() OR public.is_teacher()
);

-- SUBMISSIONS POLICIES:
DROP POLICY IF EXISTS "Submissions student select own" ON public.submissions;
CREATE POLICY "Submissions student select own" ON public.submissions FOR SELECT USING (
  student_id = auth.uid() OR public.is_admin() OR public.is_teacher()
);

DROP POLICY IF EXISTS "Submissions student create own" ON public.submissions;
CREATE POLICY "Submissions student create own" ON public.submissions FOR INSERT WITH CHECK (
  student_id = auth.uid()
);

DROP POLICY IF EXISTS "Submissions student update draft" ON public.submissions;
CREATE POLICY "Submissions student update draft" ON public.submissions FOR UPDATE USING (
  (student_id = auth.uid() AND status = 'draft') OR public.is_admin() OR public.is_teacher()
);

-- SUBMISSION FILES POLICIES:
DROP POLICY IF EXISTS "Files select" ON public.submission_files;
CREATE POLICY "Files select" ON public.submission_files FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_id AND (s.student_id = auth.uid() OR public.is_admin() OR public.is_teacher())
  )
);

-- GRADE ENTRIES POLICIES:
DROP POLICY IF EXISTS "Grade entries select" ON public.grade_entries;
CREATE POLICY "Grade entries select" ON public.grade_entries FOR SELECT USING (
  student_id = auth.uid() OR public.is_admin() OR public.is_teacher()
);

-- NOTIFICATIONS POLICIES:
DROP POLICY IF EXISTS "Notifications select own" ON public.notifications;
CREATE POLICY "Notifications select own" ON public.notifications FOR SELECT USING (
  user_id = auth.uid()
);
