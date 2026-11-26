-- =============================================================================
-- Kulto — Phase 1 foundations
-- Identity (profiles, settings, onboarding, roles) and universes.
--
-- Security model (see docs/SECURITY.md):
--   * RLS is enabled on every table in `public`.
--   * Privileges are granted explicitly, column by column for updates.
--   * Anything a user must not write directly goes through SECURITY DEFINER
--     functions with `set search_path = ''` and explicit auth.uid() checks.
--   * The `private` schema is not exposed by the Data API.
-- =============================================================================

create extension if not exists citext with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.content_status as enum ('draft', 'in_review', 'published', 'archived');
create type public.theme_preference as enum ('system', 'light', 'dark');
create type public.profile_visibility as enum ('public', 'friends', 'private');
create type public.self_level as enum ('debutant', 'intermediaire', 'expert');
create type public.app_role as enum ('admin', 'editor', 'moderator');

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Keep in sync with src/config/product.ts (reservedUsernames).
create function private.is_reserved_username(p_username text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(p_username) = any (array[
    'admin', 'administrateur', 'kulto', 'moderateur', 'moderator', 'support',
    'staff', 'officiel', 'official', 'root', 'system', 'null', 'undefined'
  ]);
$$;

-- -----------------------------------------------------------------------------
-- Universes (reference content, readable by everyone when published)
-- -----------------------------------------------------------------------------
create table public.universes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    constraint universes_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name text not null check (char_length(name) between 2 and 60),
  tagline text not null default '' check (char_length(tagline) <= 120),
  description text not null default '' check (char_length(description) <= 600),
  color_light text not null check (color_light ~ '^#[0-9A-F]{6}$'),
  color_dark text not null check (color_dark ~ '^#[0-9A-F]{6}$'),
  icon_key text not null default 'sparkles' check (icon_key ~ '^[a-z0-9-]{1,40}$'),
  sort_order smallint not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index universes_status_sort_idx on public.universes (status, sort_order);

create trigger universes_set_updated_at
  before update on public.universes
  for each row execute function private.set_updated_at();

alter table public.universes enable row level security;

create policy "Published universes are readable by everyone"
  on public.universes for select
  to anon, authenticated
  using (status = 'published');

revoke all on table public.universes from anon, authenticated;
grant select on table public.universes to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Profiles (public-facing identity: never email, never password)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext unique
    constraint profiles_username_format check (
      username is null
      or (char_length(username::text) between 3 and 20 and username::text ~ '^[A-Za-z0-9_]+$')
    ),
  avatar_key text not null default 'nuit'
    constraint profiles_avatar_key_check check (
      avatar_key in ('soleil', 'lavande', 'corail', 'menthe', 'ocean', 'rose', 'ambre', 'nuit')
    ),
  visibility public.profile_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function private.validate_profile_username()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.username is not null and private.is_reserved_username(new.username::text) then
    raise exception 'username_reserved' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger profiles_validate_username
  before insert or update of username on public.profiles
  for each row execute function private.validate_profile_username();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;

create policy "Users read their own profile and public profiles"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (visibility = 'public' and username is not null));

create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
-- Username changes go through complete_onboarding() for now.
grant update (avatar_key, visibility) on table public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- User settings (private to the user)
-- -----------------------------------------------------------------------------
create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme public.theme_preference not null default 'system',
  reduced_motion boolean not null default false,
  sound_enabled boolean not null default true,
  haptics_enabled boolean not null default true,
  daily_goal_minutes smallint not null default 10
    constraint user_settings_daily_goal_check check (daily_goal_minutes in (5, 10, 15, 20)),
  timezone text not null default 'Europe/Paris' check (char_length(timezone) between 1 and 64),
  show_in_leaderboards boolean not null default true,
  -- Consent records, written once by handle_new_user(), never by the client.
  age_confirmed_at timestamptz,
  terms_accepted_at timestamptz,
  terms_version text check (terms_version is null or char_length(terms_version) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function private.set_updated_at();

alter table public.user_settings enable row level security;

create policy "Users read their own settings"
  on public.user_settings for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users update their own settings"
  on public.user_settings for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on table public.user_settings from anon, authenticated;
grant select on table public.user_settings to authenticated;
grant update (
  theme, reduced_motion, sound_enabled, haptics_enabled,
  daily_goal_minutes, timezone, show_in_leaderboards
) on table public.user_settings to authenticated;

-- -----------------------------------------------------------------------------
-- Universe preferences (favorites + self-assessed level)
-- -----------------------------------------------------------------------------
create table public.user_universe_preferences (
  user_id uuid not null references auth.users (id) on delete cascade,
  universe_id uuid not null references public.universes (id) on delete cascade,
  is_favorite boolean not null default true,
  self_level public.self_level,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, universe_id)
);

create index user_universe_preferences_universe_idx on public.user_universe_preferences (universe_id);

create trigger user_universe_preferences_set_updated_at
  before update on public.user_universe_preferences
  for each row execute function private.set_updated_at();

alter table public.user_universe_preferences enable row level security;

create policy "Users read their own universe preferences"
  on public.user_universe_preferences for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.user_universe_preferences from anon, authenticated;
grant select on table public.user_universe_preferences to authenticated;
-- Writes go through complete_onboarding() / set_universe_preferences().

-- -----------------------------------------------------------------------------
-- Onboarding state
-- -----------------------------------------------------------------------------
create table public.user_onboarding (
  user_id uuid primary key references auth.users (id) on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_onboarding_set_updated_at
  before update on public.user_onboarding
  for each row execute function private.set_updated_at();

alter table public.user_onboarding enable row level security;

create policy "Users read their own onboarding state"
  on public.user_onboarding for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.user_onboarding from anon, authenticated;
grant select on table public.user_onboarding to authenticated;

-- -----------------------------------------------------------------------------
-- Roles (admin tooling, phase 6). Read-only for the user, never writable via API.
-- -----------------------------------------------------------------------------
create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

create policy "Users read their own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.user_roles from anon, authenticated;
grant select on table public.user_roles to authenticated;

create function public.has_role(p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = p_role
  );
$$;

revoke execute on function public.has_role(public.app_role) from public, anon;
grant execute on function public.has_role(public.app_role) to authenticated;

-- -----------------------------------------------------------------------------
-- New user bootstrap: one row per table, consent copied from sign-up metadata.
-- -----------------------------------------------------------------------------
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_terms text := left(v_meta ->> 'terms_version', 20);
begin
  insert into public.profiles (id) values (new.id);

  insert into public.user_settings (user_id, age_confirmed_at, terms_accepted_at, terms_version)
  values (
    new.id,
    case when v_meta ->> 'age_confirmed' = 'true' then now() end,
    case when v_terms is not null then now() end,
    v_terms
  );

  insert into public.user_onboarding (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- -----------------------------------------------------------------------------
-- RPC: replace the caller's universe preferences atomically.
-- p_universes: [{ "slug": "musique", "level": "expert" }, ...]
-- -----------------------------------------------------------------------------
create function public.set_universe_preferences(p_universes jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_count int;
  v_known int;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if jsonb_typeof(p_universes) <> 'array' then
    raise exception 'invalid_universes' using errcode = '22023';
  end if;

  v_count := jsonb_array_length(p_universes);
  if v_count < 1 or v_count > 20 then
    raise exception 'invalid_universes' using errcode = '22023';
  end if;

  -- Every slug must exist, be published and appear once.
  select count(distinct u.id) into v_known
  from jsonb_array_elements(p_universes) as item
  join public.universes u on u.slug = item ->> 'slug' and u.status = 'published';

  if v_known <> v_count then
    raise exception 'invalid_universes' using errcode = '22023';
  end if;

  delete from public.user_universe_preferences where user_id = v_user;

  insert into public.user_universe_preferences (user_id, universe_id, is_favorite, self_level)
  select v_user, u.id, true, (item ->> 'level')::public.self_level
  from jsonb_array_elements(p_universes) as item
  join public.universes u on u.slug = item ->> 'slug';
end;
$$;

revoke execute on function public.set_universe_preferences(jsonb) from public, anon;
grant execute on function public.set_universe_preferences(jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: complete onboarding in one transaction.
-- Errors: username_taken (23505), username_reserved / invalid_* (22023).
-- -----------------------------------------------------------------------------
create function public.complete_onboarding(
  p_username text,
  p_avatar_key text,
  p_daily_goal smallint,
  p_universes jsonb
)
returns void
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

  begin
    update public.profiles
    set username = trim(p_username), avatar_key = p_avatar_key
    where id = v_user;
  exception
    when unique_violation then
      raise exception 'username_taken' using errcode = '23505';
  end;

  update public.user_settings
  set daily_goal_minutes = p_daily_goal
  where user_id = v_user;

  perform public.set_universe_preferences(p_universes);

  update public.user_onboarding
  set completed_at = coalesce(completed_at, now())
  where user_id = v_user;
end;
$$;

revoke execute on function public.complete_onboarding(text, text, smallint, jsonb) from public, anon;
grant execute on function public.complete_onboarding(text, text, smallint, jsonb) to authenticated;

-- Private helpers are never callable through the API.
revoke execute on all functions in schema private from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Reference data: the nine launch universes (content arrives in phase 2).
-- -----------------------------------------------------------------------------
insert into public.universes (slug, name, tagline, description, color_light, color_dark, icon_key, sort_order, status)
values
  ('sport-automobile', 'Sport automobile', 'Formule 1, endurance, rallye, MotoGP',
   'Pilotes, écuries, circuits, stratégies et technologies : tout ce qui fait vibrer les paddocks.',
   '#E0301E', '#FF5A43', 'gauge', 10, 'published'),
  ('musique', 'Musique', 'R&B, rap, hip-hop, pop, rock, jazz',
   'Artistes, albums, producteurs et histoire des genres, des origines à aujourd’hui.',
   '#C2189B', '#F25BC9', 'music', 20, 'published'),
  ('jeux-video', 'Jeux vidéo', 'Consoles, studios, licences, e-sport',
   'Des jeux cultes aux coulisses des studios : l’histoire et la culture du gaming.',
   '#1C6BFF', '#5B93FF', 'gamepad', 30, 'published'),
  ('cinema-series', 'Cinéma & séries', 'Réalisateurs, films cultes, animation',
   'Réalisateurs, acteurs, récompenses et techniques : apprends à regarder autrement.',
   '#C98100', '#FFB627', 'clapperboard', 40, 'published'),
  ('sport', 'Sport', 'Football, basket, tennis, Jeux olympiques',
   'Athlètes, records et grandes compétitions qui ont marqué l’histoire du sport.',
   '#E8590C', '#FF8A4C', 'medal', 50, 'published'),
  ('creation-design', 'Création & design', 'Graphisme, branding, mode, architecture',
   'Typographie, publicité, photographie, UX : la culture visuelle qui nous entoure.',
   '#008FA8', '#2BD3EE', 'pen-tool', 60, 'published'),
  ('histoire-societe', 'Histoire & société', 'Civilisations, grandes périodes, personnalités',
   'Les événements et les figures qui expliquent le monde d’aujourd’hui.',
   '#A0522D', '#E08B5E', 'landmark', 70, 'published'),
  ('sciences-tech', 'Sciences & technologies', 'Espace, informatique, IA, inventions',
   'De l’exploration spatiale à l’intelligence artificielle, comprendre ce qui change nos vies.',
   '#1F9D55', '#4ADE80', 'atom', 80, 'published'),
  ('geographie-cultures', 'Géographie & cultures du monde', 'Pays, capitales, traditions, monuments',
   'Voyage à travers les pays, les langues et les traditions de la planète.',
   '#0F9E8E', '#3FD8C4', 'globe', 90, 'published')
on conflict (slug) do nothing;
