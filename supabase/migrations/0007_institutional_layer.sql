-- ============================================================================
-- 0007_institutional_layer.sql
-- EDURAH LMS: Sections & Cohorts, Attendance, Guardian Links, Live Classes,
-- Prerequisite Validation & Immutable Audit Ledger
-- ============================================================================

-- 0. ALLOW GUARDIAN ROLE IN PROFILES
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'teacher', 'student', 'guardian'));

-- 1. SECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.sections (
  id TEXT PRIMARY KEY DEFAULT ('sec-' || substr(gen_random_uuid()::text, 1, 8)),
  grade_id TEXT NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ENROLLMENTS TABLE (Unique per student per course, linked to section)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id TEXT PRIMARY KEY DEFAULT ('enr-' || substr(gen_random_uuid()::text, 1, 8)),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  section_id TEXT REFERENCES public.sections(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_student_course UNIQUE (student_id, course_id)
);

-- 3. ATTENDANCE TABLE (Daily roll call, unique per section, student, date)
CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY DEFAULT ('att-' || substr(gen_random_uuid()::text, 1, 8)),
  section_id TEXT NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'tardy', 'excused')),
  marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_section_student_date UNIQUE (section_id, student_id, date)
);

-- 4. GUARDIAN LINKS TABLE
CREATE TABLE IF NOT EXISTS public.guardian_links (
  id TEXT PRIMARY KEY DEFAULT ('grd-' || substr(gen_random_uuid()::text, 1, 8)),
  guardian_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  invite_code TEXT UNIQUE,
  relationship TEXT DEFAULT 'parent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_guardian_student UNIQUE (guardian_id, student_id)
);

-- 5. LIVE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id TEXT PRIMARY KEY DEFAULT ('live-' || substr(gen_random_uuid()::text, 1, 8)),
  course_id TEXT NOT NULL,
  section_id TEXT REFERENCES public.sections(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google_meet' CHECK (provider IN ('google_meet', 'zoom', 'teams')),
  meeting_url TEXT NOT NULL,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  host_teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PREREQUISITE LESSON COLUMN
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS prerequisite_lesson_id TEXT REFERENCES public.lessons(id) ON DELETE SET NULL;

-- 7. IMMUTABLE AUDIT LOGS: REVOKE UPDATE AND DELETE
REVOKE UPDATE, DELETE ON public.audit_logs FROM public, authenticated, anon;

-- 8. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_sections_grade ON public.sections(grade_id);
CREATE INDEX IF NOT EXISTS idx_sections_teacher ON public.sections(class_teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_section ON public.enrollments(section_id);
CREATE INDEX IF NOT EXISTS idx_attendance_section_date ON public.attendance(section_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_guardian_links_guardian ON public.guardian_links(guardian_id);
CREATE INDEX IF NOT EXISTS idx_guardian_links_student ON public.guardian_links(student_id);
CREATE INDEX IF NOT EXISTS idx_guardian_links_code ON public.guardian_links(invite_code);
CREATE INDEX IF NOT EXISTS idx_live_sessions_course ON public.live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_schedule ON public.live_sessions(scheduled_start, scheduled_end);

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- SECTIONS POLICIES
DROP POLICY IF EXISTS "Sections viewable by authenticated" ON public.sections;
CREATE POLICY "Sections viewable by authenticated" ON public.sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Sections manage by admin or teacher" ON public.sections;
CREATE POLICY "Sections manage by admin or teacher" ON public.sections FOR ALL USING (
  public.is_admin() OR public.is_teacher()
);

-- ENROLLMENTS POLICIES
DROP POLICY IF EXISTS "Enrollments view own or staff" ON public.enrollments;
CREATE POLICY "Enrollments view own or staff" ON public.enrollments FOR SELECT USING (
  student_id = auth.uid() OR public.is_admin() OR public.is_teacher()
);

DROP POLICY IF EXISTS "Enrollments manage by staff" ON public.enrollments;
CREATE POLICY "Enrollments manage by staff" ON public.enrollments FOR ALL USING (
  public.is_admin() OR public.is_teacher()
);

-- ATTENDANCE POLICIES
DROP POLICY IF EXISTS "Attendance view own or staff" ON public.attendance;
CREATE POLICY "Attendance view own or staff" ON public.attendance FOR SELECT USING (
  student_id = auth.uid() OR
  public.is_admin() OR
  public.is_teacher() OR
  EXISTS (
    SELECT 1 FROM public.guardian_links
    WHERE guardian_id = auth.uid() AND student_id = public.attendance.student_id AND status = 'active'
  )
);

DROP POLICY IF EXISTS "Attendance insert by teacher or admin" ON public.attendance;
CREATE POLICY "Attendance insert by teacher or admin" ON public.attendance FOR INSERT WITH CHECK (
  public.is_admin() OR public.is_teacher()
);

DROP POLICY IF EXISTS "Attendance update by admin or teacher within 48h" ON public.attendance;
CREATE POLICY "Attendance update by admin or teacher within 48h" ON public.attendance FOR UPDATE USING (
  public.is_admin() OR (public.is_teacher() AND date >= CURRENT_DATE - INTERVAL '2 days')
);

-- GUARDIAN LINKS POLICIES
DROP POLICY IF EXISTS "Guardian links view linked or admin" ON public.guardian_links;
CREATE POLICY "Guardian links view linked or admin" ON public.guardian_links FOR SELECT USING (
  guardian_id = auth.uid() OR student_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "Guardian links insert by guardian" ON public.guardian_links;
CREATE POLICY "Guardian links insert by guardian" ON public.guardian_links FOR INSERT WITH CHECK (
  guardian_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "Guardian links update by student or admin" ON public.guardian_links;
CREATE POLICY "Guardian links update by student or admin" ON public.guardian_links FOR UPDATE USING (
  student_id = auth.uid() OR public.is_admin()
);

-- LIVE SESSIONS POLICIES
DROP POLICY IF EXISTS "Live sessions select by enrolled or staff" ON public.live_sessions;
CREATE POLICY "Live sessions select by enrolled or staff" ON public.live_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Live sessions manage by teacher or admin" ON public.live_sessions;
CREATE POLICY "Live sessions manage by teacher or admin" ON public.live_sessions FOR ALL USING (
  public.is_admin() OR public.is_teacher()
);
