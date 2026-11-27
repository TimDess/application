import { X } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { routes } from '@/config/routes'

/** Full-screen message for a practice page with nothing to play (empty or already done). */
export function PracticeNotice({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <span
        aria-hidden="true"
        className="pointer-events-none fixed -top-28 -right-32 -z-10 size-96 rounded-full bg-accent opacity-20 blur-[90px]"
      />
      <header className="flex h-14 items-center">
        <Link
          href={routes.dashboard}
          className="grid size-10 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Retour à l’accueil"
        >
          <X className="size-5" aria-hidden="true" />
        </Link>
      </header>
      <main
        id="contenu"
        className="step-in flex flex-1 flex-col items-center justify-center gap-5 text-center"
      >
        <span className="grid size-16 place-items-center rounded-full bg-accent/15 text-accent-text">
          {icon}
        </span>
        <h1 className="text-title">{title}</h1>
        {children}
      </main>
    </div>
  )
}

export function MetaChips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2 text-caption text-muted">
      {items.map((item) => (
        <li key={item} className="rounded-full border border-line px-3 py-1">
          {item}
        </li>
      ))}
    </ul>
  )
}
