import type { ReactNode } from 'react'

export function AuthHeading({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-title">{title}</h1>
      {description ? <p className="text-body text-muted">{description}</p> : null}
    </div>
  )
}
