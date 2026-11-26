'use client'

import { Check } from 'lucide-react'
import type { PublishedUniverse } from '@/lib/auth/session'
import { selfLevels, type SelfLevel } from '@/config/product'
import { ChoiceGroup } from '@/components/ui/choice-group'
import { UniverseCover } from '@/features/universes/universe-tile'
import { cn } from '@/lib/utils/cn'

export type UniverseSelection = Record<string, SelfLevel>

/** Multi-select of universes (shared by onboarding and settings). */
export function UniverseGrid({
  universes,
  selection,
  onToggle,
}: {
  universes: PublishedUniverse[]
  selection: UniverseSelection
  onToggle: (slug: string) => void
}) {
  return (
    <fieldset>
      <legend className="sr-only">Univers favoris</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {universes.map((u) => {
          const selected = u.slug in selection
          return (
            <label
              key={u.slug}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border bg-surface p-3 transition-colors duration-(--duration-fast)',
                selected ? 'border-accent bg-accent/10' : 'border-line hover:border-line-strong',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={selected}
                onChange={() => onToggle(u.slug)}
              />
              <UniverseCover universe={u} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-body font-semibold text-ink">{u.name}</span>
                <span className="truncate text-caption text-muted">{u.tagline}</span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full border',
                  selected ? 'border-accent bg-accent text-on-accent' : 'border-line',
                )}
              >
                {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function LevelPicker({
  universes,
  selection,
  onChange,
}: {
  universes: PublishedUniverse[]
  selection: UniverseSelection
  onChange: (slug: string, level: SelfLevel) => void
}) {
  const chosen = universes.filter((u) => u.slug in selection)
  return (
    <div className="flex flex-col gap-5">
      {chosen.map((u) => (
        <div key={u.slug} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <UniverseCover universe={u} size="sm" />
            <span className="text-body font-semibold text-ink">{u.name}</span>
          </div>
          <ChoiceGroup
            name={`level-${u.slug}`}
            legend={`Ton niveau en ${u.name}`}
            hideLegend
            size="sm"
            columns={3}
            choices={selfLevels.map((l) => ({ value: l.value, label: l.label }))}
            value={selection[u.slug] ?? null}
            onChange={(v) => onChange(u.slug, v)}
          />
        </div>
      ))}
    </div>
  )
}

export function toChoices(selection: UniverseSelection) {
  return Object.entries(selection).map(([slug, level]) => ({ slug, level }))
}
