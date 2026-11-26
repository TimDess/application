import type { Metadata } from 'next'
import Link from 'next/link'
import { routes } from '@/config/routes'
import { AuthHeading } from '@/features/auth/auth-heading'
import { SignUpForm } from '@/features/auth/forms'

export const metadata: Metadata = { title: 'Créer un compte' }

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        title="Crée ton compte"
        description="Gratuit. Seulement un email et un mot de passe."
      />
      <SignUpForm />
      <p className="text-center text-body text-muted">
        Déjà inscrit ?{' '}
        <Link href={routes.signIn} className="font-semibold text-ink hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
