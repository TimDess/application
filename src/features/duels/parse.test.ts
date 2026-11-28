import { describe, expect, it } from 'vitest'
import { parseTurn, remainingMs } from './parse'

describe('duel turns', () => {
  it('maps a served question into a playable question', () => {
    const t = parseTurn({
      done: false,
      position: 2,
      total: 7,
      score: 120,
      deadline_at: '2026-12-01T10:00:15Z',
      server_now: '2026-12-01T10:00:00Z',
      seconds: 15,
      question: {
        id: 'q1',
        format: 'quiz',
        prompt: 'Question ?',
        difficulty: 2,
        payload: { options: [{ id: 'a', label: 'A' }], multiple: false },
      },
    })
    expect(t.done).toBe(false)
    if (!t.done) {
      expect(t.question.format).toBe('quiz')
      expect('options' in t.question && t.question.options[0]?.label).toBe('A')
    }
  })

  it('reports the end of a part', () => {
    expect(parseTurn({ done: true, total: 7 })).toEqual({ done: true, total: 7 })
  })
})

describe('remainingMs', () => {
  it('corrects a client clock that runs ahead of the server', () => {
    // The client clock is 5 s ahead: receivedAt 10:00:05 local = 10:00:00 server.
    const receivedAt = Date.parse('2026-12-01T10:00:05Z')
    const left = remainingMs(
      '2026-12-01T10:00:15Z',
      '2026-12-01T10:00:00Z',
      receivedAt,
      receivedAt + 3000,
    )
    expect(left).toBe(12000)
  })
})
