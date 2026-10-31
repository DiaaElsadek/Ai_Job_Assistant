import { requireAuth } from '@/src/server/auth'
import { prisma } from '@/src/server/db'
import { DashboardView } from '@/src/components/dashboard/dashboard-view'

export const instant = false

export default async function DashboardPage() {
  const session = await requireAuth()
  const userId = session.user!.id!

  // Fetch real counts from database
  let companyCount = 0
  let opportunityCount = 0
  let contactCount = 0
  let messageCount = 0
  let pendingFollowUpCount = 0

  try {
    const [companies, opportunities, contacts, messages, followUps] = await Promise.all([
      prisma.company.count({ where: { userId } }),
      prisma.opportunity.count({ where: { userId } }),
      prisma.contact.count({ where: { userId } }),
      prisma.messageDraft.count({ where: { userId } }),
      prisma.followUpTask.count({ where: { userId, state: 'OPEN' } }),
    ])
    companyCount = companies
    opportunityCount = opportunities
    contactCount = contacts
    messageCount = messages
    pendingFollowUpCount = followUps
  } catch {
    // Fallback if DB query fails during edge conditions
  }

  return (
    <DashboardView
      companyCount={companyCount}
      opportunityCount={opportunityCount}
      contactCount={contactCount}
      messageCount={messageCount}
      pendingFollowUpCount={pendingFollowUpCount}
    />
  )
}
