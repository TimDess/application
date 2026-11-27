'use client'

import { Link2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { PlayQuestion } from '@/features/learning/types'
import { cn } from '@/lib/utils/cn'
import type { GameProps } from './game-props'

type Match = Extract<PlayQuestion, { format: 'match' }>

/**
 * Tap an item on the left, then its partner on the right. Fully keyboard-usable
 * (no drag and drop). Tapping a paired item again unpairs it. Pairs are numbered.
 */
export function MatchGame({ question, result, pending, onSubmit }: GameProps<Match>) {
  const [pairs, setPairs] = useState<Record<string, string>>(
    result?.answer && 'pairs' in result.answer ? result.answer.pairs : {},
  )
  const [active, setActive] = useState<string | null>(null)
  const done = Object.keys(pairs).length === question.left.length
  const pairNumber = (leftId: string) => question.left.findIndex((l) => l.id === leftId) + 1
  const leftOf = (rightId: string) => Object.keys(pairs).find((l) => pairs[l] === rightId)

  function pickLeft(id: string) {
    if (result) return
    if (pairs[id]) {
      const next = { ...pairs }
      delete next[id]
      setPairs(next)
      setActive(id)
      return
    }
    // The next item is pre-selected after each pair: tapping it again must keep it selected.
    setActive(id)
  }

  function pickRight(id: string) {
    if (result) return
    const owner = leftOf(id)
    if (owner && !active) {
      const next = { ...pairs }
      delete next[owner]
      setPairs(next)
      return
    }
    if (!active) return
    const next = { ...pairs }
    if (owner) delete next[owner]
    next[active] = id
    setPairs(next)
    const nextActive = question.left.find((l) => !next[l.id])
    setActive(nextActive?.id ?? null)
  }

  const verdict = (leftId: string) =>
    result ? result.solution.pairs?.[leftId] === pairs[leftId] : null

  return (
    <div className="flex flex-col gap-4">
      {!result ? (
        <p className="text-caption text-muted">
          Choisis un élément à gauche, puis son partenaire à droite.
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2" role="group" aria-label="Éléments à associer">
          {question.left.map((l) => {
            const paired = Boolean(pairs[l.id])
            const ok = verdict(l.id)
            return (
              <button
                key={l.id}
                type="button"
                disabled={Boolean(result) || pending}
                aria-pressed={active === l.id}
                onClick={() => pickLeft(l.id)}
                className={cn(
                  'flex min-h-12 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-body font-medium text-ink transition-colors',
                  active === l.id
                    ? 'border-accent bg-accent/10'
                    : 'border-line bg-surface hover:border-line-strong',
                  ok === true && 'border-success bg-success/12',
                  ok === false && 'border-danger bg-danger/10',
                )}
              >
                <span>{l.label}</span>
                {paired ? <PairBadge n={pairNumber(l.id)} /> : null}
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2" role="group" aria-label="Partenaires">
          {question.right.map((r) => {
            const owner = leftOf(r.id)
            return (
              <button
                key={r.id}
                type="button"
                disabled={Boolean(result) || pending}
                onClick={() => pickRight(r.id)}
                aria-label={
                  owner
                    ? `${r.label}, associé à ${question.left.find((l) => l.id === owner)?.label}`
                    : r.label
                }
                className={cn(
                  'flex min-h-12 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-body font-medium text-ink transition-colors',
                  owner
                    ? 'border-line-strong bg-surface-2'
                    : 'border-line bg-surface hover:border-line-strong',
                  active && !owner && 'border-dashed border-accent',
                )}
              >
                <span>{r.label}</span>
                {owner ? <PairBadge n={pairNumber(owner)} /> : null}
              </button>
            )
          })}
        </div>
      </div>

      {result ? (
        <ul className="flex flex-col gap-1.5 rounded-md border border-line bg-surface p-3 text-body">
          {question.left.map((l) => (
            <li key={l.id} className="flex items-center gap-2">
              <Link2 className="size-4 shrink-0 text-muted" aria-hidden="true" />
              <span className="font-medium text-ink">{l.label}</span>
              <span className="text-muted">
                → {question.right.find((r) => r.id === result.solution.pairs?.[l.id])?.label}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Button size="lg" disabled={!done} loading={pending} onClick={() => onSubmit({ pairs })}>
          Valider
        </Button>
      )}
    </div>
  )
}

function PairBadge({ n }: { n: number }) {
  return (
    <span
      className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-accent text-caption font-bold text-on-accent"
      aria-hidden="true"
    >
      {n}
    </span>
  )
}
