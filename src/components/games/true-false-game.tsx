'use client'

import { useState } from 'react'
import type { PlayQuestion } from '@/features/learning/types'
import type { GameProps } from './game-props'
import { OptionButton, type OptionState } from './option-button'

type TrueFalse = Extract<PlayQuestion, { format: 'true_false' }>

export function TrueFalseGame({ result, pending, onSubmit }: GameProps<TrueFalse>) {
  const [choice, setChoice] = useState<boolean | null>(
    result?.answer && 'value' in result.answer ? result.answer.value : null,
  )

  function stateOf(value: boolean): OptionState {
    if (!result) return choice === value && pending ? 'selected' : 'idle'
    if (result.solution.value === value) return choice === value ? 'correct' : 'missed'
    return choice === value ? 'wrong' : 'idle'
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { value: true, label: 'Vrai' },
        { value: false, label: 'Faux' },
      ].map((o) => (
        <OptionButton
          key={o.label}
          state={stateOf(o.value)}
          className="min-h-20 flex-col items-start justify-center text-heading"
          disabled={Boolean(result) || pending}
          onClick={() => {
            setChoice(o.value)
            onSubmit({ value: o.value })
          }}
        >
          {o.label}
        </OptionButton>
      ))}
    </div>
  )
}
