'use client'

import { Check, X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'missed'

/** A large, tappable answer. The state is shown by border, background, icon and a word, never by color alone. */
export function OptionButton({
  state,
  children,
  trailing,
  className,
  ...props
}: ComponentProps<'button'> & { state: OptionState; trailing?: ReactNode }) {
  const label = {
    idle: null,
    selected: null,
    correct: 'Correct',
    wrong: 'Ta réponse',
    missed: 'Bonne réponse',
  }[state]
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-14 w-full items-center justify-between gap-3 rounded-[18px] border px-4 py-3 text-left text-heading font-medium text-ink',
        'transition-[background-color,border-color,transform] duration-(--duration-fast) active:translate-y-px disabled:active:translate-y-0',
        state === 'idle' && 'glass hover:border-line-strong',
        state === 'selected' && 'border-accent bg-accent/10',
        state === 'correct' &&
          'anim-pop border-success bg-success/14 shadow-[0_0_0_6px_color-mix(in_srgb,var(--success)_14%,transparent)]',
        state === 'missed' && 'border-dashed border-success bg-success/6',
        state === 'wrong' && 'anim-shake border-danger bg-danger/10',
        className,
      )}
      {...props}
    >
      <span className="min-w-0">{children}</span>
      <span className="flex shrink-0 items-center gap-1.5 text-caption text-muted">
        {label}
        {state === 'correct' || state === 'missed' ? (
          <Check className="size-4 text-success" aria-hidden="true" />
        ) : null}
        {state === 'wrong' ? <X className="size-4 text-danger" aria-hidden="true" /> : null}
        {trailing}
      </span>
    </button>
  )
}
