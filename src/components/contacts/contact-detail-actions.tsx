'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2, MessageSquarePlus } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { ContactDialog, type ContactFormDataInput } from './contact-dialog'
import { DeleteContactDialog } from './delete-contact-dialog'
import { LogTouchpointDialog } from './log-touchpoint-dialog'
import { updateContactRelationshipStatusAction } from '@/src/server/actions/contacts'
import type { RelationshipStatus } from '@prisma/client'

interface ContactDetailActionsProps {
  contact: ContactFormDataInput & { id: string; fullName: string; relationshipStatus: RelationshipStatus }
  companies: { id: string; name: string }[]
}

const STAGE_OPTIONS: { value: RelationshipStatus; label: string }[] = [
  { value: 'TO_RESEARCH', label: 'Stage: To Research' },
  { value: 'READY_FOR_OUTREACH', label: 'Stage: Ready for Outreach' },
  { value: 'REQUEST_SENT', label: 'Stage: Request Sent' },
  { value: 'CONNECTED', label: 'Stage: Connected' },
  { value: 'MESSAGE_SENT', label: 'Stage: Message Sent' },
  { value: 'REPLIED', label: 'Stage: Replied' },
  { value: 'REFERRAL_DISCUSSED', label: 'Stage: Referral Discussed' },
  { value: 'FOLLOW_UP_NEEDED', label: 'Stage: Follow-up Needed' },
  { value: 'ARCHIVED', label: 'Stage: Archived' },
]

export function ContactDetailActions({
  contact,
  companies,
}: ContactDetailActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [touchpointOpen, setTouchpointOpen] = useState(false)

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value as RelationshipStatus
    startTransition(async () => {
      const res = await updateContactRelationshipStatusAction(contact.id, newStage)
      if (!res.success) {
        toast.error('Failed to change stage')
        return
      }
      toast.success(`Moved to ${newStage.replace(/_/g, ' ')}`)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={contact.relationshipStatus}
        onChange={handleStageChange}
        disabled={isPending}
        className="h-8 px-2.5 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
      >
        {STAGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <Button size="sm" onClick={() => setTouchpointOpen(true)}>
        <MessageSquarePlus className="w-3.5 h-3.5 mr-1" />
        Log Touchpoint
      </Button>

      <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
        <Pencil className="w-3.5 h-3.5 mr-1" />
        Edit
      </Button>

      <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>
        <Trash2 className="w-3.5 h-3.5 mr-1" />
        Delete
      </Button>

      <ContactDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        contact={contact}
        companies={companies}
      />

      <DeleteContactDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        contact={contact}
        redirectAfterDelete
      />

      <LogTouchpointDialog
        open={touchpointOpen}
        onClose={() => setTouchpointOpen(false)}
        contactId={contact.id}
        contactName={contact.fullName}
      />
    </div>
  )
}

