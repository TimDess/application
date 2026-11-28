'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckboxField, TextField } from '@/components/ui/field'
import { FormMessage } from '@/components/ui/form-message'
import { PasswordField } from '@/components/ui/password-field'
import { brand } from '@/config/brand'
import { routes } from '@/config/routes'
import { idle } from '@/lib/validation/action-state'
import { saveGuestAccountAction, startGuestAction } from './actions'

const linkClass = 'font-medium text-accent-text underline underline-offset-2'

export function GuestStartForm() {
  const next = useSearchParams().get('next') ?? ''
  const [state, action, pending] = useActionState(startGuestAction, idle)
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <CheckboxField
        name="ageConfirmed"
        label={`J’ai ${brand.legal.minimumAge} ans ou plus.`}
        error={state.fieldErrors?.ageConfirmed}
      />
      <CheckboxField
        name="termsAccepted"
        label={
          <>
            J’accepte les{' '}
            <Link href={routes.terms} className={linkClass}>
              conditions d’utilisation
            </Link>{' '}
            et la{' '}
            <Link href={routes.privacy} className={linkClass}>
              politique de confidentialité
            </Link>
            .
          </>
        }
        error={state.fieldErrors?.termsAccepted}
      />
      <FormMessage tone="error">
        {state.status === 'error' && !state.fieldErrors ? state.message : undefined}
      </FormMessage>
      <Button type="submit" size="lg" loading={pending}>
        Commencer sans compte
      </Button>
    </form>
  )
}

export function SaveAccountForm() {
  const [state, action, pending] = useActionState(saveGuestAccountAction, idle)
  if (state.status === 'success') {
    return <FormMessage tone="success">{state.message}</FormMessage>
  }
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <TextField
        id="save-email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <PasswordField
        id="save-password"
        name="password"
        label="Mot de passe"
        autoComplete="new-password"
        required
        hint="Au moins 8 caractères, avec des lettres et des chiffres."
        error={state.fieldErrors?.password}
      />
      <FormMessage tone="error">
        {state.status === 'error' && !state.fieldErrors ? state.message : undefined}
      </FormMessage>
      <Button type="submit" size="lg" loading={pending}>
        Sauvegarder ma progression
      </Button>
    </form>
  )
}
