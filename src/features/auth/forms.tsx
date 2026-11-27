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
import {
  forgotPasswordAction,
  resendConfirmationAction,
  resetPasswordAction,
  signInAction,
  signUpAction,
} from './actions'

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, idle)
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <TextField
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
        name="password"
        label="Mot de passe"
        autoComplete="new-password"
        required
        hint="Au moins 8 caractères, avec des lettres et des chiffres."
        error={state.fieldErrors?.password}
      />
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
            <Link
              href={routes.terms}
              className="font-medium text-accent-text underline underline-offset-2"
            >
              conditions d’utilisation
            </Link>{' '}
            et la{' '}
            <Link
              href={routes.privacy}
              className="font-medium text-accent-text underline underline-offset-2"
            >
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
        Créer mon compte
      </Button>
    </form>
  )
}

export function SignInForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''
  const confirmed = searchParams.get('confirme') === '1'
  const [state, action, pending] = useActionState(signInAction, idle)
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      {confirmed ? (
        <FormMessage tone="success">
          Ton adresse email est confirmée. Connecte-toi pour commencer.
        </FormMessage>
      ) : null}
      <TextField
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <div className="flex flex-col gap-1.5">
        <PasswordField
          name="password"
          label="Mot de passe"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.password}
        />
        <Link
          href={routes.forgotPassword}
          className="self-end text-caption font-medium text-muted hover:text-ink"
        >
          Mot de passe oublié ?
        </Link>
      </div>
      <FormMessage tone="error">
        {state.status === 'error' && !state.fieldErrors ? state.message : undefined}
      </FormMessage>
      <Button type="submit" size="lg" loading={pending}>
        Se connecter
      </Button>
    </form>
  )
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, idle)
  if (state.status === 'success') return <FormMessage tone="success">{state.message}</FormMessage>
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <TextField
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <FormMessage tone="error">
        {state.status === 'error' && !state.fieldErrors ? state.message : undefined}
      </FormMessage>
      <Button type="submit" size="lg" loading={pending}>
        Envoyer le lien
      </Button>
    </form>
  )
}

export function ResendConfirmationForm() {
  const [state, action, pending] = useActionState(resendConfirmationAction, idle)
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <TextField
        name="email"
        type="email"
        label="Ton email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <FormMessage tone={state.status === 'success' ? 'success' : 'error'}>
        {state.status === 'idle' || state.fieldErrors ? undefined : state.message}
      </FormMessage>
      <Button type="submit" variant="secondary" loading={pending}>
        Renvoyer l’email
      </Button>
    </form>
  )
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, idle)
  if (state.status === 'success') {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage tone="success">{state.message}</FormMessage>
        <Button asChild size="lg">
          <Link href={routes.dashboard}>Continuer</Link>
        </Button>
      </div>
    )
  }
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
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
        label="Confirme le mot de passe"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirm}
      />
      <FormMessage tone="error">
        {state.status === 'error' && !state.fieldErrors ? state.message : undefined}
      </FormMessage>
      <Button type="submit" size="lg" loading={pending}>
        Enregistrer
      </Button>
    </form>
  )
}
