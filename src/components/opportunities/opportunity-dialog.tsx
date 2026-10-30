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
  createOpportunityAction,
  updateOpportunityAction,
} from '@/src/server/actions/opportunities'

export interface OpportunityFormDataInput {
  id?: string
  title: string
  companyId?: string | null
  description?: string | null
  requiredTechnologies?: string[]
  experienceLevel?: 'INTERNSHIP' | 'FRESHER' | 'JUNIOR' | 'MID_LEVEL' | 'SENIOR' | 'UNKNOWN'
  location?: string | null
  workArrangement?: 'ON_SITE' | 'HYBRID' | 'REMOTE' | 'UNKNOWN'
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  jobUrl?: string | null
  applicationUrl?: string | null
  sourceName?: string | null
  sourceUrl?: string | null
  deadline?: Date | string | null
  dateApplied?: Date | string | null
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status?: 'SAVED' | 'TO_REVIEW' | 'READY_TO_APPLY' | 'APPLIED' | 'ASSESSMENT' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'CLOSED'
  verificationFlag?: 'VERIFIED' | 'OUTDATED' | 'UNCERTAIN'
  notes?: string | null
}

interface OpportunityDialogProps {
  open: boolean
  onClose: () => void
  opportunity?: OpportunityFormDataInput | null
  companies: { id: string; name: string }[]
}

export function OpportunityDialog({
  open,
  onClose,
  opportunity,
  companies,
}: OpportunityDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!opportunity?.id

  // Form states
  const [title, setTitle] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [description, setDescription] = useState('')
  const [technologies, setTechnologies] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('JUNIOR')
  const [workArrangement, setWorkArrangement] = useState('REMOTE')
  const [location, setLocation] = useState('')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [salaryCurrency, setSalaryCurrency] = useState('EGP')
  const [jobUrl, setJobUrl] = useState('')
  const [applicationUrl, setApplicationUrl] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [dateApplied, setDateApplied] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [status, setStatus] = useState('SAVED')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (opportunity) {
      setTitle(opportunity.title || '')
      setCompanyId(opportunity.companyId || '')
      setDescription(opportunity.description || '')
      setTechnologies(opportunity.requiredTechnologies?.join(', ') || '')
      setExperienceLevel(opportunity.experienceLevel || 'JUNIOR')
      setWorkArrangement(opportunity.workArrangement || 'REMOTE')
      setLocation(opportunity.location || '')
      setSalaryMin(opportunity.salaryMin ? String(opportunity.salaryMin) : '')
      setSalaryMax(opportunity.salaryMax ? String(opportunity.salaryMax) : '')
      setSalaryCurrency(opportunity.salaryCurrency || 'EGP')
      setJobUrl(opportunity.jobUrl || '')
      setApplicationUrl(opportunity.applicationUrl || '')
      setSourceName(opportunity.sourceName || '')
      setDeadline(
        opportunity.deadline
          ? new Date(opportunity.deadline).toISOString().slice(0, 10)
          : ''
      )
      setDateApplied(
        opportunity.dateApplied
          ? new Date(opportunity.dateApplied).toISOString().slice(0, 10)
          : ''
      )
      setPriority(opportunity.priority || 'MEDIUM')
      setStatus(opportunity.status || 'SAVED')
      setNotes(opportunity.notes || '')
    } else {
      setTitle('')
      setCompanyId('')
      setDescription('')
      setTechnologies('React, Next.js, TypeScript, Tailwind CSS')
      setExperienceLevel('JUNIOR')
      setWorkArrangement('REMOTE')
      setLocation('Egypt (or Remote)')
      setSalaryMin('')
      setSalaryMax('')
      setSalaryCurrency('EGP')
      setJobUrl('')
      setApplicationUrl('')
      setSourceName('')
      setDeadline('')
      setDateApplied('')
      setPriority('MEDIUM')
      setStatus('SAVED')
      setNotes('')
    }
    setError(null)
  }, [opportunity, open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.set('title', title)
    formData.set('companyId', companyId)
    formData.set('description', description)
    formData.set('requiredTechnologies', technologies)
    formData.set('experienceLevel', experienceLevel)
    formData.set('workArrangement', workArrangement)
    formData.set('location', location)
    if (salaryMin) formData.set('salaryMin', salaryMin)
    if (salaryMax) formData.set('salaryMax', salaryMax)
    formData.set('salaryCurrency', salaryCurrency)
    formData.set('jobUrl', jobUrl)
    formData.set('applicationUrl', applicationUrl)
    formData.set('sourceName', sourceName)
    if (deadline) formData.set('deadline', deadline)
    if (dateApplied) formData.set('dateApplied', dateApplied)
    formData.set('priority', priority)
    formData.set('status', status)
    formData.set('notes', notes)

    startTransition(async () => {
      const res = isEditing
        ? await updateOpportunityAction(opportunity.id!, formData)
        : await createOpportunityAction(formData)

      if (!res.success) {
        setError(res.error || 'Failed to save opportunity')
        toast.error(res.error || 'Failed to save opportunity')
        return
      }

      toast.success(isEditing ? 'Opportunity updated' : 'Opportunity created')
      onClose()
      router.refresh()
    })
  }

  const companyOptions = [
    { value: '', label: 'None (Unassigned)' },
    ...companies.map(c => ({ value: c.id, label: c.name })),
  ]

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ]

  const statusOptions = [
    { value: 'SAVED', label: 'Saved' },
    { value: 'TO_REVIEW', label: 'To Review' },
    { value: 'READY_TO_APPLY', label: 'Ready to Apply' },
    { value: 'APPLIED', label: 'Applied' },
    { value: 'ASSESSMENT', label: 'Assessment / Task' },
    { value: 'INTERVIEW', label: 'Interview' },
    { value: 'OFFER', label: 'Offer' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CLOSED', label: 'Closed' },
  ]

  const experienceOptions = [
    { value: 'INTERNSHIP', label: 'Internship' },
    { value: 'FRESHER', label: 'Fresher / Entry' },
    { value: 'JUNIOR', label: 'Junior' },
    { value: 'MID_LEVEL', label: 'Mid-Level' },
    { value: 'SENIOR', label: 'Senior' },
    { value: 'UNKNOWN', label: 'Unknown' },
  ]

  const arrangementOptions = [
    { value: 'REMOTE', label: 'Remote' },
    { value: 'HYBRID', label: 'Hybrid' },
    { value: 'ON_SITE', label: 'On-site' },
    { value: 'UNKNOWN', label: 'Unknown' },
  ]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Opportunity' : 'Add New Opportunity'}
      description="Track a target job opening, application requirements, and status."
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
            id="opp-title"
            label="Job Title *"
            placeholder="e.g. Junior Frontend Developer"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />

          <Select
            id="opp-company"
            label="Target Company"
            options={companyOptions}
            value={companyId}
            onChange={e => setCompanyId(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Select
            id="opp-status"
            label="Status"
            options={statusOptions}
            value={status}
            onChange={e => setStatus(e.target.value)}
          />

          <Select
            id="opp-priority"
            label="Priority"
            options={priorityOptions}
            value={priority}
            onChange={e => setPriority(e.target.value)}
          />

          <Select
            id="opp-experience"
            label="Experience"
            options={experienceOptions}
            value={experienceLevel}
            onChange={e => setExperienceLevel(e.target.value)}
          />

          <Select
            id="opp-arrangement"
            label="Arrangement"
            options={arrangementOptions}
            value={workArrangement}
            onChange={e => setWorkArrangement(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="opp-location"
            label="Location"
            placeholder="e.g. Cairo, Egypt (or Remote)"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />

          <Input
            id="opp-technologies"
            label="Required Technologies (comma-separated)"
            placeholder="React, Next.js, TypeScript, Tailwind"
            value={technologies}
            onChange={e => setTechnologies(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            id="opp-salary-min"
            type="number"
            label="Min Salary"
            placeholder="e.g. 15000"
            value={salaryMin}
            onChange={e => setSalaryMin(e.target.value)}
          />

          <Input
            id="opp-salary-max"
            type="number"
            label="Max Salary"
            placeholder="e.g. 25000"
            value={salaryMax}
            onChange={e => setSalaryMax(e.target.value)}
          />

          <Input
            id="opp-currency"
            label="Currency"
            placeholder="EGP / USD"
            value={salaryCurrency}
            onChange={e => setSalaryCurrency(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="opp-job-url"
            type="url"
            label="Job Posting URL"
            placeholder="https://linkedin.com/jobs/..."
            value={jobUrl}
            onChange={e => setJobUrl(e.target.value)}
          />

          <Input
            id="opp-app-url"
            type="url"
            label="Application Link"
            placeholder="https://company.com/apply/..."
            value={applicationUrl}
            onChange={e => setApplicationUrl(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            id="opp-source"
            label="Source Name"
            placeholder="LinkedIn / Wuzzuf / Referral"
            value={sourceName}
            onChange={e => setSourceName(e.target.value)}
          />

          <Input
            id="opp-deadline"
            type="date"
            label="Deadline"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />

          <Input
            id="opp-date-applied"
            type="date"
            label="Date Applied"
            value={dateApplied}
            onChange={e => setDateApplied(e.target.value)}
          />
        </div>

        <Textarea
          id="opp-description"
          label="Job Description Highlights / Key Requirements"
          rows={3}
          placeholder="Key responsibilities, team details, tech expectations..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <Textarea
          id="opp-notes"
          label="Personal Strategy Notes"
          rows={2}
          placeholder="Referral targets, tailored CV tweaks, interview prep thoughts..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isPending} disabled={isPending}>
            {isEditing ? 'Save Changes' : 'Create Opportunity'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
