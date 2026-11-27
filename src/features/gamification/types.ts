export type XpReason =
  'correct_answer' | 'lesson_completed' | 'lesson_perfect' | 'chapter_completed' | 'exam_passed'

export type StreakStatus = 'done' | 'pending' | 'protected' | 'paused' | 'none'

export type LevelProgress = {
  level: number
  /** Cumulative XP at which the current level starts. */
  floorXp: number
  /** Cumulative XP at which the next level starts. */
  nextXp: number
}

export type StreakChange = {
  before: number
  after: number
  extended: boolean
  freezesUsed: number
  freezeEarned: boolean
  freezes: number
}

/** What complete_lesson() granted, as computed by Postgres. */
export type Rewards = {
  items: { reason: XpReason; amount: number }[]
  xp: number
  totalXpBefore: number
  totalXpAfter: number
  levelBefore: number
  levelAfter: number
  levelFloorXp: number
  nextLevelXp: number
  /** Bounds of the level held before the lesson (to animate the bar from there). */
  previousFloorXp: number
  previousNextXp: number
  universeLevelBefore: number
  universeLevelAfter: number
  goalXp: number
  todayXpBefore: number
  todayXpAfter: number
  streak: StreakChange
}

export type UniverseProgress = LevelProgress & { slug: string; xp: number }

export type Progress = LevelProgress & {
  totalXp: number
  lessonsCompleted: number
  today: { day: string; xp: number; lessons: number; goalXp: number }
  streak: { current: number; longest: number; freezes: number; status: StreakStatus }
  week: { day: string; active: boolean; frozen: boolean }[]
  universes: UniverseProgress[]
}
