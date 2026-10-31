import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock server-only
vi.mock('server-only', () => ({}))

// Mock database
vi.mock('@/src/server/db', () => ({
  prisma: {
    aiUsage: {
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/src/server/db'
import { checkAiDailyQuota, recordAiUsage } from '@/src/lib/security/ai-quota'

describe('Step 0: Persistent Serverless AI Quota (AiUsage)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows AI requests when usage is below the daily limit', async () => {
    vi.mocked(prisma.aiUsage.count).mockResolvedValueOnce(5)

    const status = await checkAiDailyQuota('user-uuid-1', 15)

    expect(status.allowed).toBe(true)
    expect(status.remaining).toBe(10)
    expect(status.limit).toBe(15)
    expect(status.usedToday).toBe(5)
    expect(status.resetInSeconds).toBe(0)
  })

  it('rejects AI requests when usage reaches or exceeds the daily limit (e.g. 15)', async () => {
    vi.mocked(prisma.aiUsage.count).mockResolvedValueOnce(15)
    const oldestTimestamp = new Date(Date.now() - 20 * 60 * 60 * 1000) // 20 hours ago
    vi.mocked(prisma.aiUsage.findFirst).mockResolvedValueOnce({
      id: 'usage-1',
      userId: 'user-uuid-1',
      feature: 'LINKEDIN_DRAFT',
      tokensUsed: 250,
      createdAt: oldestTimestamp,
    } as any)

    const status = await checkAiDailyQuota('user-uuid-1', 15)

    expect(status.allowed).toBe(false)
    expect(status.remaining).toBe(0)
    expect(status.usedToday).toBe(15)
    // 24 hours - 20 hours = ~4 hours remaining
    expect(status.resetInSeconds).toBeGreaterThan(0)
    expect(status.resetInSeconds).toBeLessThanOrEqual(4 * 3600)
  })

  it('records an AI usage event into the database', async () => {
    vi.mocked(prisma.aiUsage.create).mockResolvedValueOnce({
      id: 'usage-uuid-new',
      userId: 'user-uuid-1',
      feature: 'LINKEDIN_DRAFT',
      tokensUsed: 350,
      createdAt: new Date(),
    } as any)

    await recordAiUsage('user-uuid-1', 'LINKEDIN_DRAFT', 350)

    expect(prisma.aiUsage.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-uuid-1',
        feature: 'LINKEDIN_DRAFT',
        tokensUsed: 350,
      },
    })
  })
})

