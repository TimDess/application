import { redirect } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import { BottomNav } from '@/components/layout/bottom-nav'
import { MobileHeader } from '@/components/layout/mobile-header'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import { SideNav } from '@/components/layout/side-nav'
import { SidebarUser, SidebarUserSkeleton } from '@/components/layout/sidebar-user'
import { PreferencesSync } from '@/components/theme/preferences-sync'
import { routes } from '@/config/routes'
import { getViewer } from '@/lib/auth/session'

/**
 * Signed-in app shell. The navigation is static (prerendered); everything that
 * reads the session streams in behind Suspense boundaries (Cache Components).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:pl-64">
      <SideNav
        userSlot={
          <Suspense fallback={<SidebarUserSkeleton />}>
            <SidebarUser />
          </Suspense>
        }
      />
      <MobileHeader />
      <main
        id="contenu"
        className="mx-auto w-full max-w-3xl px-4 pt-5 pb-28 lg:px-8 lg:pt-10 lg:pb-14"
      >
        <Suspense fallback={<PageSkeleton />}>
          <AuthGate>{children}</AuthGate>
        </Suspense>
      </main>
      <BottomNav />
    </div>
  )
}

async function AuthGate({ children }: { children: ReactNode }) {
  const viewer = await getViewer()
  if (!viewer.onboardingCompleted) redirect(routes.onboarding)
  return (
    <>
      {children}
      <PreferencesSync
        theme={viewer.settings.theme}
        reducedMotion={viewer.settings.reducedMotion}
      />
    </>
  )
}
