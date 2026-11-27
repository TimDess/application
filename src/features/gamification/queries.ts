import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { parseProgress } from './parse'

/** The signed-in user's XP, level, streak and day, computed by Postgres. */
export const getMyProgress = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_progress')
  if (error) throw new Error('Impossible de charger ta progression.')
  return parseProgress(data)
})
