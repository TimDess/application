import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { routes } from '@/config/routes'
import { signOutAction } from '@/features/auth/actions'
import { SettingsForm } from '@/features/settings/settings-form'
import { getPublishedUniverses, getViewer } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Paramètres' }

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Paramètres" description="Tes choix sont enregistrés automatiquement." />
      <Suspense fallback={<PageSkeleton />}>
        <Settings />
      </Suspense>
      <Suspense fallback={null}>
        <GuestSignOutWarning />
      </Suspense>
      <form action={signOutAction}>
        <Button type="submit" variant="secondary" className="w-full sm:w-auto">
          Se déconnecter
        </Button>
      </form>
    </div>
  )
}

async function GuestSignOutWarning() {
  const viewer = await getViewer()
  if (!viewer.isGuest) return null
  return (
    <p className="text-body text-muted">
      Attention : tu joues en invité. Si tu te déconnectes sans{' '}
      <Link href={routes.saveAccount} className="font-semibold text-ink underline">
        créer ton compte
      </Link>
      , tu ne pourras plus retrouver ta progression.
    </p>
  )
}

async function Settings() {
  const [viewer, universes] = await Promise.all([getViewer(), getPublishedUniverses()])
  return <SettingsForm viewer={viewer} universes={universes} />
}
