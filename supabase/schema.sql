-- 중국어 독해 AI 챕터 학습앱 — Supabase schema (L01)
-- Run in Supabase SQL editor. Uses auth.users for login; profiles.role
-- distinguishes student/admin per claude_code_instructions.md.

-- ── profiles ────────────────────────────────────────────────────────────
-- One row per auth.users user. student_id is the 학번 (also used as the
-- student's login id); role gates the admin screen.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  student_id text unique not null,
  name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Admin-check helper. SECURITY DEFINER makes this query bypass RLS, which
-- is required here: a policy on `profiles` that reads `profiles` again to
-- check the caller's role would otherwise recurse into itself (Postgres
-- error "infinite recursion detected in policy for relation profiles").
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles p where p.id = uid and p.role = 'admin'
  );
$$;

create policy "profiles: read own row" on profiles
  for select using (auth.uid() = id);

create policy "profiles: admins read all" on profiles
  for select using (public.is_admin(auth.uid()));

-- Students self-provision on first login (see src/contexts/AuthContext.tsx:
-- signInWithPassword, falling back to signUp on first attempt). Only a
-- 'student' role can be self-assigned this way; admin accounts must be
-- created/promoted manually by the professor in the Supabase dashboard.
create policy "profiles: self insert as student" on profiles
  for insert with check (auth.uid() = id and role = 'student');

-- ── lesson_content ──────────────────────────────────────────────────────
-- Vocab / grammar / sentence data per lesson, editable from the admin
-- panel's inline editor (saved via lib/dataSource.ts -> saveContent()).
-- Seed rows from src/data/*.json (see README "Supabase 연결" section).
create table if not exists lesson_content (
  lesson_id text not null,
  kind text not null check (kind in ('vocab', 'grammar', 'sentences')),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  primary key (lesson_id, kind)
);

alter table lesson_content enable row level security;

create policy "lesson_content: everyone can read" on lesson_content
  for select using (true);

create policy "lesson_content: admins can write" on lesson_content
  for insert with check (public.is_admin(auth.uid()));

create policy "lesson_content: admins can update" on lesson_content
  for update using (public.is_admin(auth.uid()));

-- ── event_logs ──────────────────────────────────────────────────────────
-- Research logging for every student interaction. event_type examples:
-- word_lookup, word_check, flashcard_view, quiz_answer, sentence_play,
-- record_attempt, login.
create table if not exists event_logs (
  id bigint generated always as identity primary key,
  student_id text not null,
  lesson_id text not null,
  event_type text not null,
  target_id text,
  timestamp timestamptz not null default now()
);

alter table event_logs enable row level security;

create policy "event_logs: students insert own" on event_logs
  for insert with check (
    student_id = (select p.student_id from profiles p where p.id = auth.uid())
  );

create policy "event_logs: admins read all" on event_logs
  for select using (public.is_admin(auth.uid()));

-- Lets a student read back their own event history (used by the 낭독 탭
-- recording-progress indicator to count distinct sentences they've ever
-- attempted recording for, across sessions).
create policy "event_logs: students read own" on event_logs
  for select using (
    student_id = (select p.student_id from profiles p where p.id = auth.uid())
  );

create index if not exists event_logs_student_lesson_idx
  on event_logs (student_id, lesson_id);

-- ── quiz_results ────────────────────────────────────────────────────────
-- Table structure reserved ahead of time for the 4th tab (종합 이해도 퀴즈),
-- out of scope for this build per claude_code_instructions.md.
create table if not exists quiz_results (
  id bigint generated always as identity primary key,
  student_id text not null,
  lesson_id text not null,
  quiz_id text not null,
  question_id text not null,
  student_answer text not null,
  correct boolean not null,
  timestamp timestamptz not null default now()
);

alter table quiz_results enable row level security;

create policy "quiz_results: students insert own" on quiz_results
  for insert with check (
    student_id = (select p.student_id from profiles p where p.id = auth.uid())
  );

create policy "quiz_results: admins read all" on quiz_results
  for select using (public.is_admin(auth.uid()));

-- ── activity dashboard helper view ─────────────────────────────────────
-- Backs the admin "활동현황" table: per-student login count, checked-word
-- count, quiz accuracy, sentence play count, recording count, and rough
-- time-on-task.
-- drop+create (not "or replace") because Postgres won't let a view's
-- column list be reordered/inserted-into in place, only appended to.
drop view if exists student_activity_summary;
create view student_activity_summary as
select
  e.student_id,
  e.lesson_id,
  count(*) filter (where e.event_type = 'login') as login_count,
  count(*) filter (where e.event_type = 'word_check') as words_checked,
  count(*) filter (where e.event_type = 'quiz_answer') as quiz_answers,
  count(*) filter (
    where e.event_type = 'quiz_answer' and e.target_id like '%:correct'
  ) as quiz_correct,
  count(*) filter (where e.event_type = 'sentence_play') as sentence_plays,
  count(*) filter (where e.event_type = 'record_attempt') as recordings,
  extract(epoch from (max(e.timestamp) - min(e.timestamp))) as session_span_seconds
from event_logs e
group by e.student_id, e.lesson_id;
