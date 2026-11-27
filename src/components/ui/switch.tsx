'use client'

import { cn } from '@/lib/utils/cn'

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  id,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  id: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span id={`${id}-label`} className="text-body font-medium text-ink">
          {label}
        </span>
        {description ? (
          <span id={`${id}-desc`} className="text-caption text-muted">
            {description}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-(--duration-base)',
          checked ? 'border-accent bg-accent' : 'border-line bg-surface-2',
          'disabled:opacity-50',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'inline-block size-5 rounded-full shadow-sm transition-transform duration-(--duration-base) ease-(--ease-out)',
            checked ? 'translate-x-6 bg-on-accent' : 'translate-x-1 bg-muted',
          )}
        />
      </button>
    </div>
  )
}
