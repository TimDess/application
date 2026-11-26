import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/logo'
import { routes } from '@/config/routes'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="flex h-12 items-center">
        <Link href={routes.home} aria-label="Kulto, page d’accueil">
          <Logo />
        </Link>
      </header>
      <main id="contenu" className="flex flex-1 flex-col justify-center py-8">
        {children}
      </main>
      <footer className="flex justify-center gap-4 text-caption text-muted">
        <Link href={routes.terms} className="hover:text-ink">
          Conditions d’utilisation
        </Link>
        <Link href={routes.privacy} className="hover:text-ink">
          Confidentialité
        </Link>
      </footer>
    </div>
  )
}
