-- RAH learning records extend the LMS schema; they do not replace lesson_progress
-- or quiz_results, which remain the source of truth for course and assessment data.

CREATE TABLE IF NOT EXISTS public.learning_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.student_skill_mastery (
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.learning_skills(id) ON DELETE CASCADE,
  mastery NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (mastery BETWEEN 0 AND 100),
  confidence NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  attempts INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  correct_attempts INT NOT NULL DEFAULT 0 CHECK (correct_attempts BETWEEN 0 AND attempts),
  last_practiced_at TIMESTAMPTZ,
  trend TEXT NOT NULL DEFAULT 'unknown' CHECK (trend IN ('improving', 'stable', 'declining', 'unknown')),
  PRIMARY KEY (student_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.learning_skills(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  score NUMERIC(5,2) CHECK (score BETWEEN 0 AND 100),
  duration_seconds INT CHECK (duration_seconds >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learning_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  generated_by TEXT NOT NULL DEFAULT 'rah',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learning_plan_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.learning_plans(id) ON DELETE CASCADE,
  position INT NOT NULL CHECK (position > 0),
  skill_id UUID REFERENCES public.learning_skills(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  objective TEXT,
  estimated_minutes INT NOT NULL DEFAULT 10 CHECK (estimated_minutes > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
  UNIQUE (plan_id, position)
);

CREATE TABLE IF NOT EXISTS public.ai_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.learning_skills(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  difficulty INT NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 5),
  content JSONB NOT NULL,
  generated_by TEXT NOT NULL DEFAULT 'rah',
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'assigned', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.ai_activity_answer_keys (
  activity_id UUID PRIMARY KEY REFERENCES public.ai_activities(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  consumed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.rah_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  reason TEXT NOT NULL,
  action JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'seen', 'acted', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rah_recommendation_has_owner CHECK (student_id IS NOT NULL OR teacher_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.speaking_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  transcript TEXT,
  feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
  duration_seconds INT CHECK (duration_seconds >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rah_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'rah')),
  content TEXT NOT NULL CHECK (length(content) <= 1200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.is_teacher_of_student(target_student UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles teacher
    JOIN public.profiles student ON student.grade_id = teacher.grade_id
    WHERE teacher.id = auth.uid()
      AND teacher.role = 'teacher'
      AND teacher.is_active = true
      AND student.id = target_student
      AND student.role = 'student'
      AND student.is_active = true
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_teacher_of_student(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_teacher_of_student(UUID) TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_learning_events_student_created
  ON public.learning_events(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_skill_mastery_skill
  ON public.student_skill_mastery(skill_id, mastery);
CREATE INDEX IF NOT EXISTS idx_learning_plans_student_status
  ON public.learning_plans(student_id, status, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_learning_plans_one_active_per_student
  ON public.learning_plans(student_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_learning_plan_steps_plan_position
  ON public.learning_plan_steps(plan_id, position);
CREATE INDEX IF NOT EXISTS idx_ai_activities_student_status
  ON public.ai_activities(student_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rah_recommendations_student_status
  ON public.rah_recommendations(student_id, status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_rah_recommendations_teacher_status
  ON public.rah_recommendations(teacher_id, status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_speaking_attempts_student_created
  ON public.speaking_attempts(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rah_messages_student_created
  ON public.rah_messages(student_id, created_at DESC);

DROP TRIGGER IF EXISTS set_learning_plans_updated_at ON public.learning_plans;
CREATE TRIGGER set_learning_plans_updated_at
  BEFORE UPDATE ON public.learning_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.learning_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skill_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_activity_answer_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ai_activity_answer_keys FROM anon, authenticated;
GRANT ALL ON TABLE public.ai_activity_answer_keys TO service_role;
ALTER TABLE public.rah_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rah_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RAH skills readable by authenticated users"
  ON public.learning_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "RAH skills admin manage"
  ON public.learning_skills FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "RAH mastery scoped read"
  ON public.student_skill_mastery FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_admin() OR public.is_teacher_of_student(student_id));
CREATE POLICY "RAH events scoped read"
  ON public.learning_events FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_admin() OR public.is_teacher_of_student(student_id));

CREATE POLICY "RAH plans scoped read"
  ON public.learning_plans FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_admin() OR public.is_teacher_of_student(student_id));
CREATE POLICY "RAH plans student create"
  ON public.learning_plans FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "RAH plans student update"
  ON public.learning_plans FOR UPDATE TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "RAH plan steps scoped read"
  ON public.learning_plan_steps FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_plans plan
      WHERE plan.id = plan_id
        AND (plan.student_id = auth.uid() OR public.is_admin() OR public.is_teacher_of_student(plan.student_id))
    )
  );
CREATE POLICY "RAH plan steps student update"
  ON public.learning_plan_steps FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.learning_plans plan WHERE plan.id = plan_id AND plan.student_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.learning_plans plan WHERE plan.id = plan_id AND plan.student_id = auth.uid()));
CREATE POLICY "RAH plan steps student create"
  ON public.learning_plan_steps FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.learning_plans plan WHERE plan.id = plan_id AND plan.student_id = auth.uid()));

CREATE POLICY "RAH activities scoped read"
  ON public.ai_activities FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_admin() OR public.is_teacher_of_student(student_id));
CREATE POLICY "RAH recommendations scoped read"
  ON public.rah_recommendations FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR student_id = auth.uid()
    OR teacher_id = auth.uid()
    OR (student_id IS NULL AND teacher_id IS NOT NULL AND public.is_teacher_of_student(teacher_id))
  );
CREATE POLICY "RAH recommendations create by owner"
  ON public.rah_recommendations FOR INSERT TO authenticated
  WITH CHECK (
    (student_id = auth.uid() AND teacher_id IS NULL)
    OR (
      teacher_id = auth.uid()
      AND (student_id IS NULL OR public.is_teacher_of_student(student_id))
    )
  );
CREATE POLICY "RAH recommendations update by owner"
  ON public.rah_recommendations FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR teacher_id = auth.uid() OR public.is_admin())
  WITH CHECK (student_id = auth.uid() OR teacher_id = auth.uid() OR public.is_admin());

CREATE POLICY "RAH speaking scoped read"
  ON public.speaking_attempts FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_admin() OR public.is_teacher_of_student(student_id));
CREATE POLICY "RAH speaking student insert"
  ON public.speaking_attempts FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "RAH messages student read"
  ON public.rah_messages FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "RAH messages student insert"
  ON public.rah_messages FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

INSERT INTO public.learning_skills (code, name, category, description) VALUES
  ('sentence_structure', 'Sentence Structure', 'grammar', 'Build complete and correctly ordered sentences'),
  ('vocabulary_usage', 'Vocabulary Usage', 'vocabulary', 'Use new words accurately in context'),
  ('speaking_fluency', 'Speaking Fluency', 'speaking', 'Express ideas with connected speech'),
  ('pronunciation', 'Pronunciation', 'speaking', 'Produce clear and understandable speech'),
  ('listening_comprehension', 'Listening Comprehension', 'listening', 'Understand key ideas and details')
ON CONFLICT (code) DO NOTHING;

NOTIFY pgrst, 'reload schema';