import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { routes } from '@/config/routes'
import { getSessionUser } from '@/lib/auth/session'

/** Reminds guests that their progress lives on a temporary account. */
export async function GuestBanner() {
  const user = await getSessionUser()
  if (!user?.isAnonymous) return null
  return (
    <Link
      href={routes.saveAccount}
      className="glass mb-5 flex items-center gap-3 rounded-card border-accent/50 px-4 py-3 text-body text-ink hover:border-accent"
    >
      <ShieldAlert className="size-5 shrink-0 text-accent-text" aria-hidden="true" />
      <span className="flex-1">
        Tu joues en invité. <span className="font-semibold">Crée ton compte</span> pour garder ta
        progression.
      </span>
    </Link>
  )
}
