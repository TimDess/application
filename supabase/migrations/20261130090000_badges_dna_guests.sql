-- =============================================================================
-- Kulto — Phase 3C: badges, cultural DNA and guest accounts.
--
-- * Badges are a catalog (public.badges) and grants (public.user_badges). They are
--   evaluated by private.award_badges() whenever a lesson or practice session stores
--   its rewards (BEFORE UPDATE trigger), so newly earned badges travel back in the
--   same summary the player sees. Nobody grants badges through the API.
-- * get_my_dna() measures real mastery per universe from the Leitner boxes.
-- * Guests are Supabase anonymous users. Inactive guests (30 days) are purged daily.
-- =============================================================================

create type public.badge_rarity as enum ('common', 'rare', 'epic', 'legendary');
create type public.badge_family as enum ('progress', 'streak', 'level', 'review', 'daily');

create table public.badges (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  family public.badge_family not null,
  rarity public.badge_rarity not null,
  title text not null check (char_length(title) between 2 and 40),
  description text not null check (char_length(description) between 2 and 120),
  sort_order smallint not null default 0
);

insert into public.badges (key, family, rarity, title, description, sort_order) values
  ('first_lesson', 'progress', 'common', 'Premiers pas', 'Termine ta première leçon.', 10),
  ('perfect_lesson', 'progress', 'common', 'Sans faute', 'Réussis une leçon sans aucune erreur.', 11),
  ('chapter_done', 'progress', 'rare', 'Chapitre bouclé', 'Termine toutes les leçons d’un chapitre.', 12),
  ('course_done', 'progress', 'epic', 'Parcours complet', 'Termine un parcours en entier.', 13),
  ('streak_3', 'streak', 'common', 'Ça chauffe', 'Tiens une série de 3 jours.', 20),
  ('streak_7', 'streak', 'rare', 'Semaine de feu', 'Tiens une série de 7 jours.', 21),
  ('streak_30', 'streak', 'epic', 'Inarrêtable', 'Tiens une série de 30 jours.', 22),
  ('streak_100', 'streak', 'legendary', 'Flamme éternelle', 'Tiens une série de 100 jours.', 23),
  ('level_5', 'level', 'common', 'Niveau 5', 'Atteins le niveau 5.', 30),
  ('level_10', 'level', 'rare', 'Niveau 10', 'Atteins le niveau 10.', 31),
  ('level_25', 'level', 'epic', 'Niveau 25', 'Atteins le niveau 25.', 32),
  ('specialist', 'level', 'rare', 'Spécialiste', 'Atteins le niveau 5 dans un univers.', 33),
  ('first_review', 'review', 'common', 'Première révision', 'Termine ta première session de révision.', 40),
  ('elephant', 'review', 'epic', 'Mémoire d’éléphant', 'Retiens durablement 25 notions.', 41),
  ('first_daily', 'daily', 'common', 'Premier défi', 'Termine ton premier défi du jour.', 50),
  ('daily_perfect', 'daily', 'rare', 'Carton plein', 'Réussis un défi du jour sans erreur.', 51),
  ('daily_7', 'daily', 'epic', 'Habitué', 'Termine 7 défis du jour.', 52);

create table public.user_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_key text not null references public.badges (key) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_key)
);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

create policy "Everyone reads the badge catalog" on public.badges
  for select to anon, authenticated using (true);
create policy "Users read their own badges" on public.user_badges
  for select to authenticated using (user_id = (select auth.uid()));

revoke all on table public.badges from anon, authenticated;
revoke all on table public.user_badges from anon, authenticated;
grant select on table public.badges to anon, authenticated;
grant select on table public.user_badges to authenticated;

insert into public.game_config (key, value, description) values
  ('mastered_box', '5', 'A notion counts as durably retained from this Leitner box'),
  ('dna_full_box', '5', 'Leitner box at which a notion counts fully in the cultural DNA'),
  ('guest_retention_days', '30', 'Inactive guest accounts are deleted after this many days')
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Badge evaluation
-- -----------------------------------------------------------------------------
-- Grants every badge the user now qualifies for. Returns the newly earned ones.
create function private.award_badges(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lessons int;
  v_level int;
  v_longest int;
  v_universe_level int;
  v_mastered int;
  v_daily_done int;
  v_qualified text[] := '{}';
  v_new jsonb;
begin
  select coalesce(lessons_completed, 0), coalesce(level, 1) into v_lessons, v_level
  from public.user_stats where user_id = p_user;
  select coalesce(longest, 0) into v_longest from public.user_streaks where user_id = p_user;
  select coalesce(max(level), 1) into v_universe_level from public.user_universe_stats where user_id = p_user;
  select count(*) into v_mastered from public.user_knowledge_state
  where user_id = p_user and box >= private.config_number('mastered_box');
  select count(*) into v_daily_done from public.practice_sessions
  where user_id = p_user and kind = 'daily' and completed_at is not null;

  if coalesce(v_lessons, 0) >= 1 then v_qualified := array_append(v_qualified, 'first_lesson'); end if;
  if exists (select 1 from public.xp_transactions where user_id = p_user and reason = 'lesson_perfect') then
    v_qualified := array_append(v_qualified, 'perfect_lesson');
  end if;
  if exists (select 1 from public.xp_transactions where user_id = p_user and reason = 'chapter_completed') then
    v_qualified := array_append(v_qualified, 'chapter_done');
  end if;
  if exists (select 1 from public.user_course_progress where user_id = p_user and completed_at is not null) then
    v_qualified := array_append(v_qualified, 'course_done');
  end if;
  if coalesce(v_longest, 0) >= 3 then v_qualified := array_append(v_qualified, 'streak_3'); end if;
  if coalesce(v_longest, 0) >= 7 then v_qualified := array_append(v_qualified, 'streak_7'); end if;
  if coalesce(v_longest, 0) >= 30 then v_qualified := array_append(v_qualified, 'streak_30'); end if;
  if coalesce(v_longest, 0) >= 100 then v_qualified := array_append(v_qualified, 'streak_100'); end if;
  if coalesce(v_level, 1) >= 5 then v_qualified := array_append(v_qualified, 'level_5'); end if;
  if coalesce(v_level, 1) >= 10 then v_qualified := array_append(v_qualified, 'level_10'); end if;
  if coalesce(v_level, 1) >= 25 then v_qualified := array_append(v_qualified, 'level_25'); end if;
  if coalesce(v_universe_level, 1) >= 5 then v_qualified := array_append(v_qualified, 'specialist'); end if;
  if exists (select 1 from public.practice_sessions where user_id = p_user and kind = 'review' and completed_at is not null) then
    v_qualified := array_append(v_qualified, 'first_review');
  end if;
  if v_mastered >= 25 then v_qualified := array_append(v_qualified, 'elephant'); end if;
  if v_daily_done >= 1 then v_qualified := array_append(v_qualified, 'first_daily'); end if;
  if exists (
    select 1 from public.practice_sessions
    where user_id = p_user and kind = 'daily' and completed_at is not null
      and correct_count = cardinality(question_ids)
  ) then
    v_qualified := array_append(v_qualified, 'daily_perfect');
  end if;
  if v_daily_done >= 7 then v_qualified := array_append(v_qualified, 'daily_7'); end if;

  with inserted as (
    insert into public.user_badges (user_id, badge_key)
    select p_user, k from unnest(v_qualified) k
    on conflict (user_id, badge_key) do nothing
    returning badge_key
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', b.key, 'title', b.title, 'description', b.description, 'rarity', b.rarity
  ) order by b.sort_order), '[]'::jsonb)
  into v_new
  from inserted i join public.badges b on b.key = i.badge_key;

  return v_new;
end;
$$;

-- When a session stores its rewards (the last step of complete_lesson / complete_practice),
-- evaluate badges and add the new ones to the summary.
create function private.attach_badges_to_rewards()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.rewards is null and new.rewards is not null then
    new.rewards := new.rewards || jsonb_build_object('badges', private.award_badges(new.user_id));
  end if;
  return new;
end;
$$;

create trigger lesson_sessions_attach_badges before update of rewards on public.lesson_sessions
  for each row execute function private.attach_badges_to_rewards();
create trigger practice_sessions_attach_badges before update of rewards on public.practice_sessions
  for each row execute function private.attach_badges_to_rewards();

-- Players who already qualify get their badges now.
select private.award_badges(user_id) from public.user_stats;

-- -----------------------------------------------------------------------------
-- RPC: cultural DNA (mastery per universe, 0-100)
-- -----------------------------------------------------------------------------
-- Per universe: sum over the player's notions of min(box, full_box) / full_box,
-- divided by the notions that can be played in that universe.
create function public.get_my_dna()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_full numeric := private.config_number('dna_full_box');
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'slug', u.slug,
      'available', coalesce(a.available, 0),
      'seen', coalesce(m.seen, 0),
      'mastered', coalesce(m.mastered, 0),
      'score', case when coalesce(a.available, 0) = 0 then 0
        else least(100, round(100 * coalesce(m.weight, 0) / a.available)) end
    ) order by u.sort_order), '[]'::jsonb)
    from public.universes u
    left join lateral (
      select count(distinct k.id) as available
      from public.knowledge_items k
      join public.question_knowledge_items qk on qk.knowledge_item_id = k.id
      join public.questions q on q.id = qk.question_id
      where k.universe_id = u.id and private.content_visible(q.status)
    ) a on true
    left join lateral (
      select count(*) as seen,
        count(*) filter (where s.box >= private.config_number('mastered_box')) as mastered,
        sum(least(s.box, v_full) / v_full) as weight
      from public.user_knowledge_state s
      join public.knowledge_items k on k.id = s.knowledge_item_id
      where s.user_id = v_user and k.universe_id = u.id
    ) m on true
    where u.status = 'published'
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Guests: purge inactive anonymous accounts (cascades to every user table)
-- -----------------------------------------------------------------------------
create function private.purge_inactive_guests()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted int;
  v_days int := private.config_number('guest_retention_days')::int;
begin
  with gone as (
    delete from auth.users u
    where u.is_anonymous
      and coalesce(u.last_sign_in_at, u.created_at) < now() - make_interval(days => v_days)
      and not exists (
        select 1 from public.daily_activity a
        where a.user_id = u.id and a.day > (now() - make_interval(days => v_days))::date
      )
    returning 1
  )
  select count(*) into v_deleted from gone;
  return v_deleted;
end;
$$;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('kulto-purge-inactive-guests', '17 3 * * *', 'select private.purge_inactive_guests()');
exception when others then
  raise notice 'pg_cron unavailable, guests are not purged automatically: %', sqlerrm;
end;
$$;

revoke execute on function public.get_my_dna() from public, anon;
grant execute on function public.get_my_dna() to authenticated;

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.lesson_is_published(uuid) to anon, authenticated;
grant execute on function private.content_visible(public.content_status) to anon, authenticated;
