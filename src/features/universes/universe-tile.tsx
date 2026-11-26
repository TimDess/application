import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { UniverseIcon } from './universe-icon'
import { universeStyle } from './universe-style'

type Universe = {
  name: string
  tagline: string
  color_light: string
  color_dark: string
  icon_key: string
}

/** Square "cover" in the universe color, with its icon. */
export function UniverseCover({
  universe,
  size = 'md',
}: {
  universe: Universe
  size?: 'sm' | 'md' | 'lg'
}) {
  const box = { sm: 'size-9 rounded-sm', md: 'size-12 rounded-md', lg: 'size-14 rounded-lg' }[size]
  const icon = { sm: 'size-4', md: 'size-5', lg: 'size-6' }[size]
  return (
    <span
      className={cn(
        'universe-scope grid shrink-0 place-items-center bg-(--uni) text-(--on-uni)',
        box,
      )}
      style={universeStyle(universe)}
    >
      <UniverseIcon iconKey={universe.icon_key} className={icon} />
    </span>
  )
}

export function UniverseTile({
  universe,
  meta,
  className,
}: {
  universe: Universe
  meta?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'universe-scope flex items-center gap-3 rounded-lg border bg-surface p-3',
        'border-[color-mix(in_srgb,var(--uni)_22%,var(--line))]',
        className,
      )}
      style={universeStyle(universe)}
    >
      <UniverseCover universe={universe} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-display text-heading font-semibold text-ink">
          {universe.name}
        </span>
        <span className="truncate text-caption text-muted">{universe.tagline}</span>
      </div>
      {meta}
    </div>
  )
}
