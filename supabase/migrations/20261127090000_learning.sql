-- =============================================================================
-- Kulto — Phase 2: learning content, lesson sessions and progression.
--
-- * Content tables are readable when published; nobody writes them through the API
--   (content is imported as SQL generated from content/*.json, see docs/GAME_ENGINE.md).
-- * Solutions and explanations live in private.question_solutions: never exposed.
-- * Answers are scored by private.evaluate_answer() inside submit_answer().
-- * Progress tables are read-only for their owner; only the RPCs write them.
-- =============================================================================

create type public.course_level as enum ('decouverte', 'debutant', 'intermediaire', 'avance', 'expert', 'maitre');
create type public.lesson_kind as enum ('standard', 'exam');
create type public.question_format as enum ('quiz', 'true_false', 'match', 'timeline', 'guess_year');
create type public.lesson_progress_status as enum ('in_progress', 'completed');

-- -----------------------------------------------------------------------------
-- Content
-- -----------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universes (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 60),
  description text not null default '' check (char_length(description) <= 400),
  sort_order smallint not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (universe_id, slug)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 80),
  description text not null default '' check (char_length(description) <= 600),
  level public.course_level not null default 'debutant',
  sort_order smallint not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  position smallint not null check (position > 0),
  title text not null check (char_length(title) between 2 and 80),
  description text not null default '' check (char_length(description) <= 400),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  position smallint not null check (position > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 80),
  objective text not null default '' check (char_length(objective) <= 200),
  kind public.lesson_kind not null default 'standard',
  estimated_minutes smallint not null default 4 check (estimated_minutes between 1 and 30),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, position)
);

-- A knowledge item ("notion") is an atomic fact. Cards present it, questions test it,
-- and spaced repetition (phase 3) will schedule it.
create table public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  universe_id uuid not null references public.universes (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  summary text not null default '' check (char_length(summary) <= 400),
  is_evolving boolean not null default false,
  valid_as_of date,
  verified_at date,
  source_url text check (source_url is null or source_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_items_evolving_dated check (not is_evolving or valid_as_of is not null)
);

create table public.learning_cards (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  position smallint not null check (position > 0),
  title text not null check (char_length(title) between 2 and 80),
  blocks jsonb not null check (jsonb_typeof(blocks) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, position)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  universe_id uuid not null references public.universes (id) on delete cascade,
  format public.question_format not null,
  prompt text not null check (char_length(prompt) between 5 and 300),
  -- Public part only (options, items). Never anything that reveals the answer.
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  difficulty smallint not null default 2 check (difficulty between 1 and 5),
  is_evolving boolean not null default false,
  valid_as_of date,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_evolving_dated check (not is_evolving or valid_as_of is not null)
);

create table private.question_solutions (
  question_id uuid primary key references public.questions (id) on delete cascade,
  solution jsonb not null check (jsonb_typeof(solution) = 'object'),
  explanation text not null check (char_length(explanation) between 5 and 600),
  updated_at timestamptz not null default now()
);

create table public.question_knowledge_items (
  question_id uuid not null references public.questions (id) on delete cascade,
  knowledge_item_id uuid not null references public.knowledge_items (id) on delete cascade,
  primary key (question_id, knowledge_item_id)
);

create table public.lesson_items (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  position smallint not null check (position > 0),
  question_id uuid not null references public.questions (id) on delete restrict,
  primary key (lesson_id, position),
  unique (lesson_id, question_id)
);

create index categories_universe_idx on public.categories (universe_id, sort_order);
create index courses_category_idx on public.courses (category_id, sort_order);
create index lesson_items_question_idx on public.lesson_items (question_id);
create index question_knowledge_items_ki_idx on public.question_knowledge_items (knowledge_item_id);
create index questions_universe_idx on public.questions (universe_id);
create index knowledge_items_universe_idx on public.knowledge_items (universe_id);

do $$
declare t text;
begin
  foreach t in array array['categories', 'courses', 'chapters', 'lessons', 'knowledge_items', 'learning_cards', 'questions']
  loop
    execute format('create trigger %1$s_set_updated_at before update on public.%1$I for each row execute function private.set_updated_at()', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Content RLS: read when published (and the parents are published), never write.
-- -----------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.courses enable row level security;
alter table public.chapters enable row level security;
alter table public.lessons enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.learning_cards enable row level security;
alter table public.questions enable row level security;
alter table public.question_knowledge_items enable row level security;
alter table public.lesson_items enable row level security;

-- Reviewers (admin or editor role) can see content "in_review" so they can check it
-- in the real app before it is published. Everyone else only sees published content.
create function private.is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role in ('admin', 'editor')
  );
$$;

create function private.content_visible(p_status public.content_status)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_status = 'published' or (p_status = 'in_review' and private.is_reviewer());
$$;

create function private.lesson_is_published(p_lesson uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lessons l
    join public.chapters c on c.id = l.chapter_id
    join public.courses co on co.id = c.course_id
    join public.categories ca on ca.id = co.category_id
    where l.id = p_lesson
      and private.content_visible(l.status) and private.content_visible(c.status)
      and private.content_visible(co.status) and private.content_visible(ca.status)
  );
$$;

grant usage on schema private to anon, authenticated;
grant execute on function private.lesson_is_published(uuid) to anon, authenticated;
grant execute on function private.content_visible(public.content_status) to anon, authenticated;
grant execute on function private.content_visible(public.content_status) to anon, authenticated;

create policy "Published categories are public" on public.categories
  for select to anon, authenticated using (private.content_visible(status));
create policy "Published courses are public" on public.courses
  for select to anon, authenticated using (private.content_visible(status));
create policy "Published chapters are public" on public.chapters
  for select to anon, authenticated using (private.content_visible(status));
create policy "Published lessons are public" on public.lessons
  for select to anon, authenticated using (private.lesson_is_published(id));
create policy "Cards of published lessons are public" on public.learning_cards
  for select to anon, authenticated using (private.lesson_is_published(lesson_id));
create policy "Items of published lessons are public" on public.lesson_items
  for select to anon, authenticated using (private.lesson_is_published(lesson_id));
create policy "Published questions are public" on public.questions
  for select to anon, authenticated using (private.content_visible(status));
create policy "Knowledge items are public" on public.knowledge_items
  for select to anon, authenticated using (true);
create policy "Question knowledge links are public" on public.question_knowledge_items
  for select to anon, authenticated using (true);

do $$
declare t text;
begin
  foreach t in array array['categories', 'courses', 'chapters', 'lessons', 'knowledge_items', 'learning_cards', 'questions', 'question_knowledge_items', 'lesson_items']
  loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select on table public.%I to anon, authenticated', t);
  end loop;
end;
$$;

revoke all on table private.question_solutions from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Progression
-- -----------------------------------------------------------------------------
create table public.lesson_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  question_ids uuid[] not null check (cardinality(question_ids) > 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  correct_count smallint,
  score smallint check (score is null or score between 0 and 100)
);

create index lesson_sessions_user_lesson_idx on public.lesson_sessions (user_id, lesson_id, started_at desc);

create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.lesson_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  answer jsonb not null,
  is_correct boolean not null,
  score numeric(4, 3) not null check (score between 0 and 1),
  created_at timestamptz not null default now(),
  unique (session_id, question_id)
);

create index question_attempts_user_idx on public.question_attempts (user_id, created_at desc);

create table public.user_lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  status public.lesson_progress_status not null default 'in_progress',
  best_score smallint check (best_score is null or best_score between 0 and 100),
  attempts integer not null default 0 check (attempts >= 0),
  first_completed_at timestamptz,
  last_completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.user_course_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  last_lesson_id uuid references public.lessons (id) on delete set null,
  completed_lessons integer not null default 0 check (completed_lessons >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create trigger user_lesson_progress_set_updated_at before update on public.user_lesson_progress
  for each row execute function private.set_updated_at();
create trigger user_course_progress_set_updated_at before update on public.user_course_progress
  for each row execute function private.set_updated_at();

alter table public.lesson_sessions enable row level security;
alter table public.question_attempts enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.user_course_progress enable row level security;

create policy "Users read their own sessions" on public.lesson_sessions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users read their own attempts" on public.question_attempts
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users read their own lesson progress" on public.user_lesson_progress
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users read their own course progress" on public.user_course_progress
  for select to authenticated using (user_id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['lesson_sessions', 'question_attempts', 'user_lesson_progress', 'user_course_progress']
  loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Ordering and unlocking
-- -----------------------------------------------------------------------------
-- Published lessons of a course, in learning order.
create function private.course_lesson_order(p_course uuid)
returns table (lesson_id uuid, rank bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, row_number() over (order by c.position, l.position)
  from public.lessons l
  join public.chapters c on c.id = l.chapter_id
  where c.course_id = p_course and private.content_visible(c.status) and private.content_visible(l.status);
$$;

create function private.lesson_course(p_lesson uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.course_id from public.lessons l join public.chapters c on c.id = l.chapter_id where l.id = p_lesson;
$$;

-- A lesson is unlocked when it is the first of its course or the previous one is completed.
create function private.lesson_is_unlocked(p_user uuid, p_lesson uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_course uuid := private.lesson_course(p_lesson);
  v_rank bigint;
  v_previous uuid;
begin
  select o.rank into v_rank from private.course_lesson_order(v_course) o where o.lesson_id = p_lesson;
  if v_rank is null then
    return false;
  end if;
  if v_rank = 1 then
    return true;
  end if;
  select o.lesson_id into v_previous from private.course_lesson_order(v_course) o where o.rank = v_rank - 1;
  return exists (
    select 1 from public.user_lesson_progress p
    where p.user_id = p_user and p.lesson_id = v_previous and p.status = 'completed'
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Answer validation and scoring (pure functions, unit-tested with pgTAP)
-- -----------------------------------------------------------------------------
create function private.answer_is_well_formed(p_format public.question_format, p_answer jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_format
    when 'quiz' then jsonb_typeof(p_answer -> 'selected') = 'array'
    when 'true_false' then jsonb_typeof(p_answer -> 'value') = 'boolean'
    when 'match' then jsonb_typeof(p_answer -> 'pairs') = 'object'
    when 'timeline' then jsonb_typeof(p_answer -> 'order') = 'array'
    when 'guess_year' then jsonb_typeof(p_answer -> 'year') = 'number'
      and (p_answer ->> 'year') ~ '^-?[0-9]{1,4}$'
  end;
$$;

create function private.evaluate_answer(p_format public.question_format, p_solution jsonb, p_answer jsonb)
returns table (is_correct boolean, score numeric)
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_total int;
  v_ok int;
  v_diff int;
  v_tolerance int;
begin
  case p_format
    when 'quiz' then
      is_correct := (
        select coalesce(array_agg(distinct x order by x), '{}') from jsonb_array_elements_text(p_answer -> 'selected') x
      ) = (
        select coalesce(array_agg(distinct x order by x), '{}') from jsonb_array_elements_text(p_solution -> 'correct') x
      );
      score := case when is_correct then 1 else 0 end;

    when 'true_false' then
      is_correct := (p_answer -> 'value') = (p_solution -> 'value');
      score := case when is_correct then 1 else 0 end;

    when 'match' then
      select count(*), count(*) filter (where (p_answer -> 'pairs' ->> s.k) = s.v)
      into v_total, v_ok
      from jsonb_each_text(p_solution -> 'pairs') as s (k, v);
      is_correct := v_total > 0 and v_ok = v_total;
      score := round(v_ok::numeric / greatest(v_total, 1), 3);

    when 'timeline' then
      select count(*), count(*) filter (where (p_answer -> 'order' ->> (t.i - 1)::int) = t.e)
      into v_total, v_ok
      from jsonb_array_elements_text(p_solution -> 'order') with ordinality as t (e, i);
      is_correct := v_total > 0 and v_ok = v_total
        and jsonb_array_length(p_answer -> 'order') = v_total;
      score := round(v_ok::numeric / greatest(v_total, 1), 3);

    when 'guess_year' then
      v_diff := abs((p_answer ->> 'year')::int - (p_solution ->> 'year')::int);
      v_tolerance := coalesce((p_solution ->> 'tolerance')::int, 0);
      is_correct := v_diff <= v_tolerance;
      -- Full score when exact, linear down to 0 at 10 years off.
      score := round(greatest(0, 1 - v_diff / 10.0), 3);
  end case;
  return next;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: start (or resume) a lesson session.
-- -----------------------------------------------------------------------------
create function public.start_lesson(p_lesson uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_session public.lesson_sessions;
  v_questions uuid[];
  v_course uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not private.lesson_is_published(p_lesson) then
    raise exception 'lesson_not_found' using errcode = 'P0002';
  end if;
  if not private.lesson_is_unlocked(v_user, p_lesson) then
    raise exception 'lesson_locked' using errcode = '42501';
  end if;

  -- Resume an unfinished session from the last 24 hours.
  select * into v_session
  from public.lesson_sessions
  where user_id = v_user and lesson_id = p_lesson and completed_at is null
    and started_at > now() - interval '1 day'
  order by started_at desc
  limit 1;

  if not found then
    select array_agg(question_id order by position) into v_questions
    from public.lesson_items where lesson_id = p_lesson;
    if v_questions is null then
      raise exception 'lesson_empty' using errcode = 'P0002';
    end if;

    insert into public.lesson_sessions (user_id, lesson_id, question_ids)
    values (v_user, p_lesson, v_questions)
    returning * into v_session;

    insert into public.user_lesson_progress (user_id, lesson_id)
    values (v_user, p_lesson)
    on conflict (user_id, lesson_id) do nothing;

    v_course := private.lesson_course(p_lesson);
    insert into public.user_course_progress (user_id, course_id, last_lesson_id)
    values (v_user, v_course, p_lesson)
    on conflict (user_id, course_id) do update set last_lesson_id = excluded.last_lesson_id;
  end if;

  return jsonb_build_object(
    'session_id', v_session.id,
    'question_ids', to_jsonb(v_session.question_ids),
    'answers', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'question_id', a.question_id,
        'is_correct', a.is_correct,
        'score', a.score,
        'answer', a.answer,
        'solution', s.solution,
        'explanation', s.explanation
      )), '[]'::jsonb)
      from public.question_attempts a
      join private.question_solutions s on s.question_id = a.question_id
      where a.session_id = v_session.id
    )
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: submit one answer. Idempotent: a second submission returns the first result.
-- -----------------------------------------------------------------------------
create function public.submit_answer(p_session uuid, p_question uuid, p_answer jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_session public.lesson_sessions;
  v_attempt public.question_attempts;
  v_format public.question_format;
  v_solution jsonb;
  v_explanation text;
  v_correct boolean;
  v_score numeric;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_session from public.lesson_sessions
  where id = p_session and user_id = v_user
  for update;
  if not found then
    raise exception 'session_not_found' using errcode = 'P0002';
  end if;
  if v_session.completed_at is not null then
    raise exception 'session_completed' using errcode = '22023';
  end if;
  if not (p_question = any (v_session.question_ids)) then
    raise exception 'question_not_in_session' using errcode = '22023';
  end if;

  select s.solution, s.explanation into v_solution, v_explanation
  from private.question_solutions s where s.question_id = p_question;

  select * into v_attempt from public.question_attempts
  where session_id = p_session and question_id = p_question;
  if found then
    return jsonb_build_object('is_correct', v_attempt.is_correct, 'score', v_attempt.score,
      'solution', v_solution, 'explanation', v_explanation, 'replayed', true);
  end if;

  select q.format into v_format from public.questions q where q.id = p_question;
  if not coalesce(private.answer_is_well_formed(v_format, p_answer), false) then
    raise exception 'invalid_answer' using errcode = '22023';
  end if;

  select e.is_correct, e.score into v_correct, v_score
  from private.evaluate_answer(v_format, v_solution, p_answer) e;

  insert into public.question_attempts (session_id, user_id, question_id, answer, is_correct, score)
  values (p_session, v_user, p_question, p_answer, coalesce(v_correct, false), coalesce(v_score, 0));

  return jsonb_build_object('is_correct', coalesce(v_correct, false), 'score', coalesce(v_score, 0),
    'solution', v_solution, 'explanation', v_explanation, 'replayed', false);
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: complete a lesson. Requires every question answered. Idempotent.
-- -----------------------------------------------------------------------------
create function public.complete_lesson(p_session uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_session public.lesson_sessions;
  v_total int;
  v_answered int;
  v_correct int;
  v_score int;
  v_course uuid;
  v_rank bigint;
  v_next uuid;
  v_course_total int;
  v_course_done int;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_session from public.lesson_sessions
  where id = p_session and user_id = v_user
  for update;
  if not found then
    raise exception 'session_not_found' using errcode = 'P0002';
  end if;

  v_course := private.lesson_course(v_session.lesson_id);
  select o.rank into v_rank from private.course_lesson_order(v_course) o where o.lesson_id = v_session.lesson_id;
  select o.lesson_id into v_next from private.course_lesson_order(v_course) o where o.rank = v_rank + 1;
  v_total := cardinality(v_session.question_ids);

  if v_session.completed_at is null then
    select count(*), count(*) filter (where is_correct), coalesce(round(avg(score) * 100), 0)
    into v_answered, v_correct, v_score
    from public.question_attempts where session_id = p_session;

    if v_answered < v_total then
      raise exception 'lesson_incomplete' using errcode = '22023';
    end if;

    update public.lesson_sessions
    set completed_at = now(), correct_count = v_correct, score = v_score
    where id = p_session
    returning * into v_session;

    insert into public.user_lesson_progress (user_id, lesson_id, status, best_score, attempts, first_completed_at, last_completed_at)
    values (v_user, v_session.lesson_id, 'completed', v_score, 1, now(), now())
    on conflict (user_id, lesson_id) do update set
      status = 'completed',
      best_score = greatest(coalesce(public.user_lesson_progress.best_score, 0), excluded.best_score),
      attempts = public.user_lesson_progress.attempts + 1,
      first_completed_at = coalesce(public.user_lesson_progress.first_completed_at, now()),
      last_completed_at = now();

    select count(*) into v_course_total from private.course_lesson_order(v_course);
    select count(*) into v_course_done
    from public.user_lesson_progress p
    join private.course_lesson_order(v_course) o on o.lesson_id = p.lesson_id
    where p.user_id = v_user and p.status = 'completed';

    insert into public.user_course_progress (user_id, course_id, last_lesson_id, completed_lessons, completed_at)
    values (v_user, v_course, coalesce(v_next, v_session.lesson_id), v_course_done,
      case when v_course_done >= v_course_total then now() end)
    on conflict (user_id, course_id) do update set
      last_lesson_id = excluded.last_lesson_id,
      completed_lessons = excluded.completed_lessons,
      completed_at = coalesce(public.user_course_progress.completed_at, excluded.completed_at);
  end if;

  return jsonb_build_object(
    'lesson_id', v_session.lesson_id,
    'total', v_total,
    'correct', v_session.correct_count,
    'score', v_session.score,
    'perfect', v_session.correct_count = v_total,
    'next_lesson_id', v_next
  );
end;
$$;

revoke execute on function public.start_lesson(uuid) from public, anon;
revoke execute on function public.submit_answer(uuid, uuid, jsonb) from public, anon;
revoke execute on function public.complete_lesson(uuid) from public, anon;
grant execute on function public.start_lesson(uuid) to authenticated;
grant execute on function public.submit_answer(uuid, uuid, jsonb) to authenticated;
grant execute on function public.complete_lesson(uuid) to authenticated;

-- Private helpers: only the publication check is callable (needed by RLS policies).
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.lesson_is_published(uuid) to anon, authenticated;
grant execute on function private.content_visible(public.content_status) to anon, authenticated;
