-- Phase 4B: weekly leagues and divisions.
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

-- ---------------------------------------------------------------------------
-- Fixtures: twelve players (l1..l12) and one guest
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, is_anonymous)
select ('70000000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'l' || n || '@test.local', '', now(), '{}', now(), now(), false
from generate_series(1, 12) n;
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, created_at, updated_at, is_anonymous)
values ('70000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, '', '{}', now(), now(), true);
update public.profiles set username = 'ligue_' || right(id::text, 2) where id::text like '70000000-%';
-- Isolate from groups left by other runs in this database (rolled back at the end).
update public.league_groups set finalized_at = now() where week_start = private.league_week();

create function pg_temp.u(n int) returns uuid language sql as $$
  select ('70000000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid;
$$;
grant execute on function pg_temp.u(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Membership
-- ---------------------------------------------------------------------------
select is(private.ensure_league_member('70000000-0000-0000-0000-000000000099', private.league_week()), null, 'guests do not join the league');
select ok(private.ensure_league_member(pg_temp.u(1), private.league_week()) is not null, 'a player joins a group of their division');
select is(private.ensure_league_member(pg_temp.u(1), private.league_week()),
  (select group_id from public.league_members where user_id = pg_temp.u(1)), 'joining again keeps the same group');
update public.game_config set value = '2' where key = 'league_group_size';
select private.ensure_league_member(pg_temp.u(2), private.league_week());
select private.ensure_league_member(pg_temp.u(3), private.league_week());
select isnt(
  (select group_id from public.league_members where user_id = pg_temp.u(3)),
  (select group_id from public.league_members where user_id = pg_temp.u(1)), 'a full group opens a new one');
update public.game_config set value = '30' where key = 'league_group_size';

-- ---------------------------------------------------------------------------
-- Points: the 15 best duels plus the daily challenges
-- ---------------------------------------------------------------------------
select private.add_league_points(pg_temp.u(1), 'duel', gen_random_uuid(), 30, now()) from generate_series(1, 16);
select private.add_league_points(pg_temp.u(1), 'daily', gen_random_uuid(), 20, now());
select is(private.league_score(pg_temp.u(1), private.league_week()), 470, 'only the 15 best duels count, plus the daily challenge');
select private.add_league_points('70000000-0000-0000-0000-000000000099', 'duel', gen_random_uuid(), 30, now());
select is((select count(*)::int from public.league_points where user_id = '70000000-0000-0000-0000-000000000099'), 0, 'guests earn no league points');

-- A completed duel feeds the league: win 30, loss 5, forfeit 0.
insert into public.duels (id, mode, status, creator_id, opponent_id, question_ids, expires_at)
values ('75000000-0000-0000-0000-000000000001', 'quick', 'active', pg_temp.u(4), pg_temp.u(5),
  array[gen_random_uuid()], now() + interval '1 day'),
  ('75000000-0000-0000-0000-000000000002', 'quick', 'active', pg_temp.u(6), pg_temp.u(7),
  array[gen_random_uuid()], now() + interval '1 day');
insert into public.duel_players (duel_id, user_id, finished_at) values
  ('75000000-0000-0000-0000-000000000001', pg_temp.u(4), now()),
  ('75000000-0000-0000-0000-000000000001', pg_temp.u(5), now()),
  ('75000000-0000-0000-0000-000000000002', pg_temp.u(6), now()),
  ('75000000-0000-0000-0000-000000000002', pg_temp.u(7), null);
update public.duels set status = 'completed', completed_at = now(), winner_id = pg_temp.u(4) where id = '75000000-0000-0000-0000-000000000001';
update public.duels set status = 'completed', completed_at = now(), winner_id = pg_temp.u(6) where id = '75000000-0000-0000-0000-000000000002';
select is(private.league_score(pg_temp.u(4), private.league_week()), 30, 'a won duel is worth 30 points');
select is(private.league_score(pg_temp.u(5), private.league_week()), 5, 'a lost duel is worth 5 points');
select is((select count(*)::int from public.league_points where user_id = pg_temp.u(7)), 0, 'a forfeit is worth nothing');
update public.duels set status = 'active' where id = '75000000-0000-0000-0000-000000000001';
update public.duels set status = 'completed' where id = '75000000-0000-0000-0000-000000000001';
select is(private.league_score(pg_temp.u(4), private.league_week()), 30, 'a duel is counted once');

-- ---------------------------------------------------------------------------
-- End of week: up and down
-- ---------------------------------------------------------------------------
-- Last week, a Bronze group of 5 and a Gold group of 5.
insert into public.player_divisions (user_id, division)
select pg_temp.u(n), case when n <= 5 then 'bronze' else 'or' end::public.league_division from generate_series(8, 12) n
on conflict (user_id) do update set division = excluded.division;
insert into public.player_divisions (user_id, division) values (pg_temp.u(2), 'or'), (pg_temp.u(3), 'or'), (pg_temp.u(4), 'bronze'), (pg_temp.u(5), 'bronze'), (pg_temp.u(6), 'bronze')
on conflict (user_id) do update set division = excluded.division;
insert into public.league_groups (id, week_start, division) values
  ('76000000-0000-0000-0000-000000000001', private.league_week(now() - interval '7 days'), 'bronze'),
  ('76000000-0000-0000-0000-000000000002', private.league_week(now() - interval '7 days'), 'or');
insert into public.league_members (group_id, user_id, week_start)
select '76000000-0000-0000-0000-000000000001', pg_temp.u(n), private.league_week(now() - interval '7 days') from generate_series(4, 8) n;
insert into public.league_members (group_id, user_id, week_start)
select '76000000-0000-0000-0000-000000000002', pg_temp.u(n), private.league_week(now() - interval '7 days') from (values (2), (3), (10), (11), (12)) v(n);
insert into public.league_points (user_id, week_start, source_type, source_id, points)
select pg_temp.u(v.n), private.league_week(now() - interval '7 days'), 'daily', gen_random_uuid(), v.p
from (values (4, 100), (5, 80), (6, 60), (7, 40), (2, 90), (3, 70), (10, 50), (11, 30)) v(n, p);

select ok(private.finalize_league_weeks() >= 2, 'past weeks are finalized');
select is((select division::text from public.player_divisions where user_id = pg_temp.u(4)), 'argent', 'the top of Bronze moves up to Silver');
select is((select outcome::text from public.league_members where user_id = pg_temp.u(8) and group_id = '76000000-0000-0000-0000-000000000001'), 'stayed', 'nobody drops below Bronze');
select is((select division::text from public.player_divisions where user_id = pg_temp.u(2)), 'platine', 'the top of Gold moves up to Platinum');
select is((select division::text from public.player_divisions where user_id = pg_temp.u(12)), 'argent', 'the bottom of Gold drops to Silver');
select is((select final_rank from public.league_members where user_id = pg_temp.u(3) and group_id = '76000000-0000-0000-0000-000000000002'), 2::smallint, 'final ranks follow the points');

-- ---------------------------------------------------------------------------
-- Reading the league
-- ---------------------------------------------------------------------------
update public.user_settings set show_in_leaderboards = false where user_id = pg_temp.u(2);
select private.ensure_league_member(pg_temp.u(2), private.league_week());
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', pg_temp.u(1), 'role', 'authenticated')::text, true);
select throws_ok(
  format($$insert into public.league_points (user_id, week_start, source_type, source_id, points) values (%L, current_date, 'daily', gen_random_uuid(), 999)$$, pg_temp.u(1)),
  '42501', null, 'players cannot give themselves league points');
create temporary table t_league as select public.get_my_league() as l;
grant all on t_league to authenticated;
select is((select (l ->> 'joined')::boolean from t_league), true, 'get_my_league reports the membership');
select ok(
  (select bool_or((s ->> 'is_me')::boolean and (s ->> 'points')::int = 470) from t_league, jsonb_array_elements(l -> 'standings') s),
  'the standings include my weekly score');
select is(
  (select count(*)::int from t_league, jsonb_array_elements(l -> 'standings') s where s ->> 'username' is null),
  1, 'a player hidden from leaderboards appears without their name');
select is((select count(*)::int from public.league_points), 17, 'players only read their own league points');

select * from finish();
rollback;
