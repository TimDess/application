import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { connection } from 'next/server'
import type { Database } from '@/types/database'
import { supabasePublicEnv } from './env'

/**
 * Supabase client bound to the current request's auth cookies.
 * Create one per request; never share it. Queries run as the signed-in user, so RLS applies.
 */
export async function createClient() {
  // Session reads must happen at request time, never in a (runtime) prerender:
  // supabase-js checks token expiry with Date.now(), which Cache Components forbids while prerendering.
  await connection()
  const cookieStore = await cookies()
  const { url, key } = supabasePublicEnv()

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options)
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // The proxy (src/proxy.ts) refreshes the session on every navigation.
        }
      },
    },
  })
}
