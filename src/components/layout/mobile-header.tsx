import { Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { routes } from '@/config/routes'

export function MobileHeader({ aside }: { aside?: ReactNode }) {
  return (
    <header className="sticky top-0 isolate z-30 flex h-14 items-center justify-between px-4 pt-[env(safe-area-inset-top)] lg:hidden">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(100%+1.25rem)] bg-linear-to-b from-(--bg-deep) from-75% to-transparent"
      />
      <Link href={routes.dashboard} aria-label="Kulto, accueil">
        <Logo className="text-[1.125rem]" />
      </Link>
      <div className="flex items-center gap-1">
        {aside}
        <Link
          href={routes.settings}
          className="grid size-10 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Paramètres"
        >
          <Settings className="size-5" aria-hidden="true" />
        </Link>
      </div>
    </header>
  )
}
