import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  ExternalLink,
  MapPin,
  Calendar,
  Users,
  Clock,
  DollarSign,
  Send,
  FileText,
} from 'lucide-react'
import { requireAuth } from '@/src/server/auth'
import { getOpportunity } from '@/src/server/data/opportunities'
import { listCompaniesForSelect } from '@/src/server/data/companies'
import { getOpportunityMatchAnalysis } from '@/src/server/data/cv-match'
import { getInterviewRounds } from '@/src/server/data/interviews'
import { Badge, StatusBadge } from '@/src/components/ui/badge'
import { OpportunityDetailActions } from '@/src/components/opportunities/opportunity-detail-actions'
import { CVMatchWidget } from '@/src/components/opportunities/cv-match-widget'
import { InterviewPrepSection } from '@/src/components/interviews/interview-prep-section'

export const instant = false

interface OpportunityDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OpportunityDetailPage({ params }: OpportunityDetailPageProps) {
  const session = await requireAuth()
  const userId = session.user!.id!
  const { id } = await params

  const [opportunity, companies, matchAnalysis, interviewRounds] = await Promise.all([
    getOpportunity(id, userId),
    listCompaniesForSelect(userId),
    getOpportunityMatchAnalysis(id, userId),
    getInterviewRounds(id, userId),
  ])

  if (!opportunity) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Opportunities
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-tertiary border border-border text-info">
                <Briefcase className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                {opportunity.title}
              </h1>
              <StatusBadge status={opportunity.status} />
              <StatusBadge status={opportunity.priority} />
            </div>

            {/* Company & Meta info */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-text-secondary">
              {opportunity.company ? (
                <Link
                  href={`/companies/${opportunity.company.id}`}
                  className="inline-flex items-center gap-1 text-text-primary hover:text-accent font-medium transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-text-muted" />
                  {opportunity.company.name}
                </Link>
              ) : (
                <span className="text-text-muted">Unassigned Company</span>
              )}

              {opportunity.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-text-muted" />
                  {opportunity.location}
                </span>
              )}

              <Badge variant="default" className="capitalize">
                {opportunity.workArrangement.toLowerCase().replace('_', '-')}
              </Badge>

              <Badge variant="default" className="capitalize">
                {opportunity.experienceLevel.toLowerCase().replace('_', '-')}
              </Badge>
            </div>
          </div>

          <OpportunityDetailActions
            opportunity={opportunity}
            companies={companies}
          />
        </div>

        {/* Links row */}
        {(opportunity.jobUrl || opportunity.applicationUrl || opportunity.sourceName) && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border/60 text-xs">
            {opportunity.jobUrl && (
              <a
                href={opportunity.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:underline font-medium"
              >
                View Job Posting
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {opportunity.applicationUrl && (
              <a
                href={opportunity.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-info hover:underline font-medium"
              >
                Apply Online
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {opportunity.sourceName && (
              <span className="text-text-muted">
                Source: <span className="text-text-secondary font-medium">{opportunity.sourceName}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Grid Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* CV-to-Job ATS Match Engine */}
          <CVMatchWidget
            opportunityId={opportunity.id}
            jobTitle={opportunity.title}
            initialAnalysis={matchAnalysis}
          />

          {/* Interview Prep & Rounds Tracker */}
          <InterviewPrepSection
            opportunityId={opportunity.id}
            jobTitle={opportunity.title}
            rounds={interviewRounds}
          />

          {/* Tech stack */}
          {opportunity.requiredTechnologies.length > 0 && (
            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                Required Tech Stack
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {opportunity.requiredTechnologies.map((tech) => (
                  <span
                    key={tech}
                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-bg-tertiary text-text-primary border border-border"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Job description */}
          {opportunity.description && (
            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                Role Description & Requirements
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                {opportunity.description}
              </p>
            </div>
          )}

          {/* Personal Strategy Notes */}
          {opportunity.notes && (
            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                Personal Strategy & Research Notes
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                {opportunity.notes}
              </p>
            </div>
          )}

          {/* Linked Contacts */}
          <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                Linked Networking Contacts ({opportunity.contacts.length})
              </h2>
              <Link
                href="/contacts"
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                Browse Contacts
              </Link>
            </div>

            {opportunity.contacts.length === 0 ? (
              <p className="text-xs text-text-muted py-2">
                No contacts connected to this opportunity yet. Link recruiters or engineers from the Contacts tab.
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {opportunity.contacts.map(({ contact }) => (
                  <div
                    key={contact.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium text-text-primary hover:text-accent"
                      >
                        {contact.fullName}
                      </Link>
                      <p className="text-[11px] text-text-muted">
                        {contact.role || 'Role unassigned'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={contact.relationshipStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column (1 col) */}
        <div className="space-y-6">
          {/* Key Metrics / Timeline Card */}
          <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Application Status
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Current Stage:</span>
                <StatusBadge status={opportunity.status} />
              </div>

              {opportunity.salaryMin && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Salary Range:</span>
                  <span className="font-mono text-text-primary">
                    {opportunity.salaryMin.toLocaleString()}
                    {opportunity.salaryMax ? ` - ${opportunity.salaryMax.toLocaleString()}` : ''}{' '}
                    {opportunity.salaryCurrency || 'EGP'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-text-muted">Discovered:</span>
                <span className="text-text-secondary">
                  {new Date(opportunity.dateDiscovered).toLocaleDateString()}
                </span>
              </div>

              {opportunity.dateApplied && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Date Applied:</span>
                  <span className="text-success font-medium">
                    {new Date(opportunity.dateApplied).toLocaleDateString()}
                  </span>
                </div>
              )}

              {opportunity.deadline && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Application Deadline:</span>
                  <span className="text-warning font-medium">
                    {new Date(opportunity.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick AI Outreach CTA */}
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-1.5 text-accent font-semibold text-xs">
              <Send className="w-3.5 h-3.5" />
              AI Outreach Drafts
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Generate cold outreach or tailored follow-up messages for this role in Egyptian Arabic or English.
            </p>
            <div className="pt-2">
              <Link href={`/messages?opportunityId=${opportunity.id}`}>
                <button
                  type="button"
                  className="w-full h-8 px-3 rounded-lg text-xs font-medium bg-accent text-black hover:bg-accent/90 transition-colors"
                >
                  Open in Message Studio
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

