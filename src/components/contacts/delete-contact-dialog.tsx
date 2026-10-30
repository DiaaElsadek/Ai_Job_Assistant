'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/src/components/ui/dialog'
import { deleteContactAction } from '@/src/server/actions/contacts'

interface DeleteContactDialogProps {
  open: boolean
  onClose: () => void
  contact: { id: string; fullName: string } | null
  redirectAfterDelete?: boolean
}

export function DeleteContactDialog({
  open,
  onClose,
  contact,
  redirectAfterDelete = false,
}: DeleteContactDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    if (!contact) return

    startTransition(async () => {
      const res = await deleteContactAction(contact.id)
      if (!res.success) {
        toast.error(res.error || 'Failed to delete contact')
        return
      }

      toast.success('Contact deleted')
      onClose()

      if (redirectAfterDelete) {
        router.push('/contacts')
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
      title="Delete Contact"
      description={`Are you sure you want to delete ${contact?.fullName}? Recorded communication logs will also be removed.`}
      confirmLabel="Delete Contact"
      loading={isPending}
    />
  )
}

