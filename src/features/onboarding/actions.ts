'use server'

import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { fieldErrorsFrom, type ActionState } from '@/lib/validation/action-state'
import { onboardingSchema } from '@/lib/validation/profile'

/** Saves the whole onboarding in one transaction (public.complete_onboarding). */
export async function completeOnboardingAction(input: unknown): Promise<ActionState> {
  await requireUser()
  const parsed = onboardingSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Certaines réponses sont incomplètes.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('complete_onboarding', {
    p_username: parsed.data.username,
    p_avatar_key: parsed.data.avatarKey,
    p_daily_goal: parsed.data.dailyGoal,
    p_universes: parsed.data.universes,
  })

  if (error) {
    if (error.code === '23505')
      return { status: 'error', fieldErrors: { username: 'Ce pseudo est déjà pris.' } }
    if (error.message.includes('username_reserved'))
      return { status: 'error', fieldErrors: { username: 'Ce pseudo est réservé.' } }
    if (error.code === '23514')
      return { status: 'error', message: 'Certaines réponses ne sont pas valides.' }
    return {
      status: 'error',
      message: 'Impossible d’enregistrer pour le moment. Réessaie dans un instant.',
    }
  }

  return { status: 'success' }
}
