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
  Sparkles,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge, StatusBadge } from '@/src/components/ui/badge'
import { EmptyState } from '@/src/components/ui/empty-state'
import { OpportunityDialog, type OpportunityFormDataInput } from './opportunity-dialog'
import { DeleteOpportunityDialog } from './delete-opportunity-dialog'
import { OpportunityKanban } from './opportunity-kanban'
import { JobImporterDialog } from './job-importer-dialog'
import { useI18n } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'

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
  const { t, isRtl } = useI18n()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [importerDialogOpen, setImporterDialogOpen] = useState(false)
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
            {t('opportunities.title')}
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            {t('opportunities.subtitle')}
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
              title={t('opportunities.tableView')}
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
              title={t('opportunities.kanbanView')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setImporterDialogOpen(true)}
            className="gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>{isRtl ? 'استيراد بالذكاء الاصطناعي' : 'Import with AI'}</span>
          </Button>

          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className={cn("w-4 h-4", isRtl ? "ml-1.5" : "mr-1.5")} />
            {t('opportunities.addOpportunity')}
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className={cn("w-4 h-4 absolute top-1/2 -translate-y-1/2 text-text-muted", isRtl ? "right-3" : "left-3")} />
          <input
            type="text"
            placeholder={t('opportunities.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full h-9 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent",
              isRtl ? "pr-9 pl-4" : "pl-9 pr-4"
            )}
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={handleStatusChange}
            className="h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">{t('opportunities.allStages')}</option>
            <option value="SAVED">{t('opportunities.stages.SAVED')}</option>
            <option value="TO_REVIEW">{t('opportunities.stages.TO_REVIEW')}</option>
            <option value="READY_TO_APPLY">{t('opportunities.stages.READY_TO_APPLY')}</option>
            <option value="APPLIED">{t('opportunities.stages.APPLIED')}</option>
            <option value="ASSESSMENT">{t('opportunities.stages.ASSESSMENT')}</option>
            <option value="INTERVIEW">{t('opportunities.stages.INTERVIEW')}</option>
            <option value="OFFER">{t('opportunities.stages.OFFER')}</option>
            <option value="REJECTED">{t('opportunities.stages.REJECTED')}</option>
            <option value="CLOSED">{t('opportunities.stages.CLOSED')}</option>
          </select>

          <select
            value={priority}
            onChange={handlePriorityChange}
            className="h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">{t('opportunities.allPriorities')}</option>
            <option value="LOW">{isRtl ? 'منخفضة' : 'Low'}</option>
            <option value="MEDIUM">{isRtl ? 'متوسطة' : 'Medium'}</option>
            <option value="HIGH">{isRtl ? 'عالية' : 'High'}</option>
            <option value="URGENT">{isRtl ? 'عاجلة' : 'Urgent'}</option>
          </select>

          <select
            value={sortBy}
            onChange={handleSortChange}
            className="h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="createdAt">{t('companies.sortNewest')}</option>
            <option value="deadline">{isRtl ? 'أقرب موعد نهائي' : 'Upcoming Deadline'}</option>
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
          title={hasFilters ? t('common.noResults') : t('opportunities.emptyTitle')}
          description={
            hasFilters
              ? isRtl ? 'لا توجد فرص تطابق الفلاتر المحددة.' : 'Try adjusting your filters or search terms.'
              : t('opportunities.emptyDesc')
          }
          action={
            hasFilters ? (
              <Button size="sm" variant="outline" onClick={handleClearFilters}>
                {t('common.resetFilters')}
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className={cn("w-4 h-4", isRtl ? "ml-1.5" : "mr-1.5")} />
                {t('opportunities.addFirst')}
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
            <table className={cn("w-full border-collapse", isRtl ? "text-right" : "text-left")}>
              <thead>
                <tr className="border-b border-border bg-bg-tertiary/40 text-[11px] font-semibold text-text-secondary">
                  <th className="py-3 px-4">{isRtl ? 'المسمى والشركة' : 'Role & Company'}</th>
                  <th className="py-3 px-3">{isRtl ? 'المرحلة' : 'Stage'}</th>
                  <th className="py-3 px-3">{isRtl ? 'الأولوية' : 'Priority'}</th>
                  <th className="py-3 px-3 hidden md:table-cell">{isRtl ? 'طبيعة العمل' : 'Arrangement'}</th>
                  <th className="py-3 px-3 hidden lg:table-cell">{isRtl ? 'التقنيات' : 'Tech Stack'}</th>
                  <th className="py-3 px-3 hidden sm:table-cell">{isRtl ? 'التواريخ' : 'Dates'}</th>
                  <th className={cn("py-3 px-4", isRtl ? "text-left" : "text-right")}>{isRtl ? 'الإجراءات' : 'Actions'}</th>
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
      <JobImporterDialog
        open={importerDialogOpen}
        onClose={() => setImporterDialogOpen(false)}
        companies={companies}
      />

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
