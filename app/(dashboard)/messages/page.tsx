import { requireAuth } from '@/src/server/auth'
import { listMessageDrafts } from '@/src/server/data/messages'
import { listContactsForSelect } from '@/src/server/data/contacts'
import { listOpportunitiesForSelect } from '@/src/server/data/opportunities'
import { MessageStudioClient, type DraftItem } from '@/src/components/messages/message-studio-client'

interface MessagesPageProps {
  searchParams: Promise<{
    contactId?: string
    opportunityId?: string
    goal?: string
    language?: string
    status?: string
    search?: string
  }>
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const session = await requireAuth()
  const userId = session.user!.id!

  const resolvedParams = await searchParams
  const contactId = resolvedParams.contactId
  const opportunityId = resolvedParams.opportunityId
  const goal = resolvedParams.goal
  const language = resolvedParams.language
  const status = resolvedParams.status
  const search = resolvedParams.search

  const [{ drafts }, contacts, opportunities] = await Promise.all([
    listMessageDrafts({
      userId,
      goal,
      language,
      status,
      search,
      pageSize: 50,
    }),
    listContactsForSelect(userId),
    listOpportunitiesForSelect(userId),
  ])

  const formattedDrafts: DraftItem[] = drafts.map((d) => ({
    id: d.id,
    content: d.content,
    explanation: d.explanation,
    goal: d.goal,
    language: d.language,
    tone: d.tone,
    status: d.status,
    sentAt: d.sentAt,
    createdAt: d.createdAt,
    contact: d.contact,
    opportunity: d.opportunity,
    _count: d._count,
  }))

  return (
    <MessageStudioClient
      contacts={contacts.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        role: c.role,
        companyName: c.company?.name,
      }))}
      opportunities={opportunities.map((o) => ({
        id: o.id,
        title: o.title,
        companyName: o.company?.name,
      }))}
      drafts={formattedDrafts}
      initialContactId={contactId}
      initialOpportunityId={opportunityId}
    />
  )
}

