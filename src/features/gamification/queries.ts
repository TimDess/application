import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { parseProgress } from './parse'

/** The signed-in user's XP, level, streak and day, computed by Postgres. */
export const getMyProgress = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_progress')
  if (error) throw new Error('Impossible de charger ta progression.')
  return parseProgress(data)
})

const dnaSchema = z.array(
  z.object({
    slug: z.string(),
    score: z.number(),
    seen: z.number(),
    mastered: z.number(),
    available: z.number(),
  }),
)

/** Mastery per universe (0-100), computed by Postgres from the Leitner boxes. */
export const getMyDna = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_dna')
  if (error) throw new Error('Impossible de charger ton ADN culturel.')
  return dnaSchema.parse(data)
})

/** The badge catalog with the signed-in user's grants. */
export const getMyBadges = cache(async () => {
  const supabase = await createClient()
  const [catalog, earned] = await Promise.all([
    supabase
      .from('badges')
      .select('key, family, rarity, title, description, sort_order')
      .order('sort_order'),
    supabase.from('user_badges').select('badge_key, earned_at'),
  ])
  if (catalog.error || earned.error) throw new Error('Impossible de charger tes badges.')
  const earnedAt = new Map(earned.data.map((e) => [e.badge_key, e.earned_at]))
  return catalog.data.map((b) => ({ ...b, earnedAt: earnedAt.get(b.key) ?? null }))
})
