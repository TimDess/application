-- =============================================================================
-- Kulto — Phase 3A: XP, levels, daily goal and streak.
--
-- * Every reward is a row in public.xp_transactions. A UNIQUE constraint on
--   (user_id, reason, source_type, source_id) makes double attribution impossible:
--   each reward (an answer, a lesson, a perfect run, a chapter, a passed exam) is
--   earned at most once, on whichever attempt first qualifies.
-- * Rewards are only granted by public.complete_lesson(), in the same transaction as
--   the completion. Clients read their totals; nobody writes them through the API.
-- * Tunable values live in public.game_config (readable by everyone).
-- * The day used for the streak and the daily goal is the user's local day
--   (user_settings.timezone, Europe/Paris if invalid).
-- =============================================================================

create type public.xp_reason as enum (
  'correct_answer', 'lesson_completed', 'lesson_perfect', 'chapter_completed', 'exam_passed'
);
create type public.xp_source as enum ('question', 'lesson', 'chapter');

-- -----------------------------------------------------------------------------
-- Configuration
-- -----------------------------------------------------------------------------
create table public.game_config (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  value jsonb not null,
  description text not null default '',
  updated_at timestamptz not null default now()
);

create trigger game_config_set_updated_at before update on public.game_config
  for each row execute function private.set_updated_at();

insert into public.game_config (key, value, description) values
  ('xp_correct_answer', '10', 'XP for a right answer (partial answers earn a share)'),
  ('xp_lesson_completed', '50', 'XP for finishing a lesson'),
  ('xp_lesson_perfect', '20', 'Bonus XP for a lesson with every answer right'),
  ('xp_chapter_completed', '150', 'XP for finishing every lesson of a chapter'),
  ('xp_exam_passed', '100', 'XP for passing a chapter exam'),
  ('exam_pass_score', '70', 'Minimum score (0-100) to pass a chapter exam'),
  ('level_base', '100', 'Cumulative XP for level L = level_base * (L - 1) ^ level_exponent'),
  ('level_exponent', '1.6', 'See level_base'),
  ('goal_xp_per_minute', '20', 'Daily goal in XP = daily_goal_minutes * goal_xp_per_minute'),
  ('streak_freeze_every_days', '7', 'A streak freeze is earned every N days of streak'),
  ('streak_freeze_max', '2', 'Maximum streak freezes in stock');

alter table public.game_config enable row level security;
create policy "Everyone reads the game configuration" on public.game_config
  for select to anon, authenticated using (true);
revoke all on table public.game_config from anon, authenticated;
grant select on table public.game_config to anon, authenticated;

create function private.config_number(p_key text)
returns numeric
language sql
stable
set search_path = ''
as $$
  select (value #>> '{}')::numeric from public.game_config where key = p_key;
$$;

-- -----------------------------------------------------------------------------
-- Levels
-- -----------------------------------------------------------------------------
create function private.xp_for_level(p_level int)
returns int
language sql
stable
set search_path = ''
as $$
  select case when p_level <= 1 then 0
    else round(private.config_number('level_base') * power(p_level - 1, private.config_number('level_exponent')))::int
  end;
$$;

create function private.level_for_xp(p_xp int)
returns int
language plpgsql
stable
set search_path = ''
as $$
declare
  v_level int;
begin
  if p_xp is null or p_xp <= 0 then
    return 1;
  end if;
  v_level := floor(power(p_xp / private.config_number('level_base'), 1 / private.config_number('level_exponent')))::int + 1;
  -- Correct floating point drift at the boundaries.
  while private.xp_for_level(v_level + 1) <= p_xp loop
    v_level := v_level + 1;
  end loop;
  while v_level > 1 and private.xp_for_level(v_level) > p_xp loop
    v_level := v_level - 1;
  end loop;
  return v_level;
end;
$$;

-- -----------------------------------------------------------------------------
-- Tables (read-only for their owner, written by complete_lesson only)
-- -----------------------------------------------------------------------------
create table public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null check (amount > 0),
  reason public.xp_reason not null,
  source_type public.xp_source not null,
  source_id uuid not null,
  universe_id uuid references public.universes (id) on delete set null,
  session_id uuid references public.lesson_sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, reason, source_type, source_id)
);

create index xp_transactions_user_idx on public.xp_transactions (user_id, created_at desc);

create table public.user_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  level integer not null default 1 check (level >= 1),
  lessons_completed integer not null default 0 check (lessons_completed >= 0),
  updated_at timestamptz not null default now()
);

create table public.user_universe_stats (
  user_id uuid not null references auth.users (id) on delete cascade,
  universe_id uuid not null references public.universes (id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  updated_at timestamptz not null default now(),
  primary key (user_id, universe_id)
);

create table public.daily_activity (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  xp integer not null default 0 check (xp >= 0),
  lessons_completed integer not null default 0 check (lessons_completed >= 0),
  goal_xp integer not null default 0 check (goal_xp >= 0),
  goal_met boolean not null default false,
  -- A missed day covered by a streak freeze.
  frozen boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table public.user_streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current integer not null default 0 check (current >= 0),
  longest integer not null default 0 check (longest >= 0),
  last_active_day date,
  freezes integer not null default 0 check (freezes >= 0),
  updated_at timestamptz not null default now()
);

create trigger user_stats_set_updated_at before update on public.user_stats
  for each row execute function private.set_updated_at();
create trigger user_universe_stats_set_updated_at before update on public.user_universe_stats
  for each row execute function private.set_updated_at();
create trigger daily_activity_set_updated_at before update on public.daily_activity
  for each row execute function private.set_updated_at();
create trigger user_streaks_set_updated_at before update on public.user_streaks
  for each row execute function private.set_updated_at();

alter table public.xp_transactions enable row level security;
alter table public.user_stats enable row level security;
alter table public.user_universe_stats enable row level security;
alter table public.daily_activity enable row level security;
alter table public.user_streaks enable row level security;

create policy "Users read their own XP" on public.xp_transactions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users read their own stats" on public.user_stats
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users read their own universe stats" on public.user_universe_stats
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users read their own daily activity" on public.daily_activity
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users read their own streak" on public.user_streaks
  for select to authenticated using (user_id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['xp_transactions', 'user_stats', 'user_universe_stats', 'daily_activity', 'user_streaks']
  loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
  end loop;
end;
$$;

-- Rewards granted when a session was completed, so the summary stays identical on replay.
alter table public.lesson_sessions add column rewards jsonb;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
-- The user's local day. An unknown time zone falls back to Europe/Paris.
create function private.user_today(p_user uuid)
returns date
language plpgsql
stable
set search_path = ''
as $$
declare
  v_tz text;
begin
  select timezone into v_tz from public.user_settings where user_id = p_user;
  begin
    return (now() at time zone coalesce(v_tz, 'Europe/Paris'))::date;
  exception when others then
    return (now() at time zone 'Europe/Paris')::date;
  end;
end;
$$;

create function private.user_goal_xp(p_user uuid)
returns int
language sql
stable
set search_path = ''
as $$
  select (coalesce((select daily_goal_minutes from public.user_settings where user_id = p_user), 10)
    * private.config_number('goal_xp_per_minute'))::int;
$$;

-- Grants one reward if it was never granted. Returns the XP added (0 if already granted).
create function private.grant_xp(
  p_user uuid, p_amount int, p_reason public.xp_reason, p_source_type public.xp_source,
  p_source_id uuid, p_universe uuid, p_session uuid
)
returns int
language plpgsql
set search_path = ''
as $$
declare
  v_inserted int;
begin
  if p_amount is null or p_amount <= 0 then
    return 0;
  end if;
  insert into public.xp_transactions (user_id, amount, reason, source_type, source_id, universe_id, session_id)
  values (p_user, p_amount, p_reason, p_source_type, p_source_id, p_universe, p_session)
  on conflict (user_id, reason, source_type, source_id) do nothing;
  get diagnostics v_inserted = row_count;
  return case when v_inserted = 1 then p_amount else 0 end;
end;
$$;

-- Records a completed lesson on the user's local day and moves the streak.
create function private.register_activity(p_user uuid, p_day date)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_streak public.user_streaks;
  v_before int;
  v_missed int;
  v_used int := 0;
  v_earned boolean := false;
  v_every int := private.config_number('streak_freeze_every_days')::int;
  v_max int := private.config_number('streak_freeze_max')::int;
begin
  insert into public.user_streaks (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into v_streak from public.user_streaks where user_id = p_user for update;
  v_before := v_streak.current;

  if v_streak.last_active_day is not null and v_streak.last_active_day >= p_day then
    return jsonb_build_object('before', v_before, 'after', v_streak.current, 'extended', false,
      'freezes_used', 0, 'freeze_earned', false, 'freezes', v_streak.freezes);
  end if;

  if v_streak.last_active_day is null or v_streak.last_active_day = p_day - 1 then
    v_streak.current := v_streak.current + 1;
  else
    v_missed := p_day - v_streak.last_active_day - 1;
    if v_streak.current > 0 and v_streak.freezes >= v_missed then
      v_used := v_missed;
      v_streak.freezes := v_streak.freezes - v_missed;
      v_streak.current := v_streak.current + 1;
      insert into public.daily_activity (user_id, day, frozen)
      select p_user, d::date, true
      from generate_series(v_streak.last_active_day + 1, p_day - 1, interval '1 day') d
      on conflict (user_id, day) do update set frozen = true;
    else
      v_streak.current := 1;
    end if;
  end if;

  if v_streak.current % v_every = 0 and v_streak.freezes < v_max then
    v_streak.freezes := v_streak.freezes + 1;
    v_earned := true;
  end if;

  update public.user_streaks set
    current = v_streak.current,
    longest = greatest(longest, v_streak.current),
    last_active_day = p_day,
    freezes = v_streak.freezes
  where user_id = p_user;

  return jsonb_build_object('before', v_before, 'after', v_streak.current, 'extended', true,
    'freezes_used', v_used, 'freeze_earned', v_earned, 'freezes', v_streak.freezes);
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: complete a lesson (replaces the phase 2 version) and grant its rewards.
-- -----------------------------------------------------------------------------
create or replace function public.complete_lesson(p_session uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_session public.lesson_sessions;
  v_lesson public.lessons;
  v_total int;
  v_answered int;
  v_correct int;
  v_score int;
  v_course uuid;
  v_universe uuid;
  v_rank bigint;
  v_next uuid;
  v_course_total int;
  v_course_done int;
  v_chapter_total int;
  v_chapter_done int;
  v_items jsonb := '[]'::jsonb;
  v_gain int;
  v_answers_xp int := 0;
  v_xp int := 0;
  v_attempt record;
  v_day date;
  v_goal int;
  v_today_before int;
  v_stats_before public.user_stats;
  v_total_after int;
  v_level_after int;
  v_universe_level_before int;
  v_universe_level_after int;
  v_universe_xp_after int;
  v_streak jsonb;
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

  select * into v_lesson from public.lessons where id = v_session.lesson_id;
  v_course := private.lesson_course(v_session.lesson_id);
  select c.universe_id into v_universe
  from public.courses co join public.categories c on c.id = co.category_id where co.id = v_course;
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

    -- ---- Rewards ------------------------------------------------------------
    insert into public.user_stats (user_id) values (v_user) on conflict (user_id) do nothing;
    select * into v_stats_before from public.user_stats where user_id = v_user for update;
    insert into public.user_universe_stats (user_id, universe_id) values (v_user, v_universe)
    on conflict (user_id, universe_id) do nothing;
    select level into v_universe_level_before from public.user_universe_stats
    where user_id = v_user and universe_id = v_universe for update;

    for v_attempt in
      select question_id, score from public.question_attempts where session_id = p_session and score > 0
    loop
      v_answers_xp := v_answers_xp + private.grant_xp(v_user,
        round(private.config_number('xp_correct_answer') * v_attempt.score)::int,
        'correct_answer', 'question', v_attempt.question_id, v_universe, p_session);
    end loop;
    if v_answers_xp > 0 then
      v_items := v_items || jsonb_build_object('reason', 'correct_answer', 'amount', v_answers_xp);
    end if;

    v_gain := private.grant_xp(v_user, private.config_number('xp_lesson_completed')::int,
      'lesson_completed', 'lesson', v_session.lesson_id, v_universe, p_session);
    if v_gain > 0 then
      v_items := v_items || jsonb_build_object('reason', 'lesson_completed', 'amount', v_gain);
    end if;

    if v_correct = v_total then
      v_gain := private.grant_xp(v_user, private.config_number('xp_lesson_perfect')::int,
        'lesson_perfect', 'lesson', v_session.lesson_id, v_universe, p_session);
      if v_gain > 0 then
        v_items := v_items || jsonb_build_object('reason', 'lesson_perfect', 'amount', v_gain);
      end if;
    end if;

    if v_lesson.kind = 'exam' and v_score >= private.config_number('exam_pass_score') then
      v_gain := private.grant_xp(v_user, private.config_number('xp_exam_passed')::int,
        'exam_passed', 'lesson', v_session.lesson_id, v_universe, p_session);
      if v_gain > 0 then
        v_items := v_items || jsonb_build_object('reason', 'exam_passed', 'amount', v_gain);
      end if;
    end if;

    select count(*) into v_chapter_total
    from public.lessons l
    where l.chapter_id = v_lesson.chapter_id and private.lesson_is_published(l.id);
    select count(*) into v_chapter_done
    from public.lessons l
    join public.user_lesson_progress p on p.lesson_id = l.id and p.user_id = v_user and p.status = 'completed'
    where l.chapter_id = v_lesson.chapter_id and private.lesson_is_published(l.id);
    if v_chapter_total > 0 and v_chapter_done >= v_chapter_total then
      v_gain := private.grant_xp(v_user, private.config_number('xp_chapter_completed')::int,
        'chapter_completed', 'chapter', v_lesson.chapter_id, v_universe, p_session);
      if v_gain > 0 then
        v_items := v_items || jsonb_build_object('reason', 'chapter_completed', 'amount', v_gain);
      end if;
    end if;

    select coalesce(sum((i ->> 'amount')::int), 0) into v_xp from jsonb_array_elements(v_items) i;

    v_total_after := v_stats_before.total_xp + v_xp;
    v_level_after := private.level_for_xp(v_total_after);
    update public.user_stats set
      total_xp = v_total_after,
      level = v_level_after,
      lessons_completed = lessons_completed + 1
    where user_id = v_user;

    update public.user_universe_stats set
      xp = xp + v_xp,
      level = private.level_for_xp(xp + v_xp)
    where user_id = v_user and universe_id = v_universe
    returning xp, level into v_universe_xp_after, v_universe_level_after;

    v_day := private.user_today(v_user);
    v_goal := private.user_goal_xp(v_user);
    select coalesce((select xp from public.daily_activity where user_id = v_user and day = v_day), 0) into v_today_before;
    insert into public.daily_activity (user_id, day, xp, lessons_completed, goal_xp, goal_met)
    values (v_user, v_day, v_xp, 1, v_goal, v_xp >= v_goal)
    on conflict (user_id, day) do update set
      xp = public.daily_activity.xp + excluded.xp,
      lessons_completed = public.daily_activity.lessons_completed + 1,
      goal_xp = excluded.goal_xp,
      goal_met = public.daily_activity.xp + excluded.xp >= excluded.goal_xp,
      frozen = false;

    v_streak := private.register_activity(v_user, v_day);

    update public.lesson_sessions set rewards = jsonb_build_object(
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
      'universe_id', v_universe,
      'universe_xp_after', v_universe_xp_after,
      'universe_level_before', v_universe_level_before,
      'universe_level_after', v_universe_level_after,
      'goal_xp', v_goal,
      'today_xp_before', v_today_before,
      'today_xp_after', v_today_before + v_xp,
      'streak', v_streak
    )
    where id = p_session
    returning * into v_session;
  end if;

  return jsonb_build_object(
    'lesson_id', v_session.lesson_id,
    'total', v_total,
    'correct', v_session.correct_count,
    'score', v_session.score,
    'perfect', v_session.correct_count = v_total,
    'next_lesson_id', v_next,
    'rewards', v_session.rewards
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: the signed-in user's progress (level, today, streak), computed on their day.
-- -----------------------------------------------------------------------------
create function public.get_my_progress()
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
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_stats from public.user_stats where user_id = v_user;
  select * into v_streak from public.user_streaks where user_id = v_user;
  v_today := private.user_today(v_user);
  v_goal := private.user_goal_xp(v_user);
  select coalesce(xp, 0), coalesce(lessons_completed, 0) into v_today_xp, v_today_lessons
  from public.daily_activity where user_id = v_user and day = v_today;
  v_today_xp := coalesce(v_today_xp, 0);
  v_today_lessons := coalesce(v_today_lessons, 0);
  v_total := coalesce(v_stats.total_xp, 0);
  v_level := coalesce(v_stats.level, 1);

  -- 'done': played today · 'pending': alive, play today to extend it ·
  -- 'protected': days were missed but freezes will cover them · 'paused': broken · 'none'
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
        'active', coalesce(a.lessons_completed, 0) > 0,
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
    )
  );
end;
$$;

revoke execute on function public.complete_lesson(uuid) from public, anon;
revoke execute on function public.get_my_progress() from public, anon;
grant execute on function public.complete_lesson(uuid) to authenticated;
grant execute on function public.get_my_progress() to authenticated;

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.lesson_is_published(uuid) to anon, authenticated;
grant execute on function private.content_visible(public.content_status) to anon, authenticated;
