'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export type Choice<T extends string | number> = { value: T; label: string; hint?: ReactNode }

/** Accessible single-choice group built on native radio inputs. */
export function ChoiceGroup<T extends string | number>({
  name,
  legend,
  choices,
  value,
  onChange,
  columns = 1,
  hideLegend = false,
  size = 'md',
}: {
  name: string
  legend: string
  choices: readonly Choice<T>[]
  value: T | null
  onChange: (value: T) => void
  columns?: 1 | 2 | 3 | 4
  hideLegend?: boolean
  size?: 'sm' | 'md'
}) {
  const grid = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns]
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={cn('mb-2 text-body font-medium text-ink', hideLegend && 'sr-only')}>
        {legend}
      </legend>
      <div className={cn('grid gap-2', grid)}>
        {choices.map((c) => {
          const selected = c.value === value
          return (
            <label
              key={String(c.value)}
              className={cn(
                'relative flex cursor-pointer flex-col gap-0.5 rounded-md border bg-surface transition-colors duration-(--duration-fast)',
                size === 'sm' ? 'px-3 py-2' : 'px-4 py-3',
                selected ? 'border-accent bg-accent/10' : 'border-line hover:border-line-strong',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
              )}
            >
              <input
                type="radio"
                name={name}
                value={String(c.value)}
                checked={selected}
                onChange={() => onChange(c.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  'font-semibold text-ink',
                  size === 'sm' ? 'text-caption' : 'text-body',
                )}
              >
                {c.label}
              </span>
              {c.hint ? <span className="text-caption text-muted">{c.hint}</span> : null}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
