'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Dialog } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Select } from '@/src/components/ui/select'
import { Textarea } from '@/src/components/ui/textarea'
import { logTouchpointAction } from '@/src/server/actions/contacts'

interface LogTouchpointDialogProps {
  open: boolean
  onClose: () => void
  contactId: string
  contactName: string
}

const TOUCHPOINT_TYPES = [
  { value: 'LinkedIn Connection', label: 'LinkedIn Connection Request' },
  { value: 'LinkedIn Message', label: 'LinkedIn Message / InMail' },
  { value: 'Cold Email', label: 'Cold Outreach Email' },
  { value: 'Follow-up Email', label: 'Follow-up Email' },
  { value: 'Phone / Video Call', label: 'Phone / Video Call' },
  { value: 'Referral Request', label: 'Referral Request Sent' },
  { value: 'Other', label: 'Other Touchpoint' },
]

export function LogTouchpointDialog({
  open,
  onClose,
  contactId,
  contactName,
}: LogTouchpointDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [type, setType] = useState('LinkedIn Message')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [content, setContent] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!content.trim()) {
      setError('Please provide a brief summary of the interaction.')
      return
    }

    const formData = new FormData()
    formData.set('type', type)
    formData.set('date', date)
    formData.set('content', content)
    formData.set('notes', notes)

    startTransition(async () => {
      const res = await logTouchpointAction(contactId, formData)
      if (!res.success) {
        setError(res.error || 'Failed to log touchpoint')
        toast.error(res.error || 'Failed to log touchpoint')
        return
      }

      toast.success('Touchpoint logged')
      setContent('')
      setNotes('')
      onClose()
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Log Touchpoint with ${contactName}`}
      description="Record an outreach interaction or message response in the contact timeline."
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-error/10 border border-error/20 text-error rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="touchpoint-type"
            label="Interaction Channel"
            options={TOUCHPOINT_TYPES}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />

          <Input
            id="touchpoint-date"
            type="date"
            label="Date of Interaction"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <Textarea
          id="touchpoint-content"
          label="Summary / Message Body *"
          rows={3}
          placeholder="Brief summary of what was sent or discussed..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />

        <Textarea
          id="touchpoint-notes"
          label="Outcome & Next Step (Optional)"
          rows={2}
          placeholder="e.g. Awaiting reply; promised to connect with hiring manager on Monday..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isPending} disabled={isPending}>
            Save Touchpoint
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

