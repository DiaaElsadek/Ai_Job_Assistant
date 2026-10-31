'use client'

import Link from 'next/link'
import {
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  BellRing,
  UserCheck,
  Briefcase,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import type { PlannerAction } from '@/src/lib/planner/next-best-action'
import { useI18n } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'

interface DailyActionPlannerProps {
  actions: PlannerAction[]
}

export function DailyActionPlanner({ actions }: DailyActionPlannerProps) {
  const { isRtl } = useI18n()

  const getCategoryIcon = (category: PlannerAction['category']) => {
    switch (category) {
      case 'FOLLOW_UP':
        return <BellRing className="w-4 h-4 text-warning" />
      case 'CONTACT_DECAY':
        return <UserCheck className="w-4 h-4 text-accent" />
      case 'OPPORTUNITY':
        return <Briefcase className="w-4 h-4 text-info" />
      default:
        return <Sparkles className="w-4 h-4 text-accent" />
    }
  }

  const getPriorityBadge = (priority: PlannerAction['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {isRtl ? 'عاجل' : 'Critical'}
          </span>
        )
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {isRtl ? 'أولوية عالية' : 'High Priority'}
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            {isRtl ? 'مقترح' : 'Recommended'}
          </span>
        )
    }
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">
              {isRtl ? 'أهم إجراءات اليوم الموصى بها' : "Today's High-Impact Actions"}
            </h2>
            <p className="text-[11px] text-text-secondary">
              {isRtl
                ? 'إجراءات محددة بالذكاء لتسريع فرص قبولك والحفاظ على وتيرة التواصل.'
                : 'Heuristic-prioritized actions to unblock conversations and accelerate pipeline velocity.'}
            </p>
          </div>
        </div>

        {actions.length > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-bg-hover text-text-secondary font-medium">
            {actions.length} {isRtl ? 'مهام' : 'action items'}
          </span>
        )}
      </div>

      {/* Action Items List */}
      {actions.length === 0 ? (
        <div className="p-6 text-center rounded-lg bg-bg-hover/40 border border-dashed border-border flex flex-col items-center justify-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-success" />
          <p className="text-xs font-semibold text-text-primary">
            {isRtl ? 'أنت على المسار الصحيح تمامًا!' : 'All Caught Up!'}
          </p>
          <p className="text-[11px] text-text-muted max-w-sm">
            {isRtl
              ? 'لا توجد متابعات متأخرة أو جهات اتصال تحتاج تنشيطًا في الوقت الحالي.'
              : 'No overdue follow-ups or stale contacts requiring urgent outreach today. Keep up the momentum!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {actions.map((action) => (
            <div
              key={action.id}
              className="p-3 rounded-lg bg-bg-card border border-border hover:border-accent/40 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 rounded-md bg-bg-secondary border border-border shrink-0">
                  {getCategoryIcon(action.category)}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors">
                      {isRtl ? action.titleAr : action.titleEn}
                    </span>
                    {getPriorityBadge(action.priority)}
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    {isRtl ? action.descriptionAr : action.descriptionEn}
                  </p>
                </div>
              </div>

              <Link
                href={action.ctaHref}
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent hover:text-black transition-colors shrink-0',
                  isRtl && 'flex-row-reverse'
                )}
              >
                <span>{isRtl ? action.ctaLabelAr : action.ctaLabelEn}</span>
                <ArrowRight
                  className={cn('w-3.5 h-3.5', isRtl ? 'scale-x-[-1]' : '')}
                />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

