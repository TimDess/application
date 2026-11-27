import { Lock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import { LessonPlayer } from '@/components/learning/lesson-player'
import { Button } from '@/components/ui/button'
import { coursePath } from '@/config/routes'
import { getLessonForPlay } from '@/features/learning/queries'
import { requireUser } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Leçon' }

export default function LessonPage({ params }: PageProps<'/lecon/[slug]'>) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 py-10">
          <PageSkeleton />
        </div>
      }
    >
      <Lesson params={params} />
    </Suspense>
  )
}

async function Lesson({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  await requireUser()
  const lesson = await getLessonForPlay(slug)
  if (!lesson) notFound()

  if (lesson.status === 'locked') {
    return (
      <main
        id="contenu"
        className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-4 text-center"
      >
        <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-muted">
          <Lock className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-title">Leçon verrouillée</h1>
          <p className="text-body text-muted">
            Termine la leçon précédente du parcours pour débloquer « {lesson.title} ».
          </p>
        </div>
        <Button asChild>
          <Link href={coursePath(lesson.course.slug)}>Voir le parcours</Link>
        </Button>
      </main>
    )
  }

  return <LessonPlayer lesson={lesson} />
}
