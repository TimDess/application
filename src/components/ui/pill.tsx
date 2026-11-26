import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

export function Pill({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'tabular inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-caption font-semibold text-ink',
        className,
      )}
      {...props}
    />
  )
}

/** Marks a feature that is planned but not built yet. Always say which phase. */
export function SoonBadge({ phase, className }: { phase: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full bg-surface-2 px-2 py-0.5 text-caption font-medium whitespace-nowrap text-muted',
        className,
      )}
    >
      Phase {phase}
    </span>
  )
}
