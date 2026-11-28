'use server'

import { redirect } from 'next/navigation'
import { brand } from '@/config/brand'
import { routes, safeNextPath } from '@/config/routes'
import { authErrorMessage } from '@/features/auth/errors'
import { getSessionUser, requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { failure, invalid, type ActionState } from '@/lib/validation/action-state'
import { guestStartSchema, saveGuestSchema } from '@/lib/validation/auth'

const text = (fd: FormData, key: string) => {
  const v = fd.get(key)
  return typeof v === 'string' ? v : ''
}

/** Creates a real (anonymous) account server-side, with the same consent records. */
export async function startGuestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const next = safeNextPath(text(formData, 'next') || null, routes.dashboard)
  if (await getSessionUser()) redirect(next)
  const parsed = guestStartSchema.safeParse({
    ageConfirmed: formData.get('ageConfirmed') ?? undefined,
    termsAccepted: formData.get('termsAccepted') ?? undefined,
  })
  if (!parsed.success) return invalid(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInAnonymously({
    // Copied into public.user_settings by the handle_new_user() trigger, as for sign-ups.
    options: { data: { age_confirmed: 'true', terms_version: brand.legal.termsVersion } },
  })
  if (error) return failure(authErrorMessage(error.code))
  redirect(
    next === routes.dashboard
      ? routes.onboarding
      : `${routes.onboarding}?next=${encodeURIComponent(next)}`,
  )
}

/**
 * Links an email and a password to the guest account. Everything is kept (same user id);
 * the account becomes permanent once the email is confirmed.
 */
export async function saveGuestAccountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  if (!user.isAnonymous) redirect(routes.account)
  const values = { email: text(formData, 'email') }
  const parsed = saveGuestSchema.safeParse({
    email: values.email,
    password: text(formData, 'password'),
  })
  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    email: parsed.data.email,
    password: parsed.data.password,
  })
  if (error) {
    if (error.code === 'weak_password') {
      return { status: 'error', fieldErrors: { password: authErrorMessage(error.code) }, values }
    }
    if (error.code === 'email_exists') {
      return { status: 'error', fieldErrors: { email: authErrorMessage(error.code) }, values }
    }
    return failure(authErrorMessage(error.code), values)
  }
  return {
    status: 'success',
    message: `Presque fini : ouvre l’email envoyé à ${parsed.data.email} et clique sur le lien pour confirmer ton adresse.`,
  }
}
