'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Dialog } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Select } from '@/src/components/ui/select'
import { Textarea } from '@/src/components/ui/textarea'
import {
  createFollowUpAction,
  updateFollowUpAction,
} from '@/src/server/actions/follow-ups'

export interface FollowUpFormDataInput {
  id?: string
  title: string
  dueDate: Date | string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  state?: 'OPEN' | 'COMPLETED' | 'DISMISSED'
  contactId?: string | null
  companyId?: string | null
  opportunityId?: string | null
  notes?: string | null
  result?: string | null
}

interface FollowUpDialogProps {
  open: boolean
  onClose: () => void
  task?: FollowUpFormDataInput | null
  contacts: { id: string; fullName: string }[]
  companies: { id: string; name: string }[]
  opportunities: { id: string; title: string }[]
}

export function FollowUpDialog({
  open,
  onClose,
  task,
  contacts,
  companies,
  opportunities,
}: FollowUpDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!task?.id

  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [contactId, setContactId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [opportunityId, setOpportunityId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setDueDate(
        task.dueDate
          ? new Date(task.dueDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      )
      setPriority(task.priority || 'MEDIUM')
      setContactId(task.contactId || '')
      setCompanyId(task.companyId || '')
      setOpportunityId(task.opportunityId || '')
      setNotes(task.notes || '')
    } else {
      setTitle('')
      // Default due in 3 days
      const d = new Date()
      d.setDate(d.getDate() + 3)
      setDueDate(d.toISOString().slice(0, 10))
      setPriority('MEDIUM')
      setContactId('')
      setCompanyId('')
      setOpportunityId('')
      setNotes('')
    }
    setError(null)
  }, [task, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Task title is required')
      return
    }

    const formData = new FormData()
    formData.set('title', title)
    formData.set('dueDate', dueDate)
    formData.set('priority', priority)
    formData.set('contactId', contactId)
    formData.set('companyId', companyId)
    formData.set('opportunityId', opportunityId)
    formData.set('notes', notes)

    startTransition(async () => {
      const res = isEditing
        ? await updateFollowUpAction(task.id!, formData)
        : await createFollowUpAction(formData)

      if (!res.success) {
        setError(res.error || 'Failed to save follow-up task')
        toast.error(res.error || 'Failed to save follow-up task')
        return
      }

      toast.success(isEditing ? 'Task updated' : 'Follow-up task scheduled')
      onClose()
      router.refresh()
    })
  }

  const contactOptions = [
    { value: '', label: 'None (Unassigned Contact)' },
    ...contacts.map((c) => ({ value: c.id, label: c.fullName })),
  ]

  const companyOptions = [
    { value: '', label: 'None (Unassigned Company)' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ]

  const opportunityOptions = [
    { value: '', label: 'None (Unassigned Opportunity)' },
    ...opportunities.map((o) => ({ value: o.id, label: o.title })),
  ]

  const priorityOptions = [
    { value: 'LOW', label: 'Low Priority' },
    { value: 'MEDIUM', label: 'Medium Priority' },
    { value: 'HIGH', label: 'High Priority' },
    { value: 'URGENT', label: 'Urgent' },
  ]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Follow-up Task' : 'Schedule Follow-up Task'}
      description="Set a timely reminder to check in on sent outreach or application status."
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-error/10 border border-error/20 text-error rounded-md">
            {error}
          </div>
        )}

        <Input
          id="task-title"
          label="Follow-up Action *"
          placeholder="e.g. Check in with Ahmed about Next.js vacancy referral"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="task-due-date"
            type="date"
            label="Due Date *"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />

          <Select
            id="task-priority"
            label="Priority"
            options={priorityOptions}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="task-contact"
            label="Related Contact"
            options={contactOptions}
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
          />

          <Select
            id="task-company"
            label="Related Company"
            options={companyOptions}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          />
        </div>

        <Select
          id="task-opp"
          label="Related Job Opportunity"
          options={opportunityOptions}
          value={opportunityId}
          onChange={(e) => setOpportunityId(e.target.value)}
        />

        <Textarea
          id="task-notes"
          label="Task Strategy Notes"
          rows={2}
          placeholder="Specific talking points or questions to ask in the follow-up..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isPending} disabled={isPending}>
            {isEditing ? 'Save Changes' : 'Schedule Reminder'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

