import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { supabasePublicEnv } from './env'

/**
 * Privileged client (secret key, bypasses RLS). Server-only.
 * Use it only for operations the user cannot perform with their own rights,
 * after verifying who they are (today: account deletion).
 */
export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!secret) throw new Error('Missing SUPABASE_SECRET_KEY (server environment only).')
  const { url } = supabasePublicEnv()
  return createClient<Database>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

/** Stateless client used to check a password without touching the request cookies. */
export function createVerifierClient() {
  const { url, key } = supabasePublicEnv()
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
