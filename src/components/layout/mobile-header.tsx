import { Settings } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { routes } from '@/config/routes'

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 pt-[env(safe-area-inset-top)] lg:hidden">
      <Link href={routes.dashboard} aria-label="Kulto, accueil">
        <Logo className="text-[1.125rem]" />
      </Link>
      <Link
        href={routes.settings}
        className="grid size-10 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
        aria-label="Paramètres"
      >
        <Settings className="size-5" aria-hidden="true" />
      </Link>
    </header>
  )
}
