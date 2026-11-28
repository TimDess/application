import { z } from 'zod'
import type { PlayQuestion } from '@/features/learning/types'
import type { DuelDetail, DuelSummary, DuelTurn } from './types'

const person = z
  .object({ id: z.string(), username: z.string().nullable(), avatar_key: z.string() })
  .nullable()

const summarySchema = z.object({
  id: z.string(),
  mode: z.enum(['quick', 'link', 'rematch']),
  status: z.enum(['open', 'active', 'completed', 'expired', 'cancelled']),
  created_at: z.string(),
  expires_at: z.string(),
  completed_at: z.string().nullable(),
  invite_code: z.string().nullable(),
  total: z.number().int(),
  me: z.object({
    score: z.number().int(),
    correct: z.number().int(),
    answered: z.number().int(),
    finished: z.boolean(),
  }),
  opponent: person,
  opponent_progress: z
    .object({
      score: z.number().int().nullable(),
      correct: z.number().int().nullable(),
      finished: z.boolean(),
    })
    .nullable(),
  result: z.enum(['win', 'loss', 'draw']).nullable(),
})

const roundSchema = z.object({
  position: z.number().int(),
  prompt: z.string(),
  mine: z.object({ correct: z.boolean(), points: z.number().int() }).nullable(),
  theirs: z.object({ correct: z.boolean(), points: z.number().int() }).nullable(),
})

function mapSummary(d: z.infer<typeof summarySchema>): DuelSummary {
  return {
    id: d.id,
    mode: d.mode,
    status: d.status,
    createdAt: d.created_at,
    expiresAt: d.expires_at,
    completedAt: d.completed_at,
    inviteCode: d.invite_code,
    total: d.total,
    me: d.me,
    opponent: d.opponent
      ? { id: d.opponent.id, username: d.opponent.username, avatarKey: d.opponent.avatar_key }
      : null,
    opponentProgress: d.opponent_progress,
    result: d.result,
  }
}

export function parseDuels(raw: unknown): DuelSummary[] {
  return z.array(summarySchema).parse(raw).map(mapSummary)
}

export function parseDuel(raw: unknown): DuelDetail {
  const d = summarySchema.extend({ rounds: z.array(roundSchema).nullable() }).parse(raw)
  return { ...mapSummary(d), rounds: d.rounds }
}

const turnSchema = z.union([
  z.object({ done: z.literal(true), total: z.number().int() }),
  z.object({
    done: z.literal(false),
    position: z.number().int(),
    total: z.number().int(),
    score: z.number().int(),
    deadline_at: z.string(),
    server_now: z.string(),
    seconds: z.number(),
    question: z.object({
      id: z.string(),
      format: z.enum(['quiz', 'true_false', 'match', 'timeline', 'guess_year']),
      prompt: z.string(),
      difficulty: z.number().int(),
      payload: z.record(z.string(), z.unknown()),
    }),
  }),
])

export function parseTurn(raw: unknown): DuelTurn {
  const t = turnSchema.parse(raw)
  if (t.done) return { done: true, total: t.total }
  return {
    done: false,
    position: t.position,
    total: t.total,
    score: t.score,
    deadlineAt: t.deadline_at,
    serverNow: t.server_now,
    seconds: t.seconds,
    question: {
      id: t.question.id,
      prompt: t.question.prompt,
      difficulty: t.question.difficulty,
      format: t.question.format,
      ...t.question.payload,
    } as PlayQuestion,
  }
}

/** Milliseconds left before the server deadline, corrected for the client clock offset. */
export function remainingMs(
  deadlineAt: string,
  serverNow: string,
  receivedAt: number,
  now: number,
) {
  const offset = new Date(serverNow).getTime() - receivedAt
  return new Date(deadlineAt).getTime() - (now + offset)
}
