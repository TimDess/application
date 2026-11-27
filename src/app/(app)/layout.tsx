import { redirect } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import { BottomNav, BottomNavView } from '@/components/layout/bottom-nav'
import { MobileHeader } from '@/components/layout/mobile-header'
import { SideNav, SideNavView } from '@/components/layout/side-nav'
import { SidebarUser, SidebarUserSkeleton } from '@/components/layout/sidebar-user'
import { PreferencesSync } from '@/components/theme/preferences-sync'
import { BrandLoaderScreen } from '@/components/ui/brand-loader'
import { routes } from '@/config/routes'
import { HeaderStreak } from '@/features/gamification/header-streak'
import { GuestBanner } from '@/features/guest/guest-banner'
import { getViewer } from '@/lib/auth/session'

/**
 * Signed-in app shell. The navigation is static (prerendered); everything that
 * reads the session streams in behind Suspense boundaries (Cache Components).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:pl-[17rem]">
      <Suspense fallback={<SideNavView pathname="" userSlot={<SidebarUserSkeleton />} />}>
        <SideNav
          userSlot={
            <Suspense fallback={<SidebarUserSkeleton />}>
              <SidebarUser />
            </Suspense>
          }
        />
      </Suspense>
      <MobileHeader
        aside={
          <Suspense fallback={null}>
            <HeaderStreak />
          </Suspense>
        }
      />
      <main
        id="contenu"
        className="mx-auto w-full max-w-3xl px-4 pt-5 pb-28 lg:px-8 lg:pt-10 lg:pb-14"
      >
        <Suspense fallback={null}>
          <GuestBanner />
        </Suspense>
        <Suspense fallback={<BrandLoaderScreen />}>
          <AuthGate>{children}</AuthGate>
        </Suspense>
      </main>
      <Suspense fallback={<BottomNavView pathname="" />}>
        <BottomNav />
      </Suspense>
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
