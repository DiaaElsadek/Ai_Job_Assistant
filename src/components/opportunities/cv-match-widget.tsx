'use client'

import { useState, useTransition } from 'react'
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  FileCheck,
  Layers,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { analyzeOpportunityMatchAction } from '@/src/server/actions/cv-match'
import type { CVMatchResult } from '@/src/lib/ai/cv-matcher'
import { useI18n } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'

interface CVMatchWidgetProps {
  opportunityId: string
  jobTitle: string
  initialAnalysis?: CVMatchResult | null
}

export function CVMatchWidget({
  opportunityId,
  jobTitle,
  initialAnalysis,
}: CVMatchWidgetProps) {
  const { isRtl } = useI18n()
  const [analysis, setAnalysis] = useState<CVMatchResult | null>(initialAnalysis || null)
  const [isPending, startTransition] = useTransition()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false)

  const handleRunAnalysis = () => {
    startTransition(async () => {
      const res = await analyzeOpportunityMatchAction(opportunityId)
      if (!res.success || !res.data) {
        toast.error(res.error || 'Failed to analyze match.')
        return
      }

      setAnalysis(res.data)
      toast.success('CV match analysis completed!')
    })
  }

  const handleCopyBullet = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Bullet copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleCopyCoverLetter = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCoverLetter(true)
    toast.success('Cover letter pitch copied!')
    setTimeout(() => setCopiedCoverLetter(false), 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">
              {isRtl ? 'محرك مطابقة السيرة الذاتية (CV Match & ATS)' : 'CV-to-Job Match & ATS Engine'}
            </h2>
            <p className="text-[11px] text-text-muted">
              {isRtl
                ? 'تحليل تطابق متطلبات الوظيفة مع ملفك، وتوليد نقاط إنجاز مهيأة لأنظمة ATS.'
                : 'Compare job requirements against your CV, identify skill gaps, and generate STAR bullets.'}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRunAnalysis}
          disabled={isPending}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isPending && 'animate-spin')} />
          <span>
            {analysis
              ? isRtl ? 'إعادة التحليل' : 'Re-analyze Match'
              : isRtl ? 'تحليل التطابق الآن' : 'Run Match Analysis'}
          </span>
        </Button>
      </div>

      {!analysis ? (
        <div className="p-6 text-center rounded-lg bg-bg-card border border-dashed border-border space-y-3">
          <Sparkles className="w-7 h-7 text-accent mx-auto" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-text-primary">
              {isRtl ? 'لم يتم تحليل هذه الفرصة بعد' : 'No Match Analysis Generated Yet'}
            </p>
            <p className="text-[11px] text-text-muted max-w-sm mx-auto">
              {isRtl
                ? 'اضغط على زر التحليل لمقارنة مهاراتك مع متطلبات الوظيفة والحصول على نقاط مخصصة لسيرتك الذاتية.'
                : 'Click "Run Match Analysis" to generate an ATS compatibility score and 3 tailored resume achievement bullets.'}
            </p>
          </div>
          <Button size="sm" onClick={handleRunAnalysis} disabled={isPending} className="gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isPending ? (isRtl ? 'جاري التحليل...' : 'Analyzing...') : (isRtl ? 'ابدأ تحليل التطابق' : 'Start Match Analysis')}</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Score & Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Match Score Card */}
            <div className={cn('p-4 rounded-xl border flex items-center justify-between', getScoreColor(analysis.matchScore))}>
              <div className="space-y-0.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold opacity-90">
                  {isRtl ? 'نسبة التطابق' : 'ATS Match Score'}
                </span>
                <p className="text-2xl font-black">{analysis.matchScore}%</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-medium opacity-80">
                  {analysis.matchScore >= 80
                    ? (isRtl ? 'توافق ممتاز' : 'Strong Match')
                    : analysis.matchScore >= 60
                    ? (isRtl ? 'توافق متوسط' : 'Moderate Match')
                    : (isRtl ? 'يحتاج تعزيز' : 'Skill Gaps')}
                </span>
              </div>
            </div>

            {/* Matched Skills Count */}
            <div className="p-4 rounded-xl bg-bg-card border border-border space-y-0.5">
              <span className="text-[11px] text-text-muted font-medium">
                {isRtl ? 'المهارات المتوافقة' : 'Matched Skills'}
              </span>
              <p className="text-2xl font-bold text-success">{analysis.matchedSkills.length}</p>
              <p className="text-[10px] text-text-muted">{isRtl ? 'مهارة مذكورة في سيرتك' : 'verified in profile'}</p>
            </div>

            {/* Missing Skills Count */}
            <div className="p-4 rounded-xl bg-bg-card border border-border space-y-0.5">
              <span className="text-[11px] text-text-muted font-medium">
                {isRtl ? 'فجوات مهارية مطلوبة' : 'Missing / Gap Skills'}
              </span>
              <p className="text-2xl font-bold text-warning">{analysis.missingSkills.length}</p>
              <p className="text-[10px] text-text-muted">{isRtl ? 'يُنصح بإبرازها في المقابلة' : 'highlight during interview'}</p>
            </div>
          </div>

          {/* Skill Badges Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matched Skills */}
            <div className="p-3.5 rounded-lg bg-bg-card border border-border space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span>{isRtl ? 'المهارات المطابقة' : 'Matched Skills'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.matchedSkills.length === 0 ? (
                  <span className="text-[11px] text-text-muted">{isRtl ? 'لا توجد' : 'None detected'}</span>
                ) : (
                  analysis.matchedSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    >
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="p-3.5 rounded-lg bg-bg-card border border-border space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{isRtl ? 'مهارات إضافية في الإعلان' : 'Missing / Unspecified in CV'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missingSkills.length === 0 ? (
                  <span className="text-[11px] text-text-muted">
                    {isRtl ? 'جميع المهارات متطابقة!' : 'No major gaps found!'}
                  </span>
                ) : (
                  analysis.missingSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    >
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Tailored STAR Achievement Bullets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold text-text-primary">
                  {isRtl ? 'نقاط سيرة ذاتية مقترحة بصيغة STAR' : 'Tailored STAR Achievement Bullets'}
                </h3>
              </div>
              <span className="text-[10px] text-text-muted">
                {isRtl ? 'جاهزة للنسخ إلى سيرتك الذاتية' : 'Ready to paste into your resume'}
              </span>
            </div>

            <div className="space-y-2.5">
              {analysis.tailoredBullets.map((bullet, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-bg-card border border-border hover:border-accent/30 transition-colors flex items-start justify-between gap-3 group"
                >
                  <p className="text-xs text-text-secondary leading-relaxed flex-1">
                    {bullet}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopyBullet(bullet, idx)}
                    className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-accent transition-colors shrink-0"
                    title={isRtl ? 'نسخ' : 'Copy bullet'}
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cover Letter Pitch */}
          {analysis.coverLetterDraft && (
            <div className="p-4 rounded-xl bg-bg-card border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  <span>{isRtl ? 'مقدمة خطاب التقديم المقترح (Cover Letter Pitch)' : 'Tailored Cover Letter Pitch'}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyCoverLetter(analysis.coverLetterDraft!)}
                  className="h-7 text-xs gap-1.5"
                >
                  {copiedCoverLetter ? (
                    <>
                      <Check className="w-3 h-3 text-success" />
                      <span>{isRtl ? 'تم النسخ' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{isRtl ? 'نسخ الخطاب' : 'Copy Pitch'}</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">
                {analysis.coverLetterDraft}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

