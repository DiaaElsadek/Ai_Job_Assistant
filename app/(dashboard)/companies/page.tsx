import { requireAuth } from '@/src/server/auth'
import { listCompanies } from '@/src/server/data/companies'
import { CompanyList, type CompanyItem } from '@/src/components/companies/company-list'

interface CompaniesPageProps {
  searchParams: Promise<{
    search?: string
    priority?: string
    sortBy?: 'name' | 'priority' | 'createdAt' | 'lastResearchedAt'
    page?: string
  }>
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const session = await requireAuth()
  const userId = session.user!.id!

  const resolvedParams = await searchParams
  const search = resolvedParams.search
  const priority = resolvedParams.priority
  const sortBy = resolvedParams.sortBy || 'createdAt'
  const page = parseInt(resolvedParams.page || '1', 10)

  const { companies, total, totalPages } = await listCompanies({
    userId,
    search,
    priority,
    sortBy,
    page,
    pageSize: 20,
  })

  // Format data for client component
  const formattedCompanies: CompanyItem[] = companies.map((c) => ({
    id: c.id,
    name: c.name,
    website: c.website,
    careersUrl: c.careersUrl,
    location: c.location,
    industry: c.industry,
    technologies: c.technologies,
    priority: c.priority,
    lastResearchedAt: c.lastResearchedAt,
    hiringNotes: c.hiringNotes,
    notes: c.notes,
    createdAt: c.createdAt,
    _count: {
      opportunities: c._count.opportunities,
      contacts: c._count.contacts,
    },
  }))

  return (
    <CompanyList
      companies={formattedCompanies}
      total={total}
      page={page}
      totalPages={totalPages}
      initialSearch={search}
      initialPriority={priority}
      initialSortBy={sortBy}
    />
  )
}
