'use client'

import type { Answer, AnswerResult, PlayQuestion } from '@/features/learning/types'
import { GuessYearGame } from './guess-year-game'
import { MatchGame } from './match-game'
import { QuizGame } from './quiz-game'
import { TimelineGame } from './timeline-game'
import { TrueFalseGame } from './true-false-game'

export const formatLabels: Record<PlayQuestion['format'], string> = {
  quiz: 'Quiz',
  true_false: 'Vrai ou faux',
  match: 'Associations',
  timeline: 'Frise chronologique',
  guess_year: 'Devine l’année',
}

/** Format registry: adding a format means adding a component here, nothing else in the player. */
export function QuestionView({
  question,
  result,
  pending,
  onSubmit,
}: {
  question: PlayQuestion
  result: AnswerResult | null
  pending: boolean
  onSubmit: (answer: Answer) => void
}) {
  const common = { result, pending, onSubmit }
  switch (question.format) {
    case 'quiz':
      return <QuizGame question={question} {...common} />
    case 'true_false':
      return <TrueFalseGame question={question} {...common} />
    case 'match':
      return <MatchGame question={question} {...common} />
    case 'timeline':
      return <TimelineGame question={question} {...common} />
    case 'guess_year':
      return <GuessYearGame question={question} {...common} />
  }
}
