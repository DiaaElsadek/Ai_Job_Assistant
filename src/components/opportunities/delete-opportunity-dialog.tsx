'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/src/components/ui/dialog'
import { deleteOpportunityAction } from '@/src/server/actions/opportunities'

interface DeleteOpportunityDialogProps {
  open: boolean
  onClose: () => void
  opportunity: { id: string; title: string } | null
  redirectAfterDelete?: boolean
}

export function DeleteOpportunityDialog({
  open,
  onClose,
  opportunity,
  redirectAfterDelete = false,
}: DeleteOpportunityDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    if (!opportunity) return

    startTransition(async () => {
      const res = await deleteOpportunityAction(opportunity.id)
      if (!res.success) {
        toast.error(res.error || 'Failed to delete opportunity')
        return
      }

      toast.success('Opportunity deleted')
      onClose()

      if (redirectAfterDelete) {
        router.push('/opportunities')
      } else {
        router.refresh()
      }
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Opportunity"
      description={`Are you sure you want to delete "${opportunity?.title}"? Linked outreach and logs will remain unassigned.`}
      confirmLabel="Delete Opportunity"
      loading={isPending}
    />
  )
}
