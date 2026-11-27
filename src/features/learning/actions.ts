'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import type { Answer, AnswerResult, LessonSummary, Solution } from './types'

type Result<T> = { ok: true; data: T } | { ok: false; message: string }

const uuid = z.uuid()
const answerSchema = z.union([
  z.object({ selected: z.array(z.string().max(20)).max(10) }).strict(),
  z.object({ value: z.boolean() }).strict(),
  z.object({ pairs: z.record(z.string().max(20), z.string().max(20)) }).strict(),
  z.object({ order: z.array(z.string().max(20)).max(10) }).strict(),
  z.object({ year: z.number().int().min(-9999).max(9999) }).strict(),
])

const messages: Record<string, string> = {
  lesson_locked: 'Termine la leçon précédente pour débloquer celle-ci.',
  lesson_not_found: 'Cette leçon n’est pas disponible.',
  session_completed: 'Cette leçon est déjà terminée.',
  lesson_incomplete: 'Réponds à toutes les questions avant de terminer.',
  invalid_answer: 'Réponse invalide.',
}

function failure(error: { message: string } | null): { ok: false; message: string } {
  const key = Object.keys(messages).find((k) => error?.message.includes(k))
  return {
    ok: false,
    message: key ? messages[key]! : 'Une erreur est survenue. Réessaie dans un instant.',
  }
}

type RawAnswer = {
  question_id: string
  is_correct: boolean
  score: number
  answer: Answer
  solution: Solution
  explanation: string
}

export async function startLessonAction(
  lessonId: string,
): Promise<Result<{ sessionId: string; answers: Record<string, AnswerResult> }>> {
  await requireUser()
  if (!uuid.safeParse(lessonId).success) return { ok: false, message: messages.lesson_not_found! }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('start_lesson', { p_lesson: lessonId })
  if (error || !data) return failure(error)
  const raw = data as { session_id: string; answers: RawAnswer[] }
  const answers = Object.fromEntries(
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
  return { ok: true, data: { sessionId: raw.session_id, answers } }
}

export async function submitAnswerAction(
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
  const { data, error } = await supabase.rpc('submit_answer', {
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

export async function completeLessonAction(sessionId: string): Promise<Result<LessonSummary>> {
  await requireUser()
  if (!uuid.safeParse(sessionId).success) return { ok: false, message: messages.invalid_answer! }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('complete_lesson', { p_session: sessionId })
  if (error || !data) return failure(error)
  const r = data as { total: number; correct: number; score: number; perfect: boolean }
  refresh()
  return {
    ok: true,
    data: { total: r.total, correct: r.correct, score: r.score, perfect: r.perfect },
  }
}
