'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { PlayQuestion } from '@/features/learning/types'
import type { GameProps } from './game-props'
import { OptionButton, type OptionState } from './option-button'

type Quiz = Extract<PlayQuestion, { format: 'quiz' }>

export function QuizGame({ question, result, pending, onSubmit }: GameProps<Quiz>) {
  const [selected, setSelected] = useState<string[]>(
    result?.answer && 'selected' in result.answer ? result.answer.selected : [],
  )
  const correct = result?.solution.correct ?? []

  function toggle(id: string) {
    if (result) return
    setSelected((cur) =>
      question.multiple ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : [id],
    )
  }

  function stateOf(id: string): OptionState {
    if (!result) return selected.includes(id) ? 'selected' : 'idle'
    if (correct.includes(id)) return selected.includes(id) ? 'correct' : 'missed'
    return selected.includes(id) ? 'wrong' : 'idle'
  }

  return (
    <div className="flex flex-col gap-3">
      {question.multiple ? (
        <p className="text-caption text-muted">Plusieurs réponses possibles.</p>
      ) : null}
      <div
        role={question.multiple ? 'group' : 'radiogroup'}
        aria-label="Réponses"
        className="flex flex-col gap-2"
      >
        {question.options.map((o) => (
          <OptionButton
            key={o.id}
            state={stateOf(o.id)}
            role={question.multiple ? 'checkbox' : 'radio'}
            aria-checked={selected.includes(o.id)}
            disabled={Boolean(result) || pending}
            onClick={() => toggle(o.id)}
          >
            {o.label}
          </OptionButton>
        ))}
      </div>
      {!result ? (
        <Button
          size="lg"
          className="mt-2"
          disabled={selected.length === 0}
          loading={pending}
          onClick={() => onSubmit({ selected })}
        >
          Valider
        </Button>
      ) : null}
    </div>
  )
}
