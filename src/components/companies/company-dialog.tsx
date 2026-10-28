'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Dialog } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Select } from '@/src/components/ui/select'
import { Textarea } from '@/src/components/ui/textarea'
import { createCompanyAction, updateCompanyAction } from '@/src/server/actions/companies'

export interface CompanyFormDataInput {
  id?: string
  name: string
  website?: string | null
  careersUrl?: string | null
  location?: string | null
  industry?: string | null
  technologies?: string[]
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  lastResearchedAt?: Date | string | null
  hiringNotes?: string | null
  notes?: string | null
}

interface CompanyDialogProps {
  open: boolean
  onClose: () => void
  company?: CompanyFormDataInput | null
}

const priorityOptions = [
  { value: 'LOW', label: 'Low Priority' },
  { value: 'MEDIUM', label: 'Medium Priority' },
  { value: 'HIGH', label: 'High Priority' },
  { value: 'URGENT', label: 'Urgent Target' },
]

export function CompanyDialog({ open, onClose, company }: CompanyDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEditing = !!company?.id

  const [name, setName] = useState(company?.name ?? '')
  const [website, setWebsite] = useState(company?.website ?? '')
  const [careersUrl, setCareersUrl] = useState(company?.careersUrl ?? '')
  const [location, setLocation] = useState(company?.location ?? '')
  const [industry, setIndustry] = useState(company?.industry ?? '')
  const [technologies, setTechnologies] = useState(
    company?.technologies?.join(', ') ?? ''
  )
  const [priority, setPriority] = useState<string>(company?.priority ?? 'MEDIUM')
  const [lastResearchedAt, setLastResearchedAt] = useState(
    company?.lastResearchedAt
      ? new Date(company.lastResearchedAt).toISOString().split('T')[0]
      : ''
  )
  const [hiringNotes, setHiringNotes] = useState(company?.hiringNotes ?? '')
  const [notes, setNotes] = useState(company?.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Company name is required.')
      return
    }

    const formData = new FormData()
    formData.append('name', name.trim())
    if (website.trim()) formData.append('website', website.trim())
    if (careersUrl.trim()) formData.append('careersUrl', careersUrl.trim())
    if (location.trim()) formData.append('location', location.trim())
    if (industry.trim()) formData.append('industry', industry.trim())
    if (technologies.trim()) formData.append('technologies', technologies.trim())
    formData.append('priority', priority)
    if (lastResearchedAt) formData.append('lastResearchedAt', lastResearchedAt)
    if (hiringNotes.trim()) formData.append('hiringNotes', hiringNotes.trim())
    if (notes.trim()) formData.append('notes', notes.trim())

    startTransition(async () => {
      try {
        const result = isEditing
          ? await updateCompanyAction(company.id!, formData)
          : await createCompanyAction(formData)

        if (!result.success) {
          setError(result.error ?? 'Failed to save company.')
          toast.error(result.error ?? 'Failed to save company.')
          return
        }

        toast.success(
          isEditing
            ? `Updated ${name.trim()}`
            : `Added ${name.trim()} to companies`
        )
        onClose()
        router.refresh()
      } catch {
        setError('An unexpected error occurred.')
        toast.error('An unexpected error occurred.')
      }
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit ${company.name}` : 'Add Target Company'}
      description={
        isEditing
          ? 'Update company details, tech stack, and research notes.'
          : 'Track an Egyptian tech employer, tech stack, and hiring activity.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
        {error && (
          <div className="p-2.5 rounded-md bg-error/10 border border-error/20 text-error text-xs">
            {error}
          </div>
        )}

        <Input
          id="company-name"
          label="Company Name *"
          placeholder="e.g. Fawry, Valu, Instabug"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            id="company-website"
            type="url"
            label="Website URL"
            placeholder="https://example.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />

          <Input
            id="company-careers"
            type="url"
            label="Careers / Jobs URL"
            placeholder="https://example.com/careers"
            value={careersUrl}
            onChange={(e) => setCareersUrl(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            id="company-location"
            label="Location"
            placeholder="e.g. Cairo, New Cairo, Smart Village"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <Input
            id="company-industry"
            label="Industry"
            placeholder="e.g. Fintech, Healthcare, SaaS"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>

        <Input
          id="company-technologies"
          label="Verified Technologies (comma-separated)"
          placeholder="React, Next.js, TypeScript, Tailwind, GraphQL"
          value={technologies}
          onChange={(e) => setTechnologies(e.target.value)}
          hint="Key frontend tech stack identified for outreach relevance"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            id="company-priority"
            label="Target Priority"
            options={priorityOptions}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />

          <Input
            id="company-last-researched"
            type="date"
            label="Last Researched Date"
            value={lastResearchedAt}
            onChange={(e) => setLastResearchedAt(e.target.value)}
          />
        </div>

        <Textarea
          id="company-hiring-notes"
          label="Hiring & Team Signals"
          placeholder="e.g. Actively scaling frontend team; hiring manager posted on LinkedIn looking for React devs with Next.js experience..."
          rows={3}
          value={hiringNotes}
          onChange={(e) => setHiringNotes(e.target.value)}
        />

        <Textarea
          id="company-notes"
          label="General Notes"
          placeholder="Internal notes, interview tips, office location, mutual connections..."
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isPending}
            disabled={isPending}
          >
            {isEditing ? 'Save Changes' : 'Create Company'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
