'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/src/components/ui/dialog'
import { deleteCompanyAction } from '@/src/server/actions/companies'

interface DeleteCompanyDialogProps {
  open: boolean
  onClose: () => void
  companyId: string | null
  companyName: string
  redirectTo?: string
}

export function DeleteCompanyDialog({
  open,
  onClose,
  companyId,
  companyName,
  redirectTo,
}: DeleteCompanyDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    if (!companyId) return

    startTransition(async () => {
      try {
        const result = await deleteCompanyAction(companyId)
        if (!result.success) {
          toast.error(result.error ?? 'Failed to delete company')
          return
        }

        toast.success(`Deleted ${companyName}`)
        onClose()
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          router.refresh()
        }
      } catch {
        toast.error('An unexpected error occurred while deleting')
      }
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={`Delete ${companyName}?`}
      description="Are you sure you want to delete this company? Related opportunities and contacts will have their company association removed."
      confirmLabel="Delete Company"
      loading={isPending}
    />
  )
}
