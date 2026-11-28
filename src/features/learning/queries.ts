import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { CardBlock } from '@/features/content/schema'
import type { LessonStatus, PlayCard, PlayQuestion } from './types'

type UniverseRef = {
  slug: string
  name: string
  color_light: string
  color_dark: string
  icon_key: string
  tagline: string
}

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position

/** A universe with its visible courses and the viewer's progress on each. */
export const getUniverseWithCourses = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data: universe, error } = await supabase
    .from('universes')
    .select(
      'id, slug, name, tagline, description, color_light, color_dark, icon_key, categories (id, slug, name, description, sort_order, courses (id, slug, title, description, level, sort_order, chapters (id, lessons (id))))',
    )
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error('Impossible de charger cet univers.')
  if (!universe) return null

  // Easiest courses first, so a newcomer always starts with an accessible one.
  const courses = universe.categories
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((cat) =>
      cat.courses
        .sort((a, b) => levelRank(a.level) - levelRank(b.level) || a.sort_order - b.sort_order)
        .map((c) => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          description: c.description,
          level: c.level,
          category: cat.name,
          lessonCount: c.chapters.reduce((n, ch) => n + ch.lessons.length, 0),
        })),
    )
    .sort((a, b) => levelRank(a.level) - levelRank(b.level))

  const progress = courses.length
    ? ((
        await supabase
          .from('user_course_progress')
          .select('course_id, completed_lessons')
          .in(
            'course_id',
            courses.map((c) => c.id),
          )
      ).data ?? [])
    : []
  const done = new Map(progress.map((p) => [p.course_id, p.completed_lessons]))

  return {
    ...universe,
    courses: courses.map((c) => ({ ...c, completedLessons: done.get(c.id) ?? 0 })),
  }
})

export type OutlineLesson = {
  id: string
  slug: string
  title: string
  objective: string
  kind: 'standard' | 'exam'
  minutes: number
  status: LessonStatus
  bestScore: number | null
}

/** A course with chapters, lessons and the viewer's status on each lesson (same unlock rule as the database). */
export const getCourseOutline = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data: course, error } = await supabase
    .from('courses')
    .select(
      'id, slug, title, description, level, status, categories (name, universes (slug, name, tagline, color_light, color_dark, icon_key)), chapters (id, position, title, description, lessons (id, slug, position, title, objective, kind, estimated_minutes))',
    )
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error('Impossible de charger ce parcours.')
  if (!course || !course.categories) return null

  const chapters = [...course.chapters]
    .sort(byPosition)
    .map((ch) => ({ ...ch, lessons: [...ch.lessons].sort(byPosition) }))
  const flat = chapters.flatMap((ch) => ch.lessons)
  const { data: progress } = flat.length
    ? await supabase
        .from('user_lesson_progress')
        .select('lesson_id, status, best_score')
        .in(
          'lesson_id',
          flat.map((l) => l.id),
        )
    : { data: [] }
  const byLesson = new Map((progress ?? []).map((p) => [p.lesson_id, p]))

  let previousCompleted = true
  const status = new Map<string, LessonStatus>()
  for (const l of flat) {
    const completed = byLesson.get(l.id)?.status === 'completed'
    status.set(l.id, completed ? 'completed' : previousCompleted ? 'available' : 'locked')
    previousCompleted = completed
  }

  const outlineChapters = chapters.map((ch) => ({
    id: ch.id,
    position: ch.position,
    title: ch.title,
    description: ch.description,
    lessons: ch.lessons.map((l): OutlineLesson => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      objective: l.objective,
      kind: l.kind,
      minutes: l.estimated_minutes,
      status: status.get(l.id) ?? 'locked',
      bestScore: byLesson.get(l.id)?.best_score ?? null,
    })),
  }))
  const lessons = outlineChapters.flatMap((c) => c.lessons)

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    level: course.level,
    inReview: course.status === 'in_review',
    category: course.categories.name,
    universe: course.categories.universes as UniverseRef,
    chapters: outlineChapters,
    lessons,
    completedCount: lessons.filter((l) => l.status === 'completed').length,
    nextLesson: lessons.find((l) => l.status === 'available') ?? null,
  }
})

export type CourseOutline = NonNullable<Awaited<ReturnType<typeof getCourseOutline>>>

/** Everything the lesson player needs. Public data only: solutions never leave the database. */
export const getLessonForPlay = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select(
      'id, slug, title, objective, kind, estimated_minutes, chapters (title, courses (slug)), learning_cards (position, title, blocks), lesson_items (position, questions (id, format, prompt, payload, difficulty))',
    )
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error('Impossible de charger cette leçon.')
  if (!lesson || !lesson.chapters?.courses) return null

  const outline = await getCourseOutline(lesson.chapters.courses.slug)
  if (!outline) return null
  const index = outline.lessons.findIndex((l) => l.id === lesson.id)

  const cards: PlayCard[] = [...lesson.learning_cards]
    .sort(byPosition)
    .map((c) => ({ position: c.position, title: c.title, blocks: c.blocks as CardBlock[] }))

  const questions: PlayQuestion[] = [...lesson.lesson_items].sort(byPosition).flatMap((item) => {
    const q = item.questions
    if (!q) return []
    return [
      {
        id: q.id,
        prompt: q.prompt,
        difficulty: q.difficulty,
        format: q.format,
        ...(q.payload as object),
      } as PlayQuestion,
    ]
  })

  return {
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    objective: lesson.objective,
    kind: lesson.kind,
    minutes: lesson.estimated_minutes,
    chapterTitle: lesson.chapters.title,
    status: outline.lessons[index]?.status ?? 'locked',
    nextLesson: outline.lessons[index + 1] ?? null,
    course: { slug: outline.slug, title: outline.title, universe: outline.universe },
    cards,
    questions,
  }
})

export type PlayableLesson = NonNullable<Awaited<ReturnType<typeof getLessonForPlay>>>

/**
 * What to propose on the dashboard: the course the viewer last played, otherwise the first
 * course in their favorite universes, otherwise any available course (discovery).
 */
const levels = ['decouverte', 'debutant', 'intermediaire', 'avance', 'expert', 'maitre']
function levelRank(level: string) {
  return levels.indexOf(level)
}

export const getContinueCourse = cache(async (favoriteSlugs: string[]) => {
  const supabase = await createClient()
  const { data: last } = await supabase
    .from('user_course_progress')
    .select('updated_at, courses (slug)')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let slug = last?.courses?.slug ?? null
  let reason: 'resume' | 'favorite' | 'discover' = 'resume'

  if (!slug) {
    const { data: courses } = await supabase
      .from('courses')
      .select('slug, sort_order, categories (universes (slug))')
      .order('level')
      .order('sort_order')
    const list = courses ?? []
    // The easiest course of the first favorite universe that has one.
    const favorite = favoriteSlugs
      .map((fav) => list.find((c) => c.categories?.universes?.slug === fav))
      .find(Boolean)
    slug = favorite?.slug ?? list[0]?.slug ?? null
    reason = favorite ? 'favorite' : 'discover'
  }

  if (!slug) return null
  const outline = await getCourseOutline(slug)
  return outline ? { outline, reason } : null
})
