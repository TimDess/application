'use client'

import { CircleCheck, CircleX, X } from 'lucide-react'
import Link from 'next/link'
import { type MouseEvent, type ReactNode, useEffect, useRef, useState, useTransition } from 'react'
import { formatLabels, QuestionView } from '@/components/games/question-view'
import { LessonResult } from '@/components/learning/lesson-result'
import {
  WAVE_COVER_MS,
  WAVE_REVEAL_MS,
  WaveTransition,
  type WavePhase,
} from '@/components/learning/wave-transition'
import { motionReduced } from '@/components/theme/theme-client'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Progress } from '@/components/ui/progress'
import { routes } from '@/config/routes'
import { RewardsPanel } from '@/features/gamification/rewards-panel'
import type { Answer, AnswerResult } from '@/features/learning/types'
import { cn } from '@/lib/utils/cn'
import { completePracticeAction, startPracticeAction, submitPracticeAnswerAction } from './actions'
import { ShareButton } from './share-button'
import type { PracticeKind, PracticeSession, PracticeSummary } from './types'

type Step =
  | { kind: 'intro' }
  | { kind: 'question'; index: number }
  | { kind: 'result'; summary: PracticeSummary }

/** Plays a review session or the daily challenge: intro → questions → result. */
export function PracticePlayer({
  kind,
  title,
  intro,
  meta,
  idle,
}: {
  kind: PracticeKind
  title: string
  intro: string
  meta?: ReactNode
  /**
   * Shown instead of the intro when there is nothing to play (nothing due, already done).
   * Pages always render the player so that the refresh after completing a session keeps
   * this instance (and its result screen) mounted.
   */
  idle?: ReactNode
}) {
  const [step, setStep] = useState<Step>({ kind: 'intro' })
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [results, setResults] = useState<Record<string, AnswerResult>>({})
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const [wave, setWave] = useState<WavePhase>('idle')
  const [waveOrigin, setWaveOrigin] = useState<{ x: number; y: number }>()
  const headingRef = useRef<HTMLHeadingElement>(null)

  const total = session?.questions.length ?? 0
  const position = step.kind === 'question' ? step.index + 1 : step.kind === 'result' ? total : 0

  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  function cover(target: HTMLElement): Promise<boolean> {
    if (motionReduced()) return Promise.resolve(false)
    const rect = target.getBoundingClientRect()
    setWaveOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    setWave('cover')
    return new Promise((resolve) =>
      setTimeout(() => {
        setWave('hold')
        resolve(true)
      }, WAVE_COVER_MS),
    )
  }

  function reveal() {
    setWave('reveal')
    setTimeout(() => setWave('idle'), WAVE_REVEAL_MS)
  }

  function start(event: MouseEvent<HTMLButtonElement>) {
    setError(undefined)
    const covering = cover(event.currentTarget)
    startTransition(async () => {
      const [res, animated] = await Promise.all([startPracticeAction(kind), covering])
      if (!res.ok) {
        if (animated) reveal()
        return setError(res.message)
      }
      setSession(res.data)
      setResults(res.data.answers)
      const first = res.data.questions.findIndex((q) => !res.data.answers[q.id])
      setStep({ kind: 'question', index: first === -1 ? res.data.questions.length - 1 : first })
      if (animated) reveal()
    })
  }

  function submit(questionId: string, answer: Answer) {
    if (!session) return
    setError(undefined)
    startTransition(async () => {
      const res = await submitPracticeAnswerAction(session.sessionId, questionId, answer)
      if (!res.ok) return setError(res.message)
      setResults((cur) => ({ ...cur, [questionId]: res.data }))
    })
  }

  function next() {
    if (!session || step.kind !== 'question') return
    if (step.index + 1 < total) return setStep({ kind: 'question', index: step.index + 1 })
    startTransition(async () => {
      const res = await completePracticeAction(session.sessionId)
      if (!res.ok) return setError(res.message)
      setStep({ kind: 'result', summary: res.data })
    })
  }

  if (step.kind === 'intro' && idle) return idle

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <span
        aria-hidden="true"
        className="pointer-events-none fixed -top-28 -right-32 -z-10 size-96 rounded-full bg-accent opacity-20 blur-[90px]"
      />
      <header className="flex h-14 items-center gap-3">
        <Link
          href={routes.dashboard}
          className="grid size-10 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Quitter (tes réponses sont sauvegardées)"
        >
          <X className="size-5" aria-hidden="true" />
        </Link>
        {total > 0 ? (
          <>
            <Progress
              value={position}
              max={total}
              label={`Question ${position} sur ${total}`}
              className="h-2"
            />
            <span className="tabular shrink-0 text-caption text-muted">
              {position}/{total}
            </span>
          </>
        ) : null}
      </header>

      <WaveTransition phase={wave} origin={waveOrigin} />
      <main id="contenu" className="flex flex-1 flex-col gap-5 py-4">
        {step.kind === 'intro' ? (
          <div className="step-in flex flex-1 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="text-title outline-none lg:text-[1.75rem]"
              >
                {title}
              </h1>
              <p className="text-heading font-normal text-muted">{intro}</p>
            </div>
            {meta}
            <FormMessage tone="error">{error}</FormMessage>
            <div className="mt-auto">
              <Button size="lg" className="w-full" loading={pending} onClick={start}>
                C’est parti
              </Button>
            </div>
          </div>
        ) : null}

        {step.kind === 'question' && session
          ? (() => {
              const question = session.questions[step.index]!
              const result = results[question.id] ?? null
              return (
                <div key={question.id} className="slide-in-x flex flex-1 flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <p className="text-caption font-semibold text-muted">
                      {formatLabels[question.format]}
                    </p>
                    <h1
                      ref={headingRef}
                      tabIndex={-1}
                      className="text-[1.25rem] leading-snug outline-none"
                    >
                      {question.prompt}
                    </h1>
                  </div>
                  <QuestionView
                    question={question}
                    result={result}
                    pending={pending}
                    onSubmit={(a) => submit(question.id, a)}
                  />
                  <FormMessage tone="error">{error}</FormMessage>
                  {result ? (
                    <div
                      role="status"
                      className={cn(
                        'rise-in glass-strong mt-auto flex flex-col gap-3 rounded-hero border p-5',
                        result.isCorrect
                          ? 'border-success/50 bg-success/10'
                          : 'border-danger/40 bg-danger/8',
                      )}
                    >
                      <p className="flex items-center gap-2 font-display text-heading font-semibold text-ink">
                        {result.isCorrect ? (
                          <CircleCheck className="size-5 text-success" aria-hidden="true" />
                        ) : (
                          <CircleX className="size-5 text-danger" aria-hidden="true" />
                        )}
                        {result.isCorrect
                          ? 'Bonne réponse'
                          : result.score > 0
                            ? 'Presque'
                            : 'Pas tout à fait'}
                      </p>
                      <p className="text-body leading-relaxed text-ink">{result.explanation}</p>
                      <Button size="lg" onClick={next} loading={pending}>
                        {step.index + 1 < total ? 'Continuer' : 'Voir mon résultat'}
                      </Button>
                    </div>
                  ) : null}
                </div>
              )
            })()
          : null}

        {step.kind === 'result' && session ? (
          <div className="step-in flex flex-1 flex-col gap-6">
            <LessonResult
              summary={step.summary}
              headingRef={headingRef}
              title={
                kind === 'daily'
                  ? 'Défi du jour terminé'
                  : step.summary.perfect
                    ? 'Révision parfaite !'
                    : 'Révision terminée'
              }
            />
            {step.summary.rewards ? <RewardsPanel rewards={step.summary.rewards} /> : null}
            <div
              className="rise-in mt-auto flex flex-col gap-3"
              style={{ animationDelay: '1100ms' }}
            >
              {kind === 'daily' ? (
                <ShareButton
                  day={session.day}
                  results={session.questions.map((q) => Boolean(results[q.id]?.isCorrect))}
                />
              ) : null}
              <Button asChild size="lg">
                <Link href={routes.dashboard}>Retour à l’accueil</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
