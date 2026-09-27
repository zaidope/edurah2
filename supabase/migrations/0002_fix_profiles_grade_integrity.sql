-- ============================================================================
-- 0002_fix_profiles_grade_integrity.sql
-- ELIMINATES GRADE_ID / CLASS_GROUP SPLIT BRAIN & ENFORCES INTEGRITY
-- ============================================================================

-- 1. Backfill grade_id from class_group where grade_id is null
UPDATE public.profiles
SET grade_id = class_group
WHERE grade_id IS NULL AND class_group LIKE 'grade-%';

-- 2. Default any lingering students with null grade_id to grade-1
UPDATE public.profiles
SET grade_id = 'grade-1'
WHERE grade_id IS NULL AND role = 'student';

-- 3. Add constraint: All students MUST have a valid non-null grade_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS student_must_have_grade;
ALTER TABLE public.profiles ADD CONSTRAINT student_must_have_grade
  CHECK (role <> 'student' OR grade_id IS NOT NULL);

-- 4. Index profiles on (role, grade_id) for instant roster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_role_grade_id ON public.profiles(role, grade_id);
