import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isGuestOnlyPath, isProtectedPath, routes } from '@/config/routes'
import { supabasePublicEnv } from '@/lib/supabase/env'
import type { Database } from '@/types/database'

/**
 * Runs before every page request:
 *  1. refreshes the Supabase session and writes updated auth cookies;
 *  2. performs optimistic redirects (signed-out users away from the app, signed-in users away from auth pages).
 * Real authorization happens server-side (DAL + RLS); this is only routing.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, key } = supabasePublicEnv()

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet)
          response.cookies.set(name, value, options)
        for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, v)
      },
    },
  })

  // getClaims() validates the JWT (and refreshes it when needed). Do not run code between
  // client creation and this call: it can cause random sign-outs.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims?.sub)
  const { pathname, search } = request.nextUrl

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const target = request.nextUrl.clone()
    target.pathname = path
    target.search = ''
    for (const [k, v] of Object.entries(params ?? {})) target.searchParams.set(k, v)
    const redirect = NextResponse.redirect(target)
    for (const c of response.cookies.getAll()) redirect.cookies.set(c)
    return redirect
  }

  if (!signedIn && isProtectedPath(pathname)) {
    return redirectTo(routes.signIn, { next: `${pathname}${search}` })
  }
  if (signedIn && (isGuestOnlyPath(pathname) || pathname === routes.home)) {
    return redirectTo(routes.dashboard)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)',
  ],
}
