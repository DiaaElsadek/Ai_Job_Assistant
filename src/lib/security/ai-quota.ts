import 'server-only'
import { prisma } from '@/src/server/db'

export interface AiQuotaStatus {
  allowed: boolean
  remaining: number
  limit: number
  usedToday: number
  resetInSeconds: number
}

/**
 * Checks the user's daily AI generation quota using persistent database storage.
 * Resistant to serverless container restarts and distributed instances.
 */
export async function checkAiDailyQuota(
  userId: string,
  limit = 15
): Promise<AiQuotaStatus> {
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Find usage within the last 24-hour sliding window
  const count = await prisma.aiUsage.count({
    where: {
      userId,
      createdAt: { gte: twentyFourHoursAgo },
    },
  })

  // Find the oldest record in the window to compute exact reset time
  let resetInSeconds = 0
  if (count >= limit) {
    const oldestRecord = await prisma.aiUsage.findFirst({
      where: {
        userId,
        createdAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (oldestRecord) {
      const resetTime = oldestRecord.createdAt.getTime() + 24 * 60 * 60 * 1000
      resetInSeconds = Math.max(1, Math.ceil((resetTime - now.getTime()) / 1000))
    }
  }

  const remaining = Math.max(0, limit - count)

  return {
    allowed: count < limit,
    remaining,
    limit,
    usedToday: count,
    resetInSeconds,
  }
}

/**
 * Records an AI usage event for quota tracking and token audit.
 */
export async function recordAiUsage(
  userId: string,
  feature: string,
  tokensUsed?: number
): Promise<void> {
  await prisma.aiUsage.create({
    data: {
      userId,
      feature,
      tokensUsed: tokensUsed || null,
    },
  })
}

