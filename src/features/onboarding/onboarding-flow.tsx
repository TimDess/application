'use client'

import { ArrowLeft, BookOpen, Brain, Swords } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ChoiceGroup } from '@/components/ui/choice-group'
import { TextField } from '@/components/ui/field'
import { FormMessage } from '@/components/ui/form-message'
import { Progress } from '@/components/ui/progress'
import { avatarPresets, type AvatarKey } from '@/config/avatars'
import { brand } from '@/config/brand'
import { dailyGoals, selfLevels, type DailyGoalMinutes } from '@/config/product'
import { routes } from '@/config/routes'
import {
  LevelPicker,
  UniverseGrid,
  toChoices,
  type UniverseSelection,
} from '@/features/settings/universe-picker'
import type { PublishedUniverse } from '@/lib/auth/session'
import { usernameSchema } from '@/lib/validation/profile'
import { completeOnboardingAction } from './actions'

const STEPS = ['intro', 'pseudo', 'univers', 'objectif', 'niveau', 'recap'] as const
type Step = (typeof STEPS)[number]

function StepFrame({
  title,
  description,
  children,
  onSubmit,
  submitLabel,
  submitDisabled,
  loading,
  headingRef,
}: {
  title: string
  description?: string
  children?: ReactNode
  onSubmit: () => void
  submitLabel: string
  submitDisabled?: boolean
  loading?: boolean
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  function handle(e: FormEvent) {
    e.preventDefault()
    onSubmit()
  }
  return (
    <form onSubmit={handle} className="step-in flex flex-1 flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-title outline-none lg:text-[1.75rem]">
          {title}
        </h1>
        {description ? <p className="text-body text-muted">{description}</p> : null}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
      <div className="mt-auto pt-2">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={submitDisabled}
          loading={loading}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export function OnboardingFlow({ universes }: { universes: PublishedUniverse[] }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('intro')
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState<string>()
  const [avatarKey, setAvatarKey] = useState<AvatarKey>('soleil')
  const [selection, setSelection] = useState<UniverseSelection>({})
  const [goal, setGoal] = useState<DailyGoalMinutes>(10)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const headingRef = useRef<HTMLHeadingElement>(null)

  const index = STEPS.indexOf(step)
  const go = (s: Step) => setStep(s)

  useEffect(() => {
    if (step !== 'intro') headingRef.current?.focus()
  }, [step])

  function submitPseudo() {
    const r = usernameSchema.safeParse(username)
    if (!r.success) {
      setUsernameError(r.error.issues[0]?.message)
      return
    }
    setUsername(r.data)
    setUsernameError(undefined)
    go('univers')
  }

  function finish() {
    setError(undefined)
    startTransition(async () => {
      const res = await completeOnboardingAction({
        username,
        avatarKey,
        dailyGoal: goal,
        universes: toChoices(selection),
      })
      if (res.status === 'success') {
        router.replace(routes.dashboard)
        router.refresh()
        return
      }
      if (res.fieldErrors?.username) {
        setUsernameError(res.fieldErrors.username)
        go('pseudo')
        return
      }
      setError(res.message ?? 'Impossible d’enregistrer pour le moment.')
    })
  }

  const chosen = universes.filter((u) => u.slug in selection)

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col gap-6">
      {step !== 'intro' ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go(STEPS[index - 1]!)}
            className="grid size-10 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Étape précédente"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <Progress
            value={index}
            max={STEPS.length - 1}
            label={`Étape ${index} sur ${STEPS.length - 1}`}
          />
          <span className="tabular shrink-0 text-caption text-muted">
            {index}/{STEPS.length - 1}
          </span>
        </div>
      ) : null}

      {step === 'intro' ? (
        <StepFrame
          key="intro"
          headingRef={headingRef}
          title={`Bienvenue sur ${brand.name}`}
          description={brand.tagline}
          submitLabel="C’est parti"
          onSubmit={() => go('pseudo')}
        >
          <ul className="flex flex-col gap-3">
            {[
              {
                icon: BookOpen,
                title: 'Apprends',
                text: 'Des parcours courts, du plus simple au plus pointu.',
              },
              { icon: Brain, title: 'Retiens', text: 'Ce que tu apprends revient au bon moment.' },
              { icon: Swords, title: 'Défie', text: 'Mesure-toi aux autres et monte de division.' },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="glass flex items-center gap-3 rounded-card p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent/15 text-accent-text">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span className="text-body font-semibold text-ink">{title}</span>
                  <span className="text-caption text-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-caption text-muted">Une minute pour personnaliser ton expérience.</p>
        </StepFrame>
      ) : null}

      {step === 'pseudo' ? (
        <StepFrame
          key="pseudo"
          headingRef={headingRef}
          title="Choisis ton pseudo"
          description="C’est le nom que verront les autres joueurs. Ton email reste privé."
          submitLabel="Continuer"
          onSubmit={submitPseudo}
        >
          <div className="flex items-center gap-4">
            <Avatar avatarKey={avatarKey} name={username || '?'} size="lg" />
            <TextField
              name="username"
              label="Pseudo"
              className="flex-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="nickname"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={20}
              hint="3 à 20 caractères : lettres, chiffres et _"
              error={usernameError}
            />
          </div>
          <fieldset>
            <legend className="mb-2 text-body font-medium text-ink">Couleur de ton avatar</legend>
            <div className="grid max-w-sm grid-cols-8 gap-2">
              {avatarPresets.map((a) => (
                <label key={a.key} className="cursor-pointer">
                  <input
                    type="radio"
                    name="avatar"
                    className="peer sr-only"
                    checked={avatarKey === a.key}
                    onChange={() => setAvatarKey(a.key)}
                  />
                  <span className="sr-only">{a.label}</span>
                  <span
                    aria-hidden="true"
                    className="block aspect-square w-full rounded-full ring-offset-2 ring-offset-bg peer-checked:ring-2 peer-checked:ring-accent peer-focus-visible:ring-2 peer-focus-visible:ring-focus"
                    style={{ background: a.bg }}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        </StepFrame>
      ) : null}

      {step === 'univers' ? (
        <StepFrame
          key="univers"
          headingRef={headingRef}
          title="Qu’est-ce qui te passionne ?"
          description="Choisis un ou plusieurs univers. Tu pourras changer plus tard."
          submitLabel={
            chosen.length > 0
              ? `Continuer avec ${chosen.length} univers`
              : 'Choisis au moins un univers'
          }
          submitDisabled={chosen.length === 0}
          onSubmit={() => go('objectif')}
        >
          <UniverseGrid
            universes={universes}
            selection={selection}
            onToggle={(slug) =>
              setSelection((cur) => {
                const next = { ...cur }
                if (slug in next) delete next[slug]
                else next[slug] = 'debutant'
                return next
              })
            }
          />
        </StepFrame>
      ) : null}

      {step === 'objectif' ? (
        <StepFrame
          key="objectif"
          headingRef={headingRef}
          title="Combien de temps par jour ?"
          description="Un objectif réaliste vaut mieux qu’un objectif ambitieux. Tu pourras l’ajuster."
          submitLabel="Continuer"
          onSubmit={() => go('niveau')}
        >
          <ChoiceGroup
            name="goal"
            legend="Objectif quotidien"
            hideLegend
            choices={dailyGoals.map((g) => ({ value: g.minutes, label: g.label, hint: g.hint }))}
            value={goal}
            onChange={setGoal}
          />
        </StepFrame>
      ) : null}

      {step === 'niveau' ? (
        <StepFrame
          key="niveau"
          headingRef={headingRef}
          title="Où en es-tu ?"
          description="Une estimation suffit. Elle nous aide à proposer le bon point de départ."
          submitLabel="Continuer"
          onSubmit={() => go('recap')}
        >
          <LevelPicker
            universes={universes}
            selection={selection}
            onChange={(slug, level) => setSelection((cur) => ({ ...cur, [slug]: level }))}
          />
        </StepFrame>
      ) : null}

      {step === 'recap' ? (
        <StepFrame
          key="recap"
          headingRef={headingRef}
          title="Tout est prêt"
          description="Vérifie tes choix avant de commencer."
          submitLabel="Terminer"
          loading={pending}
          onSubmit={finish}
        >
          <dl className="glass flex flex-col divide-y divide-line rounded-card">
            <div className="flex items-center justify-between gap-4 p-4">
              <dt className="text-body text-muted">Pseudo</dt>
              <dd className="flex items-center gap-2 text-body font-semibold text-ink">
                <Avatar avatarKey={avatarKey} name={username} size="sm" />
                {username}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 p-4">
              <dt className="text-body text-muted">Objectif</dt>
              <dd className="text-body font-semibold text-ink">{goal} min par jour</dd>
            </div>
            <div className="flex flex-col gap-2 p-4">
              <dt className="text-body text-muted">Univers</dt>
              <dd className="flex flex-wrap gap-2">
                {chosen.map((u) => (
                  <span
                    key={u.slug}
                    className="rounded-full border border-line px-3 py-1 text-caption font-medium text-ink"
                  >
                    {u.name} · {selfLevels.find((l) => l.value === selection[u.slug])?.label}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
          <FormMessage tone="error">{error}</FormMessage>
        </StepFrame>
      ) : null}
    </div>
  )
}
