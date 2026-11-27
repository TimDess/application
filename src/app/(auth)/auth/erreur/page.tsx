import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { routes } from '@/config/routes'
import { AuthHeading } from '@/features/auth/auth-heading'

export const metadata: Metadata = { title: 'Lien invalide' }

export default function AuthErrorPage({ searchParams }: PageProps<'/auth/erreur'>) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense
        fallback={
          <AuthHeading title="Ce lien ne fonctionne plus" description="Vérification du lien…" />
        }
      >
        <Reason searchParams={searchParams} />
      </Suspense>
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

async function Reason({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { raison } = await searchParams
  if (raison === 'navigateur') {
    return (
      <AuthHeading
        title="Ouvre le lien dans le même navigateur"
        description="Pour ta sécurité, ce lien ne fonctionne que dans le navigateur où tu as fait la demande. Refais la demande depuis ce navigateur-ci, ou copie le lien dans le navigateur d’origine."
      />
    )
  }
  return (
    <AuthHeading
      title="Ce lien ne fonctionne plus"
      description="Il a expiré ou a déjà été utilisé. Si tu venais de créer ton compte, ton adresse est peut-être déjà confirmée : essaie simplement de te connecter."
    />
  )
}
