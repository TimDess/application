-- Phase 4A: asynchronous duels, invite links and hidden rating.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

-- ---------------------------------------------------------------------------
-- Fixtures: five players, and only our 8 quiz questions published (rolled back)
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
select v.id::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v.email, '', now(), '{}', now(), now()
from (values
  ('a0000000-0000-0000-0000-0000000000a4', 'da@test.local'),
  ('b0000000-0000-0000-0000-0000000000b4', 'db@test.local'),
  ('c0000000-0000-0000-0000-0000000000c4', 'dc@test.local'),
  ('d0000000-0000-0000-0000-0000000000d4', 'dd@test.local'),
  ('e0000000-0000-0000-0000-0000000000e4', 'de@test.local')) as v (id, email);
update public.profiles set username = 'duel_' || left(id::text, 1) where id::text like '_0000000-0000-0000-0000-0000000000_4';

update public.questions set status = 'draft';
insert into public.questions (id, key, universe_id, format, prompt, payload, difficulty, status)
select ('54000000-0000-0000-0000-00000000000' || n)::uuid, 'dq-' || n, u.id, 'quiz', 'Question de duel numéro ' || n,
  '{"options":[{"id":"a","label":"A"},{"id":"b","label":"B"}],"multiple":false}', 1, 'published'
from public.universes u, generate_series(1, 8) n where u.slug = 'histoire-societe';
insert into private.question_solutions (question_id, solution, explanation)
select ('54000000-0000-0000-0000-00000000000' || n)::uuid, '{"correct":["b"]}', 'La bonne réponse est B.' from generate_series(1, 8) n;

-- Plays every remaining question of a duel for the current user, right or wrong.
create function pg_temp.play(p_duel uuid, p_right boolean) returns jsonb language plpgsql as $$
declare v_next jsonb; v_last jsonb;
begin
  loop
    v_next := public.next_duel_question(p_duel);
    exit when (v_next ->> 'done')::boolean;
    v_last := public.answer_duel_question(p_duel, (v_next ->> 'position')::int,
      case when p_right then '{"selected":["b"]}'::jsonb else '{"selected":["a"]}'::jsonb end);
  end loop;
  return v_last;
end;
$$;
grant execute on function pg_temp.play(uuid, boolean) to authenticated;

create function pg_temp.as_user(p_user text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
end;
$$;
grant execute on function pg_temp.as_user(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select throws_ok($$select public.create_duel('quick')$$, '42501', null, 'anon cannot start a duel');
select is(public.get_duel_invite('nothing1'), null, 'an unknown invite code reveals nothing');

set local role authenticated;
select pg_temp.as_user('a0000000-0000-0000-0000-0000000000a4');
select throws_ok('select question_ids from public.duels', '42501', null, 'the question list of a duel is never readable');
select throws_ok(
  $$insert into public.duel_answers (duel_id, user_id, position, question_id, deadline_at) values (gen_random_uuid(), 'a0000000-0000-0000-0000-0000000000a4', 1, '54000000-0000-0000-0000-000000000001', now())$$,
  '42501', null, 'players cannot write duel answers directly');

-- ---------------------------------------------------------------------------
-- A opens a quick duel and plays
-- ---------------------------------------------------------------------------
create temporary table t_quick as select (public.create_duel('quick') ->> 'duel_id')::uuid as id;
grant all on t_quick to authenticated;
select is((select status::text from public.duels where id = (select id from t_quick)), 'open', 'with nobody waiting, a quick duel opens');
select is((public.create_duel('quick') ->> 'duel_id')::uuid, (select id from t_quick), 'an unfinished quick duel is resumed, not duplicated');

create temporary table t_q1 as select public.next_duel_question((select id from t_quick)) as q;
grant all on t_q1 to authenticated;
select is((select (q ->> 'position')::int from t_q1), 1, 'the first question is served');
select ok((select not (q -> 'question' -> 'payload')::text like '%correct%' from t_q1), 'a served question carries no answer');
select is((public.next_duel_question((select id from t_quick)) ->> 'position')::int, 1, 'asking again serves the same question (no skipping)');
select ok(
  (select (r ->> 'points')::int between 100 and 125 from (select public.answer_duel_question((select id from t_quick), 1, '{"selected":["b"]}') as r) s),
  'a fast right answer scores 100 plus a speed bonus capped at 25 %');
select is(
  (public.answer_duel_question((select id from t_quick), 1, '{"selected":["a"]}') ->> 'replayed')::boolean,
  true, 'an answer cannot be changed');

reset role;
update public.duel_answers set deadline_at = now() - interval '1 minute'
where duel_id = (select id from t_quick) and position = 1;
set local role authenticated;
select pg_temp.as_user('a0000000-0000-0000-0000-0000000000a4');
select is((public.next_duel_question((select id from t_quick)) ->> 'position')::int, 2, 'the next question follows the answered one');
reset role;
update public.duel_answers set deadline_at = now() - interval '1 minute'
where duel_id = (select id from t_quick) and position = 2;
set local role authenticated;
select pg_temp.as_user('a0000000-0000-0000-0000-0000000000a4');
select is((public.next_duel_question((select id from t_quick)) ->> 'position')::int, 3, 'a question left unanswered past its deadline is skipped');
select is((select points from public.duel_answers where duel_id = (select id from t_quick) and position = 2), 0, 'a timeout scores 0');

select is((pg_temp.play((select id from t_quick), true) ->> 'finished')::boolean, true, 'A finishes their part');
select is((select count(*)::int from public.xp_transactions where reason = 'duel_played'), 1, 'finishing a duel grants the participation XP once');

-- ---------------------------------------------------------------------------
-- B is matched with A's duel and loses
-- ---------------------------------------------------------------------------
select pg_temp.as_user('b0000000-0000-0000-0000-0000000000b4');
select is((public.create_duel('quick') ->> 'duel_id')::uuid, (select id from t_quick), 'B is matched with the waiting duel');
select is((select count(*)::int from public.duel_answers where user_id = 'a0000000-0000-0000-0000-0000000000a4'), 0, 'B cannot read A answers');
select pg_temp.play((select id from t_quick), false);
select is((select status::text from public.duels where id = (select id from t_quick)), 'completed', 'the duel completes when both have played');

select pg_temp.as_user('a0000000-0000-0000-0000-0000000000a4');
select is((public.get_duel((select id from t_quick)) ->> 'result'), 'win', 'A wins');
select is((select count(*)::int from public.xp_transactions where reason = 'duel_won'), 1, 'the winner gets the bonus XP');
reset role;
select is(
  (select string_agg(user_id::text || ':' || sign(rating - 1000)::text, ',' order by user_id) from public.player_ratings where user_id::text like '_0000000-0000-0000-0000-0000000000_4'),
  'a0000000-0000-0000-0000-0000000000a4:1,b0000000-0000-0000-0000-0000000000b4:-1', 'the winner gains rating, the loser loses some');
select is((select sum(rating)::int from public.player_ratings where user_id in ('a0000000-0000-0000-0000-0000000000a4', 'b0000000-0000-0000-0000-0000000000b4')), 2000, 'rating points are exchanged, not created');

-- ---------------------------------------------------------------------------
-- Invite links and forfeits
-- ---------------------------------------------------------------------------
set local role authenticated;
select pg_temp.as_user('c0000000-0000-0000-0000-0000000000c4');
create temporary table t_link as select public.create_duel('link') as r;
grant all on t_link to authenticated, anon;
select pg_temp.play((select (r ->> 'duel_id')::uuid from t_link), true);

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select is((public.get_duel_invite((select r ->> 'invite_code' from t_link)) ->> 'joinable')::boolean, true, 'anyone can preview an open invite');

set local role authenticated;
select pg_temp.as_user('d0000000-0000-0000-0000-0000000000d4');
select is(public.join_duel_by_code((select r ->> 'invite_code' from t_link)), (select (r ->> 'duel_id')::uuid from t_link), 'D joins with the invite code');
select pg_temp.as_user('e0000000-0000-0000-0000-0000000000e4');
select throws_ok(format($$select public.join_duel_by_code(%L)$$, (select r ->> 'invite_code' from t_link)), '22023', 'duel_unavailable', 'a taken invite cannot be joined');

reset role;
update public.duels set expires_at = now() - interval '1 minute' where id = (select (r ->> 'duel_id')::uuid from t_link);
select private.sweep_duels();
select is((select winner_id from public.duels where id = (select (r ->> 'duel_id')::uuid from t_link)), 'c0000000-0000-0000-0000-0000000000c4'::uuid, 'an opponent who never plays loses by forfeit');

select * from finish();
rollback;
