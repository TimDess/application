'use client'

import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { PlayQuestion } from '@/features/learning/types'
import type { GameProps } from './game-props'

type GuessYear = Extract<PlayQuestion, { format: 'guess_year' }>

export function GuessYearGame({ question, result, pending, onSubmit }: GameProps<GuessYear>) {
  const middle = Math.round((question.min + question.max) / 2)
  const [year, setYear] = useState<number>(
    result?.answer && 'year' in result.answer ? result.answer.year : middle,
  )
  const clamp = (n: number) => Math.min(question.max, Math.max(question.min, n))

  if (result) {
    const diff = Math.abs(year - (result.solution.year ?? year))
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-line bg-surface p-5 text-center">
        <p className="text-caption text-muted">Ta réponse : {year}</p>
        <p className="tabular font-display text-display font-semibold text-ink">
          {result.solution.year}
        </p>
        <p className="text-body text-muted">
          {diff === 0 ? 'Pile la bonne année.' : `${diff} an${diff > 1 ? 's' : ''} d’écart.`}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setYear((y) => clamp(y - 1))}
          aria-label="Une année de moins"
          className="grid size-12 place-items-center rounded-full border border-line bg-surface text-ink hover:border-line-strong"
        >
          <Minus className="size-5" aria-hidden="true" />
        </button>
        <label className="sr-only" htmlFor="year-input">
          Année
        </label>
        <input
          id="year-input"
          type="number"
          inputMode="numeric"
          min={question.min}
          max={question.max}
          value={year}
          onChange={(e) => setYear(clamp(Number(e.target.value) || middle))}
          className="tabular w-32 rounded-md border border-line bg-surface py-2 text-center font-display text-display font-semibold text-ink focus-visible:border-focus focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={() => setYear((y) => clamp(y + 1))}
          aria-label="Une année de plus"
          className="grid size-12 place-items-center rounded-full border border-line bg-surface text-ink hover:border-line-strong"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </div>
      <input
        type="range"
        min={question.min}
        max={question.max}
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        aria-label="Choisir l’année"
        className="w-full accent-(--accent)"
      />
      <div className="tabular flex justify-between text-caption text-muted">
        <span>{question.min}</span>
        <span>{question.max}</span>
      </div>
      <Button size="lg" loading={pending} onClick={() => onSubmit({ year })}>
        Valider {year}
      </Button>
    </div>
  )
}
