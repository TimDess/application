import { ArrowLeft, Download } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { routes } from '@/config/routes'
import { ChangePasswordForm, DeleteAccountForm } from '@/features/account/account-forms'
import { getViewer } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Compte' }

export default function AccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href={routes.settings}
        className="inline-flex items-center gap-1.5 self-start text-body text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Paramètres
      </Link>
      <PageHeader title="Compte" />

      <Card className="flex flex-col gap-1">
        <CardTitle>Adresse email</CardTitle>
        <Suspense fallback={<Skeleton className="h-5 w-48" />}>
          <AccountEmail />
        </Suspense>
        <CardDescription>Elle n’est jamais affichée publiquement.</CardDescription>
      </Card>

      <Card className="flex flex-col gap-4">
        <CardTitle>Mot de passe</CardTitle>
        <ChangePasswordForm />
      </Card>

      <Card className="flex flex-col gap-3">
        <CardTitle>Tes données</CardTitle>
        <CardDescription>
          Télécharge tout ce que Kulto conserve sur toi, dans un fichier JSON.
        </CardDescription>
        <a
          href="/api/compte/export"
          download
          className="inline-flex h-11 items-center gap-2 self-start rounded-md border border-line bg-surface px-4 text-body font-semibold text-ink hover:border-line-strong hover:bg-surface-2"
        >
          <Download className="size-4" aria-hidden="true" />
          Exporter mes données
        </a>
      </Card>

      <Card className="flex flex-col gap-4 border-danger/40">
        <div className="flex flex-col gap-1">
          <CardTitle>Supprimer mon compte</CardTitle>
          <CardDescription>
            Ton compte, ton profil et toutes tes données sont effacés immédiatement. Cette action
            est irréversible.
          </CardDescription>
        </div>
        <DeleteAccountForm />
      </Card>
    </div>
  )
}

async function AccountEmail() {
  const viewer = await getViewer()
  return <p className="text-body font-medium text-ink">{viewer.email}</p>
}
