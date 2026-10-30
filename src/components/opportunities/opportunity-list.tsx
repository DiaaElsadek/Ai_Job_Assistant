'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Briefcase,
  Plus,
  Search,
  Building2,
  ExternalLink,
  MapPin,
  Pencil,
  Trash2,
  Calendar,
  LayoutGrid,
  List,
  Eye,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge, StatusBadge } from '@/src/components/ui/badge'
import { EmptyState } from '@/src/components/ui/empty-state'
import { OpportunityDialog, type OpportunityFormDataInput } from './opportunity-dialog'
import { DeleteOpportunityDialog } from './delete-opportunity-dialog'
import { OpportunityKanban } from './opportunity-kanban'

export interface OpportunityItem {
  id: string
  title: string
  description: string | null
  requiredTechnologies: string[]
  experienceLevel: 'INTERNSHIP' | 'FRESHER' | 'JUNIOR' | 'MID_LEVEL' | 'SENIOR' | 'UNKNOWN'
  location: string | null
  workArrangement: 'ON_SITE' | 'HYBRID' | 'REMOTE' | 'UNKNOWN'
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  jobUrl: string | null
  applicationUrl: string | null
  sourceName: string | null
  deadline: Date | string | null
  dateApplied: Date | string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'SAVED' | 'TO_REVIEW' | 'READY_TO_APPLY' | 'APPLIED' | 'ASSESSMENT' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'CLOSED'
  verificationFlag: 'VERIFIED' | 'OUTDATED' | 'UNCERTAIN'
  notes: string | null
  createdAt: Date | string
  company: {
    id: string
    name: string
    website?: string | null
    location?: string | null
  } | null
  _count: {
    contacts: number
    messageDrafts: number
  }
}

interface OpportunityListProps {
  opportunities: OpportunityItem[]
  total: number
  page: number
  totalPages: number
  companies: { id: string; name: string }[]
  initialSearch?: string
  initialStatus?: string
  initialPriority?: string
  initialSortBy?: string
  initialView?: 'table' | 'kanban'
}

export function OpportunityList({
  opportunities,
  total,
  page,
  totalPages,
  companies,
  initialSearch = '',
  initialStatus = '',
  initialPriority = '',
  initialSortBy = 'createdAt',
  initialView = 'table',
}: OpportunityListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<OpportunityFormDataInput | null>(null)
  const [deletingOpportunity, setDeletingOpportunity] = useState<{ id: string; title: string } | null>(null)

  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [priority, setPriority] = useState(initialPriority)
  const [sortBy, setSortBy] = useState(initialSortBy)
  const [view, setView] = useState<'table' | 'kanban'>(initialView)

  const applyFilters = (
    newSearch?: string,
    newStatus?: string,
    newPriority?: string,
    newSortBy?: string,
    newView?: 'table' | 'kanban'
  ) => {
    const params = new URLSearchParams(searchParams.toString())
    const s = newSearch !== undefined ? newSearch : search
    const st = newStatus !== undefined ? newStatus : status
    const p = newPriority !== undefined ? newPriority : priority
    const sort = newSortBy !== undefined ? newSortBy : sortBy
    const v = newView !== undefined ? newView : view

    if (s) params.set('search', s)
    else params.delete('search')

    if (st) params.set('status', st)
    else params.delete('status')

    if (p) params.set('priority', p)
    else params.delete('priority')

    if (sort && sort !== 'createdAt') params.set('sortBy', sort)
    else params.delete('sortBy')

    if (v && v !== 'table') params.set('view', v)
    else params.delete('view')

    params.delete('page')
    router.push(`/opportunities?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters(search)
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setStatus(val)
    applyFilters(undefined, val)
  }

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setPriority(val)
    applyFilters(undefined, undefined, val)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSortBy(val)
    applyFilters(undefined, undefined, undefined, val)
  }

  const handleViewToggle = (newView: 'table' | 'kanban') => {
    setView(newView)
    applyFilters(undefined, undefined, undefined, undefined, newView)
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatus('')
    setPriority('')
    setSortBy('createdAt')
    router.push('/opportunities')
  }

  const hasFilters = !!search || !!status || !!priority || sortBy !== 'createdAt'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            Target Opportunities
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Track job openings, match tech requirements, and manage application stages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="inline-flex items-center border border-border rounded-lg p-0.5 bg-bg-secondary">
            <button
              type="button"
              onClick={() => handleViewToggle('table')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
                view === 'table'
                  ? 'bg-accent text-black font-semibold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleViewToggle('kanban')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
                view === 'kanban'
                  ? 'bg-accent text-black font-semibold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Pipeline board view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Opportunity
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by job title, company name, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={handleStatusChange}
            className="h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Statuses</option>
            <option value="SAVED">Saved</option>
            <option value="TO_REVIEW">To Review</option>
            <option value="READY_TO_APPLY">Ready to Apply</option>
            <option value="APPLIED">Applied</option>
            <option value="ASSESSMENT">Assessment</option>
            <option value="INTERVIEW">Interview</option>
            <option value="OFFER">Offer</option>
            <option value="REJECTED">Rejected</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priority}
            onChange={handlePriorityChange}
            className="h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <select
            value={sortBy}
            onChange={handleSortChange}
            className="h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="createdAt">Newest First</option>
            <option value="deadline">Upcoming Deadline</option>
            <option value="dateApplied">Recent Application</option>
            <option value="title">Job Title</option>
            <option value="priority">Priority</option>
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-text-muted hover:text-accent underline px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {opportunities.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-6 h-6" />}
          title={hasFilters ? 'No matching opportunities' : 'No target opportunities yet'}
          description={
            hasFilters
              ? 'Try adjusting your filters or search terms.'
              : 'Add target job openings in Egypt or remote roles to track applications.'
          }
          action={
            hasFilters ? (
              <Button size="sm" variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Your First Opportunity
              </Button>
            )
          }
        />
      ) : view === 'kanban' ? (
        <OpportunityKanban
          opportunities={opportunities}
          onEdit={(opp) => setEditingOpportunity(opp)}
          onDelete={(opp) => setDeletingOpportunity(opp)}
        />
      ) : (
        /* Table View */
        <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg-tertiary/40 text-[11px] font-semibold text-text-secondary">
                  <th className="py-3 px-4">Role & Company</th>
                  <th className="py-3 px-3">Stage</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3 hidden md:table-cell">Arrangement</th>
                  <th className="py-3 px-3 hidden lg:table-cell">Tech Stack</th>
                  <th className="py-3 px-3 hidden sm:table-cell">Dates</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {opportunities.map((opp) => (
                  <tr
                    key={opp.id}
                    className="hover:bg-bg-hover/60 transition-colors group"
                  >
                    {/* Role & Company */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <Link
                          href={`/opportunities/${opp.id}`}
                          className="font-medium text-text-primary hover:text-accent transition-colors block line-clamp-1"
                        >
                          {opp.title}
                        </Link>
                        {opp.company ? (
                          <Link
                            href={`/companies/${opp.company.id}`}
                            className="flex items-center gap-1 text-[11px] text-text-muted hover:text-accent"
                          >
                            <Building2 className="w-3 h-3 shrink-0" />
                            <span>{opp.company.name}</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-text-muted">Unassigned</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <StatusBadge status={opp.status} />
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3">
                      <StatusBadge status={opp.priority} />
                    </td>

                    {/* Arrangement */}
                    <td className="py-3 px-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <span className="text-text-secondary capitalize">
                          {opp.workArrangement.toLowerCase().replace('_', '-')}
                        </span>
                        {opp.location && (
                          <div className="text-[11px] text-text-muted flex items-center gap-1 truncate max-w-[140px]">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{opp.location}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Tech Stack */}
                    <td className="py-3 px-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {opp.requiredTechnologies.slice(0, 2).map((tech) => (
                          <span
                            key={tech}
                            className="text-[10px] bg-bg-tertiary text-text-secondary px-1.5 py-0.5 rounded"
                          >
                            {tech}
                          </span>
                        ))}
                        {opp.requiredTechnologies.length > 2 && (
                          <span className="text-[10px] text-text-muted">
                            +{opp.requiredTechnologies.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-3 hidden sm:table-cell text-[11px] text-text-muted">
                      {opp.dateApplied ? (
                        <div>
                          Applied: {new Date(opp.dateApplied).toLocaleDateString()}
                        </div>
                      ) : opp.deadline ? (
                        <div className="text-warning">
                          Due: {new Date(opp.deadline).toLocaleDateString()}
                        </div>
                      ) : (
                        <div>Added {new Date(opp.createdAt).toLocaleDateString()}</div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/opportunities/${opp.id}`}
                          className="p-1.5 text-text-muted hover:text-text-primary rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setEditingOpportunity(opp)}
                          className="p-1.5 text-text-muted hover:text-accent rounded-md transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeletingOpportunity({ id: opp.id, title: opp.title })
                          }
                          className="p-1.5 text-text-muted hover:text-error rounded-md transition-colors"
                          title="Delete"
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-tertiary/20 text-xs">
              <span className="text-text-muted">
                Showing {opportunities.length} of {total} opportunities
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', String(page - 1))
                    router.push(`/opportunities?${params.toString()}`)
                  }}
                >
                  Previous
                </Button>
                <span className="text-text-secondary px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', String(page + 1))
                    router.push(`/opportunities?${params.toString()}`)
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <OpportunityDialog
        open={createDialogOpen || !!editingOpportunity}
        onClose={() => {
          setCreateDialogOpen(false)
          setEditingOpportunity(null)
        }}
        opportunity={editingOpportunity}
        companies={companies}
      />

      <DeleteOpportunityDialog
        open={!!deletingOpportunity}
        onClose={() => setDeletingOpportunity(null)}
        opportunity={deletingOpportunity}
      />
    </div>
  )
}
