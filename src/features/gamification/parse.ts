import { z } from 'zod'
import type { Progress, Rewards } from './types'

const reason = z.enum([
  'correct_answer',
  'lesson_completed',
  'lesson_perfect',
  'chapter_completed',
  'exam_passed',
])

const rewardsSchema = z.object({
  items: z.array(z.object({ reason, amount: z.number().int() })),
  xp: z.number().int(),
  total_xp_before: z.number().int(),
  total_xp_after: z.number().int(),
  level_before: z.number().int(),
  level_after: z.number().int(),
  level_floor_xp: z.number().int(),
  next_level_xp: z.number().int(),
  previous_floor_xp: z.number().int(),
  previous_next_xp: z.number().int(),
  universe_level_before: z.number().int(),
  universe_level_after: z.number().int(),
  goal_xp: z.number().int(),
  today_xp_before: z.number().int(),
  today_xp_after: z.number().int(),
  streak: z.object({
    before: z.number().int(),
    after: z.number().int(),
    extended: z.boolean(),
    freezes_used: z.number().int(),
    freeze_earned: z.boolean(),
    freezes: z.number().int(),
  }),
})

/** Maps the rewards JSON returned by complete_lesson(); null when absent or malformed. */
export function parseRewards(raw: unknown): Rewards | null {
  const r = rewardsSchema.safeParse(raw)
  if (!r.success) return null
  const d = r.data
  return {
    items: d.items,
    xp: d.xp,
    totalXpBefore: d.total_xp_before,
    totalXpAfter: d.total_xp_after,
    levelBefore: d.level_before,
    levelAfter: d.level_after,
    levelFloorXp: d.level_floor_xp,
    nextLevelXp: d.next_level_xp,
    previousFloorXp: d.previous_floor_xp,
    previousNextXp: d.previous_next_xp,
    universeLevelBefore: d.universe_level_before,
    universeLevelAfter: d.universe_level_after,
    goalXp: d.goal_xp,
    todayXpBefore: d.today_xp_before,
    todayXpAfter: d.today_xp_after,
    streak: {
      before: d.streak.before,
      after: d.streak.after,
      extended: d.streak.extended,
      freezesUsed: d.streak.freezes_used,
      freezeEarned: d.streak.freeze_earned,
      freezes: d.streak.freezes,
    },
  }
}

const progressSchema = z.object({
  total_xp: z.number().int(),
  level: z.number().int(),
  level_floor_xp: z.number().int(),
  next_level_xp: z.number().int(),
  lessons_completed: z.number().int(),
  today: z.object({
    day: z.string(),
    xp: z.number().int(),
    lessons: z.number().int(),
    goal_xp: z.number().int(),
  }),
  streak: z.object({
    current: z.number().int(),
    longest: z.number().int(),
    freezes: z.number().int(),
    status: z.enum(['done', 'pending', 'protected', 'paused', 'none']),
  }),
  week: z.array(z.object({ day: z.string(), active: z.boolean(), frozen: z.boolean() })),
  universes: z.array(
    z.object({
      slug: z.string(),
      xp: z.number().int(),
      level: z.number().int(),
      level_floor_xp: z.number().int(),
      next_level_xp: z.number().int(),
    }),
  ),
})

/** Maps get_my_progress(). Throws on an unexpected shape (a contract bug, not user input). */
export function parseProgress(raw: unknown): Progress {
  const d = progressSchema.parse(raw)
  return {
    totalXp: d.total_xp,
    level: d.level,
    floorXp: d.level_floor_xp,
    nextXp: d.next_level_xp,
    lessonsCompleted: d.lessons_completed,
    today: { day: d.today.day, xp: d.today.xp, lessons: d.today.lessons, goalXp: d.today.goal_xp },
    streak: d.streak,
    week: d.week,
    universes: d.universes.map((u) => ({
      slug: u.slug,
      xp: u.xp,
      level: u.level,
      floorXp: u.level_floor_xp,
      nextXp: u.next_level_xp,
    })),
  }
}

/** Share of the current level already earned, between 0 and 1. */
export function levelRatio(xp: number, floorXp: number, nextXp: number): number {
  if (nextXp <= floorXp) return 1
  return Math.min(1, Math.max(0, (xp - floorXp) / (nextXp - floorXp)))
}
