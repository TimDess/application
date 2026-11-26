import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { routes } from '@/config/routes'
import type { ProfileVisibility, SelfLevel, ThemePreference } from '@/config/product'
import { createClient } from '@/lib/supabase/server'

/**
 * Data Access Layer: the only place that reads the session.
 * Every Server Component, Server Action and Route Handler goes through these helpers.
 */
export const getSessionUser = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const sub = data?.claims?.sub
  if (error || !sub) return null
  return { id: sub, email: typeof data.claims.email === 'string' ? data.claims.email : null }
})

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) redirect(routes.signIn)
  return user
}

export type FavoriteUniverse = {
  slug: string
  name: string
  tagline: string
  color_light: string
  color_dark: string
  icon_key: string
  sort_order: number
  level: SelfLevel | null
}

export type Viewer = {
  id: string
  email: string | null
  username: string | null
  avatarKey: string
  visibility: ProfileVisibility
  memberSince: string
  onboardingCompleted: boolean
  settings: {
    theme: ThemePreference
    reducedMotion: boolean
    soundEnabled: boolean
    hapticsEnabled: boolean
    dailyGoalMinutes: number
    showInLeaderboards: boolean
  }
  favorites: FavoriteUniverse[]
}

/** Everything the app shell needs about the signed-in user, loaded once per request. */
export const getViewer = cache(async (): Promise<Viewer> => {
  const user = await requireUser()
  const supabase = await createClient()

  const [profile, settings, onboarding, prefs] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, avatar_key, visibility, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_settings')
      .select(
        'theme, reduced_motion, sound_enabled, haptics_enabled, daily_goal_minutes, show_in_leaderboards',
      )
      .eq('user_id', user.id)
      .single(),
    supabase.from('user_onboarding').select('completed_at').eq('user_id', user.id).single(),
    supabase
      .from('user_universe_preferences')
      .select(
        'self_level, is_favorite, universes (slug, name, tagline, color_light, color_dark, icon_key, sort_order)',
      )
      .eq('user_id', user.id)
      .eq('is_favorite', true),
  ])

  if (profile.error || settings.error || onboarding.error || prefs.error) {
    throw new Error('Impossible de charger ton compte.')
  }

  const favorites = (prefs.data ?? [])
    .flatMap((p) => (p.universes ? [{ ...p.universes, level: p.self_level }] : []))
    .sort((a, b) => a.sort_order - b.sort_order)

  return {
    id: user.id,
    email: user.email,
    username: profile.data.username,
    avatarKey: profile.data.avatar_key,
    visibility: profile.data.visibility,
    memberSince: profile.data.created_at,
    onboardingCompleted: Boolean(onboarding.data.completed_at),
    settings: {
      theme: settings.data.theme,
      reducedMotion: settings.data.reduced_motion,
      soundEnabled: settings.data.sound_enabled,
      hapticsEnabled: settings.data.haptics_enabled,
      dailyGoalMinutes: settings.data.daily_goal_minutes,
      showInLeaderboards: settings.data.show_in_leaderboards,
    },
    favorites,
  }
})

export const getPublishedUniverses = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('universes')
    .select('slug, name, tagline, description, color_light, color_dark, icon_key, sort_order')
    .eq('status', 'published')
    .order('sort_order')
  if (error) throw new Error('Impossible de charger les univers.')
  return data
})

export type PublishedUniverse = Awaited<ReturnType<typeof getPublishedUniverses>>[number]
