import { ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import { Card } from '@/components/ui/card'
import { routes } from '@/config/routes'
import { getMyProgress } from '@/features/gamification/queries'
import { SaveAccountForm } from '@/features/guest/forms'
import { getViewer } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Sauvegarder ma progression' }

export default function SaveAccountPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SaveAccount />
    </Suspense>
  )
}

async function SaveAccount() {
  const viewer = await getViewer()
  if (!viewer.isGuest) redirect(routes.account)
  const progress = await getMyProgress()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sauvegarde ta progression"
        description="Crée ton compte en 30 secondes : tu gardes tout et tu peux jouer sur tous tes appareils."
      />
      <Card className="flex items-center gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/15 text-accent-text">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <p className="text-body text-ink">
          Tu gardes ton niveau {progress.level}, tes {progress.totalXp} XP, ta série de{' '}
          {progress.streak.current} jour{progress.streak.current > 1 ? 's' : ''} et toutes tes
          notions.
        </p>
      </Card>
      <Card>
        <SaveAccountForm />
      </Card>
    </div>
  )
}
