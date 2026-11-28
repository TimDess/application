import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Mascot, type MascotMood } from '@/components/brand/mascot'
import { cn } from '@/lib/utils/cn'

export function EmptyState({
  icon: Icon,
  mascot,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  /** Shows the Point with this expression instead of the icon. */
  mascot?: MascotMood
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
      {mascot ? (
        <Mascot mood={mascot} size={72} />
      ) : (
        <span className="grid size-11 place-items-center rounded-full bg-surface-2 text-muted">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <div className="flex max-w-sm flex-col gap-1">
        <p className="font-display text-heading font-semibold text-ink">{title}</p>
        {description ? <p className="text-body text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
