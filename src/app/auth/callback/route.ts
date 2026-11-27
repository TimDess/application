import { NextResponse, type NextRequest } from 'next/server'
import { routes, safeNextPath } from '@/config/routes'
import { createClient } from '@/lib/supabase/server'

/**
 * PKCE callback (default Supabase email templates and future OAuth providers).
 *
 * With the default templates, Supabase verifies the email link *before* redirecting here
 * with a code. Exchanging that code needs the PKCE verifier stored in the browser that
 * started the flow: when the email is opened in another browser (phone mail app, other
 * device), the exchange fails although the address is already confirmed.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'), routes.dashboard)
  const isSignUp = next === routes.onboarding

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, request.url))
    // Sign-up link opened in another browser: the address is confirmed, the user just signs in.
    if (isSignUp) {
      return NextResponse.redirect(new URL(`${routes.signIn}?confirme=1`, request.url))
    }
    return NextResponse.redirect(new URL(`${routes.authError}?raison=navigateur`, request.url))
  }

  return NextResponse.redirect(new URL(routes.authError, request.url))
}
