import type { Metadata } from 'next'
import Link from 'next/link'
import { routes } from '@/config/routes'
import { AuthHeading } from '@/features/auth/auth-heading'
import { GuestStartForm } from '@/features/guest/forms'

export const metadata: Metadata = { title: 'Essayer sans compte' }

export default function TrialPage() {
  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        title="Essaie sans compte"
        description="Joue tout de suite. Ta progression est bien enregistrée : tu pourras la garder en créant ton compte plus tard."
      />
      <GuestStartForm />
      <p className="text-caption text-muted">
        Un compte invité inactif pendant 30 jours est supprimé avec ses données.
      </p>
      <p className="text-center text-body text-muted">
        Tu préfères un compte tout de suite ?{' '}
        <Link href={routes.signUp} className="font-semibold text-ink hover:underline">
          Créer mon compte
        </Link>
      </p>
    </div>
  )
}
