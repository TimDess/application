import { CircleCheck, CircleX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Mascot } from '@/components/brand/mascot'
import { answerTitle, voice } from '@/config/voice'

/** Feedback panel title after an answer: the Point reacts, the icon and words say it. */
export function AnswerHeading({
  result,
  seed,
  timedOut = false,
  aside,
}: {
  result: { isCorrect: boolean; score: number }
  seed: string
  timedOut?: boolean
  aside?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <Mascot mood={result.isCorrect ? 'happy' : 'oops'} size={52} className="-my-2" />
      <p className="flex min-w-0 flex-1 items-center gap-2 font-display text-heading font-semibold text-ink">
        {result.isCorrect ? (
          <CircleCheck className="size-5 shrink-0 text-success" aria-hidden="true" />
        ) : (
          <CircleX className="size-5 shrink-0 text-danger" aria-hidden="true" />
        )}
        {timedOut ? voice.timeUp : answerTitle(result, seed)}
      </p>
      {aside}
    </div>
  )
}
