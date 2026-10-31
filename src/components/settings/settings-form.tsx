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
  Languages,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Select } from '@/src/components/ui/select'
import { updateSettingsAction } from '@/src/server/actions/settings'
import { useI18n, type Locale } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'
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

export function SettingsForm({ settings, ownerEmail }: SettingsFormProps) {
  const router = useRouter()
  const { t, locale, setLocale, isRtl } = useI18n()
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

  const EXPERIENCE_OPTIONS = [
    { value: 'INTERNSHIP', label: isRtl ? 'تدريب صيفي (Internship)' : 'Internship' },
    { value: 'FRESHER', label: isRtl ? 'حديث تخرج (Entry / Fresher)' : 'Fresher / Entry Level' },
    { value: 'JUNIOR', label: isRtl ? 'مطور مبتدئ (Junior)' : 'Junior' },
    { value: 'MID_LEVEL', label: isRtl ? 'متوسط الخبرة (Mid-Level)' : 'Mid-Level' },
    { value: 'SENIOR', label: isRtl ? 'مطور أول (Senior)' : 'Senior' },
  ]

  const WORK_ARRANGEMENT_OPTIONS = [
    { value: 'REMOTE', label: isRtl ? 'عن بُعد أولاً (Remote First)' : 'Remote First' },
    { value: 'HYBRID', label: isRtl ? 'هجين (Hybrid)' : 'Hybrid' },
    { value: 'ON_SITE', label: isRtl ? 'من المقر (On-Site)' : 'On-Site' },
    { value: 'UNKNOWN', label: isRtl ? 'أي نظام عمل (Any Arrangement)' : 'Any Arrangement' },
  ]

  const LANGUAGE_OPTIONS = [
    { value: 'EGYPTIAN_ARABIC', label: 'Egyptian Arabic (لهجة مصرية مهنية)' },
    { value: 'ENGLISH', label: 'English (إنجليزية)' },
    { value: 'MSA', label: 'Modern Standard Arabic (فصحى رسمية)' },
  ]

  const toggleExperience = (val: string) => {
    if (preferredExperience.includes(val)) {
      setPreferredExperience(preferredExperience.filter((e) => e !== val))
    } else {
      setPreferredExperience([...preferredExperience, val])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const formData = new FormData()
      formData.set('preferredRole', preferredRole)
      formData.set('targetCountry', targetCountry)
      formData.set('preferredExperience', preferredExperience.join(','))
      formData.set('workPreference', workPreference)
      formData.set('preferredLanguage', preferredLanguage)
      formData.set('dailyNetworkingTarget', dailyTarget)
      formData.set('followUpDefaultDays', followUpDays)
      formData.set('cvUrl', cvUrl)
      formData.set('theme', theme)

      const res = await updateSettingsAction(formData)
      if (res.success) {
        toast.success(t('settings.saveSuccess'))
        router.refresh()
      } else {
        setError(res.error || 'Failed to update settings')
        toast.error(res.error || 'Failed to update settings')
      }
    })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight">
          {t('settings.title')}
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          {t('settings.subtitle')}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account & Interface Language Card */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Languages className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">
              {t('settings.interfaceLanguage')}
            </h2>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-text-secondary">
              {t('settings.interfaceLanguageDesc')}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-2',
                  locale === 'en'
                    ? 'bg-accent/15 border-accent text-accent font-semibold'
                    : 'bg-bg-tertiary border-border text-text-secondary hover:text-text-primary'
                )}
              >
                <span>English</span>
                {locale === 'en' && <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent text-black">Active</span>}
              </button>
              <button
                type="button"
                onClick={() => setLocale('ar')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-2',
                  locale === 'ar'
                    ? 'bg-accent/15 border-accent text-accent font-semibold'
                    : 'bg-bg-tertiary border-border text-text-secondary hover:text-text-primary'
                )}
              >
                <span>العربية (Arabic)</span>
                {locale === 'ar' && <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent text-black">نشط</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Profile & Target Role Card */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <User className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">
              {t('settings.targetRole')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="preferredRole"
              label={t('settings.targetRole')}
              value={preferredRole}
              onChange={(e) => setPreferredRole(e.target.value)}
              placeholder={t('settings.targetRolePlaceholder')}
              required
            />

            <Input
              id="targetCountry"
              label={t('settings.targetCountry')}
              value={targetCountry}
              onChange={(e) => setTargetCountry(e.target.value)}
              placeholder={t('settings.targetCountryPlaceholder')}
              required
            />
          </div>

          {/* Experience level checkboxes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">
              {t('settings.seniority')}
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const isSelected = preferredExperience.includes(opt.value)
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => toggleExperience(opt.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      isSelected
                        ? 'bg-accent/15 border-accent text-accent'
                        : 'bg-bg-tertiary border-border text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Work arrangement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Select
              id="workPreference"
              label={t('opportunities.workMode')}
              value={workPreference}
              onChange={(e) => setWorkPreference(e.target.value as WorkArrangement)}
              options={WORK_ARRANGEMENT_OPTIONS}
            />

            <Select
              id="preferredLanguage"
              label={t('messages.targetLanguage')}
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as MessageLanguage)}
              options={LANGUAGE_OPTIONS}
            />
          </div>
        </div>

        {/* Cadence & Networking Goals Card */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Sliders className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">
              {t('settings.dailyTarget')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                id="dailyTarget"
                type="number"
                min="1"
                max="50"
                label={t('settings.dailyTarget')}
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                required
              />
              <p className="text-[11px] text-text-muted mt-1">
                {t('settings.dailyTargetDesc')}
              </p>
            </div>

            <div>
              <Input
                id="followUpDays"
                type="number"
                min="1"
                max="30"
                label={t('settings.followUpInterval')}
                value={followUpDays}
                onChange={(e) => setFollowUpDays(e.target.value)}
                required
              />
              <p className="text-[11px] text-text-muted mt-1">
                {t('settings.followUpIntervalDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio & CV Context Card */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <FileText className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">
              {t('settings.cvUrl')}
            </h2>
          </div>

          <div className="space-y-4">
            <Input
              id="cvUrl"
              type="url"
              label={t('settings.cvUrl')}
              value={cvUrl}
              onChange={(e) => setCvUrl(e.target.value)}
              placeholder="https://drive.google.com/... or https://yourportfolio.com"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={isPending}
            loading={isPending}
            size="md"
            className="shadow-sm"
          >
            <Save className={cn('w-4 h-4', isRtl ? 'ml-1.5' : 'mr-1.5')} />
            {isPending ? t('common.saving') : t('settings.saveBtn')}
          </Button>
        </div>
      </form>
    </div>
  )
}
