'use client'

import { AlertOctagon, Lightbulb, PieChart } from 'lucide-react'
import type { RejectionReasonCount } from '@/src/server/data/stage-history'
import { useI18n } from '@/src/lib/i18n'

interface RejectionBreakdownProps {
  reasons: RejectionReasonCount[]
}

export function RejectionBreakdown({ reasons }: RejectionBreakdownProps) {
  const { isRtl } = useI18n()

  const total = reasons.reduce((sum, r) => sum + r.count, 0)

  // Find top reason
  const topReason = [...reasons].sort((a, b) => b.count - a.count)[0]

  const getAdvice = (key?: string) => {
    switch (key) {
      case 'GHOSTED':
        return isRtl
          ? 'نصيحة: راسل مسؤول التوظيف أو مهندس الفريق مباشرة عبر لينكد إن خلال 3-5 أيام لتجنب استبعاد ATS التلقائي.'
          : 'Strategy Insight: Reach out to hiring managers or team engineers on LinkedIn within 3-5 days to bypass ATS black holes.'
      case 'TECH_STACK_GAP':
        return isRtl
          ? 'نصيحة: استخدم أداة مطابقة السيرة الذاتية (CV Match) لإبراز المشاريع والتقنيات المطلوبة بدقة قبل التقديم.'
          : 'Strategy Insight: Leverage the CV-to-Job Match engine to tailor keywords and highlight missing technologies before submitting.'
      case 'SALARY_MISMATCH':
        return isRtl
          ? 'نصيحة: راجع حاسبة الرواتب المقارنة بين السوق المصري وعقود العمل عن بُعد بالدولار لضبط نطاق التوقعات مبكرًا.'
          : 'Strategy Insight: Clarify compensation expectations during the initial recruiter screen to avoid late-stage misalignment.'
      default:
        return isRtl
          ? 'نصيحة: استمر في توثيق أسباب الرفض لملاحظة أي أنماط وتعديل خطتك التسويقية الشخصية باستمرار.'
          : 'Strategy Insight: Consistently logging rejection outcomes reveals bottleneck patterns, enabling focused interview preparation.'
    }
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              {isRtl ? 'تحليل أسباب الرفض والإغلاق (Post-Mortem)' : 'Rejection & Closure Post-Mortem'}
            </h3>
            <p className="text-[11px] text-text-muted">
              {isRtl
                ? 'تشخيص أسباب عدم اكتمال الفرص لتحسين استراتيجية التقديم.'
                : 'Diagnose why opportunities closed or stalled to refine your positioning.'}
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-0.5 rounded-full bg-bg-card border border-border text-text-secondary font-medium">
          {total} {isRtl ? 'إجمالي مسجل' : 'logged outcomes'}
        </span>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3 pt-1">
        {reasons.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
          return (
            <div key={item.reasonKey} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary font-medium">{item.reason}</span>
                <span className="text-text-muted">
                  {item.count} ({pct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-bg-card overflow-hidden">
                <div
                  className="h-full bg-rose-500/80 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(item.count > 0 ? 5 : 0, pct)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Actionable Strategic Advice Callout */}
      <div className="p-3.5 rounded-lg bg-accent/10 border border-accent/20 flex items-start gap-2.5 text-xs text-text-primary">
        <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {getAdvice(topReason?.count > 0 ? topReason.reasonKey : undefined)}
        </p>
      </div>
    </div>
  )
}

