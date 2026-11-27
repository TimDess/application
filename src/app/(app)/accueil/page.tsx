import { CalendarCheck, Repeat2, Swords, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader, SectionTitle } from '@/components/layout/page-header'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import { Card } from '@/components/ui/card'
import { SoonBadge } from '@/components/ui/pill'
import { dailyGoals, selfLevels } from '@/config/product'
import { UniverseCover, UniverseTile } from '@/features/universes/universe-tile'
import { universeStyle } from '@/features/universes/universe-style'
import { getViewer } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Accueil' }

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Dashboard />
    </Suspense>
  )
}

const upcoming = [
  {
    icon: CalendarCheck,
    title: 'Défi du jour',
    text: 'Le même défi pour tout le monde, chaque jour.',
    phase: 3,
  },
  {
    icon: Repeat2,
    title: 'Révisions',
    text: 'Tes notions reviennent au bon moment pour ne pas les oublier.',
    phase: 3,
  },
  {
    icon: Swords,
    title: 'Ligue et duels',
    text: 'Monte de division en affrontant d’autres joueurs.',
    phase: 4,
  },
  { icon: Users, title: 'Amis', text: 'Compare-toi à tes amis et lance-leur des défis.', phase: 5 },
]

async function Dashboard() {
  const viewer = await getViewer()
  const goal = dailyGoals.find((g) => g.minutes === viewer.settings.dailyGoalMinutes)
  const first = viewer.favorites[0]
  const levelLabel = (level: string | null) =>
    selfLevels.find((l) => l.value === level)?.label ?? 'Niveau non précisé'

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Salut ${viewer.username ?? ''}`.trim()}
        description={
          goal ? `Objectif ${goal.label.toLowerCase()} : ${goal.minutes} min par jour.` : undefined
        }
      />

      <section aria-labelledby="continue" className="flex flex-col gap-3">
        <SectionTitle>
          <span id="continue">Continue ton aventure</span>
        </SectionTitle>
        {first ? (
          <div
            className="universe-scope flex flex-col gap-4 rounded-lg border border-[color-mix(in_srgb,var(--uni)_28%,var(--line))] bg-[color-mix(in_srgb,var(--uni)_9%,var(--surface))] p-4"
            style={universeStyle(first)}
          >
            <div className="flex items-center gap-3">
              <UniverseCover universe={first} size="lg" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-caption font-semibold text-muted">{first.name}</span>
                <p className="font-display text-heading font-semibold text-ink">
                  Ton premier parcours se prépare
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-body text-muted">
                Les leçons et les mini-jeux arrivent avec la prochaine version.
              </p>
              <SoonBadge phase={2} />
            </div>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="mes-univers" className="flex flex-col gap-3">
        <SectionTitle>
          <span id="mes-univers">Tes univers</span>
        </SectionTitle>
        <ul className="grid gap-3 sm:grid-cols-2">
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

      <section aria-labelledby="a-venir" className="flex flex-col gap-3">
        <SectionTitle>
          <span id="a-venir">Bientôt sur Kulto</span>
        </SectionTitle>
        <Card className="divide-y divide-line p-0">
          {upcoming.map(({ icon: Icon, title, text, phase }) => (
            <div key={title} className="flex items-center gap-3 px-4 py-3">
              <Icon className="size-5 shrink-0 text-muted" aria-hidden="true" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-body font-semibold text-ink">{title}</span>
                <span className="text-caption text-muted">{text}</span>
              </div>
              <SoonBadge phase={phase} />
            </div>
          ))}
        </Card>
      </section>
    </div>
  )
}
