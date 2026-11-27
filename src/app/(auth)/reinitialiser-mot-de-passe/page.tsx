import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { routes } from '@/config/routes'
import { AuthHeading } from '@/features/auth/auth-heading'
import { ResetPasswordForm } from '@/features/auth/forms'
import { getSessionUser } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Nouveau mot de passe' }

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <AuthHeading title="Nouveau mot de passe" />
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ResetGate />
      </Suspense>
    </div>
  )
}

async function ResetGate() {
  const user = await getSessionUser()
  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-body text-muted">Ce lien a expiré ou a déjà été utilisé.</p>
        <Link href={routes.forgotPassword} className="font-semibold text-ink hover:underline">
          Demander un nouveau lien
        </Link>
      </div>
    )
  }
  return <ResetPasswordForm />
}
