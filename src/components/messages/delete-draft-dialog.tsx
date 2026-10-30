'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/src/components/ui/dialog'
import { deleteDraftAction } from '@/src/server/actions/messages'

interface DeleteDraftDialogProps {
  open: boolean
  onClose: () => void
  draft: { id: string; contentPreview: string } | null
  redirectAfterDelete?: boolean
}

export function DeleteDraftDialog({
  open,
  onClose,
  draft,
  redirectAfterDelete = false,
}: DeleteDraftDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    if (!draft) return

    startTransition(async () => {
      const res = await deleteDraftAction(draft.id)
      if (!res.success) {
        toast.error(res.error || 'Failed to delete draft')
        return
      }

      toast.success('Message draft deleted')
      onClose()

      if (redirectAfterDelete) {
        router.push('/messages')
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
      title="Delete Message Draft"
      description={`Are you sure you want to delete this draft: "${draft?.contentPreview}..."?`}
      confirmLabel="Delete Draft"
      loading={isPending}
    />
  )
}

