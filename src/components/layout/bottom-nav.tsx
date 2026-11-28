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
  const activeIndex = primaryNav.findIndex((item) => isActive(pathname, item.href))
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-36 bg-linear-to-t from-(--bg-deep) via-(--bg-deep)/85 to-transparent"
      />
      <ul className="glass-nav relative mx-auto grid h-[68px] max-w-lg grid-cols-5 items-center rounded-[26px] px-1.5">
        {/* The highlight slides between tabs with a spring (a single shared element). */}
        <li
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-[7px] left-1.5 h-[54px] w-[calc((100%-0.75rem)/5)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]',
            activeIndex < 0 && 'opacity-0',
          )}
          style={{ transform: `translateX(${Math.max(activeIndex, 0) * 100}%)` }}
        >
          <span className="mx-auto block h-full max-w-[72px] rounded-[18px] bg-accent/15" />
        </li>
        {primaryNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <li key={href} className="relative">
              <Link
                href={href}
                data-tap
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'mx-auto flex h-[54px] w-full max-w-[72px] flex-col items-center justify-center gap-1 rounded-[18px] text-[0.75rem] transition-colors duration-(--duration-base)',
                  '[&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-[cubic-bezier(0.34,1.56,0.64,1)] active:[&_svg]:scale-[0.82] active:[&_svg]:duration-75',
                  active ? 'font-semibold text-accent-text' : 'text-muted hover:text-ink',
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
