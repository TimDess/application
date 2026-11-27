import type { Answer, AnswerResult } from '@/features/learning/types'

export type GameProps<P> = {
  question: P
  /** Present once answered: the component switches to its correction view. */
  result: AnswerResult | null
  pending: boolean
  onSubmit: (answer: Answer) => void
}
