import { ArrowDown, ArrowUp, CalendarCheck, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Fragment, Suspense } from 'react'
import { PageHeader, SectionTitle } from '@/components/layout/page-header'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { divisionOf, divisions, timeLeft } from '@/config/divisions'
import { routes } from '@/config/routes'
import { voice } from '@/config/voice'
import { Mascot } from '@/components/brand/mascot'
import { DuelLauncher } from '@/features/duels/duel-launcher'
import { DivisionBadge } from '@/features/leagues/division-badge'
import { getMyLeague, type League } from '@/features/leagues/queries'
import { cn } from '@/lib/utils/cn'

export const metadata: Metadata = { title: 'Ligue' }

export default function LeaguePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LeagueView />
    </Suspense>
  )
}

const outcomeText = {
  promoted: voice.league.promoted,
  stayed: voice.league.stayed,
  relegated: voice.league.relegated,
} as const

async function LeagueView() {
  const league = await getMyLeague()
  const division = divisionOf(league.division)
  const ends = timeLeft(league.seconds_left)
  const lastWeekIsPrevious =
    league.last_week &&
    new Date(league.week_start).getTime() - new Date(league.last_week.week_start).getTime() ===
      7 * 86_400_000

  const mine = league.standings.find((s) => s.is_me)
  const leading = league.joined && mine?.rank === 1 && mine.points > 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ligue"
        eyebrow="Ta division"
        action={<Mascot mood={leading ? 'party' : 'duel'} size={72} />}
      />

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <DivisionBadge value={league.division} size="lg" />
          <span className="flex items-center gap-1.5 text-caption text-muted">
            <Clock className="size-4" aria-hidden="true" />
            Fin dans {ends}
          </span>
        </div>
        {lastWeekIsPrevious && league.last_week ? (
          <p className="rounded-control bg-surface-2 px-3 py-2 text-body text-ink">
            Semaine dernière : {league.last_week.rank}
            <sup>{league.last_week.rank === 1 ? 'er' : 'e'}</sup> avec {league.last_week.points}{' '}
            points.{' '}
            <span className="font-semibold">
              {outcomeText[league.last_week.outcome](division.label)}
            </span>
          </p>
        ) : null}
        {leading ? (
          <p className="font-display text-heading font-bold text-accent-text">
            {voice.league.first} Tu mènes ton groupe.
          </p>
        ) : null}
        {league.joined ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-caption text-muted">Tes points</span>
              <span className="tabular font-display text-title font-bold text-ink">
                {league.standings.find((s) => s.is_me)?.points ?? 0}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-caption text-muted">Duels comptés</span>
              <span className="tabular font-display text-title font-bold text-ink">
                {Math.min(league.my_duels, league.counted_duels)}/{league.counted_duels}
              </span>
            </div>
          </div>
        ) : null}
      </Card>

      {league.guest ? (
        <Card className="flex flex-col gap-3">
          <p className="text-body text-ink">
            <span className="font-semibold">Les ligues sont réservées aux comptes.</span> Crée ton
            compte pour entrer dans le classement de la semaine : tu gardes toute ta progression.
          </p>
          <Button asChild className="self-start">
            <Link href={routes.saveAccount}>Créer mon compte</Link>
          </Button>
        </Card>
      ) : !league.joined ? (
        <Card className="flex flex-col gap-4">
          <p className="text-body text-ink">
            <span className="font-semibold">Rejoins la ligue de la semaine</span> en jouant un duel
            ou le défi du jour : tu seras placé dans un groupe de joueurs de ta division.
          </p>
          <DuelLauncher />
          <Button asChild variant="secondary">
            <Link href={routes.daily}>
              <CalendarCheck className="size-4" aria-hidden="true" />
              Défi du jour
            </Link>
          </Button>
        </Card>
      ) : (
        <Standings league={league} />
      )}

      <details className="glass group rounded-card p-4">
        <summary className="cursor-pointer text-heading font-semibold text-ink">
          Comment ça marche
        </summary>
        <ul className="mt-3 flex flex-col gap-2 text-body text-muted">
          <li>La semaine va du lundi 0 h au dimanche 23 h 59, heure de Paris.</li>
          <li>Duel gagné : 30 points. Nul : 15. Perdu : 5. Forfait : 0.</li>
          <li>Défi du jour : 20 points, une fois par jour.</li>
          <li>Seuls tes {league.counted_duels} meilleurs duels de la semaine comptent.</li>
          <li>Fin de semaine : les premiers de chaque groupe montent, les derniers descendent.</li>
        </ul>
      </details>

      <section aria-labelledby="divisions" className="flex flex-col gap-3">
        <SectionTitle>
          <span id="divisions">Les divisions</span>
        </SectionTitle>
        <ol className="flex flex-wrap gap-2">
          {divisions.map((d, i) => {
            const current = d.value === league.division
            return (
              <li
                key={d.value}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 text-body',
                  current
                    ? 'border-ink bg-surface font-semibold text-ink'
                    : 'border-line bg-surface text-muted',
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full"
                  style={{ background: d.color }}
                />
                <span className="tabular text-caption">{i + 1}</span>
                {d.label}
                {current ? <span className="sr-only"> (ta division)</span> : null}
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}

function Standings({ league }: { league: League }) {
  const size = league.standings.length
  const up = league.promote_count
  const downFrom = size - league.relegate_count
  return (
    <section aria-labelledby="classement" className="flex flex-col gap-3">
      <SectionTitle aside={<span className="text-caption text-muted">{size} joueurs</span>}>
        <span id="classement">Classement de ton groupe</span>
      </SectionTitle>
      <ol className="glass divide-y divide-line overflow-hidden rounded-card">
        {league.standings.map((s) => {
          const zone = s.rank <= up ? 'up' : s.rank > downFrom ? 'down' : null
          return (
            <Fragment key={s.rank}>
              {s.rank === downFrom + 1 && league.relegate_count > 0 ? (
                <li
                  className="bg-danger/8 px-4 py-1.5 text-caption font-semibold text-danger"
                  aria-hidden="true"
                >
                  Zone de descente
                </li>
              ) : null}
              <li
                className={cn(
                  'flex items-center gap-3 px-4 py-3',
                  s.is_me && 'bg-accent/12',
                  zone === 'up' && !s.is_me && 'bg-success/8',
                )}
              >
                <span className="tabular w-6 text-center font-display font-bold text-ink">
                  {s.rank}
                </span>
                <Avatar avatarKey={s.avatar_key} name={s.username ?? '?'} size="sm" />
                <span className="min-w-0 flex-1 truncate text-body font-medium text-ink">
                  {s.is_me ? `${s.username ?? 'Toi'} (toi)` : (s.username ?? 'Joueur masqué')}
                </span>
                {zone === 'up' ? (
                  <ArrowUp className="size-4 text-success" aria-label="Zone de montée" />
                ) : zone === 'down' ? (
                  <ArrowDown className="size-4 text-danger" aria-label="Zone de descente" />
                ) : null}
                <span className="tabular w-14 text-right font-semibold text-ink">
                  {s.points} pts
                </span>
              </li>
              {s.rank === up && up > 0 && size > up ? (
                <li
                  className="bg-success/8 px-4 py-1.5 text-caption font-semibold text-success"
                  aria-hidden="true"
                >
                  ↑ Les {up} premier{up > 1 ? 's' : ''} montent de division
                </li>
              ) : null}
            </Fragment>
          )
        })}
      </ol>
    </section>
  )
}
