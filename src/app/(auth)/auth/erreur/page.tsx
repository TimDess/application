import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { routes } from '@/config/routes'
import { AuthHeading } from '@/features/auth/auth-heading'

export const metadata: Metadata = { title: 'Lien invalide' }

export default function AuthErrorPage() {
  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        title="Ce lien ne fonctionne plus"
        description="Il a expiré ou a déjà été utilisé. Les liens envoyés par email sont valables une heure et ne servent qu’une fois."
      />
      <div className="flex flex-col gap-3">
        <Button asChild size="lg">
          <Link href={routes.signIn}>Se connecter</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={routes.forgotPassword}>Recevoir un nouveau lien</Link>
        </Button>
      </div>
    </div>
  )
}
