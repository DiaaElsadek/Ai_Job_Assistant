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
  createContactAction,
  updateContactAction,
} from '@/src/server/actions/contacts'

export interface ContactFormDataInput {
  id?: string
  fullName: string
  role?: string | null
  companyId?: string | null
  profileUrl?: string | null
  publicSourceUrl?: string | null
  category?: 'RECRUITER' | 'HR' | 'SENIOR_FRONTEND_DEV' | 'TECH_LEAD' | 'ENGINEERING_MANAGER' | 'OTHER'
  location?: string | null
  reasonForTargeting?: string | null
  personalizationNotes?: string | null
  relationshipStatus?: 'TO_RESEARCH' | 'READY_FOR_OUTREACH' | 'REQUEST_SENT' | 'CONNECTED' | 'MESSAGE_SENT' | 'REPLIED' | 'REFERRAL_DISCUSSED' | 'FOLLOW_UP_NEEDED' | 'ARCHIVED'
  lastContactDate?: Date | string | null
  nextFollowUpDate?: Date | string | null
  networkingPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  verificationStatus?: 'VERIFIED' | 'OUTDATED' | 'UNCERTAIN'
  notes?: string | null
}

interface ContactDialogProps {
  open: boolean
  onClose: () => void
  contact?: ContactFormDataInput | null
  companies: { id: string; name: string }[]
}

export function ContactDialog({
  open,
  onClose,
  contact,
  companies,
}: ContactDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!contact?.id

  // Form states
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [category, setCategory] = useState('RECRUITER')
  const [profileUrl, setProfileUrl] = useState('')
  const [location, setLocation] = useState('')
  const [reasonForTargeting, setReasonForTargeting] = useState('')
  const [personalizationNotes, setPersonalizationNotes] = useState('')
  const [relationshipStatus, setRelationshipStatus] = useState('TO_RESEARCH')
  const [networkingPriority, setNetworkingPriority] = useState('MEDIUM')
  const [nextFollowUpDate, setNextFollowUpDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (contact) {
      setFullName(contact.fullName || '')
      setRole(contact.role || '')
      setCompanyId(contact.companyId || '')
      setCategory(contact.category || 'RECRUITER')
      setProfileUrl(contact.profileUrl || '')
      setLocation(contact.location || '')
      setReasonForTargeting(contact.reasonForTargeting || '')
      setPersonalizationNotes(contact.personalizationNotes || '')
      setRelationshipStatus(contact.relationshipStatus || 'TO_RESEARCH')
      setNetworkingPriority(contact.networkingPriority || 'MEDIUM')
      setNextFollowUpDate(
        contact.nextFollowUpDate
          ? new Date(contact.nextFollowUpDate).toISOString().slice(0, 10)
          : ''
      )
      setNotes(contact.notes || '')
    } else {
      setFullName('')
      setRole('')
      setCompanyId('')
      setCategory('RECRUITER')
      setProfileUrl('')
      setLocation('Egypt (or Remote)')
      setReasonForTargeting('')
      setPersonalizationNotes('')
      setRelationshipStatus('TO_RESEARCH')
      setNetworkingPriority('MEDIUM')
      setNextFollowUpDate('')
      setNotes('')
    }
    setError(null)
  }, [contact, open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.set('fullName', fullName)
    formData.set('role', role)
    formData.set('companyId', companyId)
    formData.set('category', category)
    formData.set('profileUrl', profileUrl)
    formData.set('location', location)
    formData.set('reasonForTargeting', reasonForTargeting)
    formData.set('personalizationNotes', personalizationNotes)
    formData.set('relationshipStatus', relationshipStatus)
    formData.set('networkingPriority', networkingPriority)
    if (nextFollowUpDate) formData.set('nextFollowUpDate', nextFollowUpDate)
    formData.set('notes', notes)

    startTransition(async () => {
      const res = isEditing
        ? await updateContactAction(contact.id!, formData)
        : await createContactAction(formData)

      if (!res.success) {
        setError(res.error || 'Failed to save contact')
        toast.error(res.error || 'Failed to save contact')
        return
      }

      toast.success(isEditing ? 'Contact updated' : 'Contact created')
      onClose()
      router.refresh()
    })
  }

  const companyOptions = [
    { value: '', label: 'None (Unassigned)' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ]

  const categoryOptions = [
    { value: 'RECRUITER', label: 'Tech Recruiter' },
    { value: 'HR', label: 'HR / Talent Acquisition' },
    { value: 'SENIOR_FRONTEND_DEV', label: 'Senior Frontend Dev' },
    { value: 'TECH_LEAD', label: 'Tech Lead / Principal' },
    { value: 'ENGINEERING_MANAGER', label: 'Engineering Manager' },
    { value: 'OTHER', label: 'Other Peer / Connection' },
  ]

  const relationshipOptions = [
    { value: 'TO_RESEARCH', label: 'To Research' },
    { value: 'READY_FOR_OUTREACH', label: 'Ready for Outreach' },
    { value: 'REQUEST_SENT', label: 'Connection Request Sent' },
    { value: 'CONNECTED', label: 'Connected' },
    { value: 'MESSAGE_SENT', label: 'Message Sent' },
    { value: 'REPLIED', label: 'Replied / In Conversation' },
    { value: 'REFERRAL_DISCUSSED', label: 'Referral Discussed' },
    { value: 'FOLLOW_UP_NEEDED', label: 'Follow-up Needed' },
    { value: 'ARCHIVED', label: 'Archived' },
  ]

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Contact' : 'Add New Contact'}
      description="Track hiring managers, recruiters, and engineers for referral networking."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-error/10 border border-error/20 text-error rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="contact-name"
            label="Full Name *"
            placeholder="e.g. Ahmed Mostafa"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            id="contact-role"
            label="Current Role / Title"
            placeholder="e.g. Senior Tech Recruiter / Frontend Lead"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            id="contact-company"
            label="Affiliated Company"
            options={companyOptions}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          />

          <Select
            id="contact-category"
            label="Contact Category"
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            id="contact-status"
            label="Relationship Stage"
            options={relationshipOptions}
            value={relationshipStatus}
            onChange={(e) => setRelationshipStatus(e.target.value)}
          />

          <Select
            id="contact-priority"
            label="Priority"
            options={priorityOptions}
            value={networkingPriority}
            onChange={(e) => setNetworkingPriority(e.target.value)}
          />

          <Input
            id="contact-followup"
            type="date"
            label="Next Follow-up"
            value={nextFollowUpDate}
            onChange={(e) => setNextFollowUpDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="contact-profile-url"
            type="url"
            label="LinkedIn / Profile URL"
            placeholder="https://linkedin.com/in/..."
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
          />

          <Input
            id="contact-location"
            label="Location"
            placeholder="e.g. Cairo, Egypt (or Remote)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <Textarea
          id="contact-reason"
          label="Why Target This Person? (Common ground / mutuals)"
          rows={2}
          placeholder="e.g. React team lead at FinTech target company; shared university background..."
          value={reasonForTargeting}
          onChange={(e) => setReasonForTargeting(e.target.value)}
        />

        <Textarea
          id="contact-personalization"
          label="Personalization Facts (for AI outreach)"
          rows={2}
          placeholder="Key tech interests, recent posts, open questions about their team..."
          value={personalizationNotes}
          onChange={(e) => setPersonalizationNotes(e.target.value)}
        />

        <Textarea
          id="contact-notes"
          label="General Notes"
          rows={2}
          placeholder="Conversation takeaways, dates, referrals..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isPending} disabled={isPending}>
            {isEditing ? 'Save Changes' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

