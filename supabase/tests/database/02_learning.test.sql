-- Phase 2: content visibility, answer scoring and lesson sessions.
begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

-- ---------------------------------------------------------------------------
-- Fixtures: users A (player), B (other player), R (reviewer) and a tiny course
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('a0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'la@test.local', '', now(), '{}', now(), now()),
  ('b0000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lb@test.local', '', now(), '{}', now(), now()),
  ('c0000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lr@test.local', '', now(), '{}', now(), now());
insert into public.user_roles (user_id, role) values ('c0000000-0000-0000-0000-00000000000c', 'editor');

insert into public.categories (id, universe_id, slug, name, status)
select '10000000-0000-0000-0000-000000000001', id, 'test-cat', 'Catégorie test', 'published' from public.universes where slug = 'musique';
insert into public.courses (id, category_id, slug, title, status) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'test-course', 'Parcours test', 'published'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'test-review', 'Parcours en relecture', 'in_review');
insert into public.chapters (id, course_id, position, title, status) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1, 'Chapitre 1', 'published');
insert into public.lessons (id, chapter_id, position, slug, title, status) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 1, 'test-l1', 'Leçon 1', 'published'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 2, 'test-l2', 'Leçon 2', 'published');
insert into public.questions (id, key, universe_id, format, prompt, payload, status)
select v.id::uuid, v.key, u.id, v.format::public.question_format, v.prompt, v.payload::jsonb, 'published'
from public.universes u,
  (values
    ('50000000-0000-0000-0000-000000000001', 'tq-quiz', 'quiz', 'Question quiz test', '{"options":[{"id":"a","label":"A"},{"id":"b","label":"B"}],"multiple":false}'),
    ('50000000-0000-0000-0000-000000000002', 'tq-tf', 'true_false', 'Question vrai faux test', '{}'),
    ('50000000-0000-0000-0000-000000000003', 'tq-year', 'guess_year', 'Question année test', '{"min":1900,"max":2000}')
  ) as v (id, key, format, prompt, payload)
where u.slug = 'musique';
insert into private.question_solutions (question_id, solution, explanation) values
  ('50000000-0000-0000-0000-000000000001', '{"correct":["b"]}', 'B est la bonne réponse.'),
  ('50000000-0000-0000-0000-000000000002', '{"value":true}', 'C’est vrai.'),
  ('50000000-0000-0000-0000-000000000003', '{"year":1950,"tolerance":2}', 'En 1950.');
insert into public.lesson_items (lesson_id, position, question_id) values
  ('40000000-0000-0000-0000-000000000001', 1, '50000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000001', 2, '50000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000002', 1, '50000000-0000-0000-0000-000000000003');

-- ---------------------------------------------------------------------------
-- Scoring (pure functions, as owner)
-- ---------------------------------------------------------------------------
select is((select is_correct from private.evaluate_answer('quiz', '{"correct":["b"]}', '{"selected":["b"]}')), true, 'quiz: right option');
select is((select is_correct from private.evaluate_answer('quiz', '{"correct":["a","c"]}', '{"selected":["a"]}')), false, 'quiz: multiple answers need every correct option');
select is((select is_correct from private.evaluate_answer('quiz', '{"correct":["a","c"]}', '{"selected":["c","a"]}')), true, 'quiz: order of selected options does not matter');
select is((select is_correct from private.evaluate_answer('true_false', '{"value":false}', '{"value":false}')), true, 'true/false');
select is((select score from private.evaluate_answer('match', '{"pairs":{"l1":"r1","l2":"r2"}}', '{"pairs":{"l1":"r1","l2":"r1"}}')), 0.5::numeric, 'match: partial score');
select is((select is_correct from private.evaluate_answer('timeline', '{"order":["t1","t2","t3"]}', '{"order":["t1","t2","t3"]}')), true, 'timeline: right order');
select is((select is_correct from private.evaluate_answer('timeline', '{"order":["t1","t2","t3"]}', '{"order":["t2","t1","t3"]}')), false, 'timeline: wrong order');
select is((select is_correct from private.evaluate_answer('guess_year', '{"year":1950,"tolerance":2}', '{"year":1952}')), true, 'guess the year: within tolerance');
select is((select score from private.evaluate_answer('guess_year', '{"year":1950,"tolerance":0}', '{"year":1955}')), 0.5::numeric, 'guess the year: score decreases with distance');
select is(private.answer_is_well_formed('guess_year', '{"year":"1950; drop table x"}'), false, 'malformed answers are rejected');

-- ---------------------------------------------------------------------------
-- Visibility
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select is((select count(*)::int from public.courses where slug like 'test-%'), 1, 'anon sees published courses only');
select throws_ok('select * from private.question_solutions', '42501', null, 'anon cannot read solutions');

set local role authenticated;
set local request.jwt.claims to '{"sub": "c0000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
select is((select count(*)::int from public.courses where slug like 'test-%'), 2, 'reviewers also see content in review');

set local request.jwt.claims to '{"sub": "a0000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select is((select count(*)::int from public.courses where slug like 'test-%'), 1, 'players do not see content in review');
select throws_ok('select * from private.question_solutions', '42501', null, 'players cannot read solutions');
select ok((select not (payload ? 'correct') and not (payload::text like '%"correct"%') from public.questions where key = 'tq-quiz'), 'question payloads carry no answer');
select throws_ok(
  $$insert into public.question_attempts (session_id, user_id, question_id, answer, is_correct, score) values (gen_random_uuid(), 'a0000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-000000000001', '{}', true, 1)$$,
  '42501', null, 'players cannot write attempts directly');
select throws_ok(
  $$update public.user_lesson_progress set best_score = 100$$,
  '42501', null, 'players cannot edit their progress directly');

-- ---------------------------------------------------------------------------
-- Sessions
-- ---------------------------------------------------------------------------
select throws_ok($$select public.start_lesson('40000000-0000-0000-0000-000000000002')$$, '42501', 'lesson_locked', 'lesson 2 is locked until lesson 1 is completed');

create temporary table t_session as select (public.start_lesson('40000000-0000-0000-0000-000000000001') ->> 'session_id')::uuid as id;
grant all on t_session to authenticated;
select ok((select id is not null from t_session), 'A starts lesson 1');
select is((public.start_lesson('40000000-0000-0000-0000-000000000001') ->> 'session_id')::uuid, (select id from t_session), 'starting again resumes the same session');

select throws_ok(
  format($$select public.submit_answer(%L, '50000000-0000-0000-0000-000000000001', '{"value":true}')$$, (select id from t_session)),
  '22023', 'invalid_answer', 'an answer in the wrong format is rejected');
select throws_ok(
  format($$select public.complete_lesson(%L)$$, (select id from t_session)),
  '22023', 'lesson_incomplete', 'a lesson cannot be completed before every answer');

select is(
  (public.submit_answer((select id from t_session), '50000000-0000-0000-0000-000000000001', '{"selected":["a"]}') ->> 'is_correct')::boolean,
  false, 'a wrong answer is scored server-side');
select is(
  (public.submit_answer((select id from t_session), '50000000-0000-0000-0000-000000000001', '{"selected":["b"]}') ->> 'replayed')::boolean,
  true, 'resubmitting returns the first result (no second chance)');
select is(
  (select count(*)::int from public.question_attempts where session_id = (select id from t_session)),
  1, 'only one attempt is recorded per question');

set local request.jwt.claims to '{"sub": "b0000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select throws_ok(
  format($$select public.submit_answer(%L, '50000000-0000-0000-0000-000000000002', '{"value":true}')$$, (select id from t_session)),
  'P0002', 'session_not_found', 'B cannot answer in A session');
select is((select count(*)::int from public.question_attempts), 0, 'B cannot read A attempts');

set local request.jwt.claims to '{"sub": "a0000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select is(
  (public.submit_answer((select id from t_session), '50000000-0000-0000-0000-000000000002', '{"value":true}') ->> 'is_correct')::boolean,
  true, 'a right answer is scored server-side');
select is(
  (public.complete_lesson((select id from t_session)) ->> 'score')::int,
  50, 'completing the lesson computes the score (1 right out of 2)');
select is((select (public.complete_lesson(id) ->> 'score')::int from t_session), 50, 'completing again returns the same summary');
select is(
  (select status::text || ':' || attempts from public.user_lesson_progress where lesson_id = '40000000-0000-0000-0000-000000000001'),
  'completed:1', 'completing twice is idempotent');
select lives_ok($$select public.start_lesson('40000000-0000-0000-0000-000000000002')$$, 'lesson 2 unlocks after lesson 1');

select * from finish();
rollback;
