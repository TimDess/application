'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { isActive, primaryNav } from './nav-items'

/** Mobile tab bar (hidden on large screens, where the sidebar takes over). */
export function BottomNav() {
  return <BottomNavView pathname={usePathname()} />
}

/** Pure view, also used as the Suspense fallback (no active tab) on dynamic routes. */
export function BottomNavView({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-36 bg-linear-to-t from-(--bg-deep) via-(--bg-deep)/85 to-transparent"
      />
      <ul className="glass-nav mx-auto grid h-[68px] max-w-lg grid-cols-5 items-center rounded-[26px] px-1.5">
        {primaryNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'mx-auto flex h-[54px] w-full max-w-[72px] flex-col items-center justify-center gap-1 rounded-[18px] text-[0.6875rem] transition-colors duration-(--duration-base)',
                  active
                    ? 'bg-accent/15 font-semibold text-accent-text'
                    : 'text-muted hover:text-ink',
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
