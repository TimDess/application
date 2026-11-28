import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { BrandLoaderScreen } from '@/components/ui/brand-loader'
import { DuelPlayer } from '@/features/duels/duel-player'
import { getDuel } from '@/features/duels/queries'
import { getViewer } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Duel' }

export default function DuelPage({ params }: PageProps<'/duels/[id]'>) {
  return (
    <Suspense fallback={<BrandLoaderScreen label="Préparation du duel" />}>
      <Duel params={params} />
    </Suspense>
  )
}

async function Duel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const viewer = await getViewer()
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const duel = await getDuel(id)
  if (!duel) notFound()
  return (
    <DuelPlayer
      key={duel.id}
      initial={duel}
      me={{ name: viewer.username ?? 'Toi', avatarKey: viewer.avatarKey }}
    />
  )
}
