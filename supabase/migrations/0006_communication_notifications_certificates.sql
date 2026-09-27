-- ============================================================================
-- 0006_communication_notifications_certificates.sql
-- EDURAH LMS: Notifications, Discussions, Announcements & PDF Certificates
-- ============================================================================

-- 1. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'instant' CHECK (channel IN ('instant', 'daily_digest', 'off')),
  email_opt_out BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event_type)
);

-- 2. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('institution', 'course', 'grade')),
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  grade_id TEXT REFERENCES public.grades(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  publish_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DISCUSSION THREADS TABLE
CREATE TABLE IF NOT EXISTS public.discussion_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  locked BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DISCUSSION POSTS TABLE
CREATE TABLE IF NOT EXISTS public.discussion_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  parent_post_id UUID REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body_md TEXT NOT NULL,
  is_instructor_answer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- 5. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  serial TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pdf_storage_path TEXT NOT NULL,
  verification_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, course_id)
);

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_scope ON public.announcements(scope, publish_at);
CREATE INDEX IF NOT EXISTS idx_announcements_course ON public.announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_grade ON public.announcements(grade_id);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_course ON public.discussion_threads(course_id);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_lesson ON public.discussion_threads(lesson_id);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_thread ON public.discussion_posts(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_author ON public.discussion_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student_course ON public.certificates(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_token ON public.certificates(verification_token);

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- NOTIFICATION PREFERENCES POLICIES
DROP POLICY IF EXISTS "Prefs select own" ON public.notification_preferences;
CREATE POLICY "Prefs select own" ON public.notification_preferences FOR SELECT USING (
  user_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "Prefs update own" ON public.notification_preferences;
CREATE POLICY "Prefs update own" ON public.notification_preferences FOR ALL USING (
  user_id = auth.uid() OR public.is_admin()
);

-- ANNOUNCEMENTS POLICIES
DROP POLICY IF EXISTS "Announcements select accessible" ON public.announcements;
CREATE POLICY "Announcements select accessible" ON public.announcements FOR SELECT USING (
  public.is_admin() OR public.is_teacher() OR (
    publish_at <= NOW() AND (
      scope = 'institution' OR
      (scope = 'grade' AND EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.grade_id = grade_id
      )) OR
      (scope = 'course' AND EXISTS (
        SELECT 1 FROM public.courses c
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE c.id = course_id AND c.grade_id = p.grade_id
      ))
    )
  )
);

DROP POLICY IF EXISTS "Announcements staff manage" ON public.announcements;
CREATE POLICY "Announcements staff manage" ON public.announcements FOR ALL USING (
  public.is_admin() OR public.is_teacher()
);

-- DISCUSSION THREADS POLICIES
DROP POLICY IF EXISTS "Threads select accessible" ON public.discussion_threads;
CREATE POLICY "Threads select accessible" ON public.discussion_threads FOR SELECT USING (
  public.is_admin() OR public.is_teacher() OR EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.id = course_id AND c.grade_id = p.grade_id
  )
);

DROP POLICY IF EXISTS "Threads insert" ON public.discussion_threads;
CREATE POLICY "Threads insert" ON public.discussion_threads FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

DROP POLICY IF EXISTS "Threads staff update" ON public.discussion_threads;
CREATE POLICY "Threads staff update" ON public.discussion_threads FOR UPDATE USING (
  created_by = auth.uid() OR public.is_admin() OR public.is_teacher()
);

-- DISCUSSION POSTS POLICIES
DROP POLICY IF EXISTS "Posts select accessible" ON public.discussion_posts;
CREATE POLICY "Posts select accessible" ON public.discussion_posts FOR SELECT USING (
  deleted_at IS NULL OR public.is_admin() OR public.is_teacher()
);

DROP POLICY IF EXISTS "Posts insert" ON public.discussion_posts;
CREATE POLICY "Posts insert" ON public.discussion_posts FOR INSERT WITH CHECK (
  author_id = auth.uid()
);

DROP POLICY IF EXISTS "Posts author edit" ON public.discussion_posts;
CREATE POLICY "Posts author edit" ON public.discussion_posts FOR UPDATE USING (
  (author_id = auth.uid() AND created_at >= NOW() - INTERVAL '15 minutes' AND deleted_at IS NULL)
  OR public.is_admin() OR public.is_teacher()
);

-- CERTIFICATES POLICIES
DROP POLICY IF EXISTS "Certificates select own" ON public.certificates;
CREATE POLICY "Certificates select own" ON public.certificates FOR SELECT USING (
  student_id = auth.uid() OR public.is_admin() OR public.is_teacher()
);

DROP POLICY IF EXISTS "Certificates staff manage" ON public.certificates;
CREATE POLICY "Certificates staff manage" ON public.certificates FOR ALL USING (
  public.is_admin() OR public.is_teacher()
);
