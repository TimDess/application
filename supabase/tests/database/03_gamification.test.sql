-- Phase 3A: XP, levels, daily goal and streak.
begin;
create extension if not exists pgtap with schema extensions;
select plan(32);

-- ---------------------------------------------------------------------------
-- Fixtures: players A and B, one chapter with a lesson and an exam
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('a0000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ga@test.local', '', now(), '{}', now(), now()),
  ('b0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gb@test.local', '', now(), '{}', now(), now());

insert into public.categories (id, universe_id, slug, name, status)
select '11000000-0000-0000-0000-000000000001', id, 'gam-cat', 'Catégorie gamification', 'published' from public.universes where slug = 'musique';
insert into public.courses (id, category_id, slug, title, status) values
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'gam-course', 'Parcours gamification', 'published');
insert into public.chapters (id, course_id, position, title, status) values
  ('31000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 1, 'Chapitre 1', 'published');
insert into public.lessons (id, chapter_id, position, slug, title, kind, status) values
  ('41000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', 1, 'gam-l1', 'Leçon 1', 'standard', 'published'),
  ('41000000-0000-0000-0000-000000000002', '31000000-0000-0000-0000-000000000001', 2, 'gam-exam', 'Épreuve', 'exam', 'published');
insert into public.questions (id, key, universe_id, format, prompt, payload, status)
select v.id::uuid, v.key, u.id, v.format::public.question_format, v.prompt, v.payload::jsonb, 'published'
from public.universes u,
  (values
    ('51000000-0000-0000-0000-000000000001', 'gq-quiz', 'quiz', 'Question quiz gamification', '{"options":[{"id":"a","label":"A"},{"id":"b","label":"B"}],"multiple":false}'),
    ('51000000-0000-0000-0000-000000000002', 'gq-tf', 'true_false', 'Question vrai faux gamification', '{}'),
    ('51000000-0000-0000-0000-000000000003', 'gq-year', 'guess_year', 'Question année gamification', '{"min":1900,"max":2000}')
  ) as v (id, key, format, prompt, payload)
where u.slug = 'musique';
insert into private.question_solutions (question_id, solution, explanation) values
  ('51000000-0000-0000-0000-000000000001', '{"correct":["b"]}', 'B est la bonne réponse.'),
  ('51000000-0000-0000-0000-000000000002', '{"value":true}', 'C’est bien vrai.'),
  ('51000000-0000-0000-0000-000000000003', '{"year":1950,"tolerance":2}', 'C’était en 1950.');
insert into public.lesson_items (lesson_id, position, question_id) values
  ('41000000-0000-0000-0000-000000000001', 1, '51000000-0000-0000-0000-000000000001'),
  ('41000000-0000-0000-0000-000000000001', 2, '51000000-0000-0000-0000-000000000002'),
  ('41000000-0000-0000-0000-000000000002', 1, '51000000-0000-0000-0000-000000000003');

-- Plays a lesson for the current user with the given answers; returns the completion summary.
create function pg_temp.play(p_lesson uuid, p_answers jsonb) returns jsonb language plpgsql as $$
declare v_session uuid; v_q text;
begin
  v_session := (public.start_lesson(p_lesson) ->> 'session_id')::uuid;
  for v_q in select jsonb_object_keys(p_answers) loop
    perform public.submit_answer(v_session, v_q::uuid, p_answers -> v_q);
  end loop;
  return public.complete_lesson(v_session);
end;
$$;
grant execute on function pg_temp.play(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Levels and configuration (as owner)
-- ---------------------------------------------------------------------------
select is(private.level_for_xp(0), 1, 'level 1 at 0 XP');
select is(private.level_for_xp(100), 2, 'level 2 at 100 XP (first lesson)');
select is(private.level_for_xp(99), 1, 'still level 1 at 99 XP');
select is(private.xp_for_level(10), 3363, 'level 10 needs 3363 XP');
select is(private.level_for_xp(private.xp_for_level(50)), 50, 'level boundaries are exact');

-- ---------------------------------------------------------------------------
-- Streak rules (as owner, on B)
-- ---------------------------------------------------------------------------
select is((private.register_activity('b0000000-0000-0000-0000-0000000000b1', '2026-01-01') ->> 'after')::int, 1, 'first active day starts a streak');
select is((private.register_activity('b0000000-0000-0000-0000-0000000000b1', '2026-01-01') ->> 'extended')::boolean, false, 'a second lesson the same day does not extend it');
select is((private.register_activity('b0000000-0000-0000-0000-0000000000b1', '2026-01-02') ->> 'after')::int, 2, 'the next day extends it');
select is((private.register_activity('b0000000-0000-0000-0000-0000000000b1', '2026-01-04') ->> 'after')::int, 1, 'a missed day without freeze restarts it');
update public.user_streaks set freezes = 1 where user_id = 'b0000000-0000-0000-0000-0000000000b1';
select is(
  (select r ->> 'after' || ':' || (r ->> 'freezes_used') from private.register_activity('b0000000-0000-0000-0000-0000000000b1', '2026-01-06') r),
  '2:1', 'a freeze covers a missed day and is consumed');
select is((select frozen from public.daily_activity where user_id = 'b0000000-0000-0000-0000-0000000000b1' and day = '2026-01-05'), true, 'the covered day is marked as frozen');
update public.user_streaks set current = 6, last_active_day = '2026-01-10', freezes = 0 where user_id = 'b0000000-0000-0000-0000-0000000000b1';
select is((private.register_activity('b0000000-0000-0000-0000-0000000000b1', '2026-01-11') ->> 'freeze_earned')::boolean, true, 'a freeze is earned after 7 days');
update public.user_streaks set current = 13, last_active_day = '2026-01-17', freezes = 2 where user_id = 'b0000000-0000-0000-0000-0000000000b1';
select is((private.register_activity('b0000000-0000-0000-0000-0000000000b1', '2026-01-18') ->> 'freezes')::int, 2, 'freezes are capped at 2');
select is((select longest from public.user_streaks where user_id = 'b0000000-0000-0000-0000-0000000000b1'), 14, 'the longest streak is kept');

update public.user_settings set timezone = 'Nowhere/Invalid' where user_id = 'b0000000-0000-0000-0000-0000000000b1';
select ok(private.user_today('b0000000-0000-0000-0000-0000000000b1') is not null, 'an invalid time zone falls back to Europe/Paris');

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select ok((select count(*) > 0 from public.game_config), 'anyone reads the game configuration');
select throws_ok('select * from public.user_stats', '42501', null, 'anon cannot read stats');
select throws_ok('select public.get_my_progress()', '42501', null, 'anon cannot call get_my_progress');

set local role authenticated;
set local request.jwt.claims to '{"sub": "a0000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';
select throws_ok($$update public.game_config set value = '1000' where key = 'xp_correct_answer'$$, '42501', null, 'players cannot change the configuration');
select throws_ok(
  $$insert into public.xp_transactions (user_id, amount, reason, source_type, source_id) values ('a0000000-0000-0000-0000-0000000000a1', 9999, 'lesson_completed', 'lesson', gen_random_uuid())$$,
  '42501', null, 'players cannot grant themselves XP');
select throws_ok($$update public.user_streaks set current = 365$$, '42501', null, 'players cannot edit their streak');

-- ---------------------------------------------------------------------------
-- Rewards through complete_lesson
-- ---------------------------------------------------------------------------
create temporary table t_r1 as select pg_temp.play('41000000-0000-0000-0000-000000000001',
  '{"51000000-0000-0000-0000-000000000001":{"selected":["b"]},"51000000-0000-0000-0000-000000000002":{"value":true}}') as r;
grant all on t_r1 to authenticated;
select is((select (r -> 'rewards' ->> 'xp')::int from t_r1), 90, 'a perfect lesson earns 2 x 10 + 50 + 20 XP');
select is((select (r -> 'rewards' -> 'streak' ->> 'after')::int from t_r1), 1, 'finishing a lesson starts the streak');

create temporary table t_r2 as select pg_temp.play('41000000-0000-0000-0000-000000000002',
  '{"51000000-0000-0000-0000-000000000003":{"year":1950}}') as r;
grant all on t_r2 to authenticated;
select is((select (r -> 'rewards' ->> 'xp')::int from t_r2), 330, 'a passed exam closing the chapter earns 10 + 50 + 20 + 100 + 150 XP');
select is((select (r -> 'rewards' ->> 'level_before')::int || '>' || (r -> 'rewards' ->> 'level_after') from t_r2), '1>3', 'the summary reports the level up');

create temporary table t_r3 as select pg_temp.play('41000000-0000-0000-0000-000000000001',
  '{"51000000-0000-0000-0000-000000000001":{"selected":["b"]},"51000000-0000-0000-0000-000000000002":{"value":true}}') as r;
grant all on t_r3 to authenticated;
select is((select (r -> 'rewards' ->> 'xp')::int from t_r3), 0, 'replaying a lesson grants no reward twice');
select is((select count(*)::int from public.xp_transactions), 9, 'each reward is recorded once');
select is((select total_xp || ':' || level || ':' || lessons_completed from public.user_stats), '420:3:3', 'totals match the transactions');
select is(
  (select (public.complete_lesson(s.id) -> 'rewards' ->> 'xp')::int from public.lesson_sessions s
   where s.lesson_id = '41000000-0000-0000-0000-000000000002'),
  330, 'completing again returns the stored rewards');

create temporary table t_p as select public.get_my_progress() as p;
grant all on t_p to authenticated;
select is((select (p ->> 'total_xp')::int || ':' || (p -> 'streak' ->> 'status') || ':' || (p -> 'today' ->> 'lessons') from t_p), '420:done:3', 'get_my_progress reports XP, streak and today');
select is((select (p -> 'today' ->> 'goal_xp')::int from t_p), 200, 'the daily goal is 10 min x 20 XP by default');

set local request.jwt.claims to '{"sub": "b0000000-0000-0000-0000-0000000000b1", "role": "authenticated"}';
select is((select count(*)::int from public.xp_transactions), 0, 'B cannot read A rewards');

select * from finish();
rollback;
