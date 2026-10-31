import 'server-only'
import { prisma } from '@/src/server/db'
import {
  getPipelineVelocityMetrics,
  getRejectionBreakdown,
  type StageVelocityMetric,
  type RejectionReasonCount,
} from '@/src/server/data/stage-history'

export async function getAnalyticsData(userId: string) {
  const [
    companiesCount,
    opportunities,
    contacts,
    drafts,
    followUps,
    activities,
    settings,
    velocityMetrics,
    rejectionBreakdown,
  ] = await Promise.all([
    prisma.company.count({ where: { userId } }),
    prisma.opportunity.findMany({
      where: { userId },
      select: { id: true, status: true, priority: true, createdAt: true, dateApplied: true },
    }),
    prisma.contact.findMany({
      where: { userId },
      select: { id: true, category: true, relationshipStatus: true, networkingPriority: true, createdAt: true },
    }),
    prisma.messageDraft.findMany({
      where: { userId },
      select: { id: true, goal: true, language: true, status: true, sentAt: true },
    }),
    prisma.followUpTask.findMany({
      where: { userId },
      select: { id: true, state: true, priority: true, dueDate: true },
    }),
    prisma.outreachActivity.findMany({
      where: { userId },
      select: { id: true, type: true, activityDate: true },
      orderBy: { activityDate: 'asc' },
    }),
    prisma.settings.findFirst({ where: { userId } }),
    getPipelineVelocityMetrics(userId),
    getRejectionBreakdown(userId),
  ])

  // 1. Application Funnel Counts
  const funnel = {
    saved: opportunities.filter((o) => ['SAVED', 'TO_REVIEW', 'READY_TO_APPLY'].includes(o.status)).length,
    applied: opportunities.filter((o) => o.status === 'APPLIED').length,
    interviewing: opportunities.filter((o) => ['ASSESSMENT', 'INTERVIEW'].includes(o.status)).length,
    offer: opportunities.filter((o) => o.status === 'OFFER').length,
    closed: opportunities.filter((o) => ['REJECTED', 'CLOSED'].includes(o.status)).length,
    total: opportunities.length,
  }

  // 2. Networking Relationship Stage Breakdown
  const relationshipStages = {
    toResearch: contacts.filter((c) => c.relationshipStatus === 'TO_RESEARCH').length,
    ready: contacts.filter((c) => c.relationshipStatus === 'READY_FOR_OUTREACH').length,
    sent: contacts.filter((c) => ['REQUEST_SENT', 'MESSAGE_SENT'].includes(c.relationshipStatus)).length,
    connected: contacts.filter((c) => c.relationshipStatus === 'CONNECTED').length,
    replied: contacts.filter((c) => ['REPLIED', 'REFERRAL_DISCUSSED'].includes(c.relationshipStatus)).length,
    followUpNeeded: contacts.filter((c) => c.relationshipStatus === 'FOLLOW_UP_NEEDED').length,
    total: contacts.length,
  }

  // 3. Contact Categories
  const categoryCounts = {
    recruiters: contacts.filter((c) => c.category === 'RECRUITER').length,
    hr: contacts.filter((c) => c.category === 'HR').length,
    seniorDevs: contacts.filter((c) => c.category === 'SENIOR_FRONTEND_DEV').length,
    techLeads: contacts.filter((c) => c.category === 'TECH_LEAD').length,
    managers: contacts.filter((c) => c.category === 'ENGINEERING_MANAGER').length,
    other: contacts.filter((c) => c.category === 'OTHER').length,
  }

  // 4. Outreach Messages & Sent Velocity
  const sentMessagesCount = drafts.filter((d) => d.status === 'SENT').length
  const totalDraftsCount = drafts.length

  // 5. Follow-ups
  const now = new Date()
  const openFollowUps = followUps.filter((f) => f.state === 'OPEN')
  const overdueFollowUps = openFollowUps.filter((f) => new Date(f.dueDate) < now).length
  const completedFollowUps = followUps.filter((f) => f.state === 'COMPLETED').length

  // 6. Conversion Rate (Applied to Interview / Offer)
  const totalAppliedOrBeyond = funnel.applied + funnel.interviewing + funnel.offer + funnel.closed
  const interviewConversionRate =
    totalAppliedOrBeyond > 0
      ? Math.round(((funnel.interviewing + funnel.offer) / totalAppliedOrBeyond) * 100)
      : 0

  return {
    kpis: {
      totalCompanies: companiesCount,
      totalOpportunities: funnel.total,
      totalContacts: relationshipStages.total,
      sentMessages: sentMessagesCount,
      openFollowUps: openFollowUps.length,
      overdueFollowUps,
      completedFollowUps,
      interviewConversionRate,
      dailyTarget: settings?.dailyNetworkingTarget || 5,
    },
    funnel,
    relationshipStages,
    categoryCounts,
    velocityMetrics,
    rejectionBreakdown,
  }
}

