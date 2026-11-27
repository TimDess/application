import type { Metadata } from 'next'
import Link from 'next/link'
import { routes } from '@/config/routes'
import { AuthHeading } from '@/features/auth/auth-heading'
import { ForgotPasswordForm } from '@/features/auth/forms'

export const metadata: Metadata = { title: 'Mot de passe oublié' }

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        title="Mot de passe oublié"
        description="Saisis ton email : on t’envoie un lien pour en choisir un nouveau."
      />
      <ForgotPasswordForm />
      <Link
        href={routes.signIn}
        className="text-center text-body font-semibold text-ink hover:underline"
      >
        Retour à la connexion
      </Link>
    </div>
  )
}
