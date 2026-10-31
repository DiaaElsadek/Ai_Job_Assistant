'use client'

import Link from 'next/link'
import {
  Building2,
  Briefcase,
  Users,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  BellRing,
  BarChart3,
  Sparkles,
  Sliders,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { DailyActionPlanner } from '@/src/components/dashboard/daily-action-planner'
import type { PlannerAction } from '@/src/lib/planner/next-best-action'
import { useI18n } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'

interface DashboardViewProps {
  companyCount: number
  opportunityCount: number
  contactCount: number
  messageCount: number
  pendingFollowUpCount: number
  dailyActions?: PlannerAction[]
}

export function DashboardView({
  companyCount,
  opportunityCount,
  contactCount,
  messageCount,
  pendingFollowUpCount,
  dailyActions = [],
}: DashboardViewProps) {
  const { t, isRtl } = useI18n()

  const ArrowIcon = () => (
    <ArrowRight className={cn('w-3.5 h-3.5 ml-1', isRtl && 'mr-1 ml-0 scale-x-[-1]')} />
  )

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-bg-secondary border border-border rounded-xl p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              {t('dashboard.badgeActive')}
            </span>
            <span className="text-xs text-text-muted">•</span>
            <span className="text-xs text-text-secondary flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              {t('dashboard.badgeOwner')}
            </span>
          </div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-xs text-text-secondary max-w-xl">
            {t('dashboard.description')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/opportunities">
            <Button size="sm">
              <Briefcase className={cn('w-3.5 h-3.5', isRtl ? 'ml-1.5' : 'mr-1.5')} />
              {t('dashboard.viewPipeline')}
            </Button>
          </Link>
          <Link href="/messages">
            <Button size="sm" variant="outline">
              <Sparkles className={cn('w-3.5 h-3.5 text-accent', isRtl ? 'ml-1.5' : 'mr-1.5')} />
              {t('dashboard.draftMessage')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Daily High-Impact Actions Planner */}
      <DailyActionPlanner actions={dailyActions} />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link href="/companies" className="group">
          <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-1 shadow-sm transition hover:border-accent/40">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                {t('dashboard.metricCompanies')}
              </span>
              <Building2 className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-text-primary">{companyCount}</div>
            <p className="text-[11px] text-text-muted">{t('dashboard.metricCompaniesSub')}</p>
          </div>
        </Link>

        <Link href="/opportunities" className="group">
          <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-1 shadow-sm transition hover:border-info/40">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                {t('dashboard.metricOpportunities')}
              </span>
              <Briefcase className="w-4 h-4 text-info group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-text-primary">{opportunityCount}</div>
            <p className="text-[11px] text-text-muted">{t('dashboard.metricOpportunitiesSub')}</p>
          </div>
        </Link>

        <Link href="/contacts" className="group">
          <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-1 shadow-sm transition hover:border-success/40">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                {t('dashboard.metricContacts')}
              </span>
              <Users className="w-4 h-4 text-success group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-text-primary">{contactCount}</div>
            <p className="text-[11px] text-text-muted">{t('dashboard.metricContactsSub')}</p>
          </div>
        </Link>

        <Link href="/follow-ups" className="group">
          <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-1 shadow-sm transition hover:border-warning/40">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                {t('dashboard.metricFollowUps')}
              </span>
              <BellRing className="w-4 h-4 text-warning group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-text-primary">{pendingFollowUpCount}</div>
            <p className="text-[11px] text-text-muted">{t('dashboard.metricFollowUpsSub')}</p>
          </div>
        </Link>

        <Link href="/messages" className="group col-span-2 md:col-span-1">
          <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-1 shadow-sm transition hover:border-accent/40">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                {t('dashboard.metricDrafts')}
              </span>
              <MessageSquare className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-text-primary">{messageCount}</div>
            <p className="text-[11px] text-text-muted">{t('dashboard.metricDraftsSub')}</p>
          </div>
        </Link>
      </div>

      {/* Quick Navigation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Opportunities Pipeline Card */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-info" />
                <h2 className="text-sm font-semibold text-text-primary">
                  {t('dashboard.cardPipelineTitle')}
                </h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-info/10 text-info font-medium">
                {t('dashboard.cardPipelineBadge')}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              {t('dashboard.cardPipelineDesc')}
            </p>
          </div>
          <div className="pt-2">
            <Link href="/opportunities">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>{t('dashboard.cardPipelineBtn')}</span>
                <ArrowIcon />
              </Button>
            </Link>
          </div>
        </div>

        {/* Contacts & Networking Card */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-success" />
                <h2 className="text-sm font-semibold text-text-primary">
                  {t('dashboard.cardContactsTitle')}
                </h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success font-medium">
                {t('dashboard.cardContactsBadge')}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              {t('dashboard.cardContactsDesc')}
            </p>
          </div>
          <div className="pt-2">
            <Link href="/contacts">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>{t('dashboard.cardContactsBtn')}</span>
                <ArrowIcon />
              </Button>
            </Link>
          </div>
        </div>

        {/* AI Outreach Studio Card */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-semibold text-text-primary">
                  {t('dashboard.cardStudioTitle')}
                </h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-medium">
                {t('dashboard.cardStudioBadge')}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              {t('dashboard.cardStudioDesc')}
            </p>
          </div>
          <div className="pt-2">
            <Link href="/messages">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>{t('dashboard.cardStudioBtn')}</span>
                <ArrowIcon />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Analytics & Settings Shortcut */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-bg-secondary border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-text-primary">
                {t('dashboard.analyticsCardTitle')}
              </h3>
              <p className="text-[11px] text-text-muted">
                {t('dashboard.analyticsCardDesc')}
              </p>
            </div>
          </div>
          <Link href="/analytics">
            <Button variant="ghost" size="sm">
              <ArrowRight className={cn('w-4 h-4', isRtl && 'scale-x-[-1]')} />
            </Button>
          </Link>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-bg-tertiary text-text-secondary">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-text-primary">
                {t('dashboard.settingsCardTitle')}
              </h3>
              <p className="text-[11px] text-text-muted">
                {t('dashboard.settingsCardDesc')}
              </p>
            </div>
          </div>
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowRight className={cn('w-4 h-4', isRtl && 'scale-x-[-1]')} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

