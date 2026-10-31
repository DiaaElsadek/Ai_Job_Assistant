'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Sparkles,
  Send,
  Copy,
  Check,
  RotateCcw,
  Save,
  MessageSquare,
  Users,
  Briefcase,
  Trash2,
  ExternalLink,
  History,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge, StatusBadge } from '@/src/components/ui/badge'
import { Select } from '@/src/components/ui/select'
import { Textarea } from '@/src/components/ui/textarea'
import {
  generateOutreachAction,
  saveDraftAction,
  markDraftSentAction,
} from '@/src/server/actions/messages'
import { DeleteDraftDialog } from './delete-draft-dialog'
import { useI18n } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'
import type { MessageGoal, MessageLanguage, MessageTone, MessageStatus } from '@prisma/client'

export interface DraftItem {
  id: string
  content: string
  explanation: string | null
  goal: MessageGoal
  language: MessageLanguage
  tone: MessageTone
  status: MessageStatus
  sentAt: Date | string | null
  createdAt: Date | string
  contact: {
    id: string
    fullName: string
    role?: string | null
    company?: { name: string } | null
  } | null
  opportunity: {
    id: string
    title: string
  } | null
  _count: {
    revisions: number
  }
}

interface MessageStudioClientProps {
  contacts: { id: string; fullName: string; role?: string | null; companyName?: string | null }[]
  opportunities: { id: string; title: string; companyName?: string | null }[]
  drafts: DraftItem[]
  initialContactId?: string
  initialOpportunityId?: string
}

const GOAL_OPTIONS = [
  { value: 'ASK_REFERRAL', label: 'Ask for Referral (Direct Tech Fit)' },
  { value: 'INITIAL_CONNECTION', label: 'Initial Connection Request (LinkedIn)' },
  { value: 'ASK_ABOUT_JOB', label: 'Inquire About Specific Role' },
  { value: 'POST_ACCEPTANCE', label: 'Post-Connection Thank You & Chat' },
  { value: 'ASK_ADVICE', label: 'Ask Advice / Informational Chat' },
  { value: 'FOLLOW_UP_NO_RESPONSE', label: 'Gentle Follow-up (No Response)' },
  { value: 'THANK_YOU', label: 'Thank You Note' },
]

const LANGUAGE_OPTIONS = [
  { value: 'EGYPTIAN_ARABIC', label: 'Egyptian Arabic (لهجة مصرية مهنية)' },
  { value: 'ENGLISH', label: 'English (Professional & Global)' },
  { value: 'MSA', label: 'Modern Standard Arabic (فصحى رسمية)' },
]

const TONE_OPTIONS = [
  { value: 'FRIENDLY_PROFESSIONAL', label: 'Friendly & Professional' },
  { value: 'CONCISE_DIRECT', label: 'Concise & Direct (Under 75 words)' },
  { value: 'FORMAL', label: 'Formal & Courteous' },
]

export function MessageStudioClient({
  contacts,
  opportunities,
  drafts,
  initialContactId = '',
  initialOpportunityId = '',
}: MessageStudioClientProps) {
  const router = useRouter()
  const { t, isRtl } = useI18n()
  const [isGenerating, startGenerateTransition] = useTransition()
  const [isSaving, startSaveTransition] = useTransition()

  // Form controls
  const [contactId, setContactId] = useState(initialContactId)
  const [opportunityId, setOpportunityId] = useState(initialOpportunityId)
  const [goal, setGoal] = useState<MessageGoal>('ASK_REFERRAL')
  const [language, setLanguage] = useState<MessageLanguage>('EGYPTIAN_ARABIC')
  const [tone, setTone] = useState<MessageTone>('FRIENDLY_PROFESSIONAL')
  const [sourceFacts, setSourceFacts] = useState('')

  // Editor states
  const [currentContent, setCurrentContent] = useState('')
  const [currentExplanation, setCurrentExplanation] = useState('')
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Dialog
  const [deletingDraft, setDeletingDraft] = useState<{ id: string; contentPreview: string } | null>(null)

  const handleGenerate = () => {
    startGenerateTransition(async () => {
      const res = await generateOutreachAction({
        contactId: contactId || null,
        opportunityId: opportunityId || null,
        goal,
        language,
        tone,
        sourceFacts: sourceFacts || undefined,
      })

      if (!res.success || !res.content) {
        toast.error(res.error || 'Failed to generate message')
        return
      }

      setCurrentContent(res.content)
      setCurrentExplanation(res.explanation || '')
      setCurrentDraftId(null) // New unsaved draft
      toast.success('Message generated!')
    })
  }

  const handleCopy = () => {
    if (!currentContent) return
    navigator.clipboard.writeText(currentContent)
    setCopied(true)
    toast.success('Copied message to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveDraft = () => {
    if (!currentContent.trim()) {
      toast.error('Nothing to save')
      return
    }

    startSaveTransition(async () => {
      const res = await saveDraftAction({
        id: currentDraftId || undefined,
        contactId: contactId || null,
        opportunityId: opportunityId || null,
        goal,
        language,
        tone,
        content: currentContent,
        explanation: currentExplanation,
      })

      if (!res.success) {
        toast.error(res.error || 'Failed to save draft')
        return
      }

      if (res.id) setCurrentDraftId(res.id)
      toast.success('Draft saved successfully')
      router.refresh()
    })
  }

  const handleMarkSent = () => {
    if (!currentDraftId) {
      toast.error('Please save the draft first before marking as sent')
      return
    }

    startSaveTransition(async () => {
      const res = await markDraftSentAction(currentDraftId)
      if (!res.success) {
        toast.error('Failed to mark sent')
        return
      }
      toast.success('Marked as sent!')
      router.refresh()
    })
  }

  const handleLoadDraft = (draft: DraftItem) => {
    setCurrentDraftId(draft.id)
    setCurrentContent(draft.content)
    setCurrentExplanation(draft.explanation || '')
    setGoal(draft.goal)
    setLanguage(draft.language)
    setTone(draft.tone)
    if (draft.contact) setContactId(draft.contact.id)
    if (draft.opportunity) setOpportunityId(draft.opportunity.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const charCount = currentContent.length
  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0

  const contactOptions = [
    { value: '', label: isRtl ? 'بدون (رسالة عامة بدون ربط)' : 'None (Generic Candidate Outreach)' },
    ...contacts.map((c) => ({
      value: c.id,
      label: `${c.fullName} ${c.companyName ? `(${c.companyName})` : ''}`,
    })),
  ]

  const opportunityOptions = [
    { value: '', label: isRtl ? 'بدون (تواصل عام)' : 'None (General Networking)' },
    ...opportunities.map((o) => ({
      value: o.id,
      label: `${o.title} ${o.companyName ? `@ ${o.companyName}` : ''}`,
    })),
  ]

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight">
          {t('messages.title')}
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          {t('messages.subtitle')}
        </p>
      </div>

      {/* Main Studio Workbench (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Generator Configuration (5 cols) */}
        <div className="lg:col-span-5 bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              {isRtl ? 'معايير رسالة التواصل' : 'Outreach Parameters'}
            </h2>
          </div>

          <div className="space-y-3.5">
            <Select
              id="studio-contact"
              label="Recipient Contact"
              options={contactOptions}
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            />

            <Select
              id="studio-opportunity"
              label="Target Opportunity (Optional)"
              options={opportunityOptions}
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
            />

            <Select
              id="studio-goal"
              label="Networking Goal"
              options={GOAL_OPTIONS}
              value={goal}
              onChange={(e) => setGoal(e.target.value as MessageGoal)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                id="studio-language"
                label="Language / Dialect"
                options={LANGUAGE_OPTIONS}
                value={language}
                onChange={(e) => setLanguage(e.target.value as MessageLanguage)}
              />

              <Select
                id="studio-tone"
                label="Tone & Length"
                options={TONE_OPTIONS}
                value={tone}
                onChange={(e) => setTone(e.target.value as MessageTone)}
              />
            </div>

            <Textarea
              id="studio-facts"
              label="Custom Talking Points or Fact to Mention"
              rows={2}
              placeholder="e.g. Saw your post about Next.js 15; worked on similar SSR dashboard..."
              value={sourceFacts}
              onChange={(e) => setSourceFacts(e.target.value)}
            />

            <Button
              type="button"
              className="w-full"
              size="md"
              loading={isGenerating}
              disabled={isGenerating}
              onClick={handleGenerate}
            >
              <Sparkles className={cn("w-4 h-4", isRtl ? "ml-1.5" : "mr-1.5")} />
              {isGenerating ? t('messages.generatingBtn') : t('messages.generateBtn')}
            </Button>
          </div>
        </div>

        {/* Right Column: Interactive Message Editor (7 cols) */}
        <div className="lg:col-span-7 bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                {currentDraftId ? (isRtl ? 'تعديل المسودة المحفوظة' : 'Edit Saved Draft') : t('messages.editorTitle')}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-muted font-mono text-[11px]">
                {charCount} {t('messages.charCount')} • {wordCount} {isRtl ? 'كلمة' : 'words'}
              </span>
            </div>
          </div>

          {/* Text Editor area */}
          <div className="space-y-2">
            <textarea
              dir="auto"
              rows={9}
              placeholder="Your generated outreach message will appear here. You can refine, rewrite, or manually tweak any phrasing..."
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              className="w-full p-3.5 rounded-lg text-xs leading-relaxed bg-bg-primary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent font-sans resize-y"
            />

            {currentExplanation && (
              <p className="text-[11px] text-text-muted italic px-1">
                Strategy rationale: {currentExplanation}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!currentContent}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className={cn("w-3.5 h-3.5 text-success", isRtl ? "ml-1" : "mr-1")} />
                  {t('messages.copied')}
                </>
              ) : (
                <>
                  <Copy className={cn("w-3.5 h-3.5", isRtl ? "ml-1" : "mr-1")} />
                  {t('messages.copy')}
                </>
              )}
            </Button>

            <div className="flex items-center gap-2">
              {currentDraftId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={isSaving}
                  disabled={isSaving}
                  onClick={handleMarkSent}
                >
                  <Send className={cn("w-3.5 h-3.5 text-success", isRtl ? "ml-1" : "mr-1")} />
                  {t('messages.markSent')}
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                loading={isSaving}
                disabled={isSaving || !currentContent}
                onClick={handleSaveDraft}
              >
                <Save className={cn("w-3.5 h-3.5", isRtl ? "ml-1" : "mr-1")} />
                {currentDraftId ? (isRtl ? 'تحديث المسودة' : 'Update Draft') : t('messages.saveDraft')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Drafts History Section */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-text-muted" />
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              {t('messages.savedDrafts')} ({drafts.length})
            </h2>
          </div>
        </div>

        {drafts.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">
            No saved drafts yet. Generate and save a message above to build your outreach library.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-bg-hover/40 px-2 rounded-lg transition-colors"
              >
                <div className="space-y-1.5 flex-1 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    {draft.contact && (
                      <Link
                        href={`/contacts/${draft.contact.id}`}
                        className="text-xs font-semibold text-text-primary hover:text-accent flex items-center gap-1"
                      >
                        <Users className="w-3 h-3 text-text-muted" />
                        {draft.contact.fullName}
                      </Link>
                    )}
                    {draft.opportunity && (
                      <Link
                        href={`/opportunities/${draft.opportunity.id}`}
                        className="text-xs text-text-secondary hover:text-accent flex items-center gap-1"
                      >
                        <Briefcase className="w-3 h-3 text-text-muted" />
                        {draft.opportunity.title}
                      </Link>
                    )}
                    <Badge variant="default" className="text-[10px]">
                      {draft.goal.toLowerCase().replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="default" className="text-[10px]">
                      {draft.language.toLowerCase().replace(/_/g, ' ')}
                    </Badge>
                    <StatusBadge status={draft.status} />
                  </div>

                  <p
                    dir="auto"
                    className="text-xs text-text-secondary line-clamp-2 leading-relaxed"
                  >
                    {draft.content}
                  </p>

                  <div className="text-[10px] text-text-muted">
                    Saved {new Date(draft.createdAt).toLocaleDateString()} •{' '}
                    {draft._count.revisions} {draft._count.revisions === 1 ? 'revision' : 'revisions'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLoadDraft(draft)}
                  >
                    Load in Editor
                  </Button>
                  <Link href={`/messages/${draft.id}`}>
                    <Button size="sm" variant="outline" title="View Revisions">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setDeletingDraft({
                        id: draft.id,
                        contentPreview: draft.content.slice(0, 30),
                      })
                    }
                    className="p-1.5 text-text-muted hover:text-error rounded-md transition-colors"
                    title="Delete Draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteDraftDialog
        open={!!deletingDraft}
        onClose={() => setDeletingDraft(null)}
        draft={deletingDraft}
      />
    </div>
  )
}

