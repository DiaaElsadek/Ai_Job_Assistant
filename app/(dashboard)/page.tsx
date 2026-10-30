import Link from 'next/link'
import {
  Building2,
  Briefcase,
  Users,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BellRing,
  BarChart3,
  Sparkles,
  Sliders,
} from 'lucide-react'
import { requireAuth } from '@/src/server/auth'
import { prisma } from '@/src/server/db'
import { Button } from '@/src/components/ui/button'

export default async function DashboardPage() {
  const session = await requireAuth()
  const userId = session.user!.id!

  // Fetch real counts from database
  let companyCount = 0
  let opportunityCount = 0
  let contactCount = 0
  let messageCount = 0
  let pendingFollowUpCount = 0

  try {
    const [companies, opportunities, contacts, messages, followUps] = await Promise.all([
      prisma.company.count({ where: { userId } }),
      prisma.opportunity.count({ where: { userId } }),
      prisma.contact.count({ where: { userId } }),
      prisma.messageDraft.count({ where: { userId } }),
      prisma.followUpTask.count({ where: { userId, state: 'OPEN' } }),
    ])
    companyCount = companies
    opportunityCount = opportunities
    contactCount = contacts
    messageCount = messages
    pendingFollowUpCount = followUps
  } catch {
    // Fallback if DB query fails during edge conditions
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-bg-secondary border border-border rounded-xl p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              Complete CRM Suite Active
            </span>
            <span className="text-xs text-text-muted">•</span>
            <span className="text-xs text-text-secondary flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              Authenticated Owner
            </span>
          </div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            Welcome to JobFlow AI
          </h1>
          <p className="text-xs text-text-secondary max-w-xl">
            Your personal job-search command center and outreach CRM for React.js &amp; Next.js roles in Egypt and remote.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/opportunities">
            <Button size="sm">
              <Briefcase className="w-3.5 h-3.5 mr-1.5" />
              View Pipeline
            </Button>
          </Link>
          <Link href="/messages">
            <Button size="sm" variant="outline">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-accent" />
              Draft Message
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link href="/companies" className="group">
          <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-1 shadow-sm transition hover:border-accent/40">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">Companies</span>
              <Building2 className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-text-primary">{companyCount}</div>
            <p className="text-[11px] text-text-muted">Target tech hubs</p>
          </div>
        </Link>

        <Link href="/opportunities" className="group">
          <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-1 shadow-sm transition hover:border-info/40">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">Opportunities</span>
              <Briefcase className="w-4 h-4 text-info group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-text-primary">{opportunityCount}</div>
            <p className="text-[11px] text-text-muted">Kanban &amp; table tracker</p>
          </div>
        </Link>

        <Link href="/contacts" className="group">
          <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-1 shadow-sm transition hover:border-success/40">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">Contacts</span>
              <Users className="w-4 h-4 text-success group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-text-primary">{contactCount}</div>
            <p className="text-[11px] text-text-muted">Recruiters &amp; leads</p>
          </div>
        </Link>

        <Link href="/follow-ups" className="group">
          <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-1 shadow-sm transition hover:border-warning/40">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">Follow-ups</span>
              <BellRing className="w-4 h-4 text-warning group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-text-primary">{pendingFollowUpCount}</div>
            <p className="text-[11px] text-text-muted">Active reminders</p>
          </div>
        </Link>

        <Link href="/messages" className="group col-span-2 md:col-span-1">
          <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-1 shadow-sm transition hover:border-accent/40">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">AI Drafts</span>
              <MessageSquare className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-text-primary">{messageCount}</div>
            <p className="text-[11px] text-text-muted">Outreach studio</p>
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
                <h2 className="text-sm font-semibold text-text-primary">Opportunities Pipeline</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-info/10 text-info font-medium">Active</span>
            </div>
            <p className="text-xs text-text-secondary">
              Track job openings through Saved, Applied, Assessment, Interview, and Offer stages with interactive Kanban.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/opportunities">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Manage Opportunities</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
                <h2 className="text-sm font-semibold text-text-primary">Contacts &amp; Touchpoints</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success font-medium">CRM</span>
            </div>
            <p className="text-xs text-text-secondary">
              Build your professional network. Log interactions, link decision makers to target jobs, and track outreach status.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/contacts">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Browse Contacts</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
                <h2 className="text-sm font-semibold text-text-primary">AI Message Studio</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-medium">Gemini</span>
            </div>
            <p className="text-xs text-text-secondary">
              Generate culturally attuned outreach in Egyptian Arabic, MSA, or English tailored to companies and contacts.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/messages">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Draft New Message</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
              <h3 className="text-xs font-semibold text-text-primary">Search Analytics &amp; Conversion Funnel</h3>
              <p className="text-[11px] text-text-muted">Review weekly velocity, funnel drop-off, and contact distribution.</p>
            </div>
          </div>
          <Link href="/analytics">
            <Button variant="ghost" size="sm">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-bg-tertiary text-text-secondary">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-text-primary">Search Preferences &amp; Target Roles</h3>
              <p className="text-[11px] text-text-muted">Configure daily outreach goals, reminder intervals, and CV context.</p>
            </div>
          </div>
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
