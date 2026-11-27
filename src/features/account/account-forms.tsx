'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { FormMessage } from '@/components/ui/form-message'
import { PasswordField } from '@/components/ui/password-field'
import { idle } from '@/lib/validation/action-state'
import { changePasswordAction, deleteAccountAction } from './actions'

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, idle)
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <PasswordField
        name="currentPassword"
        label="Mot de passe actuel"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.currentPassword}
      />
      <PasswordField
        name="password"
        label="Nouveau mot de passe"
        autoComplete="new-password"
        required
        hint="Au moins 8 caractères, avec des lettres et des chiffres."
        error={state.fieldErrors?.password}
      />
      <PasswordField
        name="confirm"
        label="Confirme le nouveau mot de passe"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirm}
      />
      <FormMessage tone={state.status === 'success' ? 'success' : 'error'}>
        {state.status === 'idle' ? undefined : state.message}
      </FormMessage>
      <Button type="submit" loading={pending} className="self-start">
        Modifier le mot de passe
      </Button>
    </form>
  )
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccountAction, idle)
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <PasswordField
        id="delete-password"
        name="password"
        label="Ton mot de passe"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <TextField
        id="delete-confirmation"
        name="confirmation"
        label="Écris SUPPRIMER pour confirmer"
        autoComplete="off"
        autoCapitalize="characters"
        required
        error={state.fieldErrors?.confirmation}
      />
      <FormMessage tone="error">{state.status === 'error' ? state.message : undefined}</FormMessage>
      <Button type="submit" variant="danger" loading={pending} className="self-start">
        Supprimer définitivement mon compte
      </Button>
    </form>
  )
}
