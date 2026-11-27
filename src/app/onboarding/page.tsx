import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { BrandLoaderScreen } from '@/components/ui/brand-loader'
import { routes } from '@/config/routes'
import { OnboardingFlow } from '@/features/onboarding/onboarding-flow'
import { getPublishedUniverses, getViewer } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Bienvenue' }

export default function OnboardingPage() {
  return (
    <Suspense fallback={<BrandLoaderScreen />}>
      <Onboarding />
    </Suspense>
  )
}

async function Onboarding() {
  const [viewer, universes] = await Promise.all([getViewer(), getPublishedUniverses()])
  if (viewer.onboardingCompleted) redirect(routes.dashboard)
  return <OnboardingFlow universes={universes} />
}
