'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  MapPin,
  Pencil,
  Trash2,
  Calendar,
  Briefcase,
  Users,
  Eye,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge, StatusBadge } from '@/src/components/ui/badge'
import { EmptyState } from '@/src/components/ui/empty-state'
import { CompanyDialog, type CompanyFormDataInput } from './company-dialog'
import { DeleteCompanyDialog } from './delete-company-dialog'

export interface CompanyItem {
  id: string
  name: string
  website: string | null
  careersUrl: string | null
  location: string | null
  industry: string | null
  technologies: string[]
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  lastResearchedAt: Date | string | null
  hiringNotes: string | null
  notes: string | null
  createdAt: Date | string
  _count: {
    opportunities: number
    contacts: number
  }
}

interface CompanyListProps {
  companies: CompanyItem[]
  total: number
  page: number
  totalPages: number
  initialSearch?: string
  initialPriority?: string
  initialSortBy?: string
}

export function CompanyList({
  companies,
  total,
  page,
  totalPages,
  initialSearch = '',
  initialPriority = '',
  initialSortBy = 'createdAt',
}: CompanyListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyFormDataInput | null>(null)
  const [deletingCompany, setDeletingCompany] = useState<{ id: string; name: string } | null>(null)

  const [search, setSearch] = useState(initialSearch)
  const [priority, setPriority] = useState(initialPriority)
  const [sortBy, setSortBy] = useState(initialSortBy)

  const applyFilters = (newSearch?: string, newPriority?: string, newSortBy?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const s = newSearch !== undefined ? newSearch : search
    const p = newPriority !== undefined ? newPriority : priority
    const sort = newSortBy !== undefined ? newSortBy : sortBy

    if (s) params.set('search', s)
    else params.delete('search')

    if (p) params.set('priority', p)
    else params.delete('priority')

    if (sort && sort !== 'createdAt') params.set('sortBy', sort)
    else params.delete('sortBy')

    params.delete('page')
    router.push(`/companies?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters(search)
  }

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setPriority(val)
    applyFilters(undefined, val)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSortBy(val)
    applyFilters(undefined, undefined, val)
  }

  const clearFilters = () => {
    setSearch('')
    setPriority('')
    setSortBy('createdAt')
    router.push('/companies')
  }

  const hasFilters = !!(initialSearch || initialPriority || (initialSortBy && initialSortBy !== 'createdAt'))

  return (
    <div className="space-y-4">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary tracking-tight">
            Target Companies
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Research companies, track verified tech stacks, and discover hiring opportunities.
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          size="sm"
          className="self-start sm:self-auto shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Company
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-bg-secondary border border-border rounded-lg p-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by company name, industry, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-bg-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
            />
          </form>

          {/* Priority filter */}
          <div className="sm:col-span-3">
            <select
              value={priority}
              onChange={handlePriorityChange}
              className="w-full h-8 px-2.5 text-xs bg-bg-primary border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              aria-label="Filter by priority"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Sort */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="w-full h-8 px-2.5 text-xs bg-bg-primary border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              aria-label="Sort companies"
            >
              <option value="createdAt">Newest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="priority">Priority</option>
              <option value="lastResearchedAt">Last Researched</option>
            </select>
          </div>
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
            <span className="text-text-secondary">
              Showing {companies.length} of {total} companies
            </span>
            <button
              onClick={clearFilters}
              className="text-accent hover:underline text-xs"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Companies Content */}
      {companies.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6 text-text-muted" />}
          title={hasFilters ? 'No companies found' : 'No target companies yet'}
          description={
            hasFilters
              ? 'Try modifying your search or priority filter.'
              : 'Add target companies in Egypt or remote to start mapping out opportunities and networking contacts.'
          }
          action={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Your First Company
              </Button>
            )
          }
        />
      ) : (
        <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-bg-tertiary/50 text-text-secondary font-medium">
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Location & Industry</th>
                  <th className="py-2.5 px-3 hidden md:table-cell">Tech Stack</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3 text-center">Pipeline</th>
                  <th className="py-2.5 px-3 hidden lg:table-cell">Last Researched</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-bg-hover transition-colors group"
                  >
                    {/* Name & Links */}
                    <td className="py-2.5 px-3 font-medium text-text-primary">
                      <div className="flex flex-col">
                        <Link
                          href={`/companies/${company.id}`}
                          className="hover:text-accent font-medium hover:underline inline-flex items-center gap-1.5"
                        >
                          {company.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-tertiary">
                          {company.website && (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-text-secondary inline-flex items-center gap-0.5"
                              title="Visit website"
                            >
                              Web <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {company.careersUrl && (
                            <a
                              href={company.careersUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-accent inline-flex items-center gap-0.5"
                              title="View careers page"
                            >
                              Careers <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Location & Industry */}
                    <td className="py-2.5 px-3 text-text-secondary">
                      <div className="flex flex-col">
                        {company.location && (
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-text-muted shrink-0" />
                            {company.location}
                          </span>
                        )}
                        {company.industry && (
                          <span className="text-[11px] text-text-tertiary">
                            {company.industry}
                          </span>
                        )}
                        {!company.location && !company.industry && (
                          <span className="text-text-muted">—</span>
                        )}
                      </div>
                    </td>

                    {/* Tech Stack */}
                    <td className="py-2.5 px-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {company.technologies.slice(0, 3).map((tech) => (
                          <Badge key={tech} variant="default" className="text-[10px]">
                            {tech}
                          </Badge>
                        ))}
                        {company.technologies.length > 3 && (
                          <Badge variant="muted" className="text-[10px]">
                            +{company.technologies.length - 3}
                          </Badge>
                        )}
                        {company.technologies.length === 0 && (
                          <span className="text-text-muted">—</span>
                        )}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-2.5 px-3">
                      <StatusBadge status={company.priority} />
                    </td>

                    {/* Pipeline counts */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-2 text-[11px] text-text-secondary">
                        <span
                          className="inline-flex items-center gap-1"
                          title="Related Opportunities"
                        >
                          <Briefcase className="w-3 h-3 text-text-muted" />
                          {company._count.opportunities}
                        </span>
                        <span
                          className="inline-flex items-center gap-1"
                          title="Related Contacts"
                        >
                          <Users className="w-3 h-3 text-text-muted" />
                          {company._count.contacts}
                        </span>
                      </div>
                    </td>

                    {/* Last Researched */}
                    <td className="py-2.5 px-3 text-text-tertiary hidden lg:table-cell text-[11px]">
                      {company.lastResearchedAt ? (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-text-muted" />
                          {new Date(company.lastResearchedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-text-muted">Not researched</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/companies/${company.id}`}
                          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setEditingCompany(company)}
                          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                          title="Edit Company"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingCompany({ id: company.id, name: company.name })}
                          className="p-1.5 rounded-md text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
                          title="Delete Company"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-bg-secondary text-xs text-text-secondary">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', String(page - 1))
                    router.push(`/companies?${params.toString()}`)
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', String(page + 1))
                    router.push(`/companies?${params.toString()}`)
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Dialog */}
      {createDialogOpen && (
        <CompanyDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
        />
      )}

      {editingCompany && (
        <CompanyDialog
          open={!!editingCompany}
          onClose={() => setEditingCompany(null)}
          company={editingCompany}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingCompany && (
        <DeleteCompanyDialog
          open={!!deletingCompany}
          onClose={() => setDeletingCompany(null)}
          companyId={deletingCompany.id}
          companyName={deletingCompany.name}
        />
      )}
    </div>
  )
}
