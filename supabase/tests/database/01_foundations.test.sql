-- Phase 1 security and behaviour tests. Run with: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

-- ---------------------------------------------------------------------------
-- Fixtures: two confirmed users (A and B)
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'a@test.local', '', now(), '{"age_confirmed": "true", "terms_version": "2026-11"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'b@test.local', '', now(), '{}', now(), now());

-- ---------------------------------------------------------------------------
-- Structure
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity),
  0, 'RLS is enabled on every public table');

select is(
  (select count(*)::int from public.universes where status = 'published'),
  9, 'the nine launch universes are seeded and published');

select is(
  (select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  1, 'a profile row is created for every new user');

select ok(
  (select age_confirmed_at is not null and terms_version = '2026-11'
   from public.user_settings where user_id = '11111111-1111-1111-1111-111111111111'),
  'sign-up consent is recorded server-side');

select ok(
  (select age_confirmed_at is null and terms_accepted_at is null
   from public.user_settings where user_id = '22222222-2222-2222-2222-222222222222'),
  'no consent is invented when metadata is missing');

insert into public.universes (slug, name, color_light, color_dark, status)
values ('brouillon-test', 'Brouillon', '#000000', '#FFFFFF', 'draft');

-- ---------------------------------------------------------------------------
-- Anonymous visitor
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

select is((select count(*)::int from public.universes), 9, 'anon reads published universes only');
select throws_ok('select * from public.profiles', '42501', null, 'anon cannot read profiles');
select throws_ok('select * from public.user_settings', '42501', null, 'anon cannot read settings');
select throws_ok(
  $$select public.complete_onboarding('anon_user', 'nuit', 10::smallint, '[{"slug":"musique","level":"expert"}]')$$,
  '42501', null, 'anon cannot complete onboarding');

-- ---------------------------------------------------------------------------
-- User A
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select is((select count(*)::int from public.user_settings), 1, 'A sees exactly one settings row (their own)');
select is(
  (select count(*)::int from public.user_settings where user_id = '22222222-2222-2222-2222-222222222222'),
  0, 'A cannot read B settings');

update public.user_settings set theme = 'light', daily_goal_minutes = 15;
select is((select theme::text from public.user_settings), 'light', 'A updates their own preferences');

update public.user_settings set theme = 'light' where user_id = '22222222-2222-2222-2222-222222222222';

select throws_ok(
  $$update public.user_settings set terms_version = 'forged'$$,
  '42501', null, 'A cannot forge consent records');
select throws_ok(
  $$update public.profiles set username = 'direct_write'$$,
  '42501', null, 'A cannot change username outside the onboarding function');
select throws_ok(
  $$insert into public.profiles (id) values ('33333333-3333-3333-3333-333333333333')$$,
  '42501', null, 'A cannot insert profiles');
select throws_ok(
  $$insert into public.user_roles (user_id, role) values ('11111111-1111-1111-1111-111111111111', 'admin')$$,
  '42501', null, 'A cannot grant themselves a role');
select throws_ok(
  $$insert into public.user_universe_preferences (user_id, universe_id) select '11111111-1111-1111-1111-111111111111', id from public.universes limit 1$$,
  '42501', null, 'A cannot write universe preferences directly');
select throws_ok(
  $$select private.is_reserved_username('x')$$,
  '42501', null, 'private schema is not reachable from the API roles');
select is(public.has_role('admin'), false, 'A is not an admin');

select lives_ok(
  $$select public.complete_onboarding('Pgtap_UserA', 'soleil', 10::smallint,
    '[{"slug":"sport-automobile","level":"expert"},{"slug":"musique","level":"intermediaire"}]')$$,
  'A completes onboarding');

select is((select username::text from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 'Pgtap_UserA', 'username is saved');
select is((select count(*)::int from public.user_universe_preferences), 2, 'favorite universes are saved');
select ok((select completed_at is not null from public.user_onboarding), 'onboarding is marked complete');

update public.profiles set avatar_key = 'menthe';
select is((select avatar_key from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 'menthe', 'A changes their avatar');

-- ---------------------------------------------------------------------------
-- User B
-- ---------------------------------------------------------------------------
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is((select theme::text from public.user_settings), 'system', 'B settings were not changed by A');

select throws_ok(
  $$select public.complete_onboarding('pgtap_usera', 'nuit', 10::smallint, '[{"slug":"musique","level":"expert"}]')$$,
  '23505', 'username_taken', 'usernames are unique, case-insensitively');
select throws_ok(
  $$select public.complete_onboarding('Admin', 'nuit', 10::smallint, '[{"slug":"musique","level":"expert"}]')$$,
  '22023', 'username_reserved', 'reserved usernames are rejected');
select throws_ok(
  $$select public.complete_onboarding('bob_b', 'nuit', 10::smallint, '[{"slug":"inconnu","level":"expert"}]')$$,
  '22023', 'invalid_universes', 'unknown or unpublished universes are rejected');
select throws_ok(
  $$select public.complete_onboarding('bob_b', 'nuit', 7::smallint, '[{"slug":"musique","level":"expert"}]')$$,
  '23514', null, 'daily goal must be one of the allowed values');

select is(
  (select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  1, 'B can see A public profile');

-- ---------------------------------------------------------------------------
-- Account deletion cascades
-- ---------------------------------------------------------------------------
reset role;
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select count(*)::int from public.user_universe_preferences where user_id = '11111111-1111-1111-1111-111111111111')
  + (select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111')
  + (select count(*)::int from public.user_settings where user_id = '11111111-1111-1111-1111-111111111111'),
  0, 'deleting a user removes all their data');

select * from finish();
rollback;
