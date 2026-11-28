-- =============================================================================
-- Kulto — Phase 4A: asynchronous duels, invite links and hidden rating (Elo).
--
-- * A duel is 7 questions (quiz, true/false, guess the year), the same for both players.
--   Each player plays on their own time; the duel completes when both have finished.
-- * Questions are served one at a time by next_duel_question(), which starts a
--   server-side clock (15 s + network grace). answer_duel_question() scores in Postgres:
--   100 × difficulty multiplier, + speed bonus capped at 25 %, + streak bonus capped at 30.
-- * Matchmaking ("quick" duels) pairs players of similar hidden rating. Link duels are
--   joined with an invite code; rematches are created for the same two players.
-- * Nothing about duels is written by the client: every table is read-only and the
--   question list is never exposed before a question is served.
-- =============================================================================

alter type public.xp_reason add value if not exists 'duel_played';
alter type public.xp_reason add value if not exists 'duel_won';
alter type public.xp_source add value if not exists 'duel';

create type public.duel_mode as enum ('quick', 'link', 'rematch');
create type public.duel_status as enum ('open', 'active', 'completed', 'expired', 'cancelled');

insert into public.game_config (key, value, description) values
  ('duel_question_count', '7', 'Questions per duel'),
  ('duel_seconds', '15', 'Seconds to answer a duel question'),
  ('duel_grace_ms', '800', 'Network tolerance after the deadline, in milliseconds'),
  ('duel_hours', '48', 'Hours an opponent has to play their part'),
  ('duel_formats', '["quiz", "true_false", "guess_year"]', 'Question formats used in duels (fast to answer)'),
  ('xp_duel_played', '10', 'XP for finishing your part of a duel'),
  ('xp_duel_won_bonus', '10', 'Extra XP for winning a duel'),
  ('rating_start', '1000', 'Hidden rating of a new player'),
  ('rating_k_new', '40', 'Elo K factor for a player with fewer than 20 duels'),
  ('rating_k', '24', 'Elo K factor afterwards')
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table public.player_ratings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  rating integer not null default 1000,
  duels integer not null default 0 check (duels >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  draws integer not null default 0 check (draws >= 0),
  updated_at timestamptz not null default now()
);

create table public.duels (
  id uuid primary key default gen_random_uuid(),
  mode public.duel_mode not null,
  status public.duel_status not null default 'open',
  creator_id uuid not null references auth.users (id) on delete cascade,
  opponent_id uuid references auth.users (id) on delete cascade,
  invite_code text unique check (invite_code is null or invite_code ~ '^[a-z0-9]{8}$'),
  question_ids uuid[] not null check (cardinality(question_ids) > 0),
  rematch_of uuid references public.duels (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz,
  winner_id uuid references auth.users (id) on delete set null,
  is_draw boolean not null default false,
  constraint duels_two_players check (opponent_id is null or opponent_id <> creator_id)
);

create index duels_creator_idx on public.duels (creator_id, created_at desc);
create index duels_opponent_idx on public.duels (opponent_id, created_at desc);
create index duels_pool_idx on public.duels (status, mode) where opponent_id is null;

create table public.duel_players (
  duel_id uuid not null references public.duels (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  finished_at timestamptz,
  score integer not null default 0 check (score >= 0),
  correct smallint not null default 0 check (correct >= 0),
  answered smallint not null default 0 check (answered >= 0),
  rating_before integer,
  rating_after integer,
  primary key (duel_id, user_id)
);

create index duel_players_user_idx on public.duel_players (user_id, joined_at desc);

create table public.duel_answers (
  duel_id uuid not null references public.duels (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position smallint not null check (position > 0),
  question_id uuid not null references public.questions (id) on delete cascade,
  served_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  answered_at timestamptz,
  answer jsonb,
  is_correct boolean,
  score numeric(4, 3),
  points integer not null default 0 check (points >= 0),
  primary key (duel_id, user_id, position)
);

alter table public.player_ratings enable row level security;
alter table public.duels enable row level security;
alter table public.duel_players enable row level security;
alter table public.duel_answers enable row level security;

create policy "Users read their own rating" on public.player_ratings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Participants read their duels" on public.duels
  for select to authenticated using ((select auth.uid()) in (creator_id, opponent_id));
create policy "Participants read duel players" on public.duel_players
  for select to authenticated using (exists (
    select 1 from public.duels d where d.id = duel_id and (select auth.uid()) in (d.creator_id, d.opponent_id)));
create policy "Users read their own duel answers" on public.duel_answers
  for select to authenticated using (user_id = (select auth.uid()));

revoke all on table public.player_ratings, public.duels, public.duel_players, public.duel_answers from anon, authenticated;
grant select on table public.player_ratings, public.duel_players, public.duel_answers to authenticated;
-- The question list and the invite code stay server-side (served by the RPCs).
grant select (id, mode, status, creator_id, opponent_id, rematch_of, created_at, expires_at, completed_at, winner_id, is_draw)
  on table public.duels to authenticated;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create function private.player_rating(p_user uuid)
returns int
language sql
stable
set search_path = ''
as $$
  select coalesce((select rating from public.player_ratings where user_id = p_user),
    private.config_number('rating_start')::int);
$$;

-- Draws the questions of a new duel among published, fast formats, across universes.
create function private.draw_duel_questions()
returns uuid[]
language sql
volatile
security definer
set search_path = ''
as $$
  select array_agg(id) from (
    select q.id
    from public.questions q
    join public.universes u on u.id = q.universe_id and u.status = 'published'
    where q.status = 'published'
      and q.format::text in (select jsonb_array_elements_text(value) from public.game_config where key = 'duel_formats')
    order by random()
    limit private.config_number('duel_question_count')::int
  ) s;
$$;

create function private.new_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.duels where invite_code = v_code);
  end loop;
  return v_code;
end;
$$;

-- Adds XP outside lessons (duels): totals, level and today's activity.
create function private.add_xp(p_user uuid, p_xp int)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_day date := private.user_today(p_user);
  v_goal int := private.user_goal_xp(p_user);
begin
  if p_xp <= 0 then return; end if;
  insert into public.user_stats (user_id) values (p_user) on conflict (user_id) do nothing;
  update public.user_stats set total_xp = total_xp + p_xp, level = private.level_for_xp(total_xp + p_xp)
  where user_id = p_user;
  insert into public.daily_activity (user_id, day, xp, goal_xp, goal_met)
  values (p_user, v_day, p_xp, v_goal, p_xp >= v_goal)
  on conflict (user_id, day) do update set
    xp = public.daily_activity.xp + excluded.xp,
    goal_xp = excluded.goal_xp,
    goal_met = public.daily_activity.xp + excluded.xp >= excluded.goal_xp;
end;
$$;

create function private.join_duel_as(p_duel uuid, p_user uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.duel_players (duel_id, user_id, rating_before)
  values (p_duel, p_user, private.player_rating(p_user))
  on conflict (duel_id, user_id) do nothing;
end;
$$;

-- Both players finished: decide the winner, update ratings, grant the winner bonus.
create function private.complete_duel(p_duel uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_duel public.duels;
  v_a public.duel_players;
  v_b public.duel_players;
  v_ra int;
  v_rb int;
  v_expected numeric;
  v_result numeric;
  v_ka int;
  v_kb int;
  v_winner uuid;
begin
  select * into v_duel from public.duels where id = p_duel for update;
  if v_duel.status = 'completed' or v_duel.opponent_id is null then return; end if;
  select * into v_a from public.duel_players where duel_id = p_duel and user_id = v_duel.creator_id;
  select * into v_b from public.duel_players where duel_id = p_duel and user_id = v_duel.opponent_id;

  -- A player who never finished loses by forfeit.
  v_result := case
    when v_a.finished_at is null and v_b.finished_at is null then null
    when v_b.finished_at is null then 1
    when v_a.finished_at is null then 0
    when v_a.score > v_b.score then 1
    when v_a.score < v_b.score then 0
    else 0.5 end;
  if v_result is null then
    update public.duels set status = 'cancelled', completed_at = now() where id = p_duel;
    return;
  end if;
  v_winner := case v_result when 1 then v_duel.creator_id when 0 then v_duel.opponent_id end;

  insert into public.player_ratings (user_id) values (v_duel.creator_id), (v_duel.opponent_id) on conflict (user_id) do nothing;
  select rating, case when duels < 20 then private.config_number('rating_k_new') else private.config_number('rating_k') end
  into v_ra, v_ka from public.player_ratings where user_id = v_duel.creator_id for update;
  select rating, case when duels < 20 then private.config_number('rating_k_new') else private.config_number('rating_k') end
  into v_rb, v_kb from public.player_ratings where user_id = v_duel.opponent_id for update;
  v_expected := 1 / (1 + power(10, (v_rb - v_ra) / 400.0));

  update public.player_ratings set
    rating = v_ra + round(v_ka * (v_result - v_expected))::int,
    duels = duels + 1,
    wins = wins + case when v_result = 1 then 1 else 0 end,
    losses = losses + case when v_result = 0 then 1 else 0 end,
    draws = draws + case when v_result = 0.5 then 1 else 0 end,
    updated_at = now()
  where user_id = v_duel.creator_id;
  update public.player_ratings set
    rating = v_rb + round(v_kb * ((1 - v_result) - (1 - v_expected)))::int,
    duels = duels + 1,
    wins = wins + case when v_result = 0 then 1 else 0 end,
    losses = losses + case when v_result = 1 then 1 else 0 end,
    draws = draws + case when v_result = 0.5 then 1 else 0 end,
    updated_at = now()
  where user_id = v_duel.opponent_id;

  update public.duel_players p set rating_after = r.rating
  from public.player_ratings r
  where p.duel_id = p_duel and r.user_id = p.user_id;

  update public.duels set status = 'completed', completed_at = now(), winner_id = v_winner, is_draw = (v_result = 0.5)
  where id = p_duel;

  if v_winner is not null then
    perform private.add_xp(v_winner, private.grant_xp(v_winner, private.config_number('xp_duel_won_bonus')::int,
      'duel_won', 'duel', p_duel, null, null));
  end if;
end;
$$;

-- A player answered (or timed out on) their last question.
create function private.finish_duel_player(p_duel uuid, p_user uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_duel public.duels;
  v_day date := private.user_today(p_user);
begin
  update public.duel_players set finished_at = now()
  where duel_id = p_duel and user_id = p_user and finished_at is null;
  if not found then return; end if;

  perform private.add_xp(p_user, private.grant_xp(p_user, private.config_number('xp_duel_played')::int,
    'duel_played', 'duel', p_duel, null, null));
  insert into public.daily_activity (user_id, day, practice_completed) values (p_user, v_day, 1)
  on conflict (user_id, day) do update set practice_completed = public.daily_activity.practice_completed + 1, frozen = false;
  perform private.register_activity(p_user, v_day);

  select * into v_duel from public.duels where id = p_duel;
  if v_duel.opponent_id is not null and (
    select count(*) from public.duel_players where duel_id = p_duel and finished_at is not null) = 2
  then
    perform private.complete_duel(p_duel);
  end if;
end;
$$;

-- Closes duels past their deadline: forfeits, expirations, cancellations.
create function private.sweep_duels()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_duel record;
  v_count int := 0;
begin
  for v_duel in
    select id, opponent_id from public.duels
    where status in ('open', 'active') and expires_at < now()
    for update skip locked
  loop
    if v_duel.opponent_id is null then
      update public.duels set status = 'expired', completed_at = now() where id = v_duel.id;
    else
      perform private.complete_duel(v_duel.id);
    end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('kulto-sweep-duels', '*/15 * * * *', 'select private.sweep_duels()');
exception when others then
  raise notice 'pg_cron unavailable, duels are swept lazily only: %', sqlerrm;
end;
$$;

-- Public view of one player in a duel.
create function private.duel_person(p_user uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select case when p_user is null then null else
    jsonb_build_object('id', p_user, 'username', p.username, 'avatar_key', p.avatar_key)
  end
  from (select 1) one left join public.profiles p on p.id = p_user;
$$;

-- -----------------------------------------------------------------------------
-- RPC: start a duel (quick matchmaking, invite link or rematch)
-- -----------------------------------------------------------------------------
create function public.create_duel(p_mode text, p_rematch_of uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_rating int;
  v_duel public.duels;
  v_previous public.duels;
  v_other uuid;
  v_questions uuid[];
  v_hours int := private.config_number('duel_hours')::int;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_mode not in ('quick', 'link', 'rematch') then
    raise exception 'invalid_mode' using errcode = '22023';
  end if;
  perform private.sweep_duels();

  if p_mode = 'quick' then
    -- Resume an unfinished quick duel instead of opening another.
    select d.* into v_duel from public.duels d
    join public.duel_players p on p.duel_id = d.id and p.user_id = v_user and p.finished_at is null
    where d.mode = 'quick' and d.status in ('open', 'active')
    order by d.created_at limit 1;
    if found then
      return jsonb_build_object('duel_id', v_duel.id, 'joined', v_duel.opponent_id = v_user);
    end if;

    -- Join the closest-rated waiting duel whose creator has played.
    v_rating := private.player_rating(v_user);
    select d.* into v_duel from public.duels d
    join public.duel_players cp on cp.duel_id = d.id and cp.user_id = d.creator_id and cp.finished_at is not null
    where d.mode = 'quick' and d.status = 'open' and d.opponent_id is null
      and d.creator_id <> v_user and d.expires_at > now()
    order by abs(private.player_rating(d.creator_id) - v_rating), d.created_at
    limit 1
    for update of d skip locked;
    if found then
      update public.duels set opponent_id = v_user, status = 'active',
        expires_at = greatest(expires_at, now() + make_interval(hours => v_hours))
      where id = v_duel.id;
      perform private.join_duel_as(v_duel.id, v_user);
      return jsonb_build_object('duel_id', v_duel.id, 'joined', true);
    end if;
  end if;

  if p_mode = 'rematch' then
    select * into v_previous from public.duels where id = p_rematch_of and v_user in (creator_id, opponent_id);
    if not found or v_previous.opponent_id is null then
      raise exception 'duel_not_found' using errcode = 'P0002';
    end if;
    v_other := case when v_previous.creator_id = v_user then v_previous.opponent_id else v_previous.creator_id end;
  end if;

  v_questions := private.draw_duel_questions();
  if v_questions is null or cardinality(v_questions) < private.config_number('duel_question_count') then
    raise exception 'not_enough_questions' using errcode = 'P0002';
  end if;

  insert into public.duels (mode, status, creator_id, opponent_id, invite_code, question_ids, rematch_of, expires_at)
  values (
    p_mode::public.duel_mode,
    case when p_mode = 'rematch' then 'active'::public.duel_status else 'open'::public.duel_status end,
    v_user, v_other,
    case when p_mode = 'link' then private.new_invite_code() end,
    v_questions, p_rematch_of,
    now() + make_interval(hours => v_hours)
  )
  returning * into v_duel;
  perform private.join_duel_as(v_duel.id, v_user);
  if v_other is not null then
    perform private.join_duel_as(v_duel.id, v_other);
  end if;
  return jsonb_build_object('duel_id', v_duel.id, 'joined', false, 'invite_code', v_duel.invite_code);
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: invite links
-- -----------------------------------------------------------------------------
-- What the invite page may show, signed in or not: who invites and whether it is still open.
create function public.get_duel_invite(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_duel public.duels;
begin
  select * into v_duel from public.duels where invite_code = lower(p_code);
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'creator', private.duel_person(v_duel.creator_id),
    'joinable', v_duel.status in ('open', 'active') and v_duel.opponent_id is null and v_duel.expires_at > now(),
    'duel_id', case when (select auth.uid()) in (v_duel.creator_id, v_duel.opponent_id) then v_duel.id end
  );
end;
$$;

create function public.join_duel_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_duel public.duels;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into v_duel from public.duels where invite_code = lower(p_code) for update;
  if not found then
    raise exception 'duel_not_found' using errcode = 'P0002';
  end if;
  if v_user in (v_duel.creator_id, v_duel.opponent_id) then
    return v_duel.id;
  end if;
  if v_duel.opponent_id is not null or v_duel.status not in ('open', 'active') or v_duel.expires_at < now() then
    raise exception 'duel_unavailable' using errcode = '22023';
  end if;
  update public.duels set opponent_id = v_user, status = 'active',
    expires_at = greatest(expires_at, now() + make_interval(hours => private.config_number('duel_hours')::int))
  where id = v_duel.id;
  perform private.join_duel_as(v_duel.id, v_user);
  return v_duel.id;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: play
-- -----------------------------------------------------------------------------
-- Serves the player's current question (starting its clock) or reports that they are done.
create function public.next_duel_question(p_duel uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_duel public.duels;
  v_player public.duel_players;
  v_last public.duel_answers;
  v_total int;
  v_position int;
  v_question public.questions;
  v_grace interval := make_interval(secs => private.config_number('duel_grace_ms') / 1000.0);
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into v_duel from public.duels where id = p_duel and v_user in (creator_id, opponent_id);
  if not found then
    raise exception 'duel_not_found' using errcode = 'P0002';
  end if;
  select * into v_player from public.duel_players where duel_id = p_duel and user_id = v_user for update;
  v_total := cardinality(v_duel.question_ids);
  if v_player.finished_at is not null then
    return jsonb_build_object('done', true, 'total', v_total);
  end if;
  if v_duel.status not in ('open', 'active') or v_duel.expires_at < now() then
    raise exception 'duel_closed' using errcode = '22023';
  end if;

  select * into v_last from public.duel_answers
  where duel_id = p_duel and user_id = v_user order by position desc limit 1;
  if found and v_last.answered_at is null then
    if now() <= v_last.deadline_at + v_grace then
      v_position := v_last.position;
    else
      update public.duel_answers set answered_at = v_last.deadline_at, is_correct = false, score = 0
      where duel_id = p_duel and user_id = v_user and position = v_last.position;
      update public.duel_players set answered = answered + 1 where duel_id = p_duel and user_id = v_user;
      v_last := null;
    end if;
  end if;

  if v_position is null then
    v_position := coalesce((select max(position) from public.duel_answers where duel_id = p_duel and user_id = v_user), 0) + 1;
    if v_position > v_total then
      perform private.finish_duel_player(p_duel, v_user);
      return jsonb_build_object('done', true, 'total', v_total);
    end if;
    insert into public.duel_answers (duel_id, user_id, position, question_id, deadline_at)
    values (p_duel, v_user, v_position, v_duel.question_ids[v_position],
      now() + make_interval(secs => private.config_number('duel_seconds')))
    returning * into v_last;
  end if;

  select * into v_question from public.questions where id = v_last.question_id;
  return jsonb_build_object(
    'done', false,
    'position', v_position,
    'total', v_total,
    'score', v_player.score,
    'deadline_at', v_last.deadline_at,
    'server_now', now(),
    'seconds', private.config_number('duel_seconds'),
    'question', jsonb_build_object(
      'id', v_question.id, 'format', v_question.format, 'prompt', v_question.prompt,
      'difficulty', v_question.difficulty, 'payload', v_question.payload)
  );
end;
$$;

-- Scores one answer (null = no answer). Returns the correction and the points.
create function public.answer_duel_question(p_duel uuid, p_position int, p_answer jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_row public.duel_answers;
  v_question public.questions;
  v_solution jsonb;
  v_explanation text;
  v_correct boolean := false;
  v_score numeric := 0;
  v_points int := 0;
  v_base numeric;
  v_remaining numeric;
  v_streak int;
  v_total int;
  v_player public.duel_players;
  v_timed_out boolean := false;
  v_seconds numeric := private.config_number('duel_seconds');
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into v_row from public.duel_answers
  where duel_id = p_duel and user_id = v_user and position = p_position for update;
  if not found then
    raise exception 'question_not_served' using errcode = 'P0002';
  end if;

  select s.solution, s.explanation into v_solution, v_explanation
  from private.question_solutions s where s.question_id = v_row.question_id;
  if v_row.answered_at is not null then
    select * into v_player from public.duel_players where duel_id = p_duel and user_id = v_user;
    return jsonb_build_object('is_correct', coalesce(v_row.is_correct, false), 'score', coalesce(v_row.score, 0),
      'points', v_row.points, 'solution', v_solution, 'explanation', v_explanation,
      'total_score', v_player.score, 'finished', v_player.finished_at is not null, 'replayed', true);
  end if;

  select * into v_question from public.questions where id = v_row.question_id;
  v_timed_out := now() > v_row.deadline_at + make_interval(secs => private.config_number('duel_grace_ms') / 1000.0);
  if p_answer is not null and not v_timed_out then
    if not coalesce(private.answer_is_well_formed(v_question.format, p_answer), false) then
      raise exception 'invalid_answer' using errcode = '22023';
    end if;
    select e.is_correct, e.score into v_correct, v_score
    from private.evaluate_answer(v_question.format, v_solution, p_answer) e;
    v_correct := coalesce(v_correct, false);
    v_score := coalesce(v_score, 0);
  end if;

  if v_score > 0 then
    v_base := 100 * (1 + (v_question.difficulty - 1) * 0.125);
    v_remaining := greatest(0, least(v_seconds, extract(epoch from (v_row.deadline_at - now()))));
    -- Consecutive right answers just before this one.
    select count(*) into v_streak from (
      select is_correct, position from public.duel_answers
      where duel_id = p_duel and user_id = v_user and position < p_position
        and position > coalesce((select max(position) from public.duel_answers
          where duel_id = p_duel and user_id = v_user and position < p_position and not coalesce(is_correct, false)), 0)
    ) s;
    v_points := round(v_base * v_score
      + case when v_correct then v_base * 0.25 * v_remaining / v_seconds + least(30, 10 * v_streak) else 0 end)::int;
  end if;

  update public.duel_answers set answered_at = now(), answer = p_answer, is_correct = v_correct,
    score = v_score, points = v_points
  where duel_id = p_duel and user_id = v_user and position = p_position;
  update public.duel_players set
    score = score + v_points,
    correct = correct + case when v_correct then 1 else 0 end,
    answered = answered + 1
  where duel_id = p_duel and user_id = v_user
  returning * into v_player;

  select cardinality(question_ids) into v_total from public.duels where id = p_duel;
  if p_position >= v_total then
    perform private.finish_duel_player(p_duel, v_user);
    select * into v_player from public.duel_players where duel_id = p_duel and user_id = v_user;
  end if;

  return jsonb_build_object('is_correct', v_correct, 'score', v_score, 'points', v_points,
    'timed_out', v_timed_out, 'solution', v_solution, 'explanation', v_explanation,
    'total_score', v_player.score, 'finished', v_player.finished_at is not null, 'replayed', false);
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: read duels
-- -----------------------------------------------------------------------------
create function private.duel_summary(p_duel public.duels, p_user uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p_duel.id,
    'mode', p_duel.mode,
    'status', p_duel.status,
    'created_at', p_duel.created_at,
    'expires_at', p_duel.expires_at,
    'completed_at', p_duel.completed_at,
    'invite_code', case when p_duel.creator_id = p_user then p_duel.invite_code end,
    'me', jsonb_build_object('score', me.score, 'correct', me.correct, 'answered', me.answered,
      'finished', me.finished_at is not null),
    'opponent', private.duel_person(case when p_duel.creator_id = p_user then p_duel.opponent_id else p_duel.creator_id end),
    'opponent_progress', case when op.user_id is null then null else jsonb_build_object(
      'score', case when me.finished_at is not null or p_duel.status = 'completed' then op.score end,
      'correct', case when me.finished_at is not null or p_duel.status = 'completed' then op.correct end,
      'finished', op.finished_at is not null) end,
    'result', case
      when p_duel.status <> 'completed' then null
      when p_duel.is_draw then 'draw'
      when p_duel.winner_id = p_user then 'win'
      else 'loss' end,
    'total', cardinality(p_duel.question_ids)
  )
  from public.duel_players me
  left join public.duel_players op on op.duel_id = p_duel.id and op.user_id <> p_user
  where me.duel_id = p_duel.id and me.user_id = p_user;
$$;

create function public.get_my_duels()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  perform private.sweep_duels();
  return (
    select coalesce(jsonb_agg(private.duel_summary(d, v_user) order by
      (p.finished_at is null and d.status in ('open', 'active')) desc, coalesce(d.completed_at, d.created_at) desc), '[]'::jsonb)
    from public.duel_players p
    join public.duels d on d.id = p.duel_id
    where p.user_id = v_user
      and (d.status in ('open', 'active') or coalesce(d.completed_at, d.created_at) > now() - interval '14 days')
  );
end;
$$;

-- One duel, with the question-by-question comparison once it is completed.
create function public.get_duel(p_duel uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_duel public.duels;
  v_other uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into v_duel from public.duels where id = p_duel and v_user in (creator_id, opponent_id);
  if not found then
    raise exception 'duel_not_found' using errcode = 'P0002';
  end if;
  v_other := case when v_duel.creator_id = v_user then v_duel.opponent_id else v_duel.creator_id end;
  return private.duel_summary(v_duel, v_user) || jsonb_build_object(
    'rounds', case when v_duel.status = 'completed' or exists (
        select 1 from public.duel_players where duel_id = p_duel and user_id = v_user and finished_at is not null)
      then (
        select coalesce(jsonb_agg(jsonb_build_object(
          'position', i.pos,
          'prompt', q.prompt,
          'mine', case when m.position is null then null else jsonb_build_object('correct', coalesce(m.is_correct, false), 'points', m.points) end,
          'theirs', case when v_duel.status = 'completed' and o.position is not null
            then jsonb_build_object('correct', coalesce(o.is_correct, false), 'points', o.points) end
        ) order by i.pos), '[]'::jsonb)
        from unnest(v_duel.question_ids) with ordinality i(qid, pos)
        join public.questions q on q.id = i.qid
        left join public.duel_answers m on m.duel_id = p_duel and m.user_id = v_user and m.position = i.pos
        left join public.duel_answers o on o.duel_id = p_duel and o.user_id = v_other and o.position = i.pos
      ) end
  );
end;
$$;

revoke execute on function public.create_duel(text, uuid) from public, anon;
revoke execute on function public.join_duel_by_code(text) from public, anon;
revoke execute on function public.next_duel_question(uuid) from public, anon;
revoke execute on function public.answer_duel_question(uuid, int, jsonb) from public, anon;
revoke execute on function public.get_my_duels() from public, anon;
revoke execute on function public.get_duel(uuid) from public, anon;
revoke execute on function public.get_duel_invite(text) from public;
grant execute on function public.create_duel(text, uuid) to authenticated;
grant execute on function public.join_duel_by_code(text) to authenticated;
grant execute on function public.next_duel_question(uuid) to authenticated;
grant execute on function public.answer_duel_question(uuid, int, jsonb) to authenticated;
grant execute on function public.get_my_duels() to authenticated;
grant execute on function public.get_duel(uuid) to authenticated;
grant execute on function public.get_duel_invite(text) to anon, authenticated;

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.lesson_is_published(uuid) to anon, authenticated;
grant execute on function private.content_visible(public.content_status) to anon, authenticated;
