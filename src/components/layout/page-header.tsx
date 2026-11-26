import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-title lg:text-[1.75rem]">{title}</h1>
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
