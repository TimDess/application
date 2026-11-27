import { CalendarCheck, Repeat2, Swords, Trophy, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { PageHeader, SectionTitle } from '@/components/layout/page-header'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { SoonBadge } from '@/components/ui/pill'
import { dailyGoals, selfLevels } from '@/config/product'
import { coursePath, lessonPath, routes } from '@/config/routes'
import { getContinueCourse } from '@/features/learning/queries'
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
  const continuing = await getContinueCourse(viewer.favorites.map((f) => f.slug))
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
        {continuing ? (
          <ContinueCard data={continuing} />
        ) : first ? (
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
            <p className="text-body text-muted">
              Les parcours de cet univers sont en cours d’écriture.
            </p>
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

type ContinueData = NonNullable<Awaited<ReturnType<typeof getContinueCourse>>>

function ContinueCard({ data }: { data: ContinueData }) {
  const { outline, reason } = data
  const next = outline.nextLesson
  const total = outline.lessons.length
  const label =
    reason === 'resume'
      ? outline.chapters.find((c) => c.lessons.some((l) => l.id === next?.id))?.title
      : reason === 'discover'
        ? 'À découvrir'
        : 'Pour commencer'
  return (
    <div
      className="universe-scope flex flex-col gap-4 rounded-lg border border-[color-mix(in_srgb,var(--uni)_28%,var(--line))] bg-[color-mix(in_srgb,var(--uni)_9%,var(--surface))] p-4"
      style={universeStyle(outline.universe)}
    >
      <div className="flex items-center gap-3">
        <UniverseCover universe={outline.universe} size="lg" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-caption font-semibold text-muted">
            {outline.universe.name} · {outline.title}
          </span>
          <p className="font-display text-heading font-semibold text-ink">
            {next ? next.title : 'Parcours terminé'}
          </p>
          {label && next ? <span className="text-caption text-muted">{label}</span> : null}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Progress
          value={outline.completedCount}
          max={total}
          label="Progression du parcours"
          barClassName="bg-(--uni)"
        />
        <span className="tabular shrink-0 text-caption text-muted">
          {outline.completedCount}/{total}
        </span>
      </div>
      {next ? (
        <Button asChild size="lg">
          <Link href={lessonPath(next.slug)}>
            {outline.completedCount > 0 || reason === 'resume' ? 'Reprendre' : 'Commencer'}
          </Link>
        </Button>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-body font-semibold text-ink">
            <Trophy className="size-5 text-accent-text" aria-hidden="true" />
            Bravo, tout est fait.
          </span>
          <Button asChild variant="secondary" size="sm">
            <Link href={coursePath(outline.slug)}>Revoir le parcours</Link>
          </Button>
        </div>
      )}
      {reason === 'discover' ? (
        <Link
          href={routes.explore}
          className="text-caption font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Tes univers favoris n’ont pas encore de parcours. Voir tous les univers
        </Link>
      ) : null}
    </div>
  )
}
