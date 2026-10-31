import 'server-only'
import { prisma } from '@/src/server/db'
import { rankNextBestActions, type PlannerAction } from '@/src/lib/planner/next-best-action'

export async function getDailyNextBestActions(userId: string): Promise<PlannerAction[]> {
  const now = new Date()
  const endOfTomorrow = new Date()
  endOfTomorrow.setDate(now.getDate() + 1)
  endOfTomorrow.setHours(23, 59, 59, 999)

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(now.getDate() - 14)

  const [followUps, staleContacts, urgentOpportunities] = await Promise.all([
    // Open follow-up tasks due on or before tomorrow
    prisma.followUpTask.findMany({
      where: {
        userId,
        state: 'OPEN',
        dueDate: { lte: endOfTomorrow },
      },
      orderBy: { dueDate: 'asc' },
      take: 6,
      include: {
        contact: { select: { id: true, fullName: true } },
        company: { select: { id: true, name: true } },
      },
    }),

    // High/Urgent priority contacts with no contact in 14 days or never contacted
    prisma.contact.findMany({
      where: {
        userId,
        networkingPriority: { in: ['HIGH', 'URGENT'] },
        relationshipStatus: { in: ['READY_FOR_OUTREACH', 'REQUEST_SENT', 'CONNECTED', 'FOLLOW_UP_NEEDED'] },
        OR: [
          { lastContactDate: null },
          { lastContactDate: { lte: fourteenDaysAgo } },
        ],
      },
      orderBy: { networkingPriority: 'desc' },
      take: 5,
      include: {
        company: { select: { name: true } },
      },
    }),

    // High/Urgent opportunities in early review or assessment stages
    prisma.opportunity.findMany({
      where: {
        userId,
        priority: { in: ['HIGH', 'URGENT'] },
        status: { in: ['SAVED', 'TO_REVIEW', 'READY_TO_APPLY', 'ASSESSMENT'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: {
        company: { select: { name: true } },
      },
    }),
  ])

  return rankNextBestActions({
    followUps,
    staleContacts,
    urgentOpportunities,
  })
}

