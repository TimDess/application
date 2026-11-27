-- =============================================================================
-- Kulto — Phase 3B: spaced repetition (reviews) and the daily challenge.
--
-- * user_knowledge_state schedules each notion with Leitner boxes 1..7. Notions are
--   seeded when a lesson is completed (trigger on lesson_sessions) and move when they
--   are answered in a review.
-- * Reviews and daily challenges are "practice sessions": a frozen list of questions,
--   one attempt per question, scored by private.evaluate_answer(), rewarded by
--   complete_practice() in one transaction (XP, daily goal, streak).
-- * The daily challenge is the same for everyone: drawn from published questions
--   only, deterministically for the Paris day, stored in daily_challenges.
-- =============================================================================

alter type public.xp_reason add value if not exists 'review_answer';
alter type public.xp_reason add value if not exists 'review_completed';
alter type public.xp_reason add value if not exists 'daily_challenge';
alter type public.xp_source add value if not exists 'practice_session';
alter type public.xp_source add value if not exists 'daily_challenge';

create type public.practice_kind as enum ('review', 'daily');

insert into public.game_config (key, value, description) values
  ('review_intervals', '[1, 3, 7, 16, 35, 90, 180]', 'Days before a notion comes back, for Leitner boxes 1 to 7'),
  ('review_session_size', '10', 'Maximum questions in a review session'),
  ('xp_review_answer', '5', 'XP per right answer in a review'),
  ('xp_review_completed', '30', 'XP for finishing a review session'),
  ('xp_daily_challenge', '50', 'XP for finishing the daily challenge'),
  ('daily_challenge_size', '5', 'Questions in the daily challenge')
on conflict (key) do nothing;

alter table public.daily_activity
  add column practice_completed integer not null default 0 check (practice_completed >= 0);

-- -----------------------------------------------------------------------------
-- Knowledge state (Leitner)
-- -----------------------------------------------------------------------------
create table public.user_knowledge_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  knowledge_item_id uuid not null references public.knowledge_items (id) on delete cascade,
  box smallint not null default 1 check (box between 1 and 7),
  due_on date not null,
  correct_count integer not null default 0 check (correct_count >= 0),
  wrong_count integer not null default 0 check (wrong_count >= 0),
  last_question_id uuid references public.questions (id) on delete set null,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, knowledge_item_id)
);

create index user_knowledge_state_due_idx on public.user_knowledge_state (user_id, due_on);

create trigger user_knowledge_state_set_updated_at before update on public.user_knowledge_state
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Daily challenges and practice sessions
-- -----------------------------------------------------------------------------
create table public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  day date not null unique,
  question_ids uuid[] not null check (cardinality(question_ids) > 0),
  created_at timestamptz not null default now()
);

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind public.practice_kind not null,
  daily_challenge_id uuid references public.daily_challenges (id) on delete cascade,
  day date not null,
  question_ids uuid[] not null check (cardinality(question_ids) > 0),
  -- For reviews: the notion each question tests (same order as question_ids).
  knowledge_item_ids uuid[],
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  correct_count smallint,
  score smallint check (score is null or score between 0 and 100),
  rewards jsonb,
  constraint practice_sessions_daily_link check ((kind = 'daily') = (daily_challenge_id is not null))
);

create unique index practice_sessions_one_daily_per_user
  on public.practice_sessions (user_id, daily_challenge_id) where kind = 'daily';
create index practice_sessions_user_idx on public.practice_sessions (user_id, kind, started_at desc);

create table public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  answer jsonb not null,
  is_correct boolean not null,
  score numeric(4, 3) not null check (score between 0 and 1),
  created_at timestamptz not null default now(),
  unique (session_id, question_id)
);

alter table public.user_knowledge_state enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.practice_attempts enable row level security;

create policy "Users read their own knowledge state" on public.user_knowledge_state
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Signed-in users read daily challenges" on public.daily_challenges
  for select to authenticated using (true);
create policy "Users read their own practice sessions" on public.practice_sessions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users read their own practice attempts" on public.practice_attempts
  for select to authenticated using (user_id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['user_knowledge_state', 'daily_challenges', 'practice_sessions', 'practice_attempts']
  loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create function private.review_interval(p_box int)
returns int
language sql
stable
set search_path = ''
as $$
  select ((select value from public.game_config where key = 'review_intervals') ->> (least(greatest(p_box, 1), 7) - 1))::int;
$$;

-- The day shared by everyone for the daily challenge.
create function private.paris_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Paris')::date;
$$;

-- A notion is reviewable when at least one visible question tests it.
create function private.notion_question(p_notion uuid, p_avoid uuid, p_seed text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select q.id
  from public.question_knowledge_items qk
  join public.questions q on q.id = qk.question_id
  where qk.knowledge_item_id = p_notion and private.content_visible(q.status)
  order by (q.id = p_avoid), md5(q.id::text || p_seed)
  limit 1;
$$;

-- Seeds the notions of a completed lesson: new notions enter box 1 (due tomorrow);
-- a wrong answer sends a known notion back to box 1.
create function private.seed_knowledge_from_lesson()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_due date := private.user_today(new.user_id) + private.review_interval(1);
begin
  if old.completed_at is not null or new.completed_at is null then
    return new;
  end if;
  insert into public.user_knowledge_state (user_id, knowledge_item_id, box, due_on, correct_count, wrong_count, last_question_id)
  select new.user_id, qk.knowledge_item_id, 1, v_due,
    count(*) filter (where a.is_correct), count(*) filter (where not a.is_correct), max(a.question_id::text)::uuid
  from public.question_attempts a
  join public.question_knowledge_items qk on qk.question_id = a.question_id
  where a.session_id = new.id
  group by qk.knowledge_item_id
  on conflict (user_id, knowledge_item_id) do update set
    box = case when excluded.wrong_count > 0 then 1 else public.user_knowledge_state.box end,
    due_on = case when excluded.wrong_count > 0 then least(public.user_knowledge_state.due_on, excluded.due_on)
      else public.user_knowledge_state.due_on end,
    correct_count = public.user_knowledge_state.correct_count + excluded.correct_count,
    wrong_count = public.user_knowledge_state.wrong_count + excluded.wrong_count;
  return new;
end;
$$;

create trigger lesson_sessions_seed_knowledge after update of completed_at on public.lesson_sessions
  for each row execute function private.seed_knowledge_from_lesson();

-- Lessons completed before this migration: their notions are due today.
insert into public.user_knowledge_state (user_id, knowledge_item_id, box, due_on, correct_count, wrong_count)
select s.user_id, qk.knowledge_item_id, 1, (now() at time zone 'Europe/Paris')::date,
  count(*) filter (where a.is_correct), count(*) filter (where not a.is_correct)
from public.lesson_sessions s
join public.question_attempts a on a.session_id = s.id
join public.question_knowledge_items qk on qk.question_id = a.question_id
where s.completed_at is not null
group by s.user_id, qk.knowledge_item_id
on conflict (user_id, knowledge_item_id) do nothing;

-- Draws (once) the daily challenge of a day from published questions, the same for everyone.
create function private.ensure_daily_challenge(p_day date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_questions uuid[];
begin
  select id into v_id from public.daily_challenges where day = p_day;
  if found then
    return v_id;
  end if;

  -- Spread the draw across universes, then across questions.
  select array_agg(id order by rnk, pick) into v_questions
  from (
    select q.id, md5(q.id::text || p_day::text) as pick,
      row_number() over (partition by q.universe_id order by md5(q.id::text || p_day::text)) as rnk
    from public.questions q
    join public.universes u on u.id = q.universe_id and u.status = 'published'
    where q.status = 'published'
    order by rnk, pick
    limit private.config_number('daily_challenge_size')::int
  ) s;

  if v_questions is null then
    return null;
  end if;

  insert into public.daily_challenges (day, question_ids) values (p_day, v_questions)
  on conflict (day) do nothing;
  select id into v_id from public.daily_challenges where day = p_day;
  return v_id;
end;
$$;

-- Session payload: ids, and the attempts already made (with their correction).
create function private.practice_payload(p_session public.practice_sessions)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'session_id', p_session.id,
    'kind', p_session.kind,
    'day', p_session.day,
    'question_ids', to_jsonb(p_session.question_ids),
    'completed', p_session.completed_at is not null,
    'correct', p_session.correct_count,
    'score', p_session.score,
    'rewards', p_session.rewards,
    'answers', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'question_id', a.question_id,
        'is_correct', a.is_correct,
        'score', a.score,
        'answer', a.answer,
        'solution', s.solution,
        'explanation', s.explanation
      )), '[]'::jsonb)
      from public.practice_attempts a
      join private.question_solutions s on s.question_id = a.question_id
      where a.session_id = p_session.id
    )
  );
$$;

-- -----------------------------------------------------------------------------
-- RPC: start (or resume) today's review session
-- -----------------------------------------------------------------------------
create function public.start_review()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_today date;
  v_session public.practice_sessions;
  v_questions uuid[];
  v_notions uuid[];
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  v_today := private.user_today(v_user);

  select * into v_session from public.practice_sessions
  where user_id = v_user and kind = 'review' and completed_at is null and day = v_today
  order by started_at desc limit 1;
  if found then
    return private.practice_payload(v_session);
  end if;

  select array_agg(question_id order by ord), array_agg(knowledge_item_id order by ord)
  into v_questions, v_notions
  from (
    select k.knowledge_item_id, row_number() over (order by k.due_on, k.box, k.knowledge_item_id) as ord,
      private.notion_question(k.knowledge_item_id, k.last_question_id, v_today::text) as question_id
    from public.user_knowledge_state k
    where k.user_id = v_user and k.due_on <= v_today
    order by k.due_on, k.box, k.knowledge_item_id
  ) d
  where question_id is not null
    and ord <= private.config_number('review_session_size');

  if v_questions is null then
    raise exception 'nothing_to_review' using errcode = 'P0002';
  end if;

  insert into public.practice_sessions (user_id, kind, day, question_ids, knowledge_item_ids)
  values (v_user, 'review', v_today, v_questions, v_notions)
  returning * into v_session;
  return private.practice_payload(v_session);
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: start (or resume, or show) today's daily challenge
-- -----------------------------------------------------------------------------
create function public.start_daily_challenge()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_day date := private.paris_today();
  v_challenge uuid;
  v_session public.practice_sessions;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  v_challenge := private.ensure_daily_challenge(v_day);
  if v_challenge is null then
    raise exception 'no_daily_challenge' using errcode = 'P0002';
  end if;

  select * into v_session from public.practice_sessions
  where user_id = v_user and kind = 'daily' and daily_challenge_id = v_challenge;
  if not found then
    insert into public.practice_sessions (user_id, kind, daily_challenge_id, day, question_ids)
    select v_user, 'daily', c.id, c.day, c.question_ids from public.daily_challenges c where c.id = v_challenge
    on conflict do nothing;
    select * into v_session from public.practice_sessions
    where user_id = v_user and kind = 'daily' and daily_challenge_id = v_challenge;
  end if;
  return private.practice_payload(v_session);
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: answer one question of a practice session (one attempt, scored server-side)
-- -----------------------------------------------------------------------------
create function public.submit_practice_answer(p_session uuid, p_question uuid, p_answer jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_session public.practice_sessions;
  v_attempt public.practice_attempts;
  v_format public.question_format;
  v_solution jsonb;
  v_explanation text;
  v_correct boolean;
  v_score numeric;
  v_notion uuid;
  v_box int;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_session from public.practice_sessions
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

  select * into v_attempt from public.practice_attempts
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
  v_correct := coalesce(v_correct, false);

  insert into public.practice_attempts (session_id, user_id, question_id, answer, is_correct, score)
  values (p_session, v_user, p_question, p_answer, v_correct, coalesce(v_score, 0));

  -- Reviews move the notion: right → next box, wrong → box 1.
  if v_session.kind = 'review' then
    v_notion := v_session.knowledge_item_ids[array_position(v_session.question_ids, p_question)];
    select box into v_box from public.user_knowledge_state
    where user_id = v_user and knowledge_item_id = v_notion for update;
    if found then
      v_box := case when v_correct then least(v_box + 1, 7) else 1 end;
      update public.user_knowledge_state set
        box = v_box,
        due_on = private.user_today(v_user) + private.review_interval(v_box),
        correct_count = correct_count + case when v_correct then 1 else 0 end,
        wrong_count = wrong_count + case when v_correct then 0 else 1 end,
        last_question_id = p_question,
        last_reviewed_at = now()
      where user_id = v_user and knowledge_item_id = v_notion;
    end if;
  end if;

  return jsonb_build_object('is_correct', v_correct, 'score', coalesce(v_score, 0),
    'solution', v_solution, 'explanation', v_explanation, 'replayed', false);
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: complete a practice session and grant its rewards. Idempotent.
-- -----------------------------------------------------------------------------
create function public.complete_practice(p_session uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_session public.practice_sessions;
  v_total int;
  v_answered int;
  v_correct int;
  v_score int;
  v_items jsonb := '[]'::jsonb;
  v_gain int;
  v_xp int;
  v_stats_before public.user_stats;
  v_total_after int;
  v_level_after int;
  v_day date;
  v_goal int;
  v_today_before int;
  v_streak jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_session from public.practice_sessions
  where id = p_session and user_id = v_user
  for update;
  if not found then
    raise exception 'session_not_found' using errcode = 'P0002';
  end if;
  v_total := cardinality(v_session.question_ids);

  if v_session.completed_at is null then
    select count(*), count(*) filter (where is_correct), coalesce(round(avg(score) * 100), 0)
    into v_answered, v_correct, v_score
    from public.practice_attempts where session_id = p_session;
    if v_answered < v_total then
      raise exception 'session_incomplete' using errcode = '22023';
    end if;

    if v_session.kind = 'review' then
      v_gain := private.grant_xp(v_user, (v_correct * private.config_number('xp_review_answer'))::int,
        'review_answer', 'practice_session', p_session, null, null);
      if v_gain > 0 then
        v_items := v_items || jsonb_build_object('reason', 'review_answer', 'amount', v_gain);
      end if;
      v_gain := private.grant_xp(v_user, private.config_number('xp_review_completed')::int,
        'review_completed', 'practice_session', p_session, null, null);
      if v_gain > 0 then
        v_items := v_items || jsonb_build_object('reason', 'review_completed', 'amount', v_gain);
      end if;
    else
      v_gain := private.grant_xp(v_user, private.config_number('xp_daily_challenge')::int,
        'daily_challenge', 'daily_challenge', v_session.daily_challenge_id, null, null);
      if v_gain > 0 then
        v_items := v_items || jsonb_build_object('reason', 'daily_challenge', 'amount', v_gain);
      end if;
    end if;
    select coalesce(sum((i ->> 'amount')::int), 0) into v_xp from jsonb_array_elements(v_items) i;

    insert into public.user_stats (user_id) values (v_user) on conflict (user_id) do nothing;
    select * into v_stats_before from public.user_stats where user_id = v_user for update;
    v_total_after := v_stats_before.total_xp + v_xp;
    v_level_after := private.level_for_xp(v_total_after);
    update public.user_stats set total_xp = v_total_after, level = v_level_after where user_id = v_user;

    v_day := private.user_today(v_user);
    v_goal := private.user_goal_xp(v_user);
    select coalesce((select xp from public.daily_activity where user_id = v_user and day = v_day), 0) into v_today_before;
    insert into public.daily_activity (user_id, day, xp, practice_completed, goal_xp, goal_met)
    values (v_user, v_day, v_xp, 1, v_goal, v_xp >= v_goal)
    on conflict (user_id, day) do update set
      xp = public.daily_activity.xp + excluded.xp,
      practice_completed = public.daily_activity.practice_completed + 1,
      goal_xp = excluded.goal_xp,
      goal_met = public.daily_activity.xp + excluded.xp >= excluded.goal_xp,
      frozen = false;

    v_streak := private.register_activity(v_user, v_day);

    update public.practice_sessions set
      completed_at = now(),
      correct_count = v_correct,
      score = v_score,
      rewards = jsonb_build_object(
        'items', v_items,
        'xp', v_xp,
        'total_xp_before', v_stats_before.total_xp,
        'total_xp_after', v_total_after,
        'level_before', v_stats_before.level,
        'level_after', v_level_after,
        'level_floor_xp', private.xp_for_level(v_level_after),
        'next_level_xp', private.xp_for_level(v_level_after + 1),
        'previous_floor_xp', private.xp_for_level(v_stats_before.level),
        'previous_next_xp', private.xp_for_level(v_stats_before.level + 1),
        'universe_level_before', null,
        'universe_level_after', null,
        'goal_xp', v_goal,
        'today_xp_before', v_today_before,
        'today_xp_after', v_today_before + v_xp,
        'streak', v_streak
      )
    where id = p_session
    returning * into v_session;
  end if;

  return jsonb_build_object(
    'total', v_total,
    'correct', v_session.correct_count,
    'score', v_session.score,
    'perfect', v_session.correct_count = v_total,
    'rewards', v_session.rewards
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- get_my_progress: adds reviews due and today's daily challenge
-- -----------------------------------------------------------------------------
create or replace function public.get_my_progress()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_stats public.user_stats;
  v_streak public.user_streaks;
  v_today date;
  v_today_xp int;
  v_today_lessons int;
  v_goal int;
  v_level int;
  v_total int;
  v_current int := 0;
  v_status text := 'none';
  v_missed int;
  v_daily public.daily_challenges;
  v_daily_session public.practice_sessions;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_stats from public.user_stats where user_id = v_user;
  select * into v_streak from public.user_streaks where user_id = v_user;
  v_today := private.user_today(v_user);
  v_goal := private.user_goal_xp(v_user);
  select xp, lessons_completed + practice_completed into v_today_xp, v_today_lessons
  from public.daily_activity where user_id = v_user and day = v_today;
  v_today_xp := coalesce(v_today_xp, 0);
  v_today_lessons := coalesce(v_today_lessons, 0);
  v_total := coalesce(v_stats.total_xp, 0);
  v_level := coalesce(v_stats.level, 1);

  if v_streak.last_active_day is not null and v_streak.current > 0 then
    if v_streak.last_active_day >= v_today then
      v_status := 'done';
      v_current := v_streak.current;
    elsif v_streak.last_active_day = v_today - 1 then
      v_status := 'pending';
      v_current := v_streak.current;
    else
      v_missed := v_today - v_streak.last_active_day - 1;
      if v_streak.freezes >= v_missed then
        v_status := 'protected';
        v_current := v_streak.current;
      else
        v_status := 'paused';
      end if;
    end if;
  end if;

  -- Read-only here: the challenge is drawn on first start; show it if it exists or can exist.
  select * into v_daily from public.daily_challenges where day = private.paris_today();
  if found then
    select * into v_daily_session from public.practice_sessions
    where user_id = v_user and kind = 'daily' and daily_challenge_id = v_daily.id;
  end if;

  return jsonb_build_object(
    'total_xp', v_total,
    'level', v_level,
    'level_floor_xp', private.xp_for_level(v_level),
    'next_level_xp', private.xp_for_level(v_level + 1),
    'lessons_completed', coalesce(v_stats.lessons_completed, 0),
    'today', jsonb_build_object('day', v_today, 'xp', v_today_xp, 'lessons', v_today_lessons, 'goal_xp', v_goal),
    'streak', jsonb_build_object(
      'current', v_current,
      'longest', coalesce(v_streak.longest, 0),
      'freezes', coalesce(v_streak.freezes, 0),
      'status', v_status
    ),
    'week', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', d::date,
        'active', coalesce(a.lessons_completed + a.practice_completed, 0) > 0,
        'frozen', coalesce(a.frozen, false)
      ) order by d), '[]'::jsonb)
      from generate_series(v_today - 6, v_today, interval '1 day') d
      left join public.daily_activity a on a.user_id = v_user and a.day = d::date
    ),
    'universes', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'universe_id', s.universe_id,
        'slug', u.slug,
        'xp', s.xp,
        'level', s.level,
        'level_floor_xp', private.xp_for_level(s.level),
        'next_level_xp', private.xp_for_level(s.level + 1)
      ) order by s.xp desc), '[]'::jsonb)
      from public.user_universe_stats s
      join public.universes u on u.id = s.universe_id
      where s.user_id = v_user
    ),
    'reviews', jsonb_build_object(
      'due', (
        select count(*) from public.user_knowledge_state k
        where k.user_id = v_user and k.due_on <= v_today
          and private.notion_question(k.knowledge_item_id, null, '') is not null
      ),
      'known', (select count(*) from public.user_knowledge_state k where k.user_id = v_user),
      'mastered', (select count(*) from public.user_knowledge_state k where k.user_id = v_user and k.box >= 5)
    ),
    'daily', jsonb_build_object(
      'day', private.paris_today(),
      'available', v_daily.id is not null or exists (
        select 1 from public.questions q
        join public.universes u on u.id = q.universe_id and u.status = 'published'
        where q.status = 'published'
      ),
      'started', v_daily_session.id is not null,
      'completed', v_daily_session.completed_at is not null,
      'correct', v_daily_session.correct_count,
      'total', cardinality(v_daily_session.question_ids),
      'results', (
        select coalesce(jsonb_agg(coalesce(a.is_correct, false) order by q.ord), '[]'::jsonb)
        from unnest(v_daily_session.question_ids) with ordinality q(id, ord)
        left join public.practice_attempts a on a.session_id = v_daily_session.id and a.question_id = q.id
        where v_daily_session.completed_at is not null
      )
    )
  );
end;
$$;

revoke execute on function public.start_review() from public, anon;
revoke execute on function public.start_daily_challenge() from public, anon;
revoke execute on function public.submit_practice_answer(uuid, uuid, jsonb) from public, anon;
revoke execute on function public.complete_practice(uuid) from public, anon;
revoke execute on function public.get_my_progress() from public, anon;
grant execute on function public.start_review() to authenticated;
grant execute on function public.start_daily_challenge() to authenticated;
grant execute on function public.submit_practice_answer(uuid, uuid, jsonb) to authenticated;
grant execute on function public.complete_practice(uuid) to authenticated;
grant execute on function public.get_my_progress() to authenticated;

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.lesson_is_published(uuid) to anon, authenticated;
grant execute on function private.content_visible(public.content_status) to anon, authenticated;
