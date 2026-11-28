import { Settings } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { PageHeader, SectionTitle } from '@/components/layout/page-header'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { dailyGoals, profileVisibilities, selfLevels } from '@/config/product'
import { routes } from '@/config/routes'
import { UniverseTile } from '@/features/universes/universe-tile'
import { getPublishedUniverses, getViewer } from '@/lib/auth/session'
import { streakDays } from '@/features/gamification/labels'
import { getMyBadges, getMyDna, getMyProgress } from '@/features/gamification/queries'
import { getMyDivision } from '@/features/leagues/queries'
import { divisionOf } from '@/config/divisions'
import { BadgeMedal, rarityLabels, type BadgeFamily } from '@/features/gamification/badge-medal'
import { DnaRadar } from '@/features/gamification/dna-radar'
import { dnaIdentity, dnaShortLabels } from '@/config/dna'
import { Progress } from '@/components/ui/progress'

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
  const [viewer, progress, universes, dna, badges] = await Promise.all([
    getViewer(),
    getMyProgress(),
    getPublishedUniverses(),
    getMyDna(),
    getMyBadges(),
  ])
  const division = divisionOf(await getMyDivision())
  const identity = dnaIdentity(dna)
  const playable = dna.filter((d) => d.available > 0)
  const earnedCount = badges.filter((b) => b.earnedAt).length
  const universeName = (slug: string) => universes.find((u) => u.slug === slug)?.name ?? slug
  const stats = [
    { label: 'Niveau', value: String(progress.level) },
    { label: 'XP totale', value: progress.totalXp.toLocaleString('fr-FR') },
    { label: 'Série record', value: streakDays(progress.streak.longest) },
    { label: 'Division', value: division.label },
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

      <section aria-labelledby="adn" className="flex flex-col gap-3">
        <SectionTitle>
          <span id="adn">ADN culturel</span>
        </SectionTitle>
        <Card className="flex flex-col gap-5">
          <div className="flex flex-col gap-1 text-center">
            {identity ? (
              <>
                <p className="font-display text-title font-bold text-ink">{identity.title}</p>
                <p className="text-body text-muted">{identity.qualifier}</p>
              </>
            ) : (
              <>
                <p className="font-display text-title font-bold text-ink">ADN en construction</p>
                <p className="text-body text-muted">
                  Il se dessine à mesure que tu retiens des notions en révision.
                </p>
              </>
            )}
          </div>
          <DnaRadar branches={dna} labels={dnaShortLabels} />
          <ul className="flex flex-col gap-3" aria-label="Maîtrise par univers">
            {playable.map((d) => (
              <li key={d.slug} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-caption">
                  <span className="font-semibold text-ink">{universeName(d.slug)}</span>
                  <span className="tabular text-muted">
                    {d.score} % · {d.mastered}/{d.available} notions retenues
                  </span>
                </div>
                <Progress value={d.score} label={`Maîtrise : ${universeName(d.slug)}`} />
              </li>
            ))}
          </ul>
          <p className="text-caption text-muted">
            La maîtrise compte les notions bien retenues en révision, pas le temps passé. Les autres
            univers s’ajouteront avec leurs parcours.
          </p>
        </Card>
      </section>

      <section aria-labelledby="badges" className="flex flex-col gap-3">
        <SectionTitle
          aside={
            <span className="tabular text-caption text-muted">
              {earnedCount}/{badges.length}
            </span>
          }
        >
          <span id="badges">Badges</span>
        </SectionTitle>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {badges.map((b) => (
            <li
              key={b.key}
              className="glass flex flex-col items-center gap-2 rounded-card p-4 text-center"
            >
              <BadgeMedal
                family={b.family as BadgeFamily}
                rarity={b.rarity}
                earned={Boolean(b.earnedAt)}
              />
              <span className={b.earnedAt ? 'font-semibold text-ink' : 'font-semibold text-muted'}>
                {b.title}
              </span>
              <span className="text-caption text-muted">
                {b.earnedAt ? rarityLabels[b.rarity] : b.description}
              </span>
              <span className="sr-only">{b.earnedAt ? 'Obtenu' : 'Pas encore obtenu'}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
