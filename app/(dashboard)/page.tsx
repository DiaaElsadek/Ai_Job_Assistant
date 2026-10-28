import Link from 'next/link'
import {
  Building2,
  Briefcase,
  Users,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
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

  try {
    const [companies, opportunities, contacts, messages] = await Promise.all([
      prisma.company.count({ where: { userId } }),
      prisma.opportunity.count({ where: { userId } }),
      prisma.contact.count({ where: { userId } }),
      prisma.messageDraft.count({ where: { userId } }),
    ])
    companyCount = companies
    opportunityCount = opportunities
    contactCount = contacts
    messageCount = messages
  } catch {
    // If DB is offline during build/tests
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-bg-secondary border border-border rounded-xl p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              Phase 1 Vertical Slice
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
            Your single-user job search CRM and networking engine for React.js & Next.js roles in Egypt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/companies">
            <Button size="sm">
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Manage Companies
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium text-text-secondary">Target Companies</span>
            <Building2 className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{companyCount}</div>
          <p className="text-[11px] text-text-muted">Researched & tracked</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium text-text-secondary">Opportunities</span>
            <Briefcase className="w-4 h-4 text-info" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{opportunityCount}</div>
          <p className="text-[11px] text-text-muted">Phase 2 Core CRM</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium text-text-secondary">Contacts</span>
            <Users className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{contactCount}</div>
          <p className="text-[11px] text-text-muted">Phase 2 Core CRM</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium text-text-secondary">AI Drafts</span>
            <MessageSquare className="w-4 h-4 text-warning" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{messageCount}</div>
          <p className="text-[11px] text-text-muted">Phase 4 Message Studio</p>
        </div>
      </div>

      {/* Primary Action Card: Companies Vertical Slice */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              Phase 1 Deliverable: Companies CRM
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Full CRUD, search, priority filtering, sorting, responsive tables, and relations.
            </p>
          </div>
          <Link href="/companies">
            <Button variant="outline" size="sm">
              Open Companies
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-bg-tertiary border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-text-primary">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              Company Database
            </div>
            <p className="text-[11px] text-text-secondary leading-snug">
              Store Egyptian tech hubs, tech stacks, hiring signals, and research logs.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-bg-tertiary border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-text-primary">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              Server Actions + Zod
            </div>
            <p className="text-[11px] text-text-secondary leading-snug">
              Strict server-side validation, error reporting, and optimistic Sonner toasts.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-bg-tertiary border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-text-primary">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              Single-Owner Security
            </div>
            <p className="text-[11px] text-text-secondary leading-snug">
              Auth.js JWT session protection across middleware and every Server Action.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
