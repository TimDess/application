import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { courseFileSchema } from './schema'

const CONTENT = join(process.cwd(), 'content')
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : name.endsWith('.json') ? [path] : []
  })

describe('course content', () => {
  it.each(files(CONTENT))('%s is valid', (path) => {
    const parsed = courseFileSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')))
    expect(parsed.success ? [] : parsed.error.issues.map((i) => i.message)).toEqual([])
  })

  it('keeps AI-written courses in review unless validated', () => {
    for (const path of files(CONTENT)) {
      const file = JSON.parse(readFileSync(path, 'utf8')) as {
        status: string
        course: { slug: string }
      }
      if (file.course.slug !== 'comprendre-la-f1') expect(file.status, path).not.toBe('published')
    }
  })

  it('refuses a review-only question inside a lesson of a published course', () => {
    const base = JSON.parse(
      readFileSync(join(CONTENT, 'sport-automobile/comprendre-la-f1.json'), 'utf8'),
    ) as {
      questions: { key: string; status?: string }[]
      chapters: { lessons: { questions: string[] }[] }[]
    }
    const first = base.chapters[0]!.lessons[0]!.questions[0]!
    base.questions = base.questions.map((q) =>
      q.key === first ? { ...q, status: 'in_review' } : q,
    )
    const parsed = courseFileSchema.safeParse(base)
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues.some((i) => i.message.includes('en relecture'))).toBe(true)
  })
})
