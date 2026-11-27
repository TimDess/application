-- Phase 3C: badges, cultural DNA and guest purge.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- ---------------------------------------------------------------------------
-- Fixtures: players A and B, a one-lesson course in "musique" with two notions
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, is_anonymous, last_sign_in_at)
values
  ('a0000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ba@test.local', '', now(), '{}', now(), now(), false, now()),
  ('b0000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bb@test.local', '', now(), '{}', now(), now(), false, now()),
  ('c0000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, '', null, '{}', now() - interval '40 days', now() - interval '40 days', true, now() - interval '40 days'),
  ('d0000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, '', null, '{}', now() - interval '2 days', now(), true, now() - interval '2 days'),
  ('e0000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'old@test.local', '', now(), '{}', now() - interval '90 days', now(), false, now() - interval '90 days');

insert into public.categories (id, universe_id, slug, name, status)
select '13000000-0000-0000-0000-000000000001', id, 'bdg-cat', 'Catégorie badges', 'published' from public.universes where slug = 'musique';
insert into public.courses (id, category_id, slug, title, status) values
  ('23000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'bdg-course', 'Parcours badges', 'published');
insert into public.chapters (id, course_id, position, title, status) values
  ('33000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', 1, 'Chapitre 1', 'published');
insert into public.lessons (id, chapter_id, position, slug, title, status) values
  ('43000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000001', 1, 'bdg-l1', 'Leçon 1', 'published');
insert into public.questions (id, key, universe_id, format, prompt, payload, status)
select v.id::uuid, v.key, u.id, v.format::public.question_format, v.prompt, v.payload::jsonb, 'published'
from public.universes u,
  (values
    ('53000000-0000-0000-0000-000000000001', 'bq-quiz', 'quiz', 'Question quiz badges', '{"options":[{"id":"a","label":"A"},{"id":"b","label":"B"}],"multiple":false}'),
    ('53000000-0000-0000-0000-000000000002', 'bq-tf', 'true_false', 'Question vrai faux badges', '{}')
  ) as v (id, key, format, prompt, payload)
where u.slug = 'musique';
insert into private.question_solutions (question_id, solution, explanation) values
  ('53000000-0000-0000-0000-000000000001', '{"correct":["b"]}', 'B est la bonne réponse.'),
  ('53000000-0000-0000-0000-000000000002', '{"value":true}', 'C’est bien vrai.');
insert into public.knowledge_items (id, key, universe_id, title)
select v.id::uuid, v.key, u.id, v.title from public.universes u,
  (values ('63000000-0000-0000-0000-000000000001', 'bdg-n1', 'Notion badge une'),
          ('63000000-0000-0000-0000-000000000002', 'bdg-n2', 'Notion badge deux')) as v (id, key, title)
where u.slug = 'musique';
insert into public.question_knowledge_items (question_id, knowledge_item_id) values
  ('53000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000001'),
  ('53000000-0000-0000-0000-000000000002', '63000000-0000-0000-0000-000000000002');
insert into public.lesson_items (lesson_id, position, question_id) values
  ('43000000-0000-0000-0000-000000000001', 1, '53000000-0000-0000-0000-000000000001'),
  ('43000000-0000-0000-0000-000000000001', 2, '53000000-0000-0000-0000-000000000002');

create function pg_temp.play_perfect() returns jsonb language plpgsql as $$
declare v_session uuid;
begin
  v_session := (public.start_lesson('43000000-0000-0000-0000-000000000001') ->> 'session_id')::uuid;
  perform public.submit_answer(v_session, '53000000-0000-0000-0000-000000000001', '{"selected":["b"]}');
  perform public.submit_answer(v_session, '53000000-0000-0000-0000-000000000002', '{"value":true}');
  return public.complete_lesson(v_session);
end;
$$;
grant execute on function pg_temp.play_perfect() to authenticated;

-- ---------------------------------------------------------------------------
-- Guest purge (as owner, before anything else touches these users)
-- ---------------------------------------------------------------------------
select is(private.purge_inactive_guests(), 1, 'one inactive guest is purged');
select is(
  (select string_agg(left(id::text, 1), '' order by id) from auth.users where id::text like '_0000000-0000-0000-0000-0000000000_3'),
  'abde', 'recent guests and old regular accounts are kept');

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select is((select count(*)::int from public.badges), 17, 'anyone reads the badge catalog');
select throws_ok('select public.get_my_dna()', '42501', null, 'anon has no DNA');

set local role authenticated;
set local request.jwt.claims to '{"sub": "a0000000-0000-0000-0000-0000000000a3", "role": "authenticated"}';
select throws_ok(
  $$insert into public.user_badges (user_id, badge_key) values ('a0000000-0000-0000-0000-0000000000a3', 'streak_100')$$,
  '42501', null, 'players cannot grant themselves a badge');

-- ---------------------------------------------------------------------------
-- Badges through completion
-- ---------------------------------------------------------------------------
create temporary table t_first as select pg_temp.play_perfect() as r;
grant all on t_first to authenticated;
select is(
  (select string_agg(b ->> 'key', ',' order by b ->> 'key') from t_first, jsonb_array_elements(r -> 'rewards' -> 'badges') b),
  'chapter_done,course_done,first_lesson,perfect_lesson', 'the summary carries the badges just earned');
select is(
  (select jsonb_array_length(pg_temp.play_perfect() -> 'rewards' -> 'badges')),
  0, 'replaying earns no badge twice');
select is((select count(*)::int from public.user_badges), 4, 'badges are stored once');

-- ---------------------------------------------------------------------------
-- Cultural DNA
-- ---------------------------------------------------------------------------
select is(
  (select (d ->> 'score')::int from jsonb_array_elements(public.get_my_dna()) d where d ->> 'slug' = 'musique'),
  20, 'two notions in box 1 out of two give a score of 20');

reset role;
update public.user_knowledge_state set box = 5 where user_id = 'a0000000-0000-0000-0000-0000000000a3';
update public.user_streaks set longest = 7 where user_id = 'a0000000-0000-0000-0000-0000000000a3';
select is(
  (select string_agg(b ->> 'key', ',' order by b ->> 'key') from jsonb_array_elements(private.award_badges('a0000000-0000-0000-0000-0000000000a3')) b),
  'streak_3,streak_7', 'streak badges follow the longest streak');
set local role authenticated;
set local request.jwt.claims to '{"sub": "a0000000-0000-0000-0000-0000000000a3", "role": "authenticated"}';

select is(
  (select (d ->> 'score')::int || ':' || (d ->> 'mastered') from jsonb_array_elements(public.get_my_dna()) d where d ->> 'slug' = 'musique'),
  '100:2', 'retained notions fill the universe branch');
select ok(
  (select (d ->> 'score')::int = 0 from jsonb_array_elements(public.get_my_dna()) d where d ->> 'slug' = 'jeux-video'),
  'untouched universes stay at zero');

set local request.jwt.claims to '{"sub": "b0000000-0000-0000-0000-0000000000b3", "role": "authenticated"}';
select is((select count(*)::int from public.user_badges), 0, 'B cannot read A badges');
select ok(
  (select bool_and((d ->> 'score')::int = 0) from jsonb_array_elements(public.get_my_dna()) d),
  'B has an empty DNA');

select * from finish();
rollback;
