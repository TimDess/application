import { Settings } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { PageHeader, SectionTitle } from '@/components/layout/page-header'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SoonBadge } from '@/components/ui/pill'
import { dailyGoals, profileVisibilities, selfLevels } from '@/config/product'
import { routes } from '@/config/routes'
import { UniverseTile } from '@/features/universes/universe-tile'
import { getPublishedUniverses, getViewer } from '@/lib/auth/session'
import { streakDays } from '@/features/gamification/labels'
import { getMyProgress } from '@/features/gamification/queries'

export const metadata: Metadata = { title: 'Profil' }

export default function ProfilePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Profile />
    </Suspense>
  )
}

const monthYear = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})

async function Profile() {
  const [viewer, progress, universes] = await Promise.all([
    getViewer(),
    getMyProgress(),
    getPublishedUniverses(),
  ])
  const stats = [
    { label: 'Niveau', value: String(progress.level) },
    { label: 'XP totale', value: progress.totalXp.toLocaleString('fr-FR') },
    { label: 'Série record', value: streakDays(progress.streak.longest) },
    { label: 'Leçons terminées', value: String(progress.lessonsCompleted) },
  ]
  const universeLevels = progress.universes.flatMap((p) => {
    const u = universes.find((x) => x.slug === p.slug)
    return u ? [{ universe: u, progress: p }] : []
  })
  const goal = dailyGoals.find((g) => g.minutes === viewer.settings.dailyGoalMinutes)
  const visibility = profileVisibilities.find((v) => v.value === viewer.visibility)
  const levelLabel = (level: string | null) =>
    selfLevels.find((l) => l.value === level)?.label ?? '—'

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Profil"
        action={
          <Button asChild variant="secondary" size="sm">
            <Link href={routes.settings}>
              <Settings className="size-4" aria-hidden="true" />
              Modifier
            </Link>
          </Button>
        }
      />

      <Card className="flex items-center gap-4">
        <Avatar avatarKey={viewer.avatarKey} name={viewer.username} size="lg" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate font-display text-title font-semibold text-ink">
            {viewer.username}
          </p>
          <p className="text-caption text-muted">
            Membre depuis {monthYear.format(new Date(viewer.memberSince))}
          </p>
          <p className="text-caption text-muted">Profil {visibility?.label.toLowerCase()}</p>
        </div>
      </Card>

      <section aria-labelledby="stats" className="flex flex-col gap-3">
        <SectionTitle>
          <span id="stats">Statistiques</span>
        </SectionTitle>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass flex flex-col gap-1 rounded-card p-4">
              <dt className="text-caption text-muted">{s.label}</dt>
              <dd className="tabular font-display text-title font-semibold text-ink">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {universeLevels.length > 0 ? (
        <section aria-labelledby="niveaux" className="flex flex-col gap-3">
          <SectionTitle>
            <span id="niveaux">Niveaux par univers</span>
          </SectionTitle>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {universeLevels.map(({ universe, progress: p }) => (
              <li key={universe.slug}>
                <UniverseTile
                  universe={universe}
                  meta={
                    <span className="shrink-0 text-right">
                      <span className="block font-display text-heading font-semibold text-ink">
                        Niv. {p.level}
                      </span>
                      <span className="tabular block text-caption text-muted">{p.xp} XP</span>
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="univers" className="flex flex-col gap-3">
        <SectionTitle>
          <span id="univers">Univers favoris</span>
        </SectionTitle>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {viewer.favorites.map((u) => (
            <li key={u.slug}>
              <UniverseTile
                universe={u}
                meta={
                  <span className="shrink-0 text-caption text-muted">{levelLabel(u.level)}</span>
                }
              />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="habitudes" className="flex flex-col gap-3">
        <SectionTitle>
          <span id="habitudes">Objectif</span>
        </SectionTitle>
        <Card className="flex items-center justify-between gap-3">
          <span className="text-body text-ink">{goal?.label}</span>
          <span className="tabular text-body text-muted">{goal?.minutes} min par jour</span>
        </Card>
      </section>

      <Card className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-display text-heading font-semibold text-ink">
            ADN culturel et badges
          </span>
          <span className="text-body text-muted">
            Ils se construiront à partir de tes niveaux par univers.
          </span>
        </div>
        <SoonBadge phase={3} />
      </Card>
    </div>
  )
}
