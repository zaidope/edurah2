create extension if not exists "uuid-ossp";
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade, full_name text, email text, role text not null check(role in ('student','teacher')), created_at timestamptz default now());
create table public.student_progress(student_id uuid primary key references public.profiles(id) on delete cascade, xp int default 0, journey_progress int default 0, sentence_skill int default 0, lesson4_completed boolean default false, updated_at timestamptz default now());
create table public.passport_achievements(id uuid primary key default uuid_generate_v4(), student_id uuid references public.profiles(id) on delete cascade, achievement text not null, earned_at timestamptz default now(), unique(student_id,achievement));
create table public.assignments(id uuid primary key default uuid_generate_v4(), teacher_id uuid references public.profiles(id) on delete cascade, title text not null, target text default 'class', created_at timestamptz default now());
create table public.rah_messages(id uuid primary key default uuid_generate_v4(), student_id uuid references public.profiles(id) on delete cascade, role text check(role in ('student','rah')), content text not null, created_at timestamptz default now());
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,full_name,email,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.email,coalesce(new.raw_user_meta_data->>'role','student')); if coalesce(new.raw_user_meta_data->>'role','student')='student' then insert into public.student_progress(student_id) values(new.id); end if; return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
alter table public.profiles enable row level security; alter table public.student_progress enable row level security; alter table public.passport_achievements enable row level security; alter table public.assignments enable row level security; alter table public.rah_messages enable row level security;
create policy "read own profile" on public.profiles for select using(auth.uid()=id); create policy "update own profile" on public.profiles for update using(auth.uid()=id);
create policy "students own progress" on public.student_progress for all using(auth.uid()=student_id) with check(auth.uid()=student_id);
create policy "students own passport" on public.passport_achievements for all using(auth.uid()=student_id) with check(auth.uid()=student_id);
create policy "students own rah" on public.rah_messages for all using(auth.uid()=student_id) with check(auth.uid()=student_id);
create policy "teachers read students" on public.profiles for select using((select role from public.profiles where id=auth.uid())='teacher' and role='student');
create policy "teachers read progress" on public.student_progress for select using((select role from public.profiles where id=auth.uid())='teacher');
create policy "teachers manage assignments" on public.assignments for all using(auth.uid()=teacher_id) with check(auth.uid()=teacher_id);

-- AI readiness and safer role checks
create index if not exists rah_messages_student_created_idx on public.rah_messages(student_id, created_at desc);
create index if not exists student_progress_skill_idx on public.student_progress(sentence_skill);
create or replace function public.current_user_role() returns text language sql stable security definer set search_path=public as $$ select role from public.profiles where id=auth.uid() $$;

drop policy if exists "teachers read students" on public.profiles;
create policy "teachers read students" on public.profiles for select using(public.current_user_role()='teacher' and role='student');
drop policy if exists "teachers read progress" on public.student_progress;
create policy "teachers read progress" on public.student_progress for select using(public.current_user_role()='teacher');

-- RAH Intelligence V2 -------------------------------------------------------
create table if not exists public.learning_skills (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  category text not null,
  description text
);
create table if not exists public.student_skill_mastery (
  student_id uuid references public.profiles(id) on delete cascade,
  skill_id uuid references public.learning_skills(id) on delete cascade,
  mastery numeric(5,2) default 0 check (mastery between 0 and 100),
  confidence numeric(5,2) default 0 check (confidence between 0 and 100),
  attempts int default 0,
  correct_attempts int default 0,
  last_practiced_at timestamptz,
  trend text default 'unknown' check (trend in ('improving','stable','declining','unknown')),
  primary key(student_id,skill_id)
);
create table if not exists public.learning_events (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  skill_id uuid references public.learning_skills(id) on delete set null,
  event_type text not null,
  score numeric(5,2),
  duration_seconds int,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create table if not exists public.learning_plans (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  goal text not null,
  status text not null default 'active' check(status in ('active','completed','paused','archived')),
  generated_by text not null default 'rah',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.learning_plan_steps (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references public.learning_plans(id) on delete cascade not null,
  position int not null,
  skill_id uuid references public.learning_skills(id) on delete set null,
  title text not null,
  objective text,
  estimated_minutes int default 10,
  status text not null default 'pending' check(status in ('pending','active','completed','skipped')),
  unique(plan_id,position)
);
create table if not exists public.ai_activities (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  skill_id uuid references public.learning_skills(id) on delete set null,
  title text not null,
  activity_type text not null,
  difficulty int default 2 check(difficulty between 1 and 5),
  content jsonb not null,
  generated_by text default 'rah',
  status text default 'ready' check(status in ('ready','assigned','completed','archived')),
  created_at timestamptz default now(),
  completed_at timestamptz
);
create table if not exists public.rah_recommendations (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.profiles(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  recommendation_type text not null,
  priority int default 3 check(priority between 1 and 5),
  title text not null,
  reason text not null,
  action jsonb default '{}'::jsonb,
  status text default 'new' check(status in ('new','seen','acted','dismissed')),
  created_at timestamptz default now()
);
create table if not exists public.speaking_attempts (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  prompt text not null,
  transcript text,
  feedback jsonb default '{}'::jsonb,
  duration_seconds int,
  created_at timestamptz default now()
);

insert into public.learning_skills(code,name,category,description) values
('sentence_structure','Sentence Structure','grammar','Build complete and correctly ordered sentences'),
('vocabulary_usage','Vocabulary Usage','vocabulary','Use new words accurately in context'),
('speaking_fluency','Speaking Fluency','speaking','Express ideas with connected speech'),
('pronunciation','Pronunciation','speaking','Produce clear and understandable speech'),
('listening_comprehension','Listening Comprehension','listening','Understand key ideas and details')
on conflict(code) do nothing;

create index if not exists learning_events_student_created_idx on public.learning_events(student_id,created_at desc);
create index if not exists mastery_student_idx on public.student_skill_mastery(student_id,mastery);
create index if not exists recommendations_student_status_idx on public.rah_recommendations(student_id,status,priority desc);

alter table public.learning_skills enable row level security;
alter table public.student_skill_mastery enable row level security;
alter table public.learning_events enable row level security;
alter table public.learning_plans enable row level security;
alter table public.learning_plan_steps enable row level security;
alter table public.ai_activities enable row level security;
alter table public.rah_recommendations enable row level security;
alter table public.speaking_attempts enable row level security;

create policy "skills readable" on public.learning_skills for select using(auth.role()='authenticated');
create policy "student own mastery" on public.student_skill_mastery for all using(auth.uid()=student_id) with check(auth.uid()=student_id);
create policy "student own events" on public.learning_events for all using(auth.uid()=student_id) with check(auth.uid()=student_id);
create policy "student own plans" on public.learning_plans for all using(auth.uid()=student_id) with check(auth.uid()=student_id);
create policy "student own plan steps" on public.learning_plan_steps for select using(exists(select 1 from public.learning_plans p where p.id=plan_id and p.student_id=auth.uid()));
create policy "student own activities" on public.ai_activities for all using(auth.uid()=student_id) with check(auth.uid()=student_id);
create policy "student own recommendations" on public.rah_recommendations for select using(student_id=auth.uid() or teacher_id=auth.uid());
create policy "student own speaking" on public.speaking_attempts for all using(auth.uid()=student_id) with check(auth.uid()=student_id);
create policy "teachers read v2 student data" on public.student_skill_mastery for select using(public.current_user_role()='teacher');
create policy "teachers read v2 events" on public.learning_events for select using(public.current_user_role()='teacher');
create policy "teachers read v2 plans" on public.learning_plans for select using(public.current_user_role()='teacher');
create policy "teachers read v2 activities" on public.ai_activities for select using(public.current_user_role()='teacher');
create policy "teachers read speaking attempts" on public.speaking_attempts for select using(public.current_user_role()='teacher');

-- V2 screen integration permissions ---------------------------------------
-- Students can complete/advance their own plan steps.
drop policy if exists "student own plan steps update" on public.learning_plan_steps;
create policy "student own plan steps update" on public.learning_plan_steps for update
using (exists(select 1 from public.learning_plans p where p.id=plan_id and p.student_id=auth.uid()))
with check (exists(select 1 from public.learning_plans p where p.id=plan_id and p.student_id=auth.uid()));

-- Teachers can create class-level RAH recommendations and assign AI activities.
drop policy if exists "teachers create recommendations" on public.rah_recommendations;
create policy "teachers create recommendations" on public.rah_recommendations for insert
with check (public.current_user_role()='teacher' and teacher_id=auth.uid());
drop policy if exists "teachers manage recommendations" on public.rah_recommendations;
create policy "teachers manage recommendations" on public.rah_recommendations for update
using (public.current_user_role()='teacher' and teacher_id=auth.uid())
with check (public.current_user_role()='teacher' and teacher_id=auth.uid());
drop policy if exists "teachers assign ai activities" on public.ai_activities;
create policy "teachers assign ai activities" on public.ai_activities for insert
with check (public.current_user_role()='teacher' and exists(select 1 from public.profiles p where p.id=student_id and p.role='student'));

-- Helpful indexes for intelligence screens.
create index if not exists learning_plan_steps_plan_position_idx on public.learning_plan_steps(plan_id,position);
create index if not exists ai_activities_student_status_idx on public.ai_activities(student_id,status,created_at desc);
create index if not exists speaking_attempts_student_created_idx on public.speaking_attempts(student_id,created_at desc);

-- School tenancy foundation -------------------------------------------------
-- The original schema supported student/teacher. This migration extends roles
-- safely and introduces explicit school membership boundaries before exposing
-- school-level learner data.
do $$ begin
  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles add constraint profiles_role_check check (role in ('student','teacher','school'));
exception when duplicate_object then null; end $$;

create table if not exists public.schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);
create table if not exists public.school_memberships (
  school_id uuid references public.schools(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  membership_role text not null check (membership_role in ('admin','teacher','student')),
  created_at timestamptz default now(),
  primary key(school_id,user_id)
);
create index if not exists school_memberships_user_idx on public.school_memberships(user_id);
create index if not exists school_memberships_school_role_idx on public.school_memberships(school_id,membership_role);
alter table public.schools enable row level security;
alter table public.school_memberships enable row level security;

create or replace function public.is_school_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.school_memberships sm where sm.user_id=auth.uid() and sm.membership_role='admin');
$$;
create or replace function public.shares_school(target_user uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.school_memberships mine
    join public.school_memberships theirs on theirs.school_id=mine.school_id
    where mine.user_id=auth.uid() and theirs.user_id=target_user
  );
$$;

create policy "school admins read own schools" on public.schools for select using(exists(select 1 from public.school_memberships sm where sm.school_id=id and sm.user_id=auth.uid()));
create policy "school members read own membership" on public.school_memberships for select using(user_id=auth.uid() or public.is_school_admin());
create policy "school admins read students" on public.profiles for select using(public.is_school_admin() and role='student' and public.shares_school(id));
create policy "school admins read teachers" on public.profiles for select using(public.is_school_admin() and role='teacher' and public.shares_school(id));
create policy "school admins read student progress" on public.student_progress for select using(public.is_school_admin() and public.shares_school(student_id));
create policy "school admins read mastery" on public.student_skill_mastery for select using(public.is_school_admin() and public.shares_school(student_id));
create policy "school admins read events" on public.learning_events for select using(public.is_school_admin() and public.shares_school(student_id));
create policy "school admins read activities" on public.ai_activities for select using(public.is_school_admin() and public.shares_school(student_id));
create policy "school admins read plans" on public.learning_plans for select using(public.is_school_admin() and public.shares_school(student_id));
create policy "school admins read speaking" on public.speaking_attempts for select using(public.is_school_admin() and public.shares_school(student_id));
create policy "school admins read recommendations" on public.rah_recommendations for select using(public.is_school_admin() and (student_id is null or public.shares_school(student_id)));
