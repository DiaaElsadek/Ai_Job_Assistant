import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Users,
  Building2,
  ExternalLink,
  MapPin,
  Calendar,
  Briefcase,
  Send,
  MessageSquare,
  Clock,
  Sparkles,
} from 'lucide-react'
import { requireAuth } from '@/src/server/auth'
import { getContact } from '@/src/server/data/contacts'
import { listCompaniesForSelect } from '@/src/server/data/companies'
import { Badge, StatusBadge } from '@/src/components/ui/badge'
import { ContactDetailActions } from '@/src/components/contacts/contact-detail-actions'

interface ContactDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const session = await requireAuth()
  const userId = session.user!.id!
  const { id } = await params

  const [contact, companies] = await Promise.all([
    getContact(id, userId),
    listCompaniesForSelect(userId),
  ])

  if (!contact) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Contacts
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-tertiary border border-border text-success">
                <Users className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                {contact.fullName}
              </h1>
              <StatusBadge status={contact.relationshipStatus} />
              <StatusBadge status={contact.networkingPriority} />
            </div>

            {/* Role & Company meta */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-text-secondary">
              {contact.role && (
                <span className="text-text-primary font-medium">{contact.role}</span>
              )}

              {contact.company ? (
                <Link
                  href={`/companies/${contact.company.id}`}
                  className="inline-flex items-center gap-1 text-text-secondary hover:text-accent transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-text-muted" />
                  {contact.company.name}
                </Link>
              ) : (
                <span className="text-text-muted">Unassigned Company</span>
              )}

              {contact.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-text-muted" />
                  {contact.location}
                </span>
              )}

              <Badge variant="default" className="text-[10px]">
                {contact.category.toLowerCase().replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>

          <ContactDetailActions
            contact={contact}
            companies={companies}
          />
        </div>

        {/* Profile Link */}
        {contact.profileUrl && (
          <div className="pt-2 border-t border-border/60 text-xs">
            <a
              href={contact.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent hover:underline font-medium"
            >
              LinkedIn / Public Profile
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reason for targeting */}
          {contact.reasonForTargeting && (
            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-2">
              <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                Why Target This Contact?
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                {contact.reasonForTargeting}
              </p>
            </div>
          )}

          {/* Personalization Notes */}
          {contact.personalizationNotes && (
            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-2">
              <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                Personalization Facts (Common ground & Tech stack)
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                {contact.personalizationNotes}
              </p>
            </div>
          )}

          {/* Touchpoint Timeline */}
          <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Outreach & Communication History ({contact.communicationHistory.length})
            </h2>

            {contact.communicationHistory.length === 0 ? (
              <p className="text-xs text-text-muted py-2">
                No touchpoints recorded yet. Use the "Log Touchpoint" button above after sending a connection request or message.
              </p>
            ) : (
              <div className="space-y-3">
                {contact.communicationHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-bg-tertiary/40 border border-border/70 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-accent">{item.type}</span>
                      <span className="text-text-muted">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-text-primary whitespace-pre-line">{item.content}</p>
                    {item.notes && (
                      <p className="text-[11px] text-text-muted italic">
                        Outcome: {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Opportunities */}
          <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                Target Opportunities at this Company ({contact.opportunities.length})
              </h2>
              <Link
                href="/opportunities"
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                Browse Opportunities
              </Link>
            </div>

            {contact.opportunities.length === 0 ? (
              <p className="text-xs text-text-muted py-2">
                No specific opportunities connected to this contact.
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {contact.opportunities.map(({ opportunity }) => (
                  <div
                    key={opportunity.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <Link
                        href={`/opportunities/${opportunity.id}`}
                        className="font-medium text-text-primary hover:text-accent"
                      >
                        {opportunity.title}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={opportunity.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* General Notes */}
          {contact.notes && (
            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-2">
              <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                General Notes
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                {contact.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right column (1 col) */}
        <div className="space-y-6">
          {/* Tracking Card */}
          <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Relationship Status
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Current Stage:</span>
                <StatusBadge status={contact.relationshipStatus} />
              </div>

              {contact.nextFollowUpDate && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Next Follow-up:</span>
                  <span className="text-warning font-medium">
                    {new Date(contact.nextFollowUpDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {contact.lastContactDate && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Last Contacted:</span>
                  <span className="text-text-secondary">
                    {new Date(contact.lastContactDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-text-muted">Added:</span>
                <span className="text-text-secondary">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* AI Outreach CTA */}
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-1.5 text-accent font-semibold text-xs">
              <Send className="w-3.5 h-3.5" />
              Generate Outreach Message
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Draft a personalized LinkedIn connection note or email to {contact.fullName} using AI.
            </p>
            <div className="pt-2">
              <Link href={`/messages?contactId=${contact.id}`}>
                <button
                  type="button"
                  className="w-full h-8 px-3 rounded-lg text-xs font-medium bg-accent text-black hover:bg-accent/90 transition-colors"
                >
                  Draft Message in Studio
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

