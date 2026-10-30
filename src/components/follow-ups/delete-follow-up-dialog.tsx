'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/src/components/ui/dialog'
import { deleteFollowUpAction } from '@/src/server/actions/follow-ups'

interface DeleteFollowUpDialogProps {
  open: boolean
  onClose: () => void
  task: { id: string; title: string } | null
}

export function DeleteFollowUpDialog({
  open,
  onClose,
  task,
}: DeleteFollowUpDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    if (!task) return

    startTransition(async () => {
      const res = await deleteFollowUpAction(task.id)
      if (!res.success) {
        toast.error(res.error || 'Failed to delete task')
        return
      }

      toast.success('Follow-up task deleted')
      onClose()
      router.refresh()
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Follow-up Task"
      description={`Are you sure you want to remove "${task?.title}"?`}
      confirmLabel="Delete Task"
      loading={isPending}
    />
  )
}

