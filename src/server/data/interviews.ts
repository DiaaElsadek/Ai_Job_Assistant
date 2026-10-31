import 'server-only'
import { prisma } from '@/src/server/db'
import type { InterviewRoundType } from '@prisma/client'

// ─── Interview Rounds ─────────────────────────────────────

export async function getInterviewRounds(opportunityId: string, userId: string) {
  // Verify opportunity belongs to user
  const opp = await prisma.opportunity.findFirst({
    where: { id: opportunityId, userId },
    select: { id: true },
  })
  if (!opp) return []

  return prisma.interviewRound.findMany({
    where: { opportunityId },
    orderBy: { roundNumber: 'asc' },
    include: {
      starStories: true,
    },
  })
}

export async function createInterviewRound(
  opportunityId: string,
  userId: string,
  data: {
    roundNumber: number
    roundType: InterviewRoundType
    scheduledAt?: Date | null
    interviewerName?: string | null
    interviewerRole?: string | null
    questionsAsked?: string[]
    userNotes?: string | null
  }
) {
  const opp = await prisma.opportunity.findFirst({
    where: { id: opportunityId, userId },
    select: { id: true },
  })
  if (!opp) throw new Error('Opportunity not found or unauthorized')

  return prisma.interviewRound.create({
    data: {
      opportunityId,
      roundNumber: data.roundNumber,
      roundType: data.roundType,
      scheduledAt: data.scheduledAt || null,
      interviewerName: data.interviewerName || null,
      interviewerRole: data.interviewerRole || null,
      questionsAsked: data.questionsAsked || [],
      userNotes: data.userNotes || null,
    },
  })
}

export async function updateInterviewRound(
  roundId: string,
  userId: string,
  data: {
    scheduledAt?: Date | null
    interviewerName?: string | null
    interviewerRole?: string | null
    questionsAsked?: string[]
    userNotes?: string | null
    rating?: number | null
    completed?: boolean
  }
) {
  // Ensure round belongs to user's opportunity
  const round = await prisma.interviewRound.findFirst({
    where: {
      id: roundId,
      opportunity: { userId },
    },
    select: { id: true },
  })
  if (!round) throw new Error('Round not found or unauthorized')

  return prisma.interviewRound.update({
    where: { id: roundId },
    data,
  })
}

export async function deleteInterviewRound(roundId: string, userId: string) {
  const round = await prisma.interviewRound.findFirst({
    where: {
      id: roundId,
      opportunity: { userId },
    },
    select: { id: true },
  })
  if (!round) throw new Error('Round not found or unauthorized')

  return prisma.interviewRound.delete({
    where: { id: roundId },
  })
}

// ─── STAR Stories ─────────────────────────────────────────

export async function getStarStories(userId: string) {
  return prisma.starStory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createStarStory(
  userId: string,
  data: {
    title: string
    situation: string
    task: string
    action: string
    result: string
    techTags?: string[]
    roundId?: string | null
  }
) {
  return prisma.starStory.create({
    data: {
      userId,
      title: data.title,
      situation: data.situation,
      task: data.task,
      action: data.action,
      result: data.result,
      techTags: data.techTags || [],
      roundId: data.roundId || null,
    },
  })
}

export async function deleteStarStory(id: string, userId: string) {
  return prisma.starStory.deleteMany({
    where: { id, userId },
  })
}

