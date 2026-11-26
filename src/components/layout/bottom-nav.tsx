'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { isActive, primaryNav } from './nav-items'

/** Mobile tab bar (hidden on large screens, where the sidebar takes over). */
export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {primaryNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] transition-colors',
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
