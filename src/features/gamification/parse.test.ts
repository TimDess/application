import { describe, expect, it } from 'vitest'
import { levelRatio, parseProgress, parseRewards } from './parse'

const rawRewards = {
  items: [
    { reason: 'correct_answer', amount: 20 },
    { reason: 'lesson_completed', amount: 50 },
  ],
  xp: 70,
  total_xp_before: 60,
  total_xp_after: 130,
  level_before: 1,
  level_after: 2,
  level_floor_xp: 100,
  next_level_xp: 303,
  previous_floor_xp: 0,
  previous_next_xp: 100,
  universe_id: 'x',
  universe_xp_after: 130,
  universe_level_before: 1,
  universe_level_after: 2,
  goal_xp: 200,
  today_xp_before: 0,
  today_xp_after: 70,
  streak: {
    before: 3,
    after: 4,
    extended: true,
    freezes_used: 0,
    freeze_earned: false,
    freezes: 1,
  },
}

describe('parseRewards', () => {
  it('maps the database summary', () => {
    const r = parseRewards(rawRewards)
    expect(r?.levelAfter).toBe(2)
    expect(r?.streak.after).toBe(4)
    expect(r?.items[1]).toEqual({ reason: 'lesson_completed', amount: 50 })
  })

  it('returns null for missing or malformed rewards', () => {
    expect(parseRewards(null)).toBeNull()
    expect(parseRewards({ ...rawRewards, xp: 'lots' })).toBeNull()
    expect(parseRewards({ ...rawRewards, items: [{ reason: 'cheat', amount: 1 }] })).toBeNull()
  })
})

describe('parseProgress', () => {
  it('maps get_my_progress and rejects unknown streak states', () => {
    const raw = {
      total_xp: 420,
      level: 3,
      level_floor_xp: 303,
      next_level_xp: 580,
      lessons_completed: 3,
      today: { day: '2026-11-28', xp: 90, lessons: 1, goal_xp: 200 },
      streak: { current: 2, longest: 5, freezes: 1, status: 'done' },
      week: [{ day: '2026-11-28', active: true, frozen: false }],
      universes: [{ slug: 'musique', xp: 420, level: 3, level_floor_xp: 303, next_level_xp: 580 }],
    }
    const p = parseProgress(raw)
    expect(p.today.goalXp).toBe(200)
    expect(p.universes[0]?.floorXp).toBe(303)
    expect(() => parseProgress({ ...raw, streak: { ...raw.streak, status: 'lost' } })).toThrow()
  })
})

describe('levelRatio', () => {
  it('is clamped between 0 and 1', () => {
    expect(levelRatio(150, 100, 300)).toBe(0.25)
    expect(levelRatio(50, 100, 300)).toBe(0)
    expect(levelRatio(400, 100, 300)).toBe(1)
    expect(levelRatio(100, 100, 100)).toBe(1)
  })
})
