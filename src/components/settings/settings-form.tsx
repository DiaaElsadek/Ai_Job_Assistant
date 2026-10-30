'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Settings,
  Save,
  User,
  Globe,
  Briefcase,
  Sliders,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Select } from '@/src/components/ui/select'
import { updateSettingsAction } from '@/src/server/actions/settings'
import type { WorkArrangement, MessageLanguage } from '@prisma/client'

export interface SettingsData {
  id: string
  preferredRole: string
  targetCountry: string
  preferredExperience: string[]
  workPreference: WorkArrangement
  preferredLanguage: MessageLanguage
  dailyNetworkingTarget: number
  followUpDefaultDays: number
  cvFileReference: string | null
  cvUrl: string | null
  theme: string
}

interface SettingsFormProps {
  settings: SettingsData
  ownerEmail: string
}

const EXPERIENCE_OPTIONS = [
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'FRESHER', label: 'Fresher / Entry Level' },
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID_LEVEL', label: 'Mid-Level' },
  { value: 'SENIOR', label: 'Senior' },
]

const WORK_ARRANGEMENT_OPTIONS = [
  { value: 'REMOTE', label: 'Remote First' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ON_SITE', label: 'On-Site' },
  { value: 'UNKNOWN', label: 'Any Arrangement' },
]

const LANGUAGE_OPTIONS = [
  { value: 'EGYPTIAN_ARABIC', label: 'Egyptian Arabic (لهجة مصرية مهنية)' },
  { value: 'ENGLISH', label: 'English' },
  { value: 'MSA', label: 'Modern Standard Arabic (فصحى رسمية)' },
]

export function SettingsForm({ settings, ownerEmail }: SettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [preferredRole, setPreferredRole] = useState(settings.preferredRole)
  const [targetCountry, setTargetCountry] = useState(settings.targetCountry)
  const [preferredExperience, setPreferredExperience] = useState<string[]>(
    settings.preferredExperience
  )
  const [workPreference, setWorkPreference] = useState<WorkArrangement>(settings.workPreference)
  const [preferredLanguage, setPreferredLanguage] = useState<MessageLanguage>(
    settings.preferredLanguage
  )
  const [dailyTarget, setDailyTarget] = useState(String(settings.dailyNetworkingTarget))
  const [followUpDays, setFollowUpDays] = useState(String(settings.followUpDefaultDays))
  const [cvUrl, setCvUrl] = useState(settings.cvUrl || '')
  const [theme, setTheme] = useState(settings.theme || 'dark')

  const handleExperienceToggle = (level: string) => {
    if (preferredExperience.includes(level)) {
      setPreferredExperience(preferredExperience.filter((e) => e !== level))
    } else {
      setPreferredExperience([...preferredExperience, level])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.set('preferredRole', preferredRole)
    formData.set('targetCountry', targetCountry)
    preferredExperience.forEach((exp) => formData.append('preferredExperience', exp))
    formData.set('workPreference', workPreference)
    formData.set('preferredLanguage', preferredLanguage)
    formData.set('dailyNetworkingTarget', dailyTarget)
    formData.set('followUpDefaultDays', followUpDays)
    formData.set('cvUrl', cvUrl)
    formData.set('theme', theme)

    startTransition(async () => {
      const res = await updateSettingsAction(formData)
      if (!res.success) {
        setError(res.error || 'Failed to update preferences')
        toast.error(res.error || 'Failed to update preferences')
        return
      }

      toast.success('Preferences updated successfully!')
      router.refresh()
    })
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight">
          Job Search & Assistant Settings
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Customize your career targets, outreach defaults, and AI context generator.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-xs bg-error/10 border border-error/20 text-error rounded-md">
            {error}
          </div>
        )}

        {/* Account Info */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <User className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Single-Owner Account
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-text-muted block mb-1">Authenticated Owner Email</span>
              <span className="font-medium text-text-primary">{ownerEmail}</span>
            </div>
            <div>
              <span className="text-text-muted block mb-1">Access Model</span>
              <span className="text-text-secondary">Personal CRM (Protected Single User)</span>
            </div>
          </div>
        </div>

        {/* Job Search Targets */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Briefcase className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Target Career Goals
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="set-role"
              label="Preferred Job Role / Title *"
              placeholder="e.g. React.js / Next.js Frontend Developer"
              value={preferredRole}
              onChange={(e) => setPreferredRole(e.target.value)}
              required
            />

            <Input
              id="set-country"
              label="Target Country / Location *"
              placeholder="e.g. Egypt (or Remote Worldwide)"
              value={targetCountry}
              onChange={(e) => setTargetCountry(e.target.value)}
              required
            />
          </div>

          {/* Target Experience Checkboxes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">
              Target Seniority Levels
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const isSelected = preferredExperience.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleExperienceToggle(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-accent/15 border-accent text-accent font-semibold'
                        : 'bg-bg-tertiary border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="set-arrangement"
              label="Work Arrangement Preference"
              options={WORK_ARRANGEMENT_OPTIONS}
              value={workPreference}
              onChange={(e) => setWorkPreference(e.target.value as WorkArrangement)}
            />

            <Select
              id="set-language"
              label="Default Outreach Language"
              options={LANGUAGE_OPTIONS}
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as MessageLanguage)}
            />
          </div>
        </div>

        {/* Networking Cadence & Goals */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Clock className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Outreach Velocity & Automation Defaults
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="set-daily-target"
              type="number"
              min={1}
              max={50}
              label="Daily Networking Target (Contacts / Day)"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(e.target.value)}
              required
            />

            <Input
              id="set-followup-days"
              type="number"
              min={1}
              max={30}
              label="Default Follow-up Reminder (Days after outreach)"
              value={followUpDays}
              onChange={(e) => setFollowUpDays(e.target.value)}
              required
            />
          </div>

          <Input
            id="set-cv-url"
            type="url"
            label="Resume / Portfolio Live Link"
            placeholder="https://drive.google.com/file/... or https://portfolio.dev"
            value={cvUrl}
            onChange={(e) => setCvUrl(e.target.value)}
          />
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <Button type="submit" size="md" loading={isPending} disabled={isPending}>
            <Save className="w-4 h-4 mr-1.5" />
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  )
}

