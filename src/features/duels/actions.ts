'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { duelPath } from '@/config/routes'
import { answerSchema } from '@/features/learning/answer-schema'
import type { Answer, AnswerResult, Solution } from '@/features/learning/types'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { parseDuel, parseTurn } from './parse'
import type { DuelDetail, DuelTurn } from './types'

type Result<T> = { ok: true; data: T } | { ok: false; message: string }

const uuid = z.uuid()
const messages: Record<string, string> = {
  not_enough_questions: 'Pas encore assez de questions pour un duel.',
  duel_not_found: 'Ce duel n’existe pas ou ne te concerne pas.',
  duel_unavailable: 'Ce défi a déjà été relevé par quelqu’un d’autre.',
  duel_closed: 'Ce duel est terminé.',
  question_not_served: 'Cette question n’est pas disponible.',
  invalid_answer: 'Réponse invalide.',
}

function failure(error: { message: string } | null): { ok: false; message: string } {
  const key = Object.keys(messages).find((k) => error?.message.includes(k))
  return {
    ok: false,
    message: key ? messages[key]! : 'Une erreur est survenue. Réessaie dans un instant.',
  }
}

export async function createDuelAction(
  mode: 'quick' | 'link' | 'rematch',
  rematchOf?: string,
): Promise<Result<{ duelId: string }>> {
  await requireUser()
  if (!['quick', 'link', 'rematch'].includes(mode)) return failure(null)
  if (rematchOf && !uuid.safeParse(rematchOf).success) return failure(null)
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_duel', {
    p_mode: mode,
    p_rematch_of: rematchOf,
  })
  if (error || !data) return failure(error)
  return { ok: true, data: { duelId: (data as { duel_id: string }).duel_id } }
}

/** Form action of the invite page: joins and opens the duel. */
export async function joinDuelAction(formData: FormData) {
  await requireUser()
  const code = String(formData.get('code') ?? '').toLowerCase()
  if (!/^[a-z0-9]{8}$/.test(code)) redirect('/')
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('join_duel_by_code', { p_code: code })
  if (error || !data) redirect(`/d/${code}?erreur=1`)
  redirect(duelPath(data as string))
}

export async function nextDuelQuestionAction(duelId: string): Promise<Result<DuelTurn>> {
  await requireUser()
  if (!uuid.safeParse(duelId).success) return failure(null)
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('next_duel_question', { p_duel: duelId })
  if (error || !data) return failure(error)
  return { ok: true, data: parseTurn(data) }
}

export async function answerDuelQuestionAction(
  duelId: string,
  position: number,
  answer: Answer | null,
): Promise<Result<AnswerResult & { points: number; timedOut: boolean; finished: boolean }>> {
  await requireUser()
  const parsed = answer === null ? null : answerSchema.safeParse(answer)
  if (
    !uuid.safeParse(duelId).success ||
    !Number.isInteger(position) ||
    (parsed && !parsed.success)
  ) {
    return failure({ message: 'invalid_answer' })
  }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('answer_duel_question', {
    p_duel: duelId,
    p_position: position,
    p_answer: parsed?.success ? parsed.data : null,
  })
  if (error || !data) return failure(error)
  const r = data as {
    is_correct: boolean
    score: number
    points: number
    timed_out?: boolean
    finished: boolean
    solution: Solution
    explanation: string
  }
  return {
    ok: true,
    data: {
      isCorrect: r.is_correct,
      score: Number(r.score),
      points: r.points,
      timedOut: Boolean(r.timed_out),
      finished: r.finished,
      solution: r.solution,
      explanation: r.explanation,
      answer: parsed?.success ? parsed.data : undefined,
    },
  }
}

export async function getDuelAction(duelId: string): Promise<Result<DuelDetail>> {
  await requireUser()
  if (!uuid.safeParse(duelId).success) return failure(null)
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_duel', { p_duel: duelId })
  if (error || !data) return failure(error)
  return { ok: true, data: parseDuel(data) }
}
