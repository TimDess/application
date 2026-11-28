import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { BrandLoaderScreen } from '@/components/ui/brand-loader'
import { routes, safeNextPath } from '@/config/routes'
import { OnboardingFlow } from '@/features/onboarding/onboarding-flow'
import { getPublishedUniverses, getViewer } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Bienvenue' }

export default function OnboardingPage({ searchParams }: PageProps<'/onboarding'>) {
  return (
    <Suspense fallback={<BrandLoaderScreen />}>
      <Onboarding searchParams={searchParams} />
    </Suspense>
  )
}

async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [viewer, universes, params] = await Promise.all([
    getViewer(),
    getPublishedUniverses(),
    searchParams,
  ])
  const next = safeNextPath(typeof params.next === 'string' ? params.next : null, routes.dashboard)
  if (viewer.onboardingCompleted) redirect(next)
  return <OnboardingFlow universes={universes} next={next} />
}
