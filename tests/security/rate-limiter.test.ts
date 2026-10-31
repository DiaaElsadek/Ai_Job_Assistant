import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '@/src/lib/rate-limiter'

describe('Sliding Window Rate Limiter (F8)', () => {
  it('allows requests within token capacity', () => {
    const userId = 'test-user-rate-limit-1'
    const result1 = checkRateLimit(userId, { maxTokens: 2, refillRatePerMinute: 2 })
    expect(result1.allowed).toBe(true)

    const result2 = checkRateLimit(userId, { maxTokens: 2, refillRatePerMinute: 2 })
    expect(result2.allowed).toBe(true)
  })

  it('throttles requests when token capacity is exhausted', () => {
    const userId = 'test-user-rate-limit-2'
    // Consume 2 tokens
    checkRateLimit(userId, { maxTokens: 2, refillRatePerMinute: 2 })
    checkRateLimit(userId, { maxTokens: 2, refillRatePerMinute: 2 })

    // 3rd request should be blocked
    const blocked = checkRateLimit(userId, { maxTokens: 2, refillRatePerMinute: 2 })
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.resetInSeconds).toBeGreaterThan(0)
  })
})

