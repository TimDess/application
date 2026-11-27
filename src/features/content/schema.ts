/**
 * Content-as-code schema. Every course lives in content/<universe>/<course>.json,
 * is validated here, then compiled to idempotent SQL by scripts/content-build.ts.
 * Relative imports only: this file is also run by Node directly (type stripping).
 */
import { z } from 'zod'

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug en minuscules et tirets')
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date AAAA-MM-JJ')

const evolving = {
  isEvolving: z.boolean().default(false),
  validAsOf: isoDate.optional(),
}

const block = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string().min(5).max(500) }),
  z.object({
    type: z.literal('keyfigure'),
    value: z.string().min(1).max(20),
    label: z.string().min(2).max(120),
  }),
  z.object({ type: z.literal('list'), items: z.array(z.string().min(2).max(200)).min(2).max(8) }),
  z.object({
    type: z.literal('swatches'),
    items: z
      .array(
        z.object({
          label: z.string().min(1).max(40),
          color: z.string().regex(/^#[0-9A-F]{6}$/),
          text: z.string().max(120),
        }),
      )
      .min(2)
      .max(6),
  }),
  z.object({ type: z.literal('fact'), text: z.string().min(5).max(300) }),
])

const questionBase = {
  key: slug,
  prompt: z.string().min(5).max(300),
  difficulty: z.number().int().min(1).max(5).default(2),
  knowledge: z.array(slug).min(1),
  explanation: z.string().min(5).max(600),
  ...evolving,
}

export const questionSchema = z.discriminatedUnion('format', [
  z.object({
    ...questionBase,
    format: z.literal('quiz'),
    options: z
      .array(z.object({ label: z.string().min(1).max(120), correct: z.boolean().default(false) }))
      .min(2)
      .max(6)
      .refine((o) => o.some((x) => x.correct), 'au moins une bonne réponse'),
  }),
  z.object({ ...questionBase, format: z.literal('true_false'), answer: z.boolean() }),
  z.object({
    ...questionBase,
    format: z.literal('match'),
    pairs: z
      .array(z.object({ left: z.string().min(1).max(80), right: z.string().min(1).max(80) }))
      .min(3)
      .max(6),
  }),
  z.object({
    ...questionBase,
    format: z.literal('timeline'),
    items: z
      .array(z.object({ label: z.string().min(2).max(120), date: z.string().min(4).max(20) }))
      .min(3)
      .max(6),
  }),
  z.object({
    ...questionBase,
    format: z.literal('guess_year'),
    year: z.number().int().min(1800).max(2100),
    tolerance: z.number().int().min(0).max(10).default(0),
    min: z.number().int(),
    max: z.number().int(),
  }),
])

export type ContentQuestion = z.infer<typeof questionSchema>

export const courseFileSchema = z
  .object({
    universe: slug,
    status: z.enum(['draft', 'in_review', 'published']),
    category: z.object({
      slug,
      name: z.string().min(2).max(60),
      description: z.string().max(400).default(''),
    }),
    course: z.object({
      slug,
      title: z.string().min(2).max(80),
      description: z.string().max(600),
      level: z.enum(['decouverte', 'debutant', 'intermediaire', 'avance', 'expert', 'maitre']),
    }),
    knowledge: z.array(
      z.object({
        key: slug,
        title: z.string().min(2).max(120),
        summary: z.string().max(400).default(''),
        verifiedAt: isoDate.optional(),
        sourceUrl: z.string().url().startsWith('https://').optional(),
        ...evolving,
      }),
    ),
    questions: z.array(questionSchema),
    chapters: z
      .array(
        z.object({
          title: z.string().min(2).max(80),
          description: z.string().max(400).default(''),
          lessons: z
            .array(
              z.object({
                slug,
                title: z.string().min(2).max(80),
                objective: z.string().max(200),
                kind: z.enum(['standard', 'exam']).default('standard'),
                minutes: z.number().int().min(1).max(30).default(4),
                cards: z
                  .array(
                    z.object({
                      title: z.string().min(2).max(80),
                      blocks: z.array(block).min(1).max(5),
                    }),
                  )
                  .max(5),
                questions: z.array(slug).min(3).max(12),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
  })
  .superRefine((file, ctx) => {
    const knowledge = new Set(file.knowledge.map((k) => k.key))
    const questions = new Set<string>()
    for (const k of file.knowledge) {
      if (k.isEvolving && !k.validAsOf)
        ctx.addIssue({ code: 'custom', message: `notion ${k.key} : fait évolutif sans validAsOf` })
    }
    for (const q of file.questions) {
      if (questions.has(q.key))
        ctx.addIssue({ code: 'custom', message: `question en double : ${q.key}` })
      questions.add(q.key)
      if (q.isEvolving && !q.validAsOf)
        ctx.addIssue({
          code: 'custom',
          message: `question ${q.key} : fait évolutif sans validAsOf`,
        })
      for (const k of q.knowledge) {
        if (!knowledge.has(k))
          ctx.addIssue({ code: 'custom', message: `question ${q.key} : notion inconnue ${k}` })
      }
      if (q.format === 'guess_year' && (q.year < q.min || q.year > q.max)) {
        ctx.addIssue({ code: 'custom', message: `question ${q.key} : année hors bornes` })
      }
    }
    const lessonSlugs = new Set<string>()
    for (const ch of file.chapters) {
      for (const l of ch.lessons) {
        if (lessonSlugs.has(l.slug))
          ctx.addIssue({ code: 'custom', message: `leçon en double : ${l.slug}` })
        lessonSlugs.add(l.slug)
        if (l.kind === 'standard' && l.cards.length === 0)
          ctx.addIssue({ code: 'custom', message: `leçon ${l.slug} : aucune fiche` })
        if (new Set(l.questions).size !== l.questions.length)
          ctx.addIssue({ code: 'custom', message: `leçon ${l.slug} : question répétée` })
        for (const q of l.questions) {
          if (!questions.has(q))
            ctx.addIssue({ code: 'custom', message: `leçon ${l.slug} : question inconnue ${q}` })
        }
      }
    }
  })

export type CourseFile = z.infer<typeof courseFileSchema>

/** Public card blocks, as stored in learning_cards.blocks and rendered by the lesson player. */
export type CardBlock = z.infer<typeof block>
