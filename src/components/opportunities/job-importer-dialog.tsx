'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Sparkles,
  Link as LinkIcon,
  FileText,
  Building2,
  Loader2,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
} from 'lucide-react'
import { Dialog } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Badge } from '@/src/components/ui/badge'
import {
  parseJobPostingAction,
  importOpportunityAction,
} from '@/src/server/actions/opportunities'
import type { ParsedJobPosting } from '@/src/lib/ai/job-parser'
import { useI18n } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'

interface JobImporterDialogProps {
  open: boolean
  onClose: () => void
  companies: { id: string; name: string }[]
}

export function JobImporterDialog({
  open,
  onClose,
  companies,
}: JobImporterDialogProps) {
  const router = useRouter()
  const { t, isRtl } = useI18n()
  const [tab, setTab] = useState<'text' | 'url'>('text')
  const [rawText, setRawText] = useState('')
  const [jobUrl, setJobUrl] = useState('')

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isImporting, startTransition] = useTransition()

  // Extracted data state
  const [extracted, setExtracted] = useState<ParsedJobPosting | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [createCompanyIfMissing, setCreateCompanyIfMissing] = useState(true)

  // Handle AI analysis
  const handleAnalyze = async () => {
    if (tab === 'text' && !rawText.trim()) {
      toast.error('Please paste job posting text first.')
      return
    }
    if (tab === 'url' && !jobUrl.trim()) {
      toast.error('Please enter a valid job URL.')
      return
    }

    setIsAnalyzing(true)
    try {
      const res = await parseJobPostingAction(
        tab === 'text' ? rawText : '',
        tab === 'url' ? jobUrl : undefined
      )

      if (!res.success || !res.data) {
        toast.error(res.error || 'Failed to extract job posting details.')
        return
      }

      setExtracted(res.data)

      // Try matching extracted company name to existing companies list
      const matched = companies.find(
        (c) => c.name.toLowerCase() === res.data!.companyName.toLowerCase()
      )
      if (matched) {
        setSelectedCompanyId(matched.id)
        setCreateCompanyIfMissing(false)
      } else {
        setSelectedCompanyId('')
        setCreateCompanyIfMissing(true)
      }

      toast.success('Job details extracted successfully!')
    } catch (err) {
      console.error('Job analysis error:', err)
      toast.error('Something went wrong during extraction.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Handle final opportunity import
  const handleConfirmImport = () => {
    if (!extracted) return

    startTransition(async () => {
      const res = await importOpportunityAction(extracted, {
        companyId: selectedCompanyId || undefined,
        createCompanyIfMissing,
        jobUrl: tab === 'url' ? jobUrl : undefined,
      })

      if (!res.success) {
        toast.error(res.error || 'Failed to import opportunity.')
        return
      }

      toast.success('Opportunity imported and added to pipeline!')
      handleReset()
      onClose()
      router.refresh()
    })
  }

  const handleReset = () => {
    setExtracted(null)
    setRawText('')
    setJobUrl('')
    setSelectedCompanyId('')
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        handleReset()
        onClose()
      }}
      title={isRtl ? 'استيراد فرصة عمل بالذكاء الاصطناعي' : 'Import Job Posting via AI'}
      description={
        isRtl
          ? 'الصق نص الوظيفة أو الرابط، وسيقوم الذكاء الاصطناعي باستخراج المتطلبات والراتب والشركة تلقائيًا.'
          : 'Paste raw job text or URL. Gemini will extract requirements, stack, salary, and company metadata.'
      }
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {!extracted ? (
          <>
            {/* Input Mode Tabs */}
            <div className="flex border-b border-border text-xs font-medium">
              <button
                type="button"
                onClick={() => setTab('text')}
                className={cn(
                  'flex items-center gap-2 pb-2.5 px-3 border-b-2 transition-colors',
                  tab === 'text'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                )}
              >
                <FileText className="w-4 h-4" />
                {isRtl ? 'لصق نص الإعلان' : 'Paste Job Text'}
              </button>
              <button
                type="button"
                onClick={() => setTab('url')}
                className={cn(
                  'flex items-center gap-2 pb-2.5 px-3 border-b-2 transition-colors',
                  tab === 'url'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                )}
              >
                <LinkIcon className="w-4 h-4" />
                {isRtl ? 'رابط الوظيفة (URL)' : 'Job URL'}
              </button>
            </div>

            {/* Tab 1: Raw Text */}
            {tab === 'text' ? (
              <div className="space-y-2">
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={
                    isRtl
                      ? 'الصق وصف الوظيفة هنا (المسمى، المتطلبات، اسم الشركة، الراتب)...'
                      : 'Paste the full job description here (title, requirements, company name, salary range)...'
                  }
                  rows={9}
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-text-muted">
                  {isRtl
                    ? 'يدعم إعلانات LinkedIn و Wuzzuf ووظائف الشركات عن بُعد.'
                    : 'Supports LinkedIn, Wuzzuf, Greenhouse, Lever, and remote job boards.'}
                </p>
              </div>
            ) : (
              /* Tab 2: Job URL */
              <div className="space-y-2">
                <Input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://company.com/careers/senior-frontend-engineer"
                  className="text-xs"
                />
                <p className="text-[11px] text-text-muted">
                  {isRtl
                    ? 'سيقوم النظام بقراءة محتوى الصفحة واستخراج البيانات تلقائيًا.'
                    : 'We will fetch the public job page and extract its structured contents.'}
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleReset()
                  onClose()
                }}
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                onClick={handleAnalyze}
                disabled={isAnalyzing || (tab === 'text' ? !rawText.trim() : !jobUrl.trim())}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isRtl ? 'جاري التحليل بالذكاء الاصطناعي...' : 'Extracting with Gemini...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-accent-light" />
                    {isRtl ? 'تحليل واستخراج البيانات' : 'Analyze & Extract'}
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          /* Extracted Data Review Panel */
          <div className="space-y-4">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-center gap-2.5 text-xs text-text-primary">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
              <span>
                {isRtl
                  ? 'تم استخراج بيانات الوظيفة بنجاح. راجع الحقول أدناه ثم اضغط استيراد.'
                  : 'Extracted successfully. Review and adjust fields before adding to your pipeline.'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Job Title */}
              <div>
                <label className="block text-text-muted mb-1">{isRtl ? 'مسمى الوظيفة' : 'Job Title'}</label>
                <Input
                  value={extracted.title}
                  onChange={(e) => setExtracted({ ...extracted, title: e.target.value })}
                  className="text-xs"
                />
              </div>

              {/* Company Selection / Matching */}
              <div>
                <label className="block text-text-muted mb-1">{isRtl ? 'الشركة المستهدفة' : 'Target Company'}</label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => {
                    setSelectedCompanyId(e.target.value)
                    if (e.target.value) setCreateCompanyIfMissing(false)
                  }}
                  className="w-full h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">
                    {extracted.companyName
                      ? `${extracted.companyName} (New Company)`
                      : 'None / Select Company'}
                  </option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {!selectedCompanyId && extracted.companyName && (
                  <label className="flex items-center gap-1.5 mt-1.5 text-[11px] text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createCompanyIfMissing}
                      onChange={(e) => setCreateCompanyIfMissing(e.target.checked)}
                      className="rounded border-border text-accent focus:ring-accent"
                    />
                    <span>
                      {isRtl
                        ? `إنشاء الشركة "${extracted.companyName}" في قاعدة البيانات`
                        : `Create "${extracted.companyName}" in Target Companies`}
                    </span>
                  </label>
                )}
              </div>

              {/* Work Arrangement */}
              <div>
                <label className="block text-text-muted mb-1">{isRtl ? 'طبيعة العمل' : 'Work Arrangement'}</label>
                <select
                  value={extracted.workArrangement}
                  onChange={(e) =>
                    setExtracted({
                      ...extracted,
                      workArrangement: e.target.value as ParsedJobPosting['workArrangement'],
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ON_SITE">On-site</option>
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-text-muted mb-1">{isRtl ? 'مستوى الخبرة' : 'Seniority'}</label>
                <select
                  value={extracted.experienceLevel}
                  onChange={(e) =>
                    setExtracted({
                      ...extracted,
                      experienceLevel: e.target.value as ParsedJobPosting['experienceLevel'],
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="SENIOR">Senior</option>
                  <option value="MID_LEVEL">Mid-Level</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="FRESHER">Fresher</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>

              {/* Compensation */}
              <div className="md:col-span-2 grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-text-muted mb-1">{isRtl ? 'الحد الأدنى' : 'Salary Min'}</label>
                  <Input
                    type="number"
                    value={extracted.salaryMin ?? ''}
                    onChange={(e) =>
                      setExtracted({
                        ...extracted,
                        salaryMin: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g. 50000"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-text-muted mb-1">{isRtl ? 'الحد الأقصى' : 'Salary Max'}</label>
                  <Input
                    type="number"
                    value={extracted.salaryMax ?? ''}
                    onChange={(e) =>
                      setExtracted({
                        ...extracted,
                        salaryMax: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g. 80000"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-text-muted mb-1">{isRtl ? 'العملة' : 'Currency'}</label>
                  <Input
                    value={extracted.salaryCurrency ?? 'EGP'}
                    onChange={(e) =>
                      setExtracted({
                        ...extracted,
                        salaryCurrency: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="EGP / USD"
                    className="text-xs uppercase"
                  />
                </div>
              </div>

              {/* Required Technologies */}
              <div className="md:col-span-2">
                <label className="block text-text-muted mb-1">
                  {isRtl ? 'التقنيات المطلوبة' : 'Required Technologies'}
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-bg-secondary border border-border mb-1.5">
                  {extracted.requiredTechnologies.map((tech) => (
                    <Badge key={tech} variant="default" className="text-[11px] py-0.5">
                      {tech}
                    </Badge>
                  ))}
                </div>
                <Input
                  value={extracted.requiredTechnologies.join(', ')}
                  onChange={(e) =>
                    setExtracted({
                      ...extracted,
                      requiredTechnologies: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="React, Next.js, TypeScript..."
                  className="text-xs"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-text-muted mb-1">{isRtl ? 'ملخص الوصف' : 'Description Summary'}</label>
                <Textarea
                  value={extracted.description ?? ''}
                  onChange={(e) => setExtracted({ ...extracted, description: e.target.value })}
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExtracted(null)}
                disabled={isImporting}
              >
                {isRtl ? 'الرجوع للإدخال' : 'Back to Input'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleConfirmImport}
                  disabled={isImporting || !extracted.title.trim()}
                  className="gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isRtl ? 'جاري الاستيراد...' : 'Importing...'}
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      {isRtl ? 'تأكيد الاستيراد' : 'Confirm & Import Opportunity'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}

