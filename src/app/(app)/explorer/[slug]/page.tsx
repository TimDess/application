import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Progress } from '@/components/ui/progress'
import { courseLevels } from '@/config/product'
import { coursePath, routes } from '@/config/routes'
import { getUniverseWithCourses } from '@/features/learning/queries'
import { UniverseCover } from '@/features/universes/universe-tile'
import { universeStyle } from '@/features/universes/universe-style'

export const metadata: Metadata = { title: 'Univers' }

export default function UniversePage({ params }: PageProps<'/explorer/[slug]'>) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Universe params={params} />
    </Suspense>
  )
}

async function Universe({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const universe = await getUniverseWithCourses(slug)
  if (!universe) notFound()

  return (
    <div className="universe-scope flex flex-col gap-8" style={universeStyle(universe)}>
      <Link
        href={routes.explore}
        className="inline-flex items-center gap-1.5 self-start text-body text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Explorer
      </Link>
      <header className="flex items-start gap-4">
        <UniverseCover universe={universe} size="lg" />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-title lg:text-[1.75rem]">{universe.name}</h1>
          <p className="text-body text-muted">{universe.description}</p>
        </div>
      </header>

      <section aria-labelledby="parcours" className="flex flex-col gap-3">
        <h2 id="parcours" className="text-heading">
          Parcours
        </h2>
        {universe.courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Parcours en préparation"
            description="Les premiers parcours de cet univers sont en cours d’écriture et de vérification."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {universe.courses.map((course) => (
              <li key={course.id}>
                <Link
                  href={coursePath(course.slug)}
                  className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-line-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-caption font-semibold text-muted">
                        {course.category} · {courseLevels[course.level]}
                      </p>
                      <p className="font-display text-heading font-semibold text-ink">
                        {course.title}
                      </p>
                      <p className="text-body text-muted">{course.description}</p>
                    </div>
                    <ChevronRight className="mt-1 size-5 shrink-0 text-muted" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress
                      value={course.completedLessons}
                      max={course.lessonCount}
                      label={`Progression : ${course.title}`}
                      barClassName="bg-(--uni)"
                    />
                    <span className="tabular shrink-0 text-caption text-muted">
                      {course.completedLessons}/{course.lessonCount}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
