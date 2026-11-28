import type { PlayQuestion } from '@/features/learning/types'

export type DuelMode = 'quick' | 'link' | 'rematch'
export type DuelStatus = 'open' | 'active' | 'completed' | 'expired' | 'cancelled'
export type DuelResult = 'win' | 'loss' | 'draw'

export type DuelPerson = { id: string; username: string | null; avatarKey: string }

export type DuelSummary = {
  id: string
  mode: DuelMode
  status: DuelStatus
  createdAt: string
  expiresAt: string
  completedAt: string | null
  inviteCode: string | null
  total: number
  me: { score: number; correct: number; answered: number; finished: boolean }
  opponent: DuelPerson | null
  /** Opponent scores are hidden until you have finished your own part. */
  opponentProgress: { score: number | null; correct: number | null; finished: boolean } | null
  result: DuelResult | null
}

export type DuelRound = {
  position: number
  prompt: string
  mine: { correct: boolean; points: number } | null
  theirs: { correct: boolean; points: number } | null
}

export type DuelDetail = DuelSummary & { rounds: DuelRound[] | null }

export type DuelTurn =
  | { done: true; total: number }
  | {
      done: false
      position: number
      total: number
      score: number
      deadlineAt: string
      serverNow: string
      seconds: number
      question: PlayQuestion
    }
