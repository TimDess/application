import { ChevronRight, Star } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import { universePath } from '@/config/routes'
import { UniverseCover } from '@/features/universes/universe-tile'
import { universeStyle } from '@/features/universes/universe-style'
import { getPublishedUniverses, getViewer } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Explorer' }

export default function ExplorePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Explore />
    </Suspense>
  )
}

async function Explore() {
  const [universes, viewer] = await Promise.all([getPublishedUniverses(), getViewer()])
  const favorites = new Set(viewer.favorites.map((f) => f.slug))
  const supabase = await createClient()
  const { data: courses } = await supabase
    .from('courses')
    .select('id, categories (universes (slug))')
  const courseCount = new Map<string, number>()
  for (const c of courses ?? []) {
    const s = c.categories?.universes?.slug
    if (s) courseCount.set(s, (courseCount.get(s) ?? 0) + 1)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Explorer"
        description="Tous les univers de Kulto. Les parcours arrivent univers par univers."
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {universes.map((u) => (
          <li key={u.slug}>
            <Link
              href={universePath(u.slug)}
              className="universe-scope flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-line-strong"
              style={universeStyle(u)}
            >
              <div className="flex items-start justify-between gap-3">
                <UniverseCover universe={u} />
                {favorites.has(u.slug) ? (
                  <span className="inline-flex items-center gap-1 text-caption font-semibold text-accent-text">
                    <Star className="size-3.5 fill-current" aria-hidden="true" />
                    Favori
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-heading">{u.name}</h2>
                <p className="text-body text-muted">{u.description}</p>
              </div>
              <p className="mt-auto flex items-center justify-between text-caption text-muted">
                {courseCount.get(u.slug)
                  ? `${courseCount.get(u.slug)} parcours`
                  : 'Parcours en préparation'}
                <ChevronRight className="size-4" aria-hidden="true" />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
