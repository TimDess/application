'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import { parseRewards } from '@/features/gamification/parse'
import { answerSchema } from '@/features/learning/answer-schema'
import type { Answer, AnswerResult, PlayQuestion, Solution } from '@/features/learning/types'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import type { PracticeKind, PracticeSession, PracticeSummary } from './types'

type Result<T> = { ok: true; data: T } | { ok: false; message: string }

const uuid = z.uuid()
const kindSchema = z.enum(['review', 'daily'])

const messages: Record<string, string> = {
  nothing_to_review: 'Rien à réviser pour le moment. Reviens demain !',
  no_daily_challenge: 'Le défi du jour n’est pas encore disponible.',
  session_completed: 'Cette session est déjà terminée.',
  session_incomplete: 'Réponds à toutes les questions avant de terminer.',
  invalid_answer: 'Réponse invalide.',
}

function failure(error: { message: string } | null): { ok: false; message: string } {
  const key = Object.keys(messages).find((k) => error?.message.includes(k))
  return {
    ok: false,
    message: key ? messages[key]! : 'Une erreur est survenue. Réessaie dans un instant.',
  }
}

type RawPayload = {
  session_id: string
  kind: PracticeKind
  day: string
  question_ids: string[]
  completed: boolean
  answers: {
    question_id: string
    is_correct: boolean
    score: number
    answer: Answer
    solution: Solution
    explanation: string
  }[]
}

/** Starts (or resumes) today's review or daily challenge, with its questions. */
export async function startPracticeAction(kind: PracticeKind): Promise<Result<PracticeSession>> {
  await requireUser()
  if (!kindSchema.safeParse(kind).success) return { ok: false, message: messages.invalid_answer! }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc(
    kind === 'review' ? 'start_review' : 'start_daily_challenge',
  )
  if (error || !data) return failure(error)
  const raw = data as RawPayload

  const { data: rows, error: qError } = await supabase
    .from('questions')
    .select('id, format, prompt, payload, difficulty')
    .in('id', raw.question_ids)
  if (qError || !rows) return failure(qError)
  const byId = new Map(rows.map((q) => [q.id, q]))
  const questions = raw.question_ids.flatMap((id) => {
    const q = byId.get(id)
    if (!q) return []
    return [
      {
        id: q.id,
        prompt: q.prompt,
        difficulty: q.difficulty,
        format: q.format,
        ...(q.payload as object),
      } as PlayQuestion,
    ]
  })

  const answers: Record<string, AnswerResult> = Object.fromEntries(
    raw.answers.map((a) => [
      a.question_id,
      {
        isCorrect: a.is_correct,
        score: Number(a.score),
        solution: a.solution,
        explanation: a.explanation,
        answer: a.answer,
      },
    ]),
  )
  return {
    ok: true,
    data: {
      sessionId: raw.session_id,
      kind: raw.kind,
      day: raw.day,
      questions,
      answers,
      completed: raw.completed,
    },
  }
}

export async function submitPracticeAnswerAction(
  sessionId: string,
  questionId: string,
  answer: Answer,
): Promise<Result<AnswerResult>> {
  await requireUser()
  const parsed = answerSchema.safeParse(answer)
  if (
    !uuid.safeParse(sessionId).success ||
    !uuid.safeParse(questionId).success ||
    !parsed.success
  ) {
    return { ok: false, message: messages.invalid_answer! }
  }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('submit_practice_answer', {
    p_session: sessionId,
    p_question: questionId,
    p_answer: parsed.data,
  })
  if (error || !data) return failure(error)
  const r = data as { is_correct: boolean; score: number; solution: Solution; explanation: string }
  return {
    ok: true,
    data: {
      isCorrect: r.is_correct,
      score: Number(r.score),
      solution: r.solution,
      explanation: r.explanation,
      answer: parsed.data,
    },
  }
}

export async function completePracticeAction(sessionId: string): Promise<Result<PracticeSummary>> {
  await requireUser()
  if (!uuid.safeParse(sessionId).success) return { ok: false, message: messages.invalid_answer! }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('complete_practice', { p_session: sessionId })
  if (error || !data) return failure(error)
  const r = data as {
    total: number
    correct: number
    score: number
    perfect: boolean
    rewards: unknown
  }
  refresh()
  return {
    ok: true,
    data: {
      total: r.total,
      correct: r.correct,
      score: r.score,
      perfect: r.perfect,
      rewards: parseRewards(r.rewards),
    },
  }
}
