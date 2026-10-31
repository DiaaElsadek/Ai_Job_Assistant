import { requireAuth } from '@/src/server/auth'
import { listOpportunities } from '@/src/server/data/opportunities'
import { listCompaniesForSelect } from '@/src/server/data/companies'
import { OpportunityList, type OpportunityItem } from '@/src/components/opportunities/opportunity-list'

export const instant = false

interface OpportunitiesPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    priority?: string
    sortBy?: 'title' | 'priority' | 'status' | 'createdAt' | 'deadline' | 'dateApplied'
    view?: 'table' | 'kanban'
    page?: string
  }>
}

export default async function OpportunitiesPage({ searchParams }: OpportunitiesPageProps) {
  const session = await requireAuth()
  const userId = session.user!.id!

  const resolvedParams = await searchParams
  const search = resolvedParams.search
  const status = resolvedParams.status
  const priority = resolvedParams.priority
  const sortBy = resolvedParams.sortBy || 'createdAt'
  const view = resolvedParams.view || 'table'
  const page = parseInt(resolvedParams.page || '1', 10)

  const [{ opportunities, total, totalPages }, companies] = await Promise.all([
    listOpportunities({
      userId,
      search,
      status,
      priority,
      sortBy,
      page,
      pageSize: view === 'kanban' ? 100 : 20, // Load more for Kanban view
    }),
    listCompaniesForSelect(userId),
  ])

  // Format data for client components
  const formattedOpportunities: OpportunityItem[] = opportunities.map((opp) => ({
    id: opp.id,
    title: opp.title,
    description: opp.description,
    requiredTechnologies: opp.requiredTechnologies,
    experienceLevel: opp.experienceLevel,
    location: opp.location,
    workArrangement: opp.workArrangement,
    salaryMin: opp.salaryMin,
    salaryMax: opp.salaryMax,
    salaryCurrency: opp.salaryCurrency,
    jobUrl: opp.jobUrl,
    applicationUrl: opp.applicationUrl,
    sourceName: opp.sourceName,
    deadline: opp.deadline,
    dateApplied: opp.dateApplied,
    priority: opp.priority,
    status: opp.status,
    verificationFlag: opp.verificationFlag,
    notes: opp.notes,
    createdAt: opp.createdAt,
    company: opp.company
      ? {
          id: opp.company.id,
          name: opp.company.name,
          website: opp.company.website,
          location: opp.company.location,
        }
      : null,
    _count: {
      contacts: opp._count.contacts,
      messageDrafts: opp._count.messageDrafts,
    },
  }))

  return (
    <OpportunityList
      opportunities={formattedOpportunities}
      total={total}
      page={page}
      totalPages={totalPages}
      companies={companies}
      initialSearch={search}
      initialStatus={status}
      initialPriority={priority}
      initialSortBy={sortBy}
      initialView={view}
    />
  )
}

