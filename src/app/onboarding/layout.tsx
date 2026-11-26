import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/logo'

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="flex h-12 items-center">
        <Logo />
      </header>
      <main id="contenu" className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  )
}
