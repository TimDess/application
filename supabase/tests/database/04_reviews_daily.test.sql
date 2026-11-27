-- Phase 3B: spaced repetition and the daily challenge.
begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

-- ---------------------------------------------------------------------------
-- Fixtures: players A and B, one lesson (q1, q2), notion N1 (q1, q3) and N2 (q2)
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('a0000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ra@test.local', '', now(), '{}', now(), now()),
  ('b0000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rb@test.local', '', now(), '{}', now(), now());

insert into public.categories (id, universe_id, slug, name, status)
select '12000000-0000-0000-0000-000000000001', id, 'rev-cat', 'Catégorie révisions', 'published' from public.universes where slug = 'musique';
insert into public.courses (id, category_id, slug, title, status) values
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'rev-course', 'Parcours révisions', 'published');
insert into public.chapters (id, course_id, position, title, status) values
  ('32000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 1, 'Chapitre 1', 'published');
insert into public.lessons (id, chapter_id, position, slug, title, status) values
  ('42000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', 1, 'rev-l1', 'Leçon 1', 'published');
insert into public.questions (id, key, universe_id, format, prompt, payload, status)
select v.id::uuid, v.key, u.id, v.format::public.question_format, v.prompt, v.payload::jsonb, v.status::public.content_status
from public.universes u,
  (values
    ('52000000-0000-0000-0000-000000000001', 'rq-quiz', 'quiz', 'Question quiz révision', '{"options":[{"id":"a","label":"A"},{"id":"b","label":"B"}],"multiple":false}', 'published'),
    ('52000000-0000-0000-0000-000000000002', 'rq-tf', 'true_false', 'Question vrai faux révision', '{}', 'published'),
    ('52000000-0000-0000-0000-000000000003', 'rq-year', 'guess_year', 'Question année révision', '{"min":1900,"max":2000}', 'published'),
    ('52000000-0000-0000-0000-000000000004', 'rq-draft', 'true_false', 'Question en relecture', '{}', 'in_review')
  ) as v (id, key, format, prompt, payload, status)
where u.slug = 'musique';
insert into private.question_solutions (question_id, solution, explanation) values
  ('52000000-0000-0000-0000-000000000001', '{"correct":["b"]}', 'B est la bonne réponse.'),
  ('52000000-0000-0000-0000-000000000002', '{"value":true}', 'C’est bien vrai.'),
  ('52000000-0000-0000-0000-000000000003', '{"year":1950,"tolerance":2}', 'C’était en 1950.'),
  ('52000000-0000-0000-0000-000000000004', '{"value":true}', 'C’est bien vrai.');
insert into public.knowledge_items (id, key, universe_id, title)
select v.id::uuid, v.key, u.id, v.title from public.universes u,
  (values ('62000000-0000-0000-0000-000000000001', 'rev-n1', 'Notion une'),
          ('62000000-0000-0000-0000-000000000002', 'rev-n2', 'Notion deux')) as v (id, key, title)
where u.slug = 'musique';
insert into public.question_knowledge_items (question_id, knowledge_item_id) values
  ('52000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000001'),
  ('52000000-0000-0000-0000-000000000003', '62000000-0000-0000-0000-000000000001'),
  ('52000000-0000-0000-0000-000000000002', '62000000-0000-0000-0000-000000000002');
insert into public.lesson_items (lesson_id, position, question_id) values
  ('42000000-0000-0000-0000-000000000001', 1, '52000000-0000-0000-0000-000000000001'),
  ('42000000-0000-0000-0000-000000000001', 2, '52000000-0000-0000-0000-000000000002');

-- A well-formed (not necessarily right) answer for any format.
create function pg_temp.any_answer(p_question uuid) returns jsonb language sql as $$
  select case q.format
    when 'quiz' then jsonb_build_object('selected', jsonb_build_array(q.payload -> 'options' -> 0 ->> 'id'))
    when 'true_false' then '{"value":true}'::jsonb
    when 'guess_year' then '{"year":1950}'::jsonb
    when 'timeline' then jsonb_build_object('order', (select jsonb_agg(i ->> 'id') from jsonb_array_elements(q.payload -> 'items') i))
    when 'match' then jsonb_build_object('pairs', (select jsonb_object_agg(l ->> 'id', q.payload -> 'right' -> 0 ->> 'id') from jsonb_array_elements(q.payload -> 'left') l))
  end
  from public.questions q where q.id = p_question;
$$;
grant execute on function pg_temp.any_answer(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select throws_ok('select public.start_review()', '42501', null, 'anon cannot start a review');
select throws_ok('select * from public.daily_challenges', '42501', null, 'anon cannot read daily challenges');

-- ---------------------------------------------------------------------------
-- Lessons seed the notions
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "a0000000-0000-0000-0000-0000000000a2", "role": "authenticated"}';
create temporary table t_lesson as select (public.start_lesson('42000000-0000-0000-0000-000000000001') ->> 'session_id')::uuid as id;
grant all on t_lesson to authenticated;
select public.submit_answer((select id from t_lesson), '52000000-0000-0000-0000-000000000001', '{"selected":["b"]}');
select public.submit_answer((select id from t_lesson), '52000000-0000-0000-0000-000000000002', '{"value":false}');
select public.complete_lesson((select id from t_lesson));

select is((select count(*)::int from public.user_knowledge_state), 2, 'completing a lesson seeds its notions');
select is(
  (select box || ':' || (due_on - (now() at time zone 'Europe/Paris')::date) from public.user_knowledge_state where knowledge_item_id = '62000000-0000-0000-0000-000000000001'),
  '1:1', 'a new notion enters box 1 and comes back tomorrow');
select throws_ok('select public.start_review()', 'P0002', 'nothing_to_review', 'nothing is due on the day of the lesson');
select throws_ok($$update public.user_knowledge_state set box = 7$$, '42501', null, 'players cannot move their notions directly');
select throws_ok(
  $$insert into public.practice_attempts (session_id, user_id, question_id, answer, is_correct, score) values (gen_random_uuid(), 'a0000000-0000-0000-0000-0000000000a2', '52000000-0000-0000-0000-000000000001', '{}', true, 1)$$,
  '42501', null, 'players cannot write practice attempts directly');

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
reset role;
update public.user_knowledge_state set due_on = (now() at time zone 'Europe/Paris')::date
where user_id = 'a0000000-0000-0000-0000-0000000000a2';
set local role authenticated;
set local request.jwt.claims to '{"sub": "a0000000-0000-0000-0000-0000000000a2", "role": "authenticated"}';

select is((public.get_my_progress() -> 'reviews' ->> 'due')::int, 2, 'get_my_progress counts the notions due');
create temporary table t_review as select public.start_review() as p;
grant all on t_review to authenticated;
select is((select jsonb_array_length(p -> 'question_ids') from t_review), 2, 'a review asks one question per notion due');
select ok(
  (select p -> 'question_ids' ? '52000000-0000-0000-0000-000000000003' from t_review),
  'a notion is tested with another question than the last one seen');
select is((public.start_review() ->> 'session_id'), (select p ->> 'session_id' from t_review), 'starting again resumes the same review');

select public.submit_practice_answer((select (p ->> 'session_id')::uuid from t_review), '52000000-0000-0000-0000-000000000003', '{"year":1950}');
select public.submit_practice_answer((select (p ->> 'session_id')::uuid from t_review), '52000000-0000-0000-0000-000000000002', '{"value":false}');
select is(
  (select box || ':' || (due_on - (now() at time zone 'Europe/Paris')::date) from public.user_knowledge_state where knowledge_item_id = '62000000-0000-0000-0000-000000000001'),
  '2:3', 'a right answer moves the notion to box 2 (back in 3 days)');
select is(
  (select box || ':' || (due_on - (now() at time zone 'Europe/Paris')::date) from public.user_knowledge_state where knowledge_item_id = '62000000-0000-0000-0000-000000000002'),
  '1:1', 'a wrong answer keeps the notion in box 1 (back tomorrow)');

create temporary table t_review_done as select public.complete_practice((select (p ->> 'session_id')::uuid from t_review)) as r;
grant all on t_review_done to authenticated;
select is((select (r -> 'rewards' ->> 'xp')::int from t_review_done), 35, 'a review earns 5 XP per right answer + 30');
select is((select (r -> 'rewards' -> 'streak' ->> 'extended')::boolean from t_review_done), false, 'the streak was already validated by the lesson today');
select is((public.complete_practice((select (p ->> 'session_id')::uuid from t_review)) -> 'rewards' ->> 'xp')::int, 35, 'completing again returns the same rewards');
select is((select count(*)::int from public.xp_transactions where reason in ('review_answer', 'review_completed')), 2, 'review rewards are recorded once');
select is((select practice_completed from public.daily_activity), 1, 'the review counts in the daily activity');

-- ---------------------------------------------------------------------------
-- Daily challenge
-- ---------------------------------------------------------------------------
create temporary table t_daily as select public.start_daily_challenge() as p;
grant all on t_daily to authenticated;
select ok((select jsonb_array_length(p -> 'question_ids') between 1 and 5 from t_daily), 'the daily challenge has up to 5 questions');
select ok(
  not exists (
    select 1 from t_daily, jsonb_array_elements_text(p -> 'question_ids') qid
    join public.questions q on q.id = qid::uuid where q.status <> 'published'),
  'the daily challenge only uses published questions');
select is((public.start_daily_challenge() ->> 'session_id'), (select p ->> 'session_id' from t_daily), 'one daily session per player');
select throws_ok(
  format($$select public.complete_practice(%L)$$, (select p ->> 'session_id' from t_daily)),
  '22023', 'session_incomplete', 'the challenge cannot be completed before every answer');

select public.submit_practice_answer((select (p ->> 'session_id')::uuid from t_daily), qid::uuid, pg_temp.any_answer(qid::uuid))
from t_daily, jsonb_array_elements_text(p -> 'question_ids') qid;
select is(
  (public.complete_practice((select (p ->> 'session_id')::uuid from t_daily)) -> 'rewards' ->> 'xp')::int,
  50, 'finishing the daily challenge earns 50 XP');
select is((public.get_my_progress() -> 'daily' ->> 'completed')::boolean, true, 'get_my_progress reports the challenge as done');
select is(
  (select jsonb_array_length(public.get_my_progress() -> 'daily' -> 'results')),
  (select jsonb_array_length(p -> 'question_ids') from t_daily), 'the shareable results have one square per question');

set local request.jwt.claims to '{"sub": "b0000000-0000-0000-0000-0000000000b2", "role": "authenticated"}';
select is((public.start_daily_challenge() -> 'question_ids'), (select p -> 'question_ids' from t_daily), 'the daily challenge is the same for everyone');
select throws_ok(
  format($$select public.submit_practice_answer(%L, '52000000-0000-0000-0000-000000000002', '{"value":true}')$$, (select p ->> 'session_id' from t_review)),
  'P0002', 'session_not_found', 'B cannot answer in A review');
select is((select count(*)::int from public.user_knowledge_state), 0, 'B cannot read A notions');

select * from finish();
rollback;
