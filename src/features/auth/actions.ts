'use server'

import { redirect } from 'next/navigation'
import { brand, siteUrl } from '@/config/brand'
import { routes, safeNextPath } from '@/config/routes'
import { getSessionUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { failure, invalid, type ActionState } from '@/lib/validation/action-state'
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '@/lib/validation/auth'
import { authErrorMessage } from './errors'

const text = (fd: FormData, key: string) => {
  const v = fd.get(key)
  return typeof v === 'string' ? v : ''
}

const callbackUrl = (next: string) => `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = { email: text(formData, 'email') }
  const parsed = signUpSchema.safeParse({
    email: values.email,
    password: text(formData, 'password'),
    ageConfirmed: formData.get('ageConfirmed') ?? undefined,
    termsAccepted: formData.get('termsAccepted') ?? undefined,
  })
  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: callbackUrl(routes.onboarding),
      // Consent is copied into public.user_settings by the handle_new_user() trigger.
      data: { age_confirmed: 'true', terms_version: brand.legal.termsVersion },
    },
  })

  if (error) {
    if (error.code === 'weak_password') {
      return { status: 'error', fieldErrors: { password: authErrorMessage(error.code) }, values }
    }
    // An existing address gets the same answer as a new one: we never reveal who has an account.
    if (error.code !== 'user_already_exists' && error.code !== 'email_exists') {
      return failure(authErrorMessage(error.code), values)
    }
  }

  redirect(routes.checkEmail)
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = { email: text(formData, 'email') }
  const parsed = signInSchema.safeParse({
    email: values.email,
    password: text(formData, 'password'),
  })
  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return failure(authErrorMessage(error.code), values)

  redirect(safeNextPath(text(formData, 'next')))
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(routes.home)
}

export async function resendConfirmationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = { email: text(formData, 'email') }
  const parsed = forgotPasswordSchema.safeParse(values)
  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: parsed.data.email,
    options: { emailRedirectTo: callbackUrl(routes.onboarding) },
  })
  if (
    error &&
    (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit')
  ) {
    return failure(authErrorMessage(error.code), values)
  }
  return {
    status: 'success',
    message:
      'Si un compte attend une confirmation à cette adresse, un nouvel email vient de partir.',
  }
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = { email: text(formData, 'email') }
  const parsed = forgotPasswordSchema.safeParse(values)
  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl(routes.resetPassword),
  })
  if (
    error &&
    (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit')
  ) {
    return failure(authErrorMessage(error.code), values)
  }
  return {
    status: 'success',
    message:
      'Si un compte existe avec cette adresse, tu vas recevoir un lien pour choisir un nouveau mot de passe.',
  }
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getSessionUser()
  if (!user) return failure('Ce lien a expiré. Demande un nouveau lien de réinitialisation.')

  const parsed = resetPasswordSchema.safeParse({
    password: text(formData, 'password'),
    confirm: text(formData, 'confirm'),
  })
  if (!parsed.success) return invalid(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    if (error.code === 'weak_password' || error.code === 'same_password') {
      return { status: 'error', fieldErrors: { password: authErrorMessage(error.code) } }
    }
    return failure(authErrorMessage(error.code))
  }
  return { status: 'success', message: 'Ton mot de passe a été modifié.' }
}
