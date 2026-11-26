import { NextResponse, type NextRequest } from 'next/server'
import { routes, safeNextPath } from '@/config/routes'
import { createClient } from '@/lib/supabase/server'

/** PKCE callback (default Supabase email templates and future OAuth providers). */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'), routes.dashboard)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, request.url))
  }

  return NextResponse.redirect(new URL(routes.authError, request.url))
}
