'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { OpportunityDialog, type OpportunityFormDataInput } from './opportunity-dialog'
import { DeleteOpportunityDialog } from './delete-opportunity-dialog'
import { updateOpportunityStatusAction } from '@/src/server/actions/opportunities'
import type { OpportunityStatus } from '@prisma/client'

interface OpportunityDetailActionsProps {
  opportunity: OpportunityFormDataInput & { id: string; title: string; status: OpportunityStatus }
  companies: { id: string; name: string }[]
}

const STATUS_OPTIONS: { value: OpportunityStatus; label: string }[] = [
  { value: 'SAVED', label: 'Stage: Saved' },
  { value: 'TO_REVIEW', label: 'Stage: To Review' },
  { value: 'READY_TO_APPLY', label: 'Stage: Ready to Apply' },
  { value: 'APPLIED', label: 'Stage: Applied' },
  { value: 'ASSESSMENT', label: 'Stage: Assessment' },
  { value: 'INTERVIEW', label: 'Stage: Interview' },
  { value: 'OFFER', label: 'Stage: Offer' },
  { value: 'REJECTED', label: 'Stage: Rejected' },
  { value: 'CLOSED', label: 'Stage: Closed' },
]

export function OpportunityDetailActions({
  opportunity,
  companies,
}: OpportunityDetailActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OpportunityStatus
    startTransition(async () => {
      const res = await updateOpportunityStatusAction(opportunity.id, newStatus)
      if (!res.success) {
        toast.error('Failed to change status')
        return
      }
      toast.success(`Status updated to ${newStatus}`)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={opportunity.status}
        onChange={handleStatusChange}
        disabled={isPending}
        className="h-8 px-2.5 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
        <Pencil className="w-3.5 h-3.5 mr-1" />
        Edit
      </Button>

      <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>
        <Trash2 className="w-3.5 h-3.5 mr-1" />
        Delete
      </Button>

      <OpportunityDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        opportunity={opportunity}
        companies={companies}
      />

      <DeleteOpportunityDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        opportunity={opportunity}
        redirectAfterDelete
      />
    </div>
  )
}

