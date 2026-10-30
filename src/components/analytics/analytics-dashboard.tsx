'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import {
  TrendingUp,
  Briefcase,
  Users,
  Send,
  Bell,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'

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

  const funnelChartData = [
    { name: 'Saved', count: funnel.saved, fill: '#737373' },
    { name: 'Applied', count: funnel.applied, fill: '#2563eb' },
    { name: 'Interviewing', count: funnel.interviewing, fill: '#d97706' },
    { name: 'Offer', count: funnel.offer, fill: '#16a34a' },
    { name: 'Closed', count: funnel.closed, fill: '#dc2626' },
  ]

  const categoryChartData = [
    { name: 'Recruiters', count: categoryCounts.recruiters, fill: '#d97706' },
    { name: 'HR / Talent', count: categoryCounts.hr, fill: '#2563eb' },
    { name: 'Senior Devs', count: categoryCounts.seniorDevs, fill: '#16a34a' },
    { name: 'Tech Leads', count: categoryCounts.techLeads, fill: '#8b5cf6' },
    { name: 'Eng Managers', count: categoryCounts.managers, fill: '#ec4899' },
    { name: 'Other Peers', count: categoryCounts.other, fill: '#737373' },
  ].filter((c) => c.count > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight">
          Job Search & Networking Analytics
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Measure outreach velocity, funnel conversion rates, and relationship development in real-time.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Opportunities */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium text-text-secondary">Pipeline Roles</span>
            <Briefcase className="w-4 h-4 text-info" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {kpis.totalOpportunities}
          </div>
          <p className="text-[11px] text-text-muted">
            {funnel.applied} applied • {funnel.interviewing} interviewing
          </p>
        </div>

        {/* Contacts */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium text-text-secondary">Network Contacts</span>
            <Users className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {kpis.totalContacts}
          </div>
          <p className="text-[11px] text-text-muted">
            {relationshipStages.connected + relationshipStages.replied} active conversations
          </p>
        </div>

        {/* Outreach Sent */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium text-text-secondary">Outreach Sent</span>
            <Send className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {kpis.sentMessages}
          </div>
          <p className="text-[11px] text-text-muted">
            Target: {kpis.dailyTarget} contacts / day
          </p>
        </div>

        {/* Interview Rate */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium text-text-secondary">Interview Rate</span>
            <TrendingUp className="w-4 h-4 text-warning" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {kpis.interviewConversionRate}%
          </div>
          <p className="text-[11px] text-text-muted">
            {kpis.overdueFollowUps > 0 ? (
              <span className="text-error font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {kpis.overdueFollowUps} overdue follow-up
              </span>
            ) : (
              'Applications to interviews'
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
              Application Funnel
            </h2>
            <span className="text-[11px] text-text-muted">
              {funnel.total} Total Tracked
            </span>
          </div>

          {funnel.total === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-text-muted">
              Add opportunities to visualize the application funnel
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
              Contact Networking Distribution
            </h2>
            <span className="text-[11px] text-text-muted">
              {relationshipStages.total} Total Contacts
            </span>
          </div>

          {categoryChartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-text-muted">
              Add contacts to visualize networking distribution
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <XAxis type="number" stroke="#737373" fontSize={11} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#737373" fontSize={11} tickLine={false} width={80} />
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
          Networking Relationship Lifecycle
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-bg-tertiary/40 border border-border/60 space-y-1">
            <span className="text-[11px] text-text-muted block">1. Research</span>
            <div className="text-lg font-bold text-text-primary">{relationshipStages.toResearch}</div>
            <span className="text-[10px] text-text-muted">To explore</span>
          </div>

          <div className="p-3 rounded-lg bg-bg-tertiary/40 border border-border/60 space-y-1">
            <span className="text-[11px] text-text-muted block">2. Ready</span>
            <div className="text-lg font-bold text-accent">{relationshipStages.ready}</div>
            <span className="text-[10px] text-text-muted">Draft ready</span>
          </div>

          <div className="p-3 rounded-lg bg-bg-tertiary/40 border border-border/60 space-y-1">
            <span className="text-[11px] text-text-muted block">3. Request Sent</span>
            <div className="text-lg font-bold text-info">{relationshipStages.sent}</div>
            <span className="text-[10px] text-text-muted">Awaiting accept</span>
          </div>

          <div className="p-3 rounded-lg bg-bg-tertiary/40 border border-border/60 space-y-1">
            <span className="text-[11px] text-text-muted block">4. Connected</span>
            <div className="text-lg font-bold text-success">{relationshipStages.connected}</div>
            <span className="text-[10px] text-text-muted">On LinkedIn</span>
          </div>

          <div className="p-3 rounded-lg bg-bg-tertiary/40 border border-border/60 space-y-1">
            <span className="text-[11px] text-text-muted block">5. Replied / In Chat</span>
            <div className="text-lg font-bold text-success">{relationshipStages.replied}</div>
            <span className="text-[10px] text-text-muted">Engaged</span>
          </div>

          <div className="p-3 rounded-lg bg-bg-tertiary/40 border border-border/60 space-y-1">
            <span className="text-[11px] text-text-muted block">6. Follow-up Needed</span>
            <div className="text-lg font-bold text-warning">{relationshipStages.followUpNeeded}</div>
            <span className="text-[10px] text-text-muted">Re-engage</span>
          </div>
        </div>
      </div>
    </div>
  )
}

