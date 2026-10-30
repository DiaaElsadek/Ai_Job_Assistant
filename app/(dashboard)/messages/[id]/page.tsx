import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  MessageSquare,
  Users,
  Briefcase,
  History,
  Copy,
  Calendar,
  Send,
  Building2,
} from 'lucide-react'
import { requireAuth } from '@/src/server/auth'
import { getMessageDraft } from '@/src/server/data/messages'
import { Badge, StatusBadge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'

interface MessageDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MessageDetailPage({ params }: MessageDetailPageProps) {
  const session = await requireAuth()
  const userId = session.user!.id!
  const { id } = await params

  const draft = await getMessageDraft(id, userId)

  if (!draft) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/messages"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Message Studio
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-tertiary border border-border text-accent">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                Outreach Draft
              </h1>
              <StatusBadge status={draft.status} />
              <Badge variant="default">
                {draft.goal.toLowerCase().replace(/_/g, ' ')}
              </Badge>
              <Badge variant="default">
                {draft.language.toLowerCase().replace(/_/g, ' ')}
              </Badge>
              <Badge variant="default">
                {draft.tone.toLowerCase().replace(/_/g, ' ')}
              </Badge>
            </div>

            {/* Relations meta */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-text-secondary">
              {draft.contact && (
                <Link
                  href={`/contacts/${draft.contact.id}`}
                  className="inline-flex items-center gap-1 text-text-primary hover:text-accent font-medium"
                >
                  <Users className="w-3.5 h-3.5 text-text-muted" />
                  {draft.contact.fullName}
                  {draft.contact.company && ` (${draft.contact.company.name})`}
                </Link>
              )}

              {draft.opportunity && (
                <Link
                  href={`/opportunities/${draft.opportunity.id}`}
                  className="inline-flex items-center gap-1 text-text-primary hover:text-accent font-medium"
                >
                  <Briefcase className="w-3.5 h-3.5 text-text-muted" />
                  {draft.opportunity.title}
                </Link>
              )}

              <span className="text-text-muted">
                Created {new Date(draft.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <Link href="/messages">
            <Button size="sm">
              Open in Editor
            </Button>
          </Link>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Latest Draft Text (7 cols) */}
        <div className="lg:col-span-7 bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
            Current Content
          </h2>

          <div
            dir="auto"
            className="p-4 rounded-lg bg-bg-primary border border-border text-xs leading-relaxed text-text-primary whitespace-pre-line font-sans"
          >
            {draft.content}
          </div>

          {draft.explanation && (
            <div className="text-xs text-text-muted italic bg-bg-tertiary/40 p-3 rounded-lg border border-border/60">
              Strategy: {draft.explanation}
            </div>
          )}
        </div>

        {/* Right: Revision History (5 cols) */}
        <div className="lg:col-span-5 bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <History className="w-4 h-4 text-text-muted" />
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Revision History ({draft.revisions.length})
            </h2>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {draft.revisions.map((rev, index) => (
              <div
                key={rev.id}
                className="p-3 rounded-lg bg-bg-tertiary/30 border border-border/60 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-text-primary">
                    Revision #{draft.revisions.length - index}
                  </span>
                  <span className="text-text-muted">
                    {new Date(rev.createdAt).toLocaleString()}
                  </span>
                </div>

                {rev.explanation && (
                  <p className="text-[11px] text-accent font-medium">
                    {rev.explanation}
                  </p>
                )}

                <p dir="auto" className="text-text-secondary text-[11px] line-clamp-3">
                  {rev.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

