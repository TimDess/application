'use server'

import { redirect } from 'next/navigation'
import { routes } from '@/config/routes'
import { requireUser } from '@/lib/auth/session'
import { createAdminClient, createVerifierClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { failure, invalid, type ActionState } from '@/lib/validation/action-state'
import { changePasswordSchema, deleteAccountSchema } from '@/lib/validation/auth'
import { authErrorMessage, genericAuthError } from '@/features/auth/errors'

const text = (fd: FormData, key: string) => {
  const v = fd.get(key)
  return typeof v === 'string' ? v : ''
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser()
  const parsed = changePasswordSchema.safeParse({
    currentPassword: text(formData, 'currentPassword'),
    password: text(formData, 'password'),
    confirm: text(formData, 'confirm'),
  })
  if (!parsed.success) return invalid(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
    current_password: parsed.data.currentPassword,
  })
  if (error) {
    if (
      error.code === 'invalid_credentials' ||
      error.code === 'reauthentication_needed' ||
      error.code === 'reauthentication_not_valid'
    ) {
      return { status: 'error', fieldErrors: { currentPassword: 'Mot de passe actuel incorrect.' } }
    }
    if (error.code === 'weak_password' || error.code === 'same_password') {
      return { status: 'error', fieldErrors: { password: authErrorMessage(error.code) } }
    }
    return failure(authErrorMessage(error.code))
  }
  return { status: 'success', message: 'Mot de passe modifié.' }
}

export async function deleteAccountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const parsed = deleteAccountSchema.safeParse({
    password: text(formData, 'password'),
    confirmation: text(formData, 'confirmation'),
  })
  if (!parsed.success) return invalid(parsed.error)
  if (!user.email) return failure(genericAuthError)

  // Re-verify the password with a stateless client: deletion is irreversible.
  const verifier = createVerifierClient()
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  })
  if (verifyError) {
    return { status: 'error', fieldErrors: { password: 'Mot de passe incorrect.' } }
  }

  // Deleting the auth user cascades to every table (ON DELETE CASCADE on user_id / id).
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id)
  if (error) return failure('La suppression a échoué. Réessaie ou contacte-nous.')

  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'local' })
  redirect(`${routes.home}?compte=supprime`)
}
