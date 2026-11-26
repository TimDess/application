import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { brand } from '@/config/brand'
import { routes } from '@/config/routes'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
        <Link href={routes.home} aria-label={`${brand.name}, page d’accueil`}>
          <Logo />
        </Link>
        <nav aria-label="Compte" className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={routes.signIn}>Se connecter</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={routes.signUp}>Commencer</Link>
          </Button>
        </nav>
      </header>
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <footer className="mx-auto flex w-full max-w-5xl flex-col gap-3 border-t border-line px-4 py-8 text-caption text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {brand.name} · {brand.tagline}
        </span>
        <nav aria-label="Informations légales" className="flex gap-4">
          <Link href={routes.terms} className="hover:text-ink">
            Conditions d’utilisation
          </Link>
          <Link href={routes.privacy} className="hover:text-ink">
            Confidentialité
          </Link>
        </nav>
      </footer>
    </div>
  )
}
