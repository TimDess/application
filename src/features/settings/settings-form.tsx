'use client'

import { feedback, setSensations } from '@/lib/sensations'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChoiceGroup } from '@/components/ui/choice-group'
import { FormMessage } from '@/components/ui/form-message'
import { Switch } from '@/components/ui/switch'
import { applyReducedMotion, applyThemePreference } from '@/components/theme/theme-client'
import { avatarPresets } from '@/config/avatars'
import {
  dailyGoals,
  profileVisibilities,
  themePreferences,
  type ThemePreference,
} from '@/config/product'
import { routes } from '@/config/routes'
import type { PublishedUniverse, Viewer } from '@/lib/auth/session'
import type { ActionState } from '@/lib/validation/action-state'
import type { SettingsInput } from '@/lib/validation/profile'
import { cn } from '@/lib/utils/cn'
import { updateSettingsAction, updateUniversesAction } from './actions'
import { LevelPicker, UniverseGrid, toChoices, type UniverseSelection } from './universe-picker'

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id={id} className="text-heading">
          {title}
        </h2>
        {description ? <p className="text-body text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function SettingsForm({
  viewer,
  universes,
}: {
  viewer: Viewer
  universes: PublishedUniverse[]
}) {
  const [s, setS] = useState({
    ...viewer.settings,
    visibility: viewer.visibility,
    avatarKey: viewer.avatarKey,
  })
  const [status, setStatus] = useState<ActionState | null>(null)
  const [pending, startTransition] = useTransition()

  const initialSelection: UniverseSelection = Object.fromEntries(
    viewer.favorites.map((f) => [f.slug, f.level ?? 'debutant']),
  )
  const [selection, setSelection] = useState<UniverseSelection>(initialSelection)
  const [uniStatus, setUniStatus] = useState<ActionState | null>(null)
  const [uniPending, startUniTransition] = useTransition()

  function save(patch: SettingsInput, local: Partial<typeof s>) {
    const previous = s
    setS((cur) => ({ ...cur, ...local }))
    startTransition(async () => {
      const res = await updateSettingsAction(patch)
      setStatus(res)
      if (res.status === 'error') setS(previous)
    })
  }

  function saveUniverses() {
    startUniTransition(async () => setUniStatus(await updateUniversesAction(toChoices(selection))))
  }

  return (
    <div className="flex flex-col gap-8">
      <p
        role="status"
        aria-live="polite"
        className={cn(
          'pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto w-fit rounded-full border px-4 py-2 text-caption font-semibold shadow-(--shadow-pop) lg:bottom-8',
          status?.status === 'error'
            ? 'border-danger/40 bg-surface text-danger'
            : 'border-line bg-surface text-ink',
          !pending && !status?.message && 'sr-only',
        )}
      >
        {pending ? 'Enregistrement…' : (status?.message ?? '')}
      </p>

      <Section id="apparence" title="Apparence">
        <ChoiceGroup
          name="theme"
          legend="Thème"
          columns={3}
          choices={themePreferences}
          value={s.theme}
          onChange={(theme: ThemePreference) => {
            applyThemePreference(theme)
            save({ theme }, { theme })
          }}
        />
        <Card className="py-1">
          <Switch
            id="reduced-motion"
            label="Réduire les animations"
            description="Remplace les mouvements par des transitions discrètes."
            checked={s.reducedMotion}
            onCheckedChange={(reducedMotion) => {
              applyReducedMotion(reducedMotion)
              save({ reducedMotion }, { reducedMotion })
            }}
          />
        </Card>
      </Section>

      <Section id="avatar" title="Avatar" description="Une couleur et l’initiale de ton pseudo.">
        <fieldset>
          <legend className="sr-only">Couleur d’avatar</legend>
          <div className="grid max-w-md grid-cols-8 gap-2">
            {avatarPresets.map((a) => (
              <label key={a.key} className="cursor-pointer">
                <input
                  type="radio"
                  name="avatar"
                  className="peer sr-only"
                  checked={s.avatarKey === a.key}
                  onChange={() => save({ avatarKey: a.key }, { avatarKey: a.key })}
                />
                <span className="sr-only">{a.label}</span>
                <span
                  aria-hidden="true"
                  className="grid aspect-square w-full place-items-center rounded-full font-display font-semibold ring-offset-2 ring-offset-bg peer-checked:ring-2 peer-checked:ring-accent peer-focus-visible:ring-2 peer-focus-visible:ring-focus"
                  style={{ background: a.bg, color: a.fg }}
                >
                  {(viewer.username?.[0] ?? '?').toUpperCase()}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Section>

      <Section id="objectif" title="Objectif quotidien">
        <ChoiceGroup
          name="goal"
          legend="Objectif quotidien"
          hideLegend
          columns={4}
          choices={dailyGoals.map((g) => ({ value: g.minutes, label: g.label, hint: g.hint }))}
          value={s.dailyGoalMinutes}
          onChange={(dailyGoal) => save({ dailyGoal }, { dailyGoalMinutes: dailyGoal })}
        />
      </Section>

      <Section
        id="univers"
        title="Univers favoris"
        description="Ils orientent ton accueil et tes recommandations."
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
        <LevelPicker
          universes={universes}
          selection={selection}
          onChange={(slug, level) => setSelection((cur) => ({ ...cur, [slug]: level }))}
        />
        <FormMessage tone={uniStatus?.status === 'error' ? 'error' : 'success'}>
          {uniStatus?.message}
        </FormMessage>
        <Button
          onClick={saveUniverses}
          loading={uniPending}
          disabled={Object.keys(selection).length === 0}
          className="self-start"
        >
          Enregistrer mes univers
        </Button>
      </Section>

      <Section
        id="sons"
        title="Sons et vibrations"
        description="Les sons et vibrations des réponses, combos, duels et récompenses."
      >
        <Card className="divide-y divide-line py-1">
          <Switch
            id="sound"
            label="Effets sonores"
            checked={s.soundEnabled}
            onCheckedChange={(soundEnabled) => {
              setSensations({ sound: soundEnabled })
              if (soundEnabled) feedback('correct')
              save({ soundEnabled }, { soundEnabled })
            }}
          />
          <Switch
            id="haptics"
            label="Vibrations"
            description="Sur Android. L’iPhone ne permet pas encore les vibrations aux applications web."
            checked={s.hapticsEnabled}
            onCheckedChange={(hapticsEnabled) => {
              setSensations({ haptics: hapticsEnabled })
              save({ hapticsEnabled }, { hapticsEnabled })
            }}
          />
        </Card>
      </Section>

      <Section id="confidentialite" title="Confidentialité">
        <ChoiceGroup
          name="visibility"
          legend="Qui peut voir ton profil"
          choices={profileVisibilities}
          value={s.visibility}
          onChange={(visibility) => save({ visibility }, { visibility })}
        />
        <Card className="py-1">
          <Switch
            id="leaderboards"
            label="Apparaître dans les classements"
            description="Ton pseudo et ton score dans les classements publics."
            checked={s.showInLeaderboards}
            onCheckedChange={(showInLeaderboards) =>
              save({ showInLeaderboards }, { showInLeaderboards })
            }
          />
        </Card>
      </Section>

      <Link
        href={routes.account}
        className="glass flex items-center justify-between rounded-card p-4 hover:border-line-strong"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-heading font-semibold text-ink">Compte</span>
          <span className="text-body text-muted">
            Mot de passe, export de tes données, suppression
          </span>
        </span>
        <ChevronRight className="size-5 text-muted" aria-hidden="true" />
      </Link>
    </div>
  )
}
