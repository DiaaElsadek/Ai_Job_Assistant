import { requireAuth } from '@/src/server/auth'
import { listContacts } from '@/src/server/data/contacts'
import { listCompaniesForSelect } from '@/src/server/data/companies'
import { ContactList, type ContactItem } from '@/src/components/contacts/contact-list'

interface ContactsPageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    status?: string
    priority?: string
    sortBy?: 'fullName' | 'networkingPriority' | 'relationshipStatus' | 'createdAt' | 'lastContactDate' | 'nextFollowUpDate'
    page?: string
  }>
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const session = await requireAuth()
  const userId = session.user!.id!

  const resolvedParams = await searchParams
  const search = resolvedParams.search
  const category = resolvedParams.category
  const status = resolvedParams.status
  const priority = resolvedParams.priority
  const sortBy = resolvedParams.sortBy || 'createdAt'
  const page = parseInt(resolvedParams.page || '1', 10)

  const [{ contacts, total, totalPages }, companies] = await Promise.all([
    listContacts({
      userId,
      search,
      category,
      relationshipStatus: status,
      networkingPriority: priority,
      sortBy,
      page,
      pageSize: 20,
    }),
    listCompaniesForSelect(userId),
  ])

  // Format data for client component
  const formattedContacts: ContactItem[] = contacts.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    role: c.role,
    profileUrl: c.profileUrl,
    publicSourceUrl: c.publicSourceUrl,
    category: c.category,
    location: c.location,
    reasonForTargeting: c.reasonForTargeting,
    personalizationNotes: c.personalizationNotes,
    relationshipStatus: c.relationshipStatus,
    lastContactDate: c.lastContactDate,
    nextFollowUpDate: c.nextFollowUpDate,
    networkingPriority: c.networkingPriority,
    verificationStatus: c.verificationStatus,
    notes: c.notes,
    createdAt: c.createdAt,
    company: c.company
      ? {
          id: c.company.id,
          name: c.company.name,
          location: c.company.location,
        }
      : null,
    _count: {
      opportunities: c._count.opportunities,
      messageDrafts: c._count.messageDrafts,
      communicationHistory: c._count.communicationHistory,
    },
  }))

  return (
    <ContactList
      contacts={formattedContacts}
      total={total}
      page={page}
      totalPages={totalPages}
      companies={companies}
      initialSearch={search}
      initialCategory={category}
      initialStatus={status}
      initialPriority={priority}
      initialSortBy={sortBy}
    />
  )
}

