'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { PlayQuestion } from '@/features/learning/types'
import { cn } from '@/lib/utils/cn'
import type { GameProps } from './game-props'

type Timeline = Extract<PlayQuestion, { format: 'timeline' }>

/** Reorder with the arrow buttons (accessible alternative to drag and drop). Earliest at the top. */
export function TimelineGame({ question, result, pending, onSubmit }: GameProps<Timeline>) {
  const [order, setOrder] = useState<string[]>(
    result?.answer && 'order' in result.answer
      ? result.answer.order
      : question.items.map((i) => i.id),
  )
  const [announce, setAnnounce] = useState('')
  const label = (id: string) => question.items.find((i) => i.id === id)?.label ?? ''

  function move(index: number, delta: -1 | 1) {
    const target = index + delta
    if (target < 0 || target >= order.length) return
    const next = [...order]
    ;[next[index], next[target]] = [next[target]!, next[index]!]
    setOrder(next)
    setAnnounce(`${label(order[index]!)} en position ${target + 1}`)
  }

  const shown = result?.solution.order ?? order

  return (
    <div className="flex flex-col gap-3">
      <p className="text-caption text-muted">
        {result ? 'L’ordre correct :' : 'Du plus ancien (en haut) au plus récent (en bas).'}
      </p>
      <ol className="flex flex-col gap-2">
        {shown.map((id, index) => {
          const placedRight = result
            ? result.answer && 'order' in result.answer && result.answer.order[index] === id
            : null
          return (
            <li
              key={id}
              className={cn(
                'flex min-h-12 items-center gap-3 rounded-md border bg-surface px-3 py-2',
                placedRight === null && 'border-line',
                placedRight === true && 'border-success bg-success/12',
                placedRight === false && 'border-line',
              )}
            >
              <span className="tabular w-5 shrink-0 text-caption font-semibold text-muted">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 text-body font-medium text-ink">{label(id)}</span>
              {result ? (
                <span className="tabular shrink-0 text-body font-semibold text-accent-text">
                  {result.solution.dates?.[id]}
                </span>
              ) : (
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || pending}
                    aria-label={`Monter « ${label(id)} »`}
                    className="grid size-9 place-items-center rounded-sm border border-line text-muted hover:text-ink disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === shown.length - 1 || pending}
                    aria-label={`Descendre « ${label(id)} »`}
                    className="grid size-9 place-items-center rounded-sm border border-line text-muted hover:text-ink disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </button>
                </span>
              )}
            </li>
          )
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {!result ? (
        <Button size="lg" loading={pending} onClick={() => onSubmit({ order })}>
          Valider l’ordre
        </Button>
      ) : null}
    </div>
  )
}
