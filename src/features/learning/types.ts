import type { Rewards } from '@/features/gamification/types'
import type { CardBlock } from '@/features/content/schema'

export type QuestionFormat = 'quiz' | 'true_false' | 'match' | 'timeline' | 'guess_year'

export type Option = { id: string; label: string }

export type QuestionPayload =
  | { format: 'quiz'; options: Option[]; multiple: boolean }
  | { format: 'true_false' }
  | { format: 'match'; left: Option[]; right: Option[] }
  | { format: 'timeline'; items: Option[] }
  | { format: 'guess_year'; min: number; max: number }

export type PlayQuestion = { id: string; prompt: string; difficulty: number } & QuestionPayload

export type Answer =
  | { selected: string[] }
  | { value: boolean }
  | { pairs: Record<string, string> }
  | { order: string[] }
  | { year: number }

/** Solutions are only ever received after answering, from submit_answer(). */
export type Solution = {
  correct?: string[]
  value?: boolean
  pairs?: Record<string, string>
  order?: string[]
  dates?: Record<string, string>
  year?: number
  tolerance?: number
}

export type AnswerResult = {
  isCorrect: boolean
  score: number
  solution: Solution
  explanation: string
  answer?: Answer
}

export type PlayCard = { position: number; title: string; blocks: CardBlock[] }

export type LessonSummary = {
  total: number
  correct: number
  score: number
  perfect: boolean
  /** Null when the server returned no rewards (should not happen after phase 3). */
  rewards: Rewards | null
}

export type LessonStatus = 'completed' | 'available' | 'locked'
