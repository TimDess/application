import { z } from 'zod'

/** Shape of an answer sent to the scoring RPCs (validated before reaching Postgres). */
export const answerSchema = z.union([
  z.object({ selected: z.array(z.string().max(20)).max(10) }).strict(),
  z.object({ value: z.boolean() }).strict(),
  z.object({ pairs: z.record(z.string().max(20), z.string().max(20)) }).strict(),
  z.object({ order: z.array(z.string().max(20)).max(10) }).strict(),
  z.object({ year: z.number().int().min(-9999).max(9999) }).strict(),
])
