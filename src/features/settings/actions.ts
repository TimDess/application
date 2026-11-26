'use server'

import { refresh } from 'next/cache'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/lib/validation/action-state'
import { settingsSchema, universeChoicesSchema } from '@/lib/validation/profile'
import type { Database } from '@/types/database'

type SettingsUpdate = Database['public']['Tables']['user_settings']['Update']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

const saveError: ActionState = {
  status: 'error',
  message: 'Enregistrement impossible. Réessaie dans un instant.',
}

export async function updateSettingsAction(input: unknown): Promise<ActionState> {
  const user = await requireUser()
  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) return { status: 'error', message: 'Valeur non valide.' }
  const s = parsed.data

  const settings: SettingsUpdate = {}
  if (s.theme !== undefined) settings.theme = s.theme as SettingsUpdate['theme']
  if (s.reducedMotion !== undefined) settings.reduced_motion = s.reducedMotion
  if (s.soundEnabled !== undefined) settings.sound_enabled = s.soundEnabled
  if (s.hapticsEnabled !== undefined) settings.haptics_enabled = s.hapticsEnabled
  if (s.dailyGoal !== undefined) settings.daily_goal_minutes = s.dailyGoal
  if (s.showInLeaderboards !== undefined) settings.show_in_leaderboards = s.showInLeaderboards

  const profile: ProfileUpdate = {}
  if (s.visibility !== undefined) profile.visibility = s.visibility as ProfileUpdate['visibility']
  if (s.avatarKey !== undefined) profile.avatar_key = s.avatarKey

  const supabase = await createClient()
  if (Object.keys(settings).length > 0) {
    const { error } = await supabase.from('user_settings').update(settings).eq('user_id', user.id)
    if (error) return saveError
  }
  if (Object.keys(profile).length > 0) {
    const { error } = await supabase.from('profiles').update(profile).eq('id', user.id)
    if (error) return saveError
  }

  refresh()
  return { status: 'success', message: 'Enregistré.' }
}

export async function updateUniversesAction(input: unknown): Promise<ActionState> {
  await requireUser()
  const parsed = universeChoicesSchema.safeParse(input)
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Sélection non valide.' }
  }
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_universe_preferences', { p_universes: parsed.data })
  if (error) return saveError
  refresh()
  return { status: 'success', message: 'Univers enregistrés.' }
}
