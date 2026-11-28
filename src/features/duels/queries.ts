import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { parseDuel, parseDuels } from './parse'

export const getMyDuels = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_duels')
  if (error) throw new Error('Impossible de charger tes duels.')
  return parseDuels(data)
})

export const getDuel = cache(async (id: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_duel', { p_duel: id })
  if (error) return null
  return parseDuel(data)
})

export const getDuelInvite = cache(async (code: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_duel_invite', { p_code: code })
  if (error || !data) return null
  const d = data as {
    creator: { username: string | null; avatar_key: string } | null
    joinable: boolean
    duel_id: string | null
  }
  return {
    creatorName: d.creator?.username ?? null,
    creatorAvatar: d.creator?.avatar_key ?? 'soleil',
    joinable: d.joinable,
    duelId: d.duel_id,
  }
})
