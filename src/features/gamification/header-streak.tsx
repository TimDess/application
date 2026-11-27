import Link from 'next/link'
import { routes } from '@/config/routes'
import { getSessionUser } from '@/lib/auth/session'
import { streakDays } from './labels'
import { getMyProgress } from './queries'
import { StreakFlame } from './streak-flame'

/** Compact streak chip for the mobile header. Renders nothing when signed out. */
export async function HeaderStreak() {
  const user = await getSessionUser()
  if (!user) return null
  const progress = await getMyProgress()
  const n = progress.streak.current
  return (
    <Link
      href={routes.dashboard}
      className="flex h-10 items-center gap-1.5 rounded-full px-3 text-body font-semibold text-ink hover:bg-surface-2"
      aria-label={n > 0 ? `Série de ${streakDays(n)}` : 'Pas encore de série'}
    >
      <StreakFlame lit={n > 0} className="size-5" />
      <span className="tabular" aria-hidden="true">
        {n}
      </span>
    </Link>
  )
}
