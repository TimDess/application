import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const division = z.enum(['bronze', 'argent', 'or', 'platine', 'diamant', 'legende'])

const leagueSchema = z.object({
  guest: z.boolean(),
  division,
  week_start: z.string(),
  ends_at: z.string(),
  seconds_left: z.number().int(),
  joined: z.boolean(),
  promote_count: z.number().int(),
  relegate_count: z.number().int(),
  counted_duels: z.number().int(),
  my_duels: z.number().int(),
  last_week: z
    .object({
      week_start: z.string(),
      division,
      rank: z.number().int().nullable(),
      points: z.number().int().nullable(),
      outcome: z.enum(['promoted', 'stayed', 'relegated']),
    })
    .nullable(),
  standings: z.array(
    z.object({
      rank: z.number().int(),
      points: z.number().int(),
      is_me: z.boolean(),
      username: z.string().nullable(),
      avatar_key: z.string(),
    }),
  ),
})

export type League = z.infer<typeof leagueSchema>

export const getMyLeague = cache(async (): Promise<League> => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_league')
  if (error) throw new Error('Impossible de charger ta ligue.')
  return leagueSchema.parse(data)
})

export const getMyDivision = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.from('player_divisions').select('division').maybeSingle()
  return data?.division ?? 'bronze'
})
