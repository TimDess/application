import { ArrowLeft, Check, Lock, Play, Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { courseLevels } from '@/config/product'
import { lessonPath, universePath } from '@/config/routes'
import type { OutlineLesson } from '@/features/learning/queries'
import { getCourseOutline } from '@/features/learning/queries'
import { UniverseArt } from '@/features/universes/universe-art'
import { universeStyle } from '@/features/universes/universe-style'
import { cn } from '@/lib/utils/cn'

export const metadata: Metadata = { title: 'Parcours' }

export default function CoursePage({ params }: PageProps<'/parcours/[slug]'>) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Course params={params} />
    </Suspense>
  )
}

async function Course({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = await getCourseOutline(slug)
  if (!course) notFound()
  const total = course.lessons.length
  const started = course.completedCount > 0

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={universePath(course.universe.slug)}
        className="inline-flex items-center gap-1.5 self-start text-body text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {course.universe.name}
      </Link>

      <header
        className="universe-scope glass flex flex-col overflow-hidden rounded-hero"
        style={universeStyle(course.universe)}
      >
        <div className="relative h-44">
          <UniverseArt
            iconKey={course.universe.icon_key}
            color="var(--uni)"
            className="absolute inset-0"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent to-(--glass-bg-strong)"
            aria-hidden="true"
          />
          <div className="absolute inset-x-5 bottom-4 flex flex-col gap-1">
            <p className="text-caption font-semibold text-(--uni)">
              {course.category} · {courseLevels[course.level]} · {total} leçons
            </p>
            <h1 className="font-display text-[2rem] leading-[1.02] font-bold tracking-[-0.03em]">
              {course.title}
            </h1>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-5 pt-3">
          <p className="text-body text-muted">{course.description}</p>
          {course.inReview ? (
            <p className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-caption text-ink">
              Contenu en vérification : visible seulement par les relecteurs avant publication.
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            <div className="tabular flex justify-between text-caption text-muted">
              <span>Progression</span>
              <span>
                {course.completedCount}/{total} leçons
              </span>
            </div>
            <Progress
              value={course.completedCount}
              max={total}
              label="Progression du parcours"
              barClassName="bg-(--uni)"
            />
          </div>
          {course.nextLesson ? (
            <Button asChild size="lg">
              <Link href={lessonPath(course.nextLesson.slug)}>
                {started ? 'Continuer' : 'Commencer'} : {course.nextLesson.title}
              </Link>
            </Button>
          ) : (
            <p className="flex items-center gap-2 text-body font-semibold text-ink">
              <Trophy className="size-5 text-accent-text" aria-hidden="true" />
              Parcours terminé. Tu peux rejouer chaque leçon.
            </p>
          )}
        </div>
      </header>

      {course.chapters.map((chapter) => (
        <section
          key={chapter.id}
          aria-labelledby={`ch-${chapter.position}`}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-0.5">
            <p className="text-caption font-semibold text-muted">Chapitre {chapter.position}</p>
            <h2 id={`ch-${chapter.position}`} className="text-heading">
              {chapter.title}
            </h2>
          </div>
          <ol className="flex flex-col gap-2">
            {chapter.lessons.map((lesson) => (
              <li key={lesson.id}>
                <LessonRow lesson={lesson} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

function LessonRow({ lesson }: { lesson: OutlineLesson }) {
  const locked = lesson.status === 'locked'
  const content = (
    <>
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-full border',
          lesson.status === 'completed' && 'border-success bg-success/15 text-success',
          lesson.status === 'available' && 'border-accent bg-accent text-on-accent',
          locked && 'border-line bg-surface-2 text-muted',
        )}
        aria-hidden="true"
      >
        {lesson.status === 'completed' ? (
          <Check className="size-5" />
        ) : locked ? (
          <Lock className="size-4" />
        ) : (
          <Play className="size-4" />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className={cn('text-body font-semibold', locked ? 'text-muted' : 'text-ink')}>
            {lesson.title}
          </span>
          {lesson.kind === 'exam' ? (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-caption font-semibold text-accent-text">
              Épreuve
            </span>
          ) : null}
        </span>
        <span className="text-caption text-muted">
          {locked
            ? 'Termine la leçon précédente pour la débloquer'
            : `${lesson.minutes} min · ${lesson.objective}`}
        </span>
      </span>
      <span className="tabular shrink-0 text-caption text-muted">
        {lesson.status === 'completed'
          ? `${lesson.bestScore ?? 0} %`
          : lesson.status === 'available'
            ? 'À faire'
            : ''}
        <span className="sr-only">
          {lesson.status === 'completed' ? ', terminée' : locked ? ', verrouillée' : ', disponible'}
        </span>
      </span>
    </>
  )
  const base = 'glass flex items-center gap-3 rounded-card p-3.5'
  if (locked) return <div className={cn(base, 'border-line opacity-80')}>{content}</div>
  return (
    <Link
      href={lessonPath(lesson.slug)}
      className={cn(
        base,
        lesson.status === 'available' ? 'border-accent/60' : 'border-line',
        'transition-colors hover:border-line-strong',
      )}
    >
      {content}
    </Link>
  )
}
