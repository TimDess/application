import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-10 text-center',
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-full bg-surface-2 text-muted">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="font-display text-heading font-semibold text-ink">{title}</p>
        {description ? <p className="text-body text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
