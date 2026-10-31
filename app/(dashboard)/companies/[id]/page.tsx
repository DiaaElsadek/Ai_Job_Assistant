import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react'
import { requireAuth } from '@/src/server/auth'
import { getCompany } from '@/src/server/data/companies'
import { Badge, StatusBadge } from '@/src/components/ui/badge'
import { EmptyState } from '@/src/components/ui/empty-state'
import { CompanyDetailActions } from '@/src/components/companies/company-detail-actions'

export const instant = false

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const session = await requireAuth()
  const userId = session.user!.id!
  const { id } = await params

  const company = await getCompany(id, userId)

  if (!company) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/companies"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Companies
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-tertiary border border-border text-accent">
                <Building2 className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                {company.name}
              </h1>
              <StatusBadge status={company.priority} />
            </div>

            {/* Location & Industry & Date */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-text-secondary pt-1">
              {company.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-text-muted" />
                  {company.location}
                </span>
              )}
              {company.industry && (
                <span className="inline-flex items-center gap-1">
                  <span>Industry:</span>
                  <span className="text-text-primary">{company.industry}</span>
                </span>
              )}
              {company.lastResearchedAt && (
                <span className="inline-flex items-center gap-1 text-text-tertiary">
                  <Calendar className="w-3 h-3 text-text-muted" />
                  Researched {new Date(company.lastResearchedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <CompanyDetailActions company={company} />
        </div>

        {/* External Links */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/60 text-xs">
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent hover:underline font-medium"
            >
              Company Website
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {company.careersUrl && (
            <a
              href={company.careersUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-text-primary hover:text-accent hover:underline font-medium"
            >
              Careers Portal
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Grid: Tech Stack & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tech Stack */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">
              Verified Tech Stack
            </h2>
          </div>
          {company.technologies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {company.technologies.map((tech) => (
                <Badge key={tech} variant="default" className="text-xs px-2 py-1">
                  {tech}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted">
              No tech stack tags recorded yet. Edit the company to list detected React, Next.js, and frontend technologies.
            </p>
          )}
        </div>

        {/* Hiring & Team Signals */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">
              Hiring & Team Signals
            </h2>
          </div>
          {company.hiringNotes ? (
            <p
              dir="auto"
              className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap"
            >
              {company.hiringNotes}
            </p>
          ) : (
            <p className="text-xs text-text-muted">
              No hiring signals or recent recruiter posts recorded yet.
            </p>
          )}
        </div>

        {/* General Notes */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">
              Research & Networking Notes
            </h2>
          </div>
          {company.notes ? (
            <p
              dir="auto"
              className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap"
            >
              {company.notes}
            </p>
          ) : (
            <p className="text-xs text-text-muted">
              No general notes recorded yet.
            </p>
          )}
        </div>
      </div>

      {/* Relational Sections: Opportunities & Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Linked Opportunities */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-text-muted" />
              <h2 className="text-sm font-semibold text-text-primary">
                Job Opportunities ({company.opportunities.length})
              </h2>
            </div>
          </div>

          {company.opportunities.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="w-5 h-5 text-text-muted" />}
              title="No opportunities linked yet"
              description="Track job openings at this company when discovered."
            />
          ) : (
            <div className="divide-y divide-border">
              {company.opportunities.map((opp) => (
                <div key={opp.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-medium text-text-primary">
                      {opp.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5">
                      <span>{opp.workArrangement}</span>
                      <span>•</span>
                      <span>Discovered {new Date(opp.dateDiscovered).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <StatusBadge status={opp.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked Contacts */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-text-muted" />
              <h2 className="text-sm font-semibold text-text-primary">
                Networking Contacts ({company.contacts.length})
              </h2>
            </div>
          </div>

          {company.contacts.length === 0 ? (
            <EmptyState
              icon={<Users className="w-5 h-5 text-text-muted" />}
              title="No contacts linked yet"
              description="Add recruiters, HR, or engineering leads from this company."
            />
          ) : (
            <div className="divide-y divide-border">
              {company.contacts.map((contact) => (
                <div key={contact.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-medium text-text-primary">
                      {contact.fullName}
                    </h3>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {contact.role || contact.category}
                    </p>
                  </div>
                  <StatusBadge status={contact.relationshipStatus} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
