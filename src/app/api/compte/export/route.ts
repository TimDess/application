import { NextResponse } from 'next/server'
import { brand } from '@/config/brand'
import { getSessionUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

/** GDPR export: everything stored about the signed-in user, as a JSON download. */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })

  const supabase = await createClient()
  const [
    profile,
    settings,
    onboarding,
    universes,
    authUser,
    lessonProgress,
    courseProgress,
    stats,
    universeStats,
    streak,
    dailyActivity,
    xp,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
    supabase.from('user_onboarding').select('*').eq('user_id', user.id).single(),
    supabase
      .from('user_universe_preferences')
      .select('self_level, is_favorite, created_at, universes (slug, name)')
      .eq('user_id', user.id),
    supabase.auth.getUser(),
    supabase
      .from('user_lesson_progress')
      .select(
        'status, best_score, attempts, first_completed_at, last_completed_at, lessons (slug, title)',
      )
      .eq('user_id', user.id),
    supabase
      .from('user_course_progress')
      .select('completed_lessons, started_at, completed_at, courses (slug, title)')
      .eq('user_id', user.id),
    supabase
      .from('user_stats')
      .select('total_xp, level, lessons_completed')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_universe_stats')
      .select('xp, level, universes (slug, name)')
      .eq('user_id', user.id),
    supabase
      .from('user_streaks')
      .select('current, longest, last_active_day, freezes')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('daily_activity')
      .select('day, xp, lessons_completed, goal_xp, goal_met, frozen')
      .eq('user_id', user.id)
      .order('day'),
    supabase
      .from('xp_transactions')
      .select('amount, reason, source_type, source_id, created_at')
      .eq('user_id', user.id)
      .order('created_at'),
  ])

  const body = {
    exported_at: new Date().toISOString(),
    service: brand.name,
    account: {
      id: user.id,
      email: authUser.data.user?.email ?? null,
      created_at: authUser.data.user?.created_at ?? null,
      email_confirmed_at: authUser.data.user?.email_confirmed_at ?? null,
    },
    profile: profile.data,
    settings: settings.data,
    onboarding: onboarding.data,
    universe_preferences: universes.data,
    learning: { lessons: lessonProgress.data, courses: courseProgress.data },
    gamification: {
      stats: stats.data,
      universes: universeStats.data,
      streak: streak.data,
      daily_activity: dailyActivity.data,
      xp_transactions: xp.data,
    },
  }

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${brand.wordmark}-mes-donnees.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
