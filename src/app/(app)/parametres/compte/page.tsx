import { ArrowLeft, Download } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { brand } from '@/config/brand'
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

      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <Credentials />
      </Suspense>

      <Card className="flex flex-col gap-3">
        <CardTitle>Tes données</CardTitle>
        <CardDescription>
          Télécharge tout ce que {brand.name} conserve sur toi, dans un fichier JSON.
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
        <Suspense fallback={<Skeleton className="h-24 w-full" />}>
          <DeleteSection />
        </Suspense>
      </Card>
    </div>
  )
}

async function Credentials() {
  const viewer = await getViewer()
  if (viewer.isGuest) {
    return (
      <Card className="flex flex-col gap-3">
        <CardTitle>Compte invité</CardTitle>
        <CardDescription>
          Tu joues sans email ni mot de passe. Crée ton compte pour garder ta progression : un
          compte invité inactif pendant 30 jours est supprimé.
        </CardDescription>
        <Button asChild className="self-start">
          <Link href={routes.saveAccount}>Sauvegarder ma progression</Link>
        </Button>
      </Card>
    )
  }
  return (
    <>
      <Card className="flex flex-col gap-1">
        <CardTitle>Adresse email</CardTitle>
        <p className="text-body font-medium text-ink">{viewer.email}</p>
        <CardDescription>Elle n’est jamais affichée publiquement.</CardDescription>
      </Card>
      <Card className="flex flex-col gap-4">
        <CardTitle>Mot de passe</CardTitle>
        <ChangePasswordForm />
      </Card>
    </>
  )
}

async function DeleteSection() {
  const viewer = await getViewer()
  return <DeleteAccountForm guest={viewer.isGuest} />
}
