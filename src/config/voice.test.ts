import { describe, expect, it } from 'vitest'
import { answerTitle, voice } from './voice'

describe('answerTitle', () => {
  it('is stable for a given question and varies across questions', () => {
    const r = { isCorrect: true, score: 100 }
    expect(answerTitle(r, 'q1')).toBe(answerTitle(r, 'q1'))
    const lines = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((s) => answerTitle(r, s)))
    expect(lines.size).toBeGreaterThan(1)
  })

  it('encourages on a partial answer', () => {
    expect(answerTitle({ isCorrect: false, score: 40 }, 'x')).toMatch(/Pas loin/)
  })

  it('never celebrates a wrong answer', () => {
    expect(answerTitle({ isCorrect: false, score: 0 }, 'x')).not.toMatch(/Bien vu|Exact/)
  })

  it('writes league outcomes with the division name', () => {
    expect(voice.league.promoted('Argent')).toContain('Argent')
  })
})
