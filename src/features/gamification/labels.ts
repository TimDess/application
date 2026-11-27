import type { StreakStatus, XpReason } from './types'

export const xpReasonLabels: Record<XpReason, string> = {
  correct_answer: 'Bonnes réponses',
  lesson_completed: 'Leçon terminée',
  lesson_perfect: 'Sans faute',
  chapter_completed: 'Chapitre terminé',
  exam_passed: 'Épreuve réussie',
}

export function streakDays(n: number) {
  return `${n} jour${n > 1 ? 's' : ''}`
}

/** One encouraging line about the streak, never guilt-tripping. */
export function streakMessage(status: StreakStatus): string {
  switch (status) {
    case 'done':
      return 'Série validée pour aujourd’hui. À demain !'
    case 'pending':
      return 'Termine une leçon aujourd’hui pour prolonger ta série.'
    case 'protected':
      return 'Une protection garde ta série au chaud. Termine une leçon pour la prolonger.'
    case 'paused':
      return 'Ta série a fait une pause. On repart ?'
    default:
      return 'Termine une leçon pour lancer ta série.'
  }
}
