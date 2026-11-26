'use client'

import { Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/logo'
import { routes } from '@/config/routes'
import { cn } from '@/lib/utils/cn'
import { isActive, primaryNav, type NavItem } from './nav-items'

function SideLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-10 items-center gap-3 rounded-md px-3 text-body transition-colors',
        active
          ? 'bg-surface-2 font-semibold text-ink'
          : 'text-muted hover:bg-surface-2/60 hover:text-ink',
      )}
    >
      <Icon className={cn('size-[18px]', active && 'text-accent-text')} aria-hidden="true" />
      {item.label}
    </Link>
  )
}

/** Desktop sidebar. `userSlot` streams in the signed-in user's chip. */
export function SideNav({ userSlot }: { userSlot: ReactNode }) {
  const pathname = usePathname()
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
      <Link href={routes.dashboard} className="px-3" aria-label="Kulto, accueil">
        <Logo />
      </Link>
      <nav aria-label="Navigation principale" className="mt-8 flex flex-1 flex-col gap-1">
        {primaryNav.map((item) => (
          <SideLink key={item.href} item={item} pathname={pathname} />
        ))}
        <div className="my-3 h-px bg-line" />
        <SideLink
          item={{ href: routes.settings, label: 'Paramètres', icon: Settings }}
          pathname={pathname}
        />
      </nav>
      {userSlot}
    </aside>
  )
}
