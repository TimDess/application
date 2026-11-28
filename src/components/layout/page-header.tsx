import { TitleDot } from '@/components/ui/title-dot'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  eyebrow?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow ? <p className="text-body text-muted first-letter:uppercase">{eyebrow}</p> : null}
        <h1 className="font-display text-[1.875rem] leading-[1.05] font-bold tracking-[-0.03em] lg:text-[2.25rem]">
          <TitleDot>{title}</TitleDot>
        </h1>
        {description ? <p className="text-body text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-heading">{children}</h2>
      {aside}
    </div>
  )
}
