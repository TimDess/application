import type { AnswerResult, LessonSummary, PlayQuestion } from '@/features/learning/types'

export type PracticeKind = 'review' | 'daily'

export type PracticeSession = {
  sessionId: string
  kind: PracticeKind
  day: string
  questions: PlayQuestion[]
  answers: Record<string, AnswerResult>
  completed: boolean
}

export type PracticeSummary = LessonSummary
