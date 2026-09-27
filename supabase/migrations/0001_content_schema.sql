-- ============================================================================
-- 0001_content_schema.sql: EDURAH CONTENT ENGINE & CURRICULUM POSTGRES TABLES
-- MIGRATES CURRICULUM FROM CLIENT LOCALSTORAGE TO AUTHORITATIVE POSTGRESQL
-- ============================================================================

-- 1. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  icon TEXT DEFAULT 'BookOpen',
  color TEXT DEFAULT 'from-blue-600 to-indigo-600',
  category TEXT DEFAULT 'General',
  course_count INT NOT NULL DEFAULT 0,
  lesson_count INT NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  banner_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  grade_id TEXT NOT NULL REFERENCES public.grades(id) ON DELETE RESTRICT,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
  subject_name TEXT DEFAULT 'General',
  thumbnail TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  level TEXT NOT NULL DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  duration TEXT DEFAULT '2h 30m',
  lesson_count INT NOT NULL DEFAULT 0,
  rating NUMERIC NOT NULL DEFAULT 5.0,
  students_enrolled INT NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT true,
  position INT NOT NULL DEFAULT 1,
  instructor JSONB DEFAULT '{"name":"Edurah Lead Instructor","role":"Senior Educator","avatar":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80","bio":"Domain expert & curriculum developer."}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CHAPTERS TABLE
CREATE TABLE IF NOT EXISTS public.chapters (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, position)
);

-- 4. LESSONS TABLE
CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'video' CHECK (type IN ('video', 'reading', 'assignment', 'quiz')),
  video_url TEXT,
  video_id TEXT,
  duration_seconds INT NOT NULL DEFAULT 0,
  duration TEXT DEFAULT '10:00',
  body_md TEXT,
  position INT NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT true,
  quiz_id TEXT,
  learning_objectives JSONB DEFAULT '[]'::jsonb,
  key_concepts JSONB DEFAULT '[]'::jsonb,
  prerequisite_lesson_id TEXT REFERENCES public.lessons(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chapter_id, position),
  UNIQUE (course_id, slug)
);

-- 5. LESSON RESOURCES TABLE
CREATE TABLE IF NOT EXISTS public.lesson_resources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lesson_id TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'pdf' CHECK (type IN ('pdf', 'code', 'link', 'zip', 'document')),
  url TEXT NOT NULL,
  storage_path TEXT,
  filename TEXT,
  mime TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS public.quizzes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id TEXT REFERENCES public.lessons(id) ON DELETE SET NULL,
  grade_id TEXT NOT NULL REFERENCES public.grades(id) ON DELETE RESTRICT,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  pass_percent INT NOT NULL DEFAULT 60 CHECK (pass_percent >= 0 AND pass_percent <= 100),
  total_marks NUMERIC NOT NULL DEFAULT 100 CHECK (total_marks >= 0),
  time_limit_seconds INT,
  questions_to_serve INT, -- null = serve all
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  shuffle_options BOOLEAN NOT NULL DEFAULT false,
  max_attempts INT NOT NULL DEFAULT 1,
  start_date TEXT,
  start_time TEXT,
  deadline_date TEXT,
  deadline_time TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. QUESTIONS TABLE (HOLDS THE SENSITIVE AUTHORITATIVE ANSWER KEY)
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'single' CHECK (type IN ('single', 'multi', 'true_false', 'fill_blank', 'short_answer', 'match')),
  prompt_md TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ "id": 0, "text": "Option 1" }] or ["Option 1", "Option 2"]
  correct JSONB NOT NULL,                     -- THE ANSWER KEY: NEVER ACCESSIBLE TO CLIENTS/STUDENTS
  explanation_md TEXT,
  points NUMERIC NOT NULL DEFAULT 1 CHECK (points >= 0),
  position INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. QUESTIONS_PUBLIC VIEW (SANITIZED: NO CORRECT ANSWERS OR EXPLANATIONS BEFORE SUBMISSION)
CREATE OR REPLACE VIEW public.questions_public AS
SELECT
  id,
  quiz_id,
  type,
  prompt_md,
  options,
  points,
  position,
  created_at
FROM public.questions;

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_courses_grade_status ON public.courses(grade_id, status);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_subject ON public.courses(subject_id);
CREATE INDEX IF NOT EXISTS idx_chapters_course_position ON public.chapters(course_id, position);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_position ON public.lessons(chapter_id, position);
CREATE INDEX IF NOT EXISTS idx_lessons_course_slug ON public.lessons(course_id, slug);
CREATE INDEX IF NOT EXISTS idx_quizzes_grade_status ON public.quizzes(grade_id, status);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON public.quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_position ON public.questions(quiz_id, position);
CREATE INDEX IF NOT EXISTS idx_profiles_role_grade ON public.profiles(role, grade_id);

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- SUBJECTS POLICIES
DROP POLICY IF EXISTS "Subjects public read" ON public.subjects;
CREATE POLICY "Subjects public read" ON public.subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Subjects admin modify" ON public.subjects;
CREATE POLICY "Subjects admin modify" ON public.subjects FOR ALL USING (public.is_admin());

-- COURSES POLICIES
DROP POLICY IF EXISTS "Courses read policy" ON public.courses;
CREATE POLICY "Courses read policy" ON public.courses FOR SELECT USING (
  public.is_admin()
  OR (public.is_teacher() AND grade_id = public.get_teacher_assigned_grade())
  OR (status = 'published' AND (
      auth.role() = 'anon'
      OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
      OR grade_id = (SELECT grade_id FROM public.profiles WHERE id = auth.uid())
  ))
);

DROP POLICY IF EXISTS "Courses admin manage" ON public.courses;
CREATE POLICY "Courses admin manage" ON public.courses FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Courses teacher manage" ON public.courses;
CREATE POLICY "Courses teacher manage" ON public.courses FOR ALL USING (
  public.is_teacher() AND grade_id = public.get_teacher_assigned_grade()
);

-- CHAPTERS POLICIES
DROP POLICY IF EXISTS "Chapters read policy" ON public.chapters;
CREATE POLICY "Chapters read policy" ON public.chapters FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id)
);

DROP POLICY IF EXISTS "Chapters admin manage" ON public.chapters;
CREATE POLICY "Chapters admin manage" ON public.chapters FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Chapters teacher manage" ON public.chapters;
CREATE POLICY "Chapters teacher manage" ON public.chapters FOR ALL USING (
  public.is_teacher() AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id AND c.grade_id = public.get_teacher_assigned_grade()
  )
);

-- LESSONS POLICIES
DROP POLICY IF EXISTS "Lessons read policy" ON public.lessons;
CREATE POLICY "Lessons read policy" ON public.lessons FOR SELECT USING (
  public.is_admin()
  OR (public.is_teacher() AND EXISTS (
      SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.grade_id = public.get_teacher_assigned_grade()
  ))
  OR (is_published = true AND EXISTS (
      SELECT 1 FROM public.courses c WHERE c.id = course_id AND (
        auth.role() = 'anon'
        OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
        OR c.grade_id = (SELECT grade_id FROM public.profiles WHERE id = auth.uid())
      )
  ))
);

DROP POLICY IF EXISTS "Lessons admin manage" ON public.lessons;
CREATE POLICY "Lessons admin manage" ON public.lessons FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Lessons teacher manage" ON public.lessons;
CREATE POLICY "Lessons teacher manage" ON public.lessons FOR ALL USING (
  public.is_teacher() AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id AND c.grade_id = public.get_teacher_assigned_grade()
  )
);

-- LESSON RESOURCES POLICIES
DROP POLICY IF EXISTS "Lesson resources read policy" ON public.lesson_resources;
CREATE POLICY "Lesson resources read policy" ON public.lesson_resources FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lesson resources admin manage" ON public.lesson_resources;
CREATE POLICY "Lesson resources admin manage" ON public.lesson_resources FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Lesson resources teacher manage" ON public.lesson_resources;
CREATE POLICY "Lesson resources teacher manage" ON public.lesson_resources FOR ALL USING (
  public.is_teacher() AND EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.courses c ON c.id = l.course_id
    WHERE l.id = lesson_id AND c.grade_id = public.get_teacher_assigned_grade()
  )
);

-- QUIZZES POLICIES
DROP POLICY IF EXISTS "Quizzes read policy" ON public.quizzes;
CREATE POLICY "Quizzes read policy" ON public.quizzes FOR SELECT USING (
  public.is_admin()
  OR (public.is_teacher() AND grade_id = public.get_teacher_assigned_grade())
  OR (status = 'published' AND (
      auth.role() = 'anon'
      OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
      OR grade_id = (SELECT grade_id FROM public.profiles WHERE id = auth.uid())
  ))
);

DROP POLICY IF EXISTS "Quizzes admin manage" ON public.quizzes;
CREATE POLICY "Quizzes admin manage" ON public.quizzes FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Quizzes teacher manage" ON public.quizzes;
CREATE POLICY "Quizzes teacher manage" ON public.quizzes FOR ALL USING (
  public.is_teacher() AND grade_id = public.get_teacher_assigned_grade()
);

-- QUESTIONS TABLE POLICIES:
-- CRITICAL SECURITY RULE: The raw questions table (with correct answers) is NEVER directly selected by students!
DROP POLICY IF EXISTS "Questions admin teacher select" ON public.questions;
CREATE POLICY "Questions admin teacher select" ON public.questions FOR SELECT USING (
  public.is_admin() OR (
    public.is_teacher() AND EXISTS (
      SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.grade_id = public.get_teacher_assigned_grade()
    )
  )
);

DROP POLICY IF EXISTS "Questions admin manage" ON public.questions;
CREATE POLICY "Questions admin manage" ON public.questions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Questions teacher manage" ON public.questions;
CREATE POLICY "Questions teacher manage" ON public.questions FOR ALL USING (
  public.is_teacher() AND EXISTS (
    SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.grade_id = public.get_teacher_assigned_grade()
  )
);

-- Grant access on sanitized view
GRANT SELECT ON public.questions_public TO anon, authenticated, service_role;
