'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  Briefcase,
  Users,
  Send,
  AlertCircle,
} from 'lucide-react'
import { useI18n } from '@/src/lib/i18n'

interface AnalyticsDashboardProps {
  data: {
    kpis: {
      totalCompanies: number
      totalOpportunities: number
      totalContacts: number
      sentMessages: number
      openFollowUps: number
      overdueFollowUps: number
      completedFollowUps: number
      interviewConversionRate: number
      dailyTarget: number
    }
    funnel: {
      saved: number
      applied: number
      interviewing: number
      offer: number
      closed: number
      total: number
    }
    relationshipStages: {
      toResearch: number
      ready: number
      sent: number
      connected: number
      replied: number
      followUpNeeded: number
      total: number
    }
    categoryCounts: {
      recruiters: number
      hr: number
      seniorDevs: number
      techLeads: number
      managers: number
      other: number
    }
  }
}

export function AnalyticsDashboard({ data }: { data: AnalyticsDashboardProps['data'] }) {
  const { kpis, funnel, relationshipStages, categoryCounts } = data
  const { t, isRtl } = useI18n()

  const funnelChartData = [
    { name: isRtl ? 'محفوظة' : 'Saved', count: funnel.saved, fill: '#737373' },
    { name: isRtl ? 'تم التقديم' : 'Applied', count: funnel.applied, fill: '#2563eb' },
    { name: isRtl ? 'مقابلات' : 'Interviewing', count: funnel.interviewing, fill: '#d97706' },
    { name: isRtl ? 'عرض عمل' : 'Offer', count: funnel.offer, fill: '#16a34a' },
    { name: isRtl ? 'مغلقة' : 'Closed', count: funnel.closed, fill: '#dc2626' },
  ]

  const categoryChartData = [
    { name: isRtl ? 'مسؤولو التوظيف' : 'Recruiters', count: categoryCounts.recruiters, fill: '#d97706' },
    { name: isRtl ? 'موارد بشرية' : 'HR / Talent', count: categoryCounts.hr, fill: '#2563eb' },
    { name: isRtl ? 'مطورون أول' : 'Senior Devs', count: categoryCounts.seniorDevs, fill: '#16a34a' },
    { name: isRtl ? 'قادة تقنيون' : 'Tech Leads', count: categoryCounts.techLeads, fill: '#8b5cf6' },
    { name: isRtl ? 'مديرون' : 'Eng Managers', count: categoryCounts.managers, fill: '#ec4899' },
    { name: isRtl ? 'آخرون' : 'Other Peers', count: categoryCounts.other, fill: '#737373' },
  ].filter((c) => c.count > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight">
          {t('analytics.title')}
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          {t('analytics.subtitle')}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Opportunities */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium text-text-secondary">
              {t('analytics.opportunities')}
            </span>
            <Briefcase className="w-4 h-4 text-info" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {kpis.totalOpportunities}
          </div>
          <p className="text-[11px] text-text-muted">
            {funnel.applied} {isRtl ? 'تم التقديم' : 'applied'} • {funnel.interviewing} {isRtl ? 'مقابلات' : 'interviewing'}
          </p>
        </div>

        {/* Contacts */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium text-text-secondary">
              {t('analytics.contacts')}
            </span>
            <Users className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {kpis.totalContacts}
          </div>
          <p className="text-[11px] text-text-muted">
            {relationshipStages.connected + relationshipStages.replied} {isRtl ? 'محادثة نشطة' : 'active conversations'}
          </p>
        </div>

        {/* Outreach Sent */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium text-text-secondary">
              {t('analytics.weeklyActivity')}
            </span>
            <Send className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {kpis.sentMessages}
          </div>
          <p className="text-[11px] text-text-muted">
            {isRtl ? `الهدف: ${kpis.dailyTarget} يوميًا` : `Target: ${kpis.dailyTarget} contacts / day`}
          </p>
        </div>

        {/* Interview Rate */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium text-text-secondary">
              {isRtl ? 'معدل المقابلات' : 'Interview Rate'}
            </span>
            <TrendingUp className="w-4 h-4 text-warning" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {kpis.interviewConversionRate}%
          </div>
          <p className="text-[11px] text-text-muted">
            {kpis.overdueFollowUps > 0 ? (
              <span className="text-error font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {kpis.overdueFollowUps} {isRtl ? 'متابعة متأخرة' : 'overdue follow-up'}
              </span>
            ) : (
              isRtl ? 'من التقديم إلى المقابلات' : 'Applications to interviews'
            )}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Funnel Chart */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              {t('analytics.funnelTitle')}
            </h2>
            <span className="text-[11px] text-text-muted">
              {funnel.total} {isRtl ? 'إجمالي الفرص' : 'Total Tracked'}
            </span>
          </div>

          {funnel.total === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-text-muted">
              {isRtl ? 'أضف فرص وظيفية لعرض قمع التوظيف' : 'Add opportunities to visualize the application funnel'}
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#737373" fontSize={11} tickLine={false} />
                  <YAxis stroke="#737373" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderColor: '#404040',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {funnelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Contact Category Breakdown */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              {t('analytics.contactsCategoryTitle')}
            </h2>
            <span className="text-[11px] text-text-muted">
              {relationshipStages.total} {isRtl ? 'إجمالي جهات الاتصال' : 'Total Contacts'}
            </span>
          </div>

          {categoryChartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-text-muted">
              {isRtl ? 'أضف جهات اتصال لعرض توزيع الشبكة' : 'Add contacts to visualize networking distribution'}
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <XAxis type="number" stroke="#737373" fontSize={11} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#737373" fontSize={11} tickLine={false} width={isRtl ? 90 : 80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderColor: '#404040',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-cat-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Relationship Pipeline Stages Progress */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
          {isRtl ? 'دورة حياة وتطور العلاقات المهنية' : 'Networking Relationship Lifecycle'}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-bg-tertiary/40 border border-border/60 space-y-1">
            <span className="text-[11px] text-text-muted block">{isRtl ? '1. بحث وتعرف' : '1. Research'}</span>
            <div className="text-lg font-bold text-text-primary">{relationshipStages.toResearch}</div>
            <span className="text-[10px] text-text-muted">{isRtl ? 'للاستكشاف' : 'To explore'}</span>
          </div>

          <div className="p-3 rounded-lg bg-bg-tertiary/40 border border-border/60 space-y-1">
            <span className="text-[11px] text-text-muted block">{isRtl ? '2. جاهز للمراسلة' : '2. Ready'}</span>
            <div className="text-lg font-bold text-accent">{relationshipStages.ready}</div>
            <span className="text-[10px] text-text-muted">{isRtl ? 'مسودة جاهزة' : 'Draft ready'}</span>
          </div>

          <div className="p-3 rounded-lg bg-bg-tertiary/40 border border-border/60 space-y-1">
            <span className="text-[11px] text-text-muted block">{isRtl ? '3. أُرسل الطلب' : '3. Request Sent'}</span>
            <div className="text-lg font-bold text-info">{relationshipStages.sent}</div>
            <span className="text-[10px] text-text-muted">{isRtl ? 'بانتظار القبول' : 'Awaiting accept'}</span>
          </div>

          <div className="p-3 rounded-lg bg-bg-tertiary/40 border border-border/60 space-y-1">
            <span className="text-[11px] text-text-muted block">{isRtl ? '4. تم الاتصال' : '4. Connected'}</span>
            <div className="text-lg font-bold text-success">{relationshipStages.connected}</div>
            <span className="text-[10px] text-text-muted">{isRtl ? 'على لينكد إن' : 'On LinkedIn'}</span>
          </div>

          <div className="p-3 rounded-lg bg-bg-tertiary/40 border border-border/60 space-y-1">
            <span className="text-[11px] text-text-muted block">{isRtl ? '5. تم الرد / حوار' : '5. Replied / In Chat'}</span>
            <div className="text-lg font-bold text-success">{relationshipStages.replied}</div>
            <span className="text-[10px] text-text-muted">{isRtl ? 'تفاعل إيجابي' : 'Engaged'}</span>
          </div>

          <div className="p-3 rounded-lg bg-bg-tertiary/40 border border-border/60 space-y-1">
            <span className="text-[11px] text-text-muted block">{isRtl ? '6. بحاجة لمتابعة' : '6. Follow-up Needed'}</span>
            <div className="text-lg font-bold text-warning">{relationshipStages.followUpNeeded}</div>
            <span className="text-[10px] text-text-muted">{isRtl ? 'إعادة تنشيط' : 'Re-engage'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
