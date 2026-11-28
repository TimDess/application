import type { StreakStatus, XpReason } from './types'

export const xpReasonLabels: Record<XpReason, string> = {
  correct_answer: 'Bonnes réponses',
  lesson_completed: 'Leçon terminée',
  lesson_perfect: 'Sans faute',
  chapter_completed: 'Chapitre terminé',
  exam_passed: 'Épreuve réussie',
  review_answer: 'Bonnes réponses',
  review_completed: 'Révision terminée',
  daily_challenge: 'Défi du jour terminé',
}

export function streakDays(n: number) {
  return `${n} jour${n > 1 ? 's' : ''}`
}

/** One encouraging line about the streak, never guilt-tripping. */
export function streakMessage(status: StreakStatus): string {
  switch (status) {
    case 'done':
      return 'Série validée. Tu peux souffler jusqu’à demain.'
    case 'pending':
      return 'Une leçon aujourd’hui et ta série continue. Facile.'
    case 'protected':
      return 'Ta protection a sauvé ta série. Ne la fais pas bosser deux fois.'
    case 'paused':
      return 'Ta flamme s’est éteinte. On la rallume ?'
    default:
      return 'Une leçon et ta première flamme s’allume.'
  }
}
