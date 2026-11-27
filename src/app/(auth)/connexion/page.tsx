import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { routes } from '@/config/routes'
import { AuthHeading } from '@/features/auth/auth-heading'
import { TryWithoutAccount } from '@/features/guest/try-link'
import { SignInForm } from '@/features/auth/forms'

export const metadata: Metadata = { title: 'Connexion' }

export default function SignInPage() {
  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        title="Content de te revoir"
        description="Connecte-toi pour reprendre ta progression."
      />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <SignInForm />
      </Suspense>
      <TryWithoutAccount />
      <p className="text-center text-body text-muted">
        Pas encore de compte ?{' '}
        <Link href={routes.signUp} className="font-semibold text-ink hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
