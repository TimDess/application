'use client'

import { Shield, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CountUp } from '@/components/learning/count-up'
import { motionReduced } from '@/components/theme/theme-client'
import { cn } from '@/lib/utils/cn'
import { streakDays, xpReasonLabels } from './labels'
import { LevelBar } from './level-bar'
import { LevelUpOverlay } from './level-up-overlay'
import { levelRatio } from './parse'
import { BadgeMedal, familyOf, rarityLabels } from './badge-medal'
import { StreakFlame } from './streak-flame'
import type { Rewards } from './types'

/** End-of-lesson rewards: XP lines, level bar, streak and daily goal, then the level-up moment. */
export function RewardsPanel({ rewards }: { rewards: Rewards }) {
  const leveledUp = rewards.levelAfter > rewards.levelBefore
  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    if (!leveledUp) return
    const t = setTimeout(() => setShowLevelUp(true), motionReduced() ? 0 : 1900)
    return () => clearTimeout(t)
  }, [leveledUp])

  const from = levelRatio(rewards.totalXpBefore, rewards.previousFloorXp, rewards.previousNextXp)
  const toRatio = levelRatio(rewards.totalXpAfter, rewards.levelFloorXp, rewards.nextLevelXp)
  const goalReached =
    rewards.todayXpBefore < rewards.goalXp && rewards.todayXpAfter >= rewards.goalXp
  const goalRatio = Math.min(1, rewards.todayXpAfter / Math.max(1, rewards.goalXp))
  const { streak } = rewards

  return (
    <section aria-labelledby="rewards-title" className="stagger flex w-full flex-col gap-3">
      <h2 id="rewards-title" className="sr-only">
        Récompenses
      </h2>

      <div className="glass flex flex-col gap-3 rounded-card p-4" style={{ ['--i' as string]: 4 }}>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-heading font-semibold text-ink">XP gagnée</span>
          <span className="font-display text-title font-bold text-accent-text">
            +<CountUp value={rewards.xp} delay={500} />
            <span className="sr-only">{rewards.xp}</span> XP
          </span>
        </div>
        {rewards.items.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {rewards.items.map((item, i) => (
              <li
                key={item.reason}
                className="rise-in flex items-center justify-between text-body text-muted"
                style={{ animationDelay: `${650 + i * 140}ms` }}
              >
                <span>{xpReasonLabels[item.reason]}</span>
                <span className="tabular font-semibold text-ink">+{item.amount}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-muted">
            Tu avais déjà obtenu toute l’XP de cette leçon. Les révisions arrivent bientôt pour
            réviser en gagnant de l’XP.
          </p>
        )}

        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between text-caption">
            <span className="font-semibold text-ink">Niveau {rewards.levelAfter}</span>
            <span className="tabular text-muted">
              {rewards.totalXpAfter - rewards.levelFloorXp} /{' '}
              {rewards.nextLevelXp - rewards.levelFloorXp} XP
            </span>
          </div>
          <LevelBar
            from={from}
            to={toRatio}
            levelUp={leveledUp}
            delay={700}
            label={`Progression vers le niveau ${rewards.levelAfter + 1}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div
          className="glass flex flex-col gap-2 rounded-card p-4"
          style={{ ['--i' as string]: 5 }}
        >
          <span className="flex items-center gap-2 text-caption text-muted">
            <StreakFlame lit={streak.after > 0} ignite={streak.extended} className="size-4" />
            Série
          </span>
          <span className="font-display text-title font-semibold text-ink">
            {streakDays(streak.after)}
          </span>
          <span className="text-caption text-muted">
            {streak.freezesUsed > 0
              ? 'Une protection a gardé ta série.'
              : streak.freezeEarned
                ? 'Protection gagnée !'
                : streak.extended
                  ? streak.before === 0
                    ? 'C’est le début !'
                    : '+1 aujourd’hui'
                  : 'Déjà validée aujourd’hui'}
          </span>
        </div>
        <div
          className="glass flex flex-col gap-2 rounded-card p-4"
          style={{ ['--i' as string]: 6 }}
        >
          <span className="flex items-center gap-2 text-caption text-muted">
            <Target className="size-4" aria-hidden="true" />
            Objectif du jour
          </span>
          <span className="tabular font-display text-title font-semibold text-ink">
            {Math.min(rewards.todayXpAfter, rewards.goalXp)}
            <span className="text-body font-normal text-muted"> / {rewards.goalXp} XP</span>
          </span>
          <div
            role="progressbar"
            aria-label="Objectif du jour"
            aria-valuemin={0}
            aria-valuemax={rewards.goalXp}
            aria-valuenow={Math.min(rewards.todayXpAfter, rewards.goalXp)}
            className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
          >
            <div
              className={cn('h-full rounded-full bg-accent', goalReached && 'anim-pop')}
              style={{ width: `${goalRatio * 100}%` }}
            />
          </div>
          {goalRatio >= 1 ? (
            <span className="text-caption font-semibold text-accent-text">
              {goalReached ? 'Objectif atteint !' : 'Objectif déjà atteint'}
            </span>
          ) : null}
        </div>
      </div>

      {rewards.badges.length > 0 ? (
        <div
          className="glass flex flex-col gap-3 rounded-card p-4"
          style={{ ['--i' as string]: 7 }}
        >
          <h3 className="text-heading font-semibold text-ink">
            {rewards.badges.length > 1 ? 'Nouveaux badges' : 'Nouveau badge'}
          </h3>
          <ul className="flex flex-col gap-3">
            {rewards.badges.map((badge) => (
              <li key={badge.key} className="flex items-center gap-4">
                <span className="level-burst" style={{ animationDelay: '1300ms' }}>
                  <BadgeMedal family={familyOf(badge.key)} rarity={badge.rarity} earned />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-display text-heading font-semibold text-ink">
                    {badge.title}
                  </span>
                  <span className="text-caption text-muted">
                    {rarityLabels[badge.rarity]} · {badge.description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {streak.freezes > 0 ? (
        <p className="flex items-center justify-center gap-1.5 text-caption text-muted">
          <Shield className="size-3.5" aria-hidden="true" />
          {streak.freezes} protection{streak.freezes > 1 ? 's' : ''} de série en réserve
        </p>
      ) : null}

      {showLevelUp ? (
        <LevelUpOverlay level={rewards.levelAfter} onClose={() => setShowLevelUp(false)} />
      ) : null}
    </section>
  )
}
