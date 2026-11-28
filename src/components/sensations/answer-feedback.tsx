'use client'

import { Flame } from 'lucide-react'
import { useState } from 'react'
import { burstAt, feedback, lastPointer } from '@/lib/sensations'

/**
 * Sound, vibration and golden burst for each answer, plus the combo: every right answer
 * in a row raises the note one step.
 */
export function useAnswerFeedback() {
  const [streak, setStreak] = useState(0)
  function onAnswer(correct: boolean) {
    if (!correct) {
      setStreak(0)
      feedback('wrong')
      return
    }
    const n = streak + 1
    setStreak(n)
    feedback(n >= 2 ? 'combo' : 'correct', n)
    const p = lastPointer()
    if (p.x || p.y) burstAt(p.x, p.y, 20 + Math.min(n, 6) * 4)
  }
  return { streak, onAnswer }
}

/** "3 d'affilée": appears from the third right answer in a row. */
export function ComboChip({ streak }: { streak: number }) {
  if (streak < 3) return null
  return (
    <span
      key={streak}
      className="anim-pop tabular inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-caption font-bold text-on-accent"
      role="status"
    >
      <Flame className="size-3.5" aria-hidden="true" />
      {streak}
      <span className="sr-only"> bonnes réponses</span> d’affilée
    </span>
  )
}
