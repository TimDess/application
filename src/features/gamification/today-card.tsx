import { Check, Shield, Snowflake } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'
import { streakDays, streakMessage } from './labels'
import { StreakFlame } from './streak-flame'
import type { Progress as ProgressData } from './types'

const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'narrow', timeZone: 'UTC' })
const weekdayLong = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

/** Home card: streak, the last 7 days, today's goal and the level. */
export function TodayCard({ progress }: { progress: ProgressData }) {
  const { streak, today, week } = progress
  const alive = streak.current > 0
  const goalDone = today.xp >= today.goalXp
  const toNext = progress.nextXp - progress.totalXp

  return (
    <section aria-labelledby="ta-journee" className="glass flex flex-col gap-5 rounded-hero p-5">
      <h2 id="ta-journee" className="sr-only">
        Ta journée
      </h2>

      <div className="flex items-center gap-4">
        <span
          className={cn(
            'grid size-14 shrink-0 place-items-center rounded-full',
            alive ? 'bg-accent/15' : 'bg-surface-2',
          )}
        >
          <StreakFlame lit={alive} className="size-7" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="font-display text-title leading-tight font-bold text-ink">
            {alive ? `Série de ${streakDays(streak.current)}` : 'Pas encore de série'}
          </p>
          <p className="text-body text-muted">{streakMessage(streak.status)}</p>
        </div>
        {streak.freezes > 0 ? (
          <span
            className="flex shrink-0 items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-caption font-semibold text-ink"
            title="Protections de série"
          >
            <Shield className="size-3.5" aria-hidden="true" />
            {streak.freezes}
            <span className="sr-only">
              protection{streak.freezes > 1 ? 's' : ''} de série en réserve
            </span>
          </span>
        ) : null}
      </div>

      <ol className="grid grid-cols-7 gap-1.5" aria-label="Tes 7 derniers jours">
        {week.map((d, i) => {
          const date = new Date(`${d.day}T00:00:00Z`)
          const isToday = i === week.length - 1
          const state = d.active ? 'leçon terminée' : d.frozen ? 'protégé' : 'pas de leçon'
          return (
            <li key={d.day} className="flex flex-col items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn('text-caption', isToday ? 'font-semibold text-ink' : 'text-muted')}
              >
                {weekday.format(date)}
              </span>
              <span
                className={cn(
                  'grid size-9 place-items-center rounded-full border',
                  d.active
                    ? 'border-accent bg-accent text-on-accent'
                    : d.frozen
                      ? 'border-line bg-surface-2 text-ink'
                      : 'border-line text-muted',
                  isToday && !d.active && 'border-dashed border-line-strong',
                )}
              >
                {d.active ? (
                  <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                ) : d.frozen ? (
                  <Snowflake className="size-4" aria-hidden="true" />
                ) : null}
                <span className="sr-only">
                  {isToday ? 'Aujourd’hui' : weekdayLong.format(date)} : {state}
                </span>
              </span>
            </li>
          )
        })}
      </ol>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2 text-caption">
            <span className="font-semibold text-ink">Objectif du jour</span>
            <span className="tabular text-muted">
              {Math.min(today.xp, today.goalXp)} / {today.goalXp} XP
            </span>
          </div>
          <Progress
            value={Math.min(today.xp, today.goalXp)}
            max={today.goalXp}
            label="Objectif du jour"
            className="h-2"
          />
          {goalDone ? (
            <span className="text-caption font-semibold text-accent-text">Objectif atteint !</span>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2 text-caption">
            <span className="font-semibold text-ink">Niveau {progress.level}</span>
            <span className="tabular text-muted">encore {toNext} XP</span>
          </div>
          <Progress
            value={progress.totalXp - progress.floorXp}
            max={progress.nextXp - progress.floorXp}
            label={`Progression vers le niveau ${progress.level + 1}`}
            className="h-2"
          />
        </div>
      </div>
    </section>
  )
}
