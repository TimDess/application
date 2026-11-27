'use client'

import { Trophy } from 'lucide-react'
import type { LessonSummary } from '@/features/learning/types'
import { CountUp } from './count-up'

const RADIUS = 52
const LENGTH = 2 * Math.PI * RADIUS

/** Celebration screen: rays, trophy pop, accuracy ring filling up, counters. */
export function LessonResult({
  summary,
  headingRef,
}: {
  summary: LessonSummary
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  const title = summary.perfect
    ? 'Sans faute !'
    : summary.score >= 60
      ? 'Leçon terminée'
      : 'Leçon terminée, à revoir'
  return (
    <div className="flex flex-col items-center gap-5 pt-4 text-center">
      <div className="relative grid size-44 place-items-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 [animation:rays-in_500ms_var(--ease-out)_both,rays-spin_14s_linear_infinite] rounded-full opacity-60"
          style={{
            background:
              'repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--accent) 38%, transparent) 0deg 10deg, transparent 10deg 30deg)',
            maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
          }}
        />
        <svg viewBox="0 0 120 120" className="absolute size-36 -rotate-90" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={LENGTH}
            strokeDashoffset={LENGTH * (1 - summary.score / 100)}
            style={{
              ['--ring-length' as string]: `${LENGTH}`,
              animation: 'ring-fill 1100ms var(--ease-out) 250ms both',
            }}
          />
        </svg>
        <span className="relative grid size-20 [animation:trophy-in_620ms_var(--ease-out)_both] place-items-center rounded-full bg-accent text-on-accent shadow-(--shadow-pop)">
          <Trophy className="size-9" aria-hidden="true" />
        </span>
      </div>

      <div className="stagger flex flex-col items-center gap-1.5">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-title outline-none"
          style={{ ['--i' as string]: 0 }}
        >
          {title}
        </h1>
        <p className="text-body text-muted" style={{ ['--i' as string]: 1 }}>
          {summary.correct} bonne{summary.correct > 1 ? 's' : ''} réponse
          {summary.correct > 1 ? 's' : ''} sur {summary.total}
        </p>
      </div>

      <div className="stagger grid w-full grid-cols-2 gap-3">
        <div
          className="glass flex flex-col gap-1 rounded-card p-4"
          style={{ ['--i' as string]: 2 }}
        >
          <span className="text-caption text-muted">Précision</span>
          <span className="font-display text-title font-semibold text-ink">
            <CountUp value={summary.score} suffix=" %" delay={250} />
            <span className="sr-only">{summary.score} %</span>
          </span>
        </div>
        <div
          className="glass flex flex-col gap-1 rounded-card p-4"
          style={{ ['--i' as string]: 3 }}
        >
          <span className="text-caption text-muted">Bonnes réponses</span>
          <span className="font-display text-title font-semibold text-ink">
            <CountUp value={summary.correct} delay={350} />
            <span aria-hidden="true">/{summary.total}</span>
            <span className="sr-only">
              {summary.correct} sur {summary.total}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
