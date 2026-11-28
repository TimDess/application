'use client'

import { CircleCheck, CircleX, Swords, Timer, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { formatLabels, QuestionView } from '@/components/games/question-view'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Progress } from '@/components/ui/progress'
import { routes } from '@/config/routes'
import type { Answer, AnswerResult } from '@/features/learning/types'
import { cn } from '@/lib/utils/cn'
import { answerDuelQuestionAction, getDuelAction, nextDuelQuestionAction } from './actions'
import { DuelOutcome } from './duel-outcome'
import { remainingMs } from './parse'
import type { DuelDetail, DuelTurn } from './types'

type Turn = Extract<DuelTurn, { done: false }>
type Scored = AnswerResult & { points: number; timedOut: boolean; finished: boolean }

/** Plays one player's part of a duel against a server-side clock, then shows the outcome. */
export function DuelPlayer({
  initial,
  me,
}: {
  initial: DuelDetail
  me: { name: string; avatarKey: string }
}) {
  const [duel, setDuel] = useState(initial)
  const [phase, setPhase] = useState<'intro' | 'playing' | 'end'>(
    initial.me.finished || !['open', 'active'].includes(initial.status) ? 'end' : 'intro',
  )
  const [turn, setTurn] = useState<Turn | null>(null)
  const [receivedAt, setReceivedAt] = useState(0)
  const [now, setNow] = useState(0)
  const [scored, setScored] = useState<Scored | null>(null)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const submitting = useRef(false)

  const left = turn ? remainingMs(turn.deadlineAt, turn.serverNow, receivedAt, now) : 0
  const seconds = turn ? Math.max(0, Math.ceil(left / 1000)) : 0

  useEffect(() => {
    headingRef.current?.focus()
  }, [turn?.position, phase])

  function loadNext() {
    setError(undefined)
    startTransition(async () => {
      const res = await nextDuelQuestionAction(duel.id)
      if (!res.ok) return setError(res.message)
      if (res.data.done) return finish()
      setScored(null)
      submitting.current = false
      const t = Date.now()
      setReceivedAt(t)
      setNow(t)
      setTurn(res.data)
      setPhase('playing')
    })
  }

  async function finish() {
    const res = await getDuelAction(duel.id)
    if (res.ok) setDuel(res.data)
    setTurn(null)
    setPhase('end')
  }

  function submit(answer: Answer | null) {
    if (!turn || scored || submitting.current) return
    submitting.current = true
    setError(undefined)
    startTransition(async () => {
      const res = await answerDuelQuestionAction(duel.id, turn.position, answer)
      if (!res.ok) {
        submitting.current = false
        return setError(res.message)
      }
      setScored(res.data)
    })
  }

  // Server clock: tick while a question is open, give up at the deadline.
  useEffect(() => {
    if (phase !== 'playing' || !turn || scored) return
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [phase, turn, scored])

  useEffect(() => {
    if (phase === 'playing' && turn && !scored && left <= 0) submit(null)
  })

  function next() {
    if (scored?.finished) {
      startTransition(finish)
      return
    }
    loadNext()
  }

  const opponentName = duel.opponent?.username ?? null

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <span
        aria-hidden="true"
        className="pointer-events-none fixed -top-28 -right-32 -z-10 size-96 rounded-full bg-accent opacity-20 blur-[90px]"
      />
      <header className="flex h-14 items-center gap-3">
        <Link
          href={routes.play}
          className="grid size-10 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Quitter le duel"
        >
          <X className="size-5" aria-hidden="true" />
        </Link>
        {phase === 'playing' && turn ? (
          <>
            <Progress
              value={turn.position}
              max={turn.total}
              label={`Question ${turn.position} sur ${turn.total}`}
              className="h-2"
            />
            <span className="tabular shrink-0 text-caption font-semibold text-ink">
              {(scored ? turn.score + scored.points : turn.score).toLocaleString('fr-FR')} pts
            </span>
          </>
        ) : null}
      </header>

      <main id="contenu" className="flex flex-1 flex-col gap-5 py-4">
        {phase === 'intro' ? (
          <div className="step-in flex flex-1 flex-col gap-6">
            <div className="flex flex-col items-center gap-4 pt-6 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-accent text-on-accent">
                <Swords className="size-8" aria-hidden="true" />
              </span>
              <h1 ref={headingRef} tabIndex={-1} className="text-title outline-none">
                {opponentName ? `Duel contre ${opponentName}` : 'Duel'}
              </h1>
              <p className="max-w-sm text-body text-muted">
                {opponentName
                  ? duel.opponentProgress?.finished
                    ? `${opponentName} a déjà joué. À toi de faire mieux !`
                    : `Joue ta manche, ${opponentName} jouera la sienne de son côté.`
                  : duel.mode === 'link'
                    ? 'Joue ta manche, puis envoie le lien du défi à qui tu veux.'
                    : 'Joue ta manche : un adversaire de ton niveau jouera les mêmes questions.'}
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-body text-muted">
              <li className="glass flex items-center gap-3 rounded-card p-3">
                <Timer className="size-5 shrink-0 text-accent-text" aria-hidden="true" />
                {duel.total} questions, 15 secondes chacune.
              </li>
              <li className="glass flex items-center gap-3 rounded-card p-3">
                <CircleCheck className="size-5 shrink-0 text-accent-text" aria-hidden="true" />
                La justesse compte d’abord, la vitesse donne un bonus.
              </li>
            </ul>
            <FormMessage tone="error">{error}</FormMessage>
            <div className="mt-auto">
              <Button size="lg" className="w-full" loading={pending} onClick={loadNext}>
                {duel.me.answered > 0 ? 'Reprendre' : 'C’est parti'}
              </Button>
            </div>
          </div>
        ) : null}

        {phase === 'playing' && turn ? (
          <div key={turn.position} className="slide-in-x flex flex-1 flex-col gap-5">
            <div className="flex items-center gap-3" aria-live="off">
              <div
                role="timer"
                aria-label={`${seconds} secondes restantes`}
                className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2"
              >
                <div
                  className={cn('h-full rounded-full', seconds <= 5 ? 'bg-danger' : 'bg-accent')}
                  style={{
                    width: `${Math.max(0, Math.min(100, (left / (turn.seconds * 1000)) * 100))}%`,
                  }}
                />
              </div>
              <span className="tabular w-10 text-right font-display text-heading font-semibold text-ink">
                {scored ? '–' : `${seconds} s`}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-caption font-semibold text-muted">
                {formatLabels[turn.question.format]} · Question {turn.position}/{turn.total}
              </p>
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="text-[1.25rem] leading-snug outline-none"
              >
                {turn.question.prompt}
              </h1>
            </div>
            <QuestionView
              question={turn.question}
              result={scored}
              pending={pending || left <= 0}
              onSubmit={submit}
            />
            <FormMessage tone="error">{error}</FormMessage>
            {scored ? (
              <div
                role="status"
                className={cn(
                  'rise-in glass-strong mt-auto flex flex-col gap-3 rounded-hero border p-5',
                  scored.isCorrect
                    ? 'border-success/50 bg-success/10'
                    : 'border-danger/40 bg-danger/8',
                )}
              >
                <p className="flex items-center justify-between gap-2 font-display text-heading font-semibold text-ink">
                  <span className="flex items-center gap-2">
                    {scored.isCorrect ? (
                      <CircleCheck className="size-5 text-success" aria-hidden="true" />
                    ) : (
                      <CircleX className="size-5 text-danger" aria-hidden="true" />
                    )}
                    {scored.timedOut
                      ? 'Temps écoulé'
                      : scored.isCorrect
                        ? 'Bonne réponse'
                        : scored.score > 0
                          ? 'Presque'
                          : 'Pas tout à fait'}
                  </span>
                  <span className="tabular text-accent-text">+{scored.points}</span>
                </p>
                <p className="text-body leading-relaxed text-ink">{scored.explanation}</p>
                <Button size="lg" onClick={next} loading={pending}>
                  {scored.finished ? 'Voir le résultat' : 'Question suivante'}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {phase === 'end' ? <DuelOutcome duel={duel} me={me} headingRef={headingRef} /> : null}
      </main>
    </div>
  )
}
