'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Building2,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Badge, StatusBadge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import type { OpportunityItem } from './opportunity-list'
import { updateOpportunityStatusAction } from '@/src/server/actions/opportunities'
import type { OpportunityStatus } from '@prisma/client'

interface OpportunityKanbanProps {
  opportunities: OpportunityItem[]
  onEdit: (opp: OpportunityItem) => void
  onDelete: (opp: { id: string; title: string }) => void
}

interface ColumnDef {
  key: string
  label: string
  statuses: OpportunityStatus[]
  badgeVariant: 'muted' | 'info' | 'accent' | 'warning' | 'success' | 'error'
}

const COLUMNS: ColumnDef[] = [
  {
    key: 'saved',
    label: 'Saved & To Review',
    statuses: ['SAVED', 'TO_REVIEW', 'READY_TO_APPLY'],
    badgeVariant: 'muted',
  },
  {
    key: 'applied',
    label: 'Applied',
    statuses: ['APPLIED'],
    badgeVariant: 'info',
  },
  {
    key: 'interview',
    label: 'Assessment & Interview',
    statuses: ['ASSESSMENT', 'INTERVIEW'],
    badgeVariant: 'warning',
  },
  {
    key: 'offer',
    label: 'Offer',
    statuses: ['OFFER'],
    badgeVariant: 'success',
  },
  {
    key: 'closed',
    label: 'Rejected / Closed',
    statuses: ['REJECTED', 'CLOSED'],
    badgeVariant: 'error',
  },
]

export function OpportunityKanban({
  opportunities,
  onEdit,
  onDelete,
}: OpportunityKanbanProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleQuickStatus = (id: string, newStatus: OpportunityStatus) => {
    startTransition(async () => {
      const res = await updateOpportunityStatusAction(id, newStatus)
      if (!res.success) {
        toast.error('Failed to update stage')
        return
      }
      toast.success(`Moved to ${newStatus.replace(/_/g, ' ')}`)
      router.refresh()
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colOpps = opportunities.filter((o) =>
          col.statuses.includes(o.status as OpportunityStatus)
        )

        return (
          <div
            key={col.key}
            className="flex flex-col bg-bg-secondary/60 border border-border rounded-xl p-3 min-w-[240px] max-w-full"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
              <span className="text-xs font-semibold text-text-primary">
                {col.label}
              </span>
              <Badge variant={col.badgeVariant}>{colOpps.length}</Badge>
            </div>

            {/* Cards List */}
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
              {colOpps.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-muted">
                  No roles in this stage
                </div>
              ) : (
                colOpps.map((opp) => (
                  <div
                    key={opp.id}
                    className="group relative bg-bg-secondary border border-border hover:border-accent/40 rounded-lg p-3 shadow-xs transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <Link
                        href={`/opportunities/${opp.id}`}
                        className="text-xs font-semibold text-text-primary hover:text-accent transition-colors line-clamp-2"
                      >
                        {opp.title}
                      </Link>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEdit(opp)}
                          className="p-1 text-text-muted hover:text-text-primary rounded transition-colors"
                          title="Edit opportunity"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete({ id: opp.id, title: opp.title })}
                          className="p-1 text-text-muted hover:text-error rounded transition-colors"
                          title="Delete opportunity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {opp.company ? (
                      <Link
                        href={`/companies/${opp.company.id}`}
                        className="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-accent truncate"
                      >
                        <Building2 className="w-3 h-3 text-text-muted shrink-0" />
                        <span className="truncate">{opp.company.name}</span>
                      </Link>
                    ) : (
                      <div className="text-[11px] text-text-muted flex items-center gap-1">
                        <Building2 className="w-3 h-3 shrink-0" />
                        Unassigned Company
                      </div>
                    )}

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <StatusBadge status={opp.priority} />
                      {opp.workArrangement && opp.workArrangement !== 'UNKNOWN' && (
                        <Badge variant="default" className="text-[10px]">
                          {opp.workArrangement.toLowerCase()}
                        </Badge>
                      )}
                      {opp.salaryMin && (
                        <span className="text-[10px] text-text-muted font-mono">
                          {opp.salaryMin.toLocaleString()}
                          {opp.salaryMax ? `-${opp.salaryMax.toLocaleString()}` : ''}{' '}
                          {opp.salaryCurrency || 'EGP'}
                        </span>
                      )}
                    </div>

                    {/* Tech tags preview */}
                    {opp.requiredTechnologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {opp.requiredTechnologies.slice(0, 3).map((tech) => (
                          <span
                            key={tech}
                            className="text-[10px] bg-bg-tertiary text-text-secondary px-1 rounded"
                          >
                            {tech}
                          </span>
                        ))}
                        {opp.requiredTechnologies.length > 3 && (
                          <span className="text-[9px] text-text-muted">
                            +{opp.requiredTechnologies.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Quick stage progression */}
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                      {opp.status === 'SAVED' || opp.status === 'TO_REVIEW' ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleQuickStatus(opp.id, 'APPLIED')}
                          className="text-accent hover:underline flex items-center gap-0.5"
                        >
                          Mark Applied <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : opp.status === 'APPLIED' ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleQuickStatus(opp.id, 'INTERVIEW')}
                          className="text-warning hover:underline flex items-center gap-0.5"
                        >
                          Interviewing <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : opp.status === 'INTERVIEW' || opp.status === 'ASSESSMENT' ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleQuickStatus(opp.id, 'OFFER')}
                          className="text-success hover:underline flex items-center gap-0.5"
                        >
                          Got Offer <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-text-muted">
                          {opp.status}
                        </span>
                      )}

                      <Link
                        href={`/opportunities/${opp.id}`}
                        className="text-text-muted hover:text-text-primary p-0.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

