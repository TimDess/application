'use client'

import { ArrowLeft, ArrowRight, CircleCheck, CircleX, Clock, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { formatLabels, QuestionView } from '@/components/games/question-view'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Progress } from '@/components/ui/progress'
import { coursePath, lessonPath } from '@/config/routes'
import {
  completeLessonAction,
  startLessonAction,
  submitAnswerAction,
} from '@/features/learning/actions'
import type { PlayableLesson } from '@/features/learning/queries'
import type { Answer, AnswerResult, LessonSummary } from '@/features/learning/types'
import { cn } from '@/lib/utils/cn'
import { motionReduced } from '@/components/theme/theme-client'
import { LaunchScreen } from './launch-screen'
import { universeStyle } from '@/features/universes/universe-style'
import { LearningCard } from './learning-card'
import { LessonResult } from './lesson-result'

type Step =
  | { kind: 'intro' }
  | { kind: 'card'; index: number }
  | { kind: 'question'; index: number }
  | { kind: 'result'; summary: LessonSummary }

export function LessonPlayer({ lesson }: { lesson: PlayableLesson }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>({ kind: 'intro' })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, AnswerResult>>({})
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const [launching, setLaunching] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const totalSteps = lesson.cards.length + lesson.questions.length
  const position =
    step.kind === 'card'
      ? step.index + 1
      : step.kind === 'question'
        ? lesson.cards.length + step.index + 1
        : step.kind === 'result'
          ? totalSteps
          : 0

  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  function start() {
    setError(undefined)
    const animate = !motionReduced()
    if (animate) setLaunching(true)
    startTransition(async () => {
      const [res] = await Promise.all([
        startLessonAction(lesson.id),
        animate ? new Promise((r) => setTimeout(r, 900)) : Promise.resolve(),
      ])
      setLaunching(false)
      if (!res.ok) return setError(res.message)
      setSessionId(res.data.sessionId)
      setResults(res.data.answers)
      const firstUnanswered = lesson.questions.findIndex((q) => !res.data.answers[q.id])
      const resumed = Object.keys(res.data.answers).length > 0
      if (resumed)
        setStep({
          kind: 'question',
          index: firstUnanswered === -1 ? lesson.questions.length - 1 : firstUnanswered,
        })
      else
        setStep(
          lesson.cards.length > 0 ? { kind: 'card', index: 0 } : { kind: 'question', index: 0 },
        )
    })
  }

  function submit(questionId: string, answer: Answer) {
    if (!sessionId) return
    setError(undefined)
    startTransition(async () => {
      const res = await submitAnswerAction(sessionId, questionId, answer)
      if (!res.ok) return setError(res.message)
      setResults((cur) => ({ ...cur, [questionId]: res.data }))
    })
  }

  function next() {
    if (step.kind === 'card') {
      setStep(
        step.index + 1 < lesson.cards.length
          ? { kind: 'card', index: step.index + 1 }
          : { kind: 'question', index: 0 },
      )
      return
    }
    if (step.kind === 'question') {
      if (step.index + 1 < lesson.questions.length)
        return setStep({ kind: 'question', index: step.index + 1 })
      if (!sessionId) return
      startTransition(async () => {
        const res = await completeLessonAction(sessionId)
        if (!res.ok) return setError(res.message)
        setStep({ kind: 'result', summary: res.data })
      })
    }
  }

  return (
    <div
      className="universe-scope relative mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      style={universeStyle(lesson.course.universe)}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none fixed -top-28 -right-32 -z-10 size-96 rounded-full bg-(--uni) opacity-25 blur-[90px]"
      />
      <header className="flex h-14 items-center gap-3">
        <Link
          href={coursePath(lesson.course.slug)}
          className="grid size-10 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Quitter la leçon (ta progression est sauvegardée)"
        >
          <X className="size-5" aria-hidden="true" />
        </Link>
        <Progress
          value={position}
          max={totalSteps}
          label={`Étape ${position} sur ${totalSteps}`}
          className="h-2"
        />
        <span className="tabular shrink-0 text-caption text-muted">
          {position}/{totalSteps}
        </span>
      </header>

      {launching ? <LaunchScreen title={lesson.title} /> : null}
      <main id="contenu" className="flex flex-1 flex-col gap-5 py-4">
        {step.kind === 'intro' ? (
          <div className="step-in flex flex-1 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-caption font-semibold text-muted">
                {lesson.course.title} · {lesson.chapterTitle}
              </p>
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="text-title outline-none lg:text-[1.75rem]"
              >
                {lesson.kind === 'exam' ? `${lesson.title}` : lesson.title}
              </h1>
              <p className="text-heading font-normal text-muted">{lesson.objective}</p>
            </div>
            <ul className="flex flex-wrap gap-2 text-caption text-muted">
              <li className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1">
                <Clock className="size-3.5" aria-hidden="true" />
                {lesson.minutes} min
              </li>
              {lesson.cards.length ? (
                <li className="rounded-full border border-line px-3 py-1">
                  {lesson.cards.length} fiches
                </li>
              ) : null}
              <li className="rounded-full border border-line px-3 py-1">
                {lesson.questions.length} questions
              </li>
              {lesson.kind === 'exam' ? (
                <li className="rounded-full bg-accent/15 px-3 py-1 font-semibold text-accent-text">
                  Épreuve de chapitre
                </li>
              ) : null}
            </ul>
            <FormMessage tone="error">{error}</FormMessage>
            <div className="mt-auto">
              <Button size="lg" className="w-full" loading={pending} onClick={start}>
                C’est parti
              </Button>
            </div>
          </div>
        ) : null}

        {step.kind === 'card' ? (
          <div key={`card-${step.index}`} className="slide-in-x flex flex-1 flex-col gap-5">
            <h1 ref={headingRef} tabIndex={-1} className="sr-only outline-none">
              Fiche {step.index + 1} sur {lesson.cards.length}
            </h1>
            <LearningCard card={lesson.cards[step.index]!} />
            <div className="mt-auto flex gap-3">
              {step.index > 0 ? (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setStep({ kind: 'card', index: step.index - 1 })}
                  aria-label="Fiche précédente"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </Button>
              ) : null}
              <Button size="lg" className="flex-1" onClick={next}>
                {step.index + 1 < lesson.cards.length ? 'Suivant' : 'Passer aux questions'}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}

        {step.kind === 'question'
          ? (() => {
              const question = lesson.questions[step.index]!
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
                        {step.index + 1 < lesson.questions.length
                          ? 'Continuer'
                          : 'Voir mon résultat'}
                      </Button>
                    </div>
                  ) : null}
                </div>
              )
            })()
          : null}

        {step.kind === 'result' ? (
          <div className="step-in flex flex-1 flex-col gap-6">
            <LessonResult summary={step.summary} headingRef={headingRef} />
            <p
              className="rise-in text-center text-caption text-muted"
              style={{ animationDelay: '600ms' }}
            >
              L’XP, les séries et les révisions arrivent dans la prochaine version.
            </p>
            <div
              className="rise-in mt-auto flex flex-col gap-3"
              style={{ animationDelay: '700ms' }}
            >
              {lesson.nextLesson ? (
                <Button size="lg" onClick={() => router.push(lessonPath(lesson.nextLesson!.slug))}>
                  Leçon suivante : {lesson.nextLesson.title}
                </Button>
              ) : null}
              <Button asChild size="lg" variant={lesson.nextLesson ? 'secondary' : 'primary'}>
                <Link href={coursePath(lesson.course.slug)}>Retour au parcours</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
