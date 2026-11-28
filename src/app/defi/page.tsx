import { CalendarCheck, CalendarClock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { BrandLoaderScreen } from '@/components/ui/brand-loader'
import { Button } from '@/components/ui/button'
import { routes } from '@/config/routes'
import { getMyProgress } from '@/features/gamification/queries'
import { MetaChips, PracticeNotice } from '@/features/practice/practice-notice'
import { PracticePlayer } from '@/features/practice/practice-player'
import { ShareButton } from '@/features/practice/share-button'
import { requireUser } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Défi du jour' }

export default function DailyPage() {
  return (
    <Suspense fallback={<BrandLoaderScreen label="Préparation du défi" />}>
      <Daily />
    </Suspense>
  )
}

const dayLabel = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

async function Daily() {
  await requireUser()
  const { daily } = await getMyProgress()
  const date = dayLabel.format(new Date(`${daily.day}T00:00:00Z`))

  const idle = !daily.available ? (
    <PracticeNotice
      icon={<CalendarClock className="size-7" aria-hidden="true" />}
      title="Pas encore de défi"
    >
      <p className="text-body text-muted">
        Le défi du jour arrive dès que les premiers parcours sont publiés.
      </p>
      <Button asChild size="lg" className="w-full">
        <Link href={routes.dashboard}>Retour à l’accueil</Link>
      </Button>
    </PracticeNotice>
  ) : daily.completed ? (
    <PracticeNotice
      icon={<CalendarCheck className="size-7" aria-hidden="true" />}
      title="Défi du jour terminé"
    >
      <p className="font-display text-[3rem] leading-none font-bold text-ink">
        {daily.correct}/{daily.total}
      </p>
      <p aria-hidden="true" className="text-[1.75rem] tracking-[0.2em]">
        {daily.results.map((r) => (r ? '🟨' : '⬛')).join('')}
      </p>
      <p className="text-body text-muted">Le prochain tombe à minuit. Garde des forces.</p>
      <div className="flex w-full flex-col gap-3">
        <ShareButton day={daily.day} results={daily.results} />
        <Button asChild size="lg">
          <Link href={routes.dashboard}>Retour à l’accueil</Link>
        </Button>
      </div>
    </PracticeNotice>
  ) : undefined

  return (
    <PracticePlayer
      kind="daily"
      idle={idle}
      title="Défi du jour"
      intro={`Le défi du ${date} t’attend. Tout le monde a les mêmes questions, et tu n’as qu’une tentative.`}
      meta={<MetaChips items={['5 questions', 'Une seule tentative', '+50 XP', 'Partageable']} />}
    />
  )
}
