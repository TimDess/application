-- =============================================================================
-- Kulto — Phase 4B: weekly leagues and divisions.
--
-- * Weeks run Monday 00:00 to Sunday 23:59, Paris time. A week is identified by the
--   date of its Monday (week_start).
-- * Six divisions, Bronze to Légende. Each week a player sits in one group of at most
--   30 players of their division; they join it the first time they score league points.
-- * League points: duel won 30, draw 15, lost 5 (a forfeit scores nothing), daily
--   challenge 20. Only the 15 best duels of the week count.
-- * At the end of the week the top ~20 % of each group move up, the bottom ~20 % move
--   down (never below Bronze, never above Légende).
-- * Guests (anonymous users) do not take part. Everything is written by Postgres
--   (triggers and functions); clients only read.
-- =============================================================================

create type public.league_division as enum ('bronze', 'argent', 'or', 'platine', 'diamant', 'legende');
create type public.league_outcome as enum ('promoted', 'stayed', 'relegated');

insert into public.game_config (key, value, description) values
  ('league_group_size', '30', 'Maximum players in a weekly league group'),
  ('league_points_win', '30', 'League points for a won duel'),
  ('league_points_draw', '15', 'League points for a drawn duel'),
  ('league_points_loss', '5', 'League points for a lost duel (not for a forfeit)'),
  ('league_points_daily', '20', 'League points for the daily challenge'),
  ('league_counted_duels', '15', 'Only the best N duels of the week count'),
  ('league_move_share', '0.2', 'Share of a group that moves up, and down, each week')
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table public.player_divisions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  division public.league_division not null default 'bronze',
  updated_at timestamptz not null default now()
);

create table public.league_groups (
  id uuid primary key default gen_random_uuid(),
  week_start date not null check (extract(isodow from week_start) = 1),
  division public.league_division not null,
  created_at timestamptz not null default now(),
  finalized_at timestamptz
);

create index league_groups_week_idx on public.league_groups (week_start, division);

create table public.league_members (
  group_id uuid not null references public.league_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  joined_at timestamptz not null default now(),
  final_rank smallint,
  final_points integer,
  outcome public.league_outcome,
  primary key (group_id, user_id),
  unique (week_start, user_id)
);

create table public.league_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  source_type text not null check (source_type in ('duel', 'daily')),
  source_id uuid not null,
  points integer not null check (points >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, source_type, source_id)
);

create index league_points_user_week_idx on public.league_points (user_id, week_start);

alter table public.player_divisions enable row level security;
alter table public.league_groups enable row level security;
alter table public.league_members enable row level security;
alter table public.league_points enable row level security;

create policy "Users read their own division" on public.player_divisions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users read their own memberships" on public.league_members
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users read their own league points" on public.league_points
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Members read their groups" on public.league_groups
  for select to authenticated using (exists (
    select 1 from public.league_members m where m.group_id = id and m.user_id = (select auth.uid())));

revoke all on table public.player_divisions, public.league_groups, public.league_members, public.league_points from anon, authenticated;
grant select on table public.player_divisions, public.league_groups, public.league_members, public.league_points to authenticated;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create function private.league_week(p_at timestamptz default now())
returns date
language sql
stable
set search_path = ''
as $$
  select date_trunc('week', p_at at time zone 'Europe/Paris')::date;
$$;

create function private.league_week_end(p_week date)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select ((p_week + 7)::timestamp) at time zone 'Europe/Paris';
$$;

create function private.league_division_of(p_user uuid)
returns public.league_division
language sql
stable
set search_path = ''
as $$
  select coalesce((select division from public.player_divisions where user_id = p_user), 'bronze');
$$;

-- Weekly score: the best N duels plus the daily challenges.
create function private.league_score(p_user uuid, p_week date)
returns int
language sql
stable
set search_path = ''
as $$
  select coalesce((
    select sum(points) from (
      select points from public.league_points
      where user_id = p_user and week_start = p_week and source_type = 'duel'
      order by points desc
      limit private.config_number('league_counted_duels')::int
    ) best), 0)
  + coalesce((
    select sum(points) from public.league_points
    where user_id = p_user and week_start = p_week and source_type = 'daily'), 0)::int;
$$;

-- Places a (non-guest) player in a group of their division for the week. Idempotent.
create function private.ensure_league_member(p_user uuid, p_week date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group uuid;
  v_division public.league_division;
begin
  select group_id into v_group from public.league_members where user_id = p_user and week_start = p_week;
  if found then return v_group; end if;
  if coalesce((select is_anonymous from auth.users where id = p_user), true) then
    return null;
  end if;

  insert into public.player_divisions (user_id) values (p_user) on conflict (user_id) do nothing;
  v_division := private.league_division_of(p_user);

  -- Fill the oldest group that still has room; serialise group creation per division.
  perform pg_advisory_xact_lock(hashtext('league:' || p_week::text || ':' || v_division::text));
  select g.id into v_group from public.league_groups g
  where g.week_start = p_week and g.division = v_division and g.finalized_at is null
    and (select count(*) from public.league_members m where m.group_id = g.id) < private.config_number('league_group_size')
  order by g.created_at
  limit 1;
  if v_group is null then
    insert into public.league_groups (week_start, division) values (p_week, v_division) returning id into v_group;
  end if;

  insert into public.league_members (group_id, user_id, week_start) values (v_group, p_user, p_week)
  on conflict do nothing;
  return v_group;
end;
$$;

create function private.add_league_points(p_user uuid, p_source_type text, p_source_id uuid, p_points int, p_at timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_week date := private.league_week(p_at);
begin
  if p_points <= 0 or private.ensure_league_member(p_user, v_week) is null then
    return;
  end if;
  insert into public.league_points (user_id, week_start, source_type, source_id, points)
  values (p_user, v_week, p_source_type, p_source_id, p_points)
  on conflict (user_id, source_type, source_id) do nothing;
end;
$$;

-- -----------------------------------------------------------------------------
-- Triggers: duels and daily challenges feed the league
-- -----------------------------------------------------------------------------
create function private.league_points_from_duel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player record;
  v_points int;
begin
  if old.status = 'completed' or new.status <> 'completed' then
    return new;
  end if;
  for v_player in
    select user_id, finished_at from public.duel_players where duel_id = new.id
  loop
    v_points := case
      when v_player.finished_at is null then 0
      when new.is_draw then private.config_number('league_points_draw')
      when new.winner_id = v_player.user_id then private.config_number('league_points_win')
      else private.config_number('league_points_loss') end;
    perform private.add_league_points(v_player.user_id, 'duel', new.id, v_points, coalesce(new.completed_at, now()));
  end loop;
  return new;
end;
$$;

create trigger duels_league_points after update of status on public.duels
  for each row execute function private.league_points_from_duel();

create function private.league_points_from_daily()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'daily' and old.completed_at is null and new.completed_at is not null then
    perform private.add_league_points(new.user_id, 'daily', new.daily_challenge_id,
      private.config_number('league_points_daily')::int, new.completed_at);
  end if;
  return new;
end;
$$;

create trigger practice_sessions_league_points after update of completed_at on public.practice_sessions
  for each row execute function private.league_points_from_daily();

-- -----------------------------------------------------------------------------
-- End of week: rank each group, move players up and down
-- -----------------------------------------------------------------------------
create function private.finalize_league_weeks()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group public.league_groups;
  v_count int := 0;
  v_size int;
  v_up int;
  v_down int;
  v_share numeric := private.config_number('league_move_share');
begin
  for v_group in
    select * from public.league_groups
    where week_start < private.league_week() and finalized_at is null
    order by week_start
    for update skip locked
  loop
    -- Final ranking: points, then counted activity, then who joined first.
    with ranked as (
      select m.user_id, private.league_score(m.user_id, m.week_start) as points,
        row_number() over (
          order by private.league_score(m.user_id, m.week_start) desc,
            (select count(*) from public.league_points p where p.user_id = m.user_id and p.week_start = m.week_start) desc,
            m.joined_at) as rank
      from public.league_members m where m.group_id = v_group.id
    )
    update public.league_members m set final_rank = r.rank, final_points = r.points
    from ranked r where m.group_id = v_group.id and m.user_id = r.user_id;

    select count(*) into v_size from public.league_members where group_id = v_group.id;
    if v_size >= 5 then
      v_up := greatest(1, round(v_size * v_share));
      v_down := greatest(1, round(v_size * v_share));
    else
      v_up := least(1, v_size);
      v_down := 0;
    end if;
    if v_group.division = 'legende' then v_up := 0; end if;
    if v_group.division = 'bronze' then v_down := 0; end if;

    update public.league_members set outcome = case
      when final_rank <= v_up and final_points > 0 then 'promoted'::public.league_outcome
      when final_rank > v_size - v_down then 'relegated'::public.league_outcome
      else 'stayed'::public.league_outcome end
    where group_id = v_group.id;

    insert into public.player_divisions (user_id, division)
    select m.user_id, v_group.division from public.league_members m where m.group_id = v_group.id
    on conflict (user_id) do nothing;
    update public.player_divisions d set
      division = (enum_range(null::public.league_division))[
        array_position(enum_range(null::public.league_division), v_group.division)
        + case m.outcome when 'promoted' then 1 when 'relegated' then -1 else 0 end],
      updated_at = now()
    from public.league_members m
    where m.group_id = v_group.id and m.user_id = d.user_id and m.outcome <> 'stayed';

    update public.league_groups set finalized_at = now() where id = v_group.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('kulto-finalize-leagues', '7 * * * *', 'select private.finalize_league_weeks()');
exception when others then
  raise notice 'pg_cron unavailable, leagues are finalized lazily only: %', sqlerrm;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: the signed-in player's league
-- -----------------------------------------------------------------------------
create function public.get_my_league()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_week date;
  v_group public.league_groups;
  v_size int;
  v_up int;
  v_down int;
  v_last public.league_members;
  v_last_division public.league_division;
  v_guest boolean;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  perform private.finalize_league_weeks();
  v_week := private.league_week();
  v_guest := coalesce((select is_anonymous from auth.users where id = v_user), true);

  select g.* into v_group from public.league_groups g
  join public.league_members m on m.group_id = g.id and m.user_id = v_user
  where g.week_start = v_week;

  select m.* into v_last from public.league_members m
  where m.user_id = v_user and m.week_start < v_week and m.outcome is not null
  order by m.week_start desc limit 1;
  if v_last.group_id is not null then
    select division into v_last_division from public.league_groups where id = v_last.group_id;
  end if;

  if v_group.id is not null then
    select count(*) into v_size from public.league_members where group_id = v_group.id;
    if v_size >= 5 then
      v_up := greatest(1, round(v_size * private.config_number('league_move_share')));
      v_down := greatest(1, round(v_size * private.config_number('league_move_share')));
    else
      v_up := least(1, v_size);
      v_down := 0;
    end if;
    if v_group.division = 'legende' then v_up := 0; end if;
    if v_group.division = 'bronze' then v_down := 0; end if;
  end if;

  return jsonb_build_object(
    'guest', v_guest,
    'division', private.league_division_of(v_user),
    'week_start', v_week,
    'ends_at', private.league_week_end(v_week),
    'seconds_left', greatest(0, extract(epoch from private.league_week_end(v_week) - now()))::int,
    'joined', v_group.id is not null,
    'promote_count', coalesce(v_up, 0),
    'relegate_count', coalesce(v_down, 0),
    'counted_duels', private.config_number('league_counted_duels'),
    'my_duels', (select count(*) from public.league_points where user_id = v_user and week_start = v_week and source_type = 'duel'),
    'last_week', case when v_last.group_id is null then null else jsonb_build_object(
      'week_start', v_last.week_start, 'division', v_last_division, 'rank', v_last.final_rank,
      'points', v_last.final_points, 'outcome', v_last.outcome) end,
    'standings', case when v_group.id is null then '[]'::jsonb else (
      select coalesce(jsonb_agg(jsonb_build_object(
        'rank', s.rank, 'points', s.points, 'is_me', s.user_id = v_user,
        'username', case when s.user_id = v_user or s.visible then s.username end,
        'avatar_key', case when s.user_id = v_user or s.visible then s.avatar_key else 'soleil' end
      ) order by s.rank), '[]'::jsonb)
      from (
        select m.user_id, p.username, p.avatar_key,
          coalesce(st.show_in_leaderboards, true) and p.visibility <> 'private' as visible,
          private.league_score(m.user_id, m.week_start) as points,
          row_number() over (
            order by private.league_score(m.user_id, m.week_start) desc,
              (select count(*) from public.league_points lp where lp.user_id = m.user_id and lp.week_start = m.week_start) desc,
              m.joined_at) as rank
        from public.league_members m
        join public.profiles p on p.id = m.user_id
        left join public.user_settings st on st.user_id = m.user_id
        where m.group_id = v_group.id
      ) s) end
  );
end;
$$;

revoke execute on function public.get_my_league() from public, anon;
grant execute on function public.get_my_league() to authenticated;

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.lesson_is_published(uuid) to anon, authenticated;
grant execute on function private.content_visible(public.content_status) to anon, authenticated;
