'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  Star,
  Trash2,
  User,
  HelpCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Dialog } from '@/src/components/ui/dialog'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import {
  createInterviewRoundAction,
  updateInterviewRoundAction,
  deleteInterviewRoundAction,
  generateRoleQuestionsAction,
  createStarStoryAction,
} from '@/src/server/actions/interviews'
import type { InterviewQuestion } from '@/src/lib/ai/interview-prep'
import { useI18n } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'

export interface InterviewRoundItem {
  id: string
  roundNumber: number
  roundType: 'RECRUITER_SCREEN' | 'TECHNICAL_PHONE' | 'LIVE_CODING' | 'SYSTEM_DESIGN' | 'BEHAVIORAL_CULTURE' | 'MANAGEMENT_FINAL'
  scheduledAt: Date | string | null
  interviewerName: string | null
  interviewerRole: string | null
  questionsAsked: string[]
  userNotes: string | null
  rating: number | null
  completed: boolean
}

interface InterviewPrepSectionProps {
  opportunityId: string
  jobTitle: string
  rounds: InterviewRoundItem[]
}

export function InterviewPrepSection({
  opportunityId,
  jobTitle,
  rounds,
}: InterviewPrepSectionProps) {
  const router = useRouter()
  const { isRtl } = useI18n()
  const [isPending, startTransition] = useTransition()

  const [addRoundOpen, setAddRoundOpen] = useState(false)
  const [questionsOpen, setQuestionsOpen] = useState(false)
  const [starOpen, setStarOpen] = useState(false)

  const [aiQuestions, setAiQuestions] = useState<InterviewQuestion[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  // Handle generating AI interview questions
  const handleGenerateQuestions = async () => {
    setLoadingQuestions(true)
    setQuestionsOpen(true)
    try {
      const res = await generateRoleQuestionsAction(opportunityId)
      if (res.success && res.data) {
        setAiQuestions(res.data)
      } else {
        toast.error(res.error || 'Failed to generate questions.')
      }
    } catch {
      toast.error('Error contacting AI engine.')
    } finally {
      setLoadingQuestions(false)
    }
  }

  // Handle toggling round completion
  const handleToggleComplete = (round: InterviewRoundItem) => {
    startTransition(async () => {
      const res = await updateInterviewRoundAction(opportunityId, round.id, {
        completed: !round.completed,
      })
      if (res.success) {
        toast.success(round.completed ? 'Round marked active' : 'Round marked completed!')
        router.refresh()
      }
    })
  }

  // Handle updating rating
  const handleUpdateRating = (roundId: string, rating: number) => {
    startTransition(async () => {
      const res = await updateInterviewRoundAction(opportunityId, roundId, { rating })
      if (res.success) {
        toast.success(`Rating set to ${rating} stars!`)
        router.refresh()
      }
    })
  }

  // Handle deleting round
  const handleDeleteRound = (roundId: string) => {
    if (!confirm('Are you sure you want to delete this interview round?')) return
    startTransition(async () => {
      const res = await deleteInterviewRoundAction(opportunityId, roundId)
      if (res.success) {
        toast.success('Interview round deleted.')
        router.refresh()
      }
    })
  }

  const formatRoundType = (type: string) => {
    switch (type) {
      case 'RECRUITER_SCREEN':
        return isRtl ? 'مقابلة أولية (Recruiter Screen)' : 'Recruiter Screen'
      case 'TECHNICAL_PHONE':
        return isRtl ? 'مقابلة تقنية هاتفية' : 'Technical Screen'
      case 'LIVE_CODING':
        return isRtl ? 'اختبار برمجي مباشر (Live Coding)' : 'Live Coding'
      case 'SYSTEM_DESIGN':
        return isRtl ? 'تصميم نظم (System Design)' : 'System Design'
      case 'BEHAVIORAL_CULTURE':
        return isRtl ? 'مقابلة سلوكية وثقافية' : 'Behavioral & Culture'
      case 'MANAGEMENT_FINAL':
        return isRtl ? 'المقابلة النهائية مع الإدارة' : 'Executive Final'
      default:
        return type.replace(/_/g, ' ')
    }
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">
              {isRtl ? 'مركز إدارة المقابلات والتحضير (Interview Prep)' : 'Interview Prep & Round Tracking'}
            </h2>
            <p className="text-[11px] text-text-muted">
              {isRtl
                ? 'تتبع جولات المقابلات، توليد الأسئلة التقنية المتوقعة، وتوثيق قصص STAR.'
                : 'Track interview stages, practice technical Q&As, and log post-round feedback.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateQuestions}
            className="gap-1.5 h-8 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>{isRtl ? 'توليد أسئلة متوقعة' : 'Generate Q&A Bank'}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setAddRoundOpen(true)}
            className="gap-1.5 h-8 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isRtl ? 'إضافة جولة مقابلة' : 'Add Interview Round'}</span>
          </Button>
        </div>
      </div>

      {/* Rounds List */}
      {rounds.length === 0 ? (
        <div className="p-6 text-center rounded-lg bg-bg-card border border-dashed border-border space-y-2">
          <Calendar className="w-6 h-6 text-text-muted mx-auto" />
          <p className="text-xs font-semibold text-text-primary">
            {isRtl ? 'لا توجد جولات مقابلات مسجلة بعد' : 'No Interview Rounds Logged Yet'}
          </p>
          <p className="text-[11px] text-text-muted max-w-sm mx-auto">
            {isRtl
              ? 'سجل مواعيد المقابلات وأسماء المقابلين لمتابعة الأداء واستخراج تقييمات دقيقة.'
              : 'Add scheduled interview rounds to organize discussion notes, interviewer details, and ratings.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rounds.map((round) => (
            <div
              key={round.id}
              className={cn(
                'p-4 rounded-xl border transition-colors space-y-3',
                round.completed
                  ? 'bg-bg-card/50 border-border/60 opacity-90'
                  : 'bg-bg-card border-border hover:border-accent/40'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-accent/10 text-accent border border-accent/20 flex items-center justify-center text-xs font-bold shrink-0">
                    {round.roundNumber}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-text-primary">
                      {formatRoundType(round.roundType)}
                    </h3>
                    {(round.interviewerName || round.interviewerRole) && (
                      <p className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" />
                        <span>
                          {round.interviewerName || 'Interviewer'}
                          {round.interviewerRole ? ` (${round.interviewerRole})` : ''}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Star Rating */}
                  <div className="flex items-center gap-0.5 px-2 py-1 rounded bg-bg-secondary border border-border">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleUpdateRating(round.id, star)}
                        className={cn(
                          'p-0.5 hover:text-amber-400 transition-colors',
                          (round.rating || 0) >= star ? 'text-amber-400 fill-amber-400' : 'text-text-muted'
                        )}
                        title={`Rate ${star} stars`}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>

                  {/* Complete Button */}
                  <Button
                    size="sm"
                    variant={round.completed ? 'outline' : 'primary'}
                    onClick={() => handleToggleComplete(round)}
                    className="h-7 text-xs gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-success" />
                    <span>{round.completed ? (isRtl ? 'مكتملة' : 'Completed') : (isRtl ? 'إكمال' : 'Mark Done')}</span>
                  </Button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteRound(round.id)}
                    className="p-1 rounded text-text-muted hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              {round.userNotes && (
                <div className="p-2.5 rounded bg-bg-secondary border border-border text-[11px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {round.userNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog 1: Add Round */}
      <AddRoundDialog
        open={addRoundOpen}
        onClose={() => setAddRoundOpen(false)}
        opportunityId={opportunityId}
        nextNumber={rounds.length + 1}
      />

      {/* Dialog 2: AI Questions Bank */}
      <Dialog
        open={questionsOpen}
        onClose={() => setQuestionsOpen(false)}
        title={isRtl ? `أسئلة مقابلة مقترحة: ${jobTitle}` : `Interview Questions: ${jobTitle}`}
        description={
          isRtl
            ? 'أسئلة تم توليدها بالذكاء وفقًا للتقنيات والمسؤوليات المحددة في إعلان الوظيفة.'
            : 'Tailored technical, system design, and behavioral questions generated by Gemini.'
        }
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {loadingQuestions ? (
            <div className="p-8 text-center text-xs text-text-muted space-y-2">
              <Sparkles className="w-6 h-6 text-accent animate-pulse mx-auto" />
              <p>{isRtl ? 'جاري تحليل المتطلبات وصياغة الأسئلة...' : 'Analyzing requirements and generating question bank...'}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {aiQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-bg-secondary border border-border space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-bg-hover text-accent border border-border">
                      {q.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(q.question)
                        toast.success('Question copied to clipboard!')
                      }}
                      className="text-[11px] text-text-muted hover:text-accent"
                    >
                      {isRtl ? 'نسخ' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-text-primary leading-relaxed">
                    {q.question}
                  </p>
                  {q.suggestedFocus && (
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      💡 <span className="font-medium text-text-secondary">{isRtl ? 'محور الإجابة المثالية: ' : 'Suggested Focus: '}</span>
                      {q.suggestedFocus}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  )
}

function AddRoundDialog({
  open,
  onClose,
  opportunityId,
  nextNumber,
}: {
  open: boolean
  onClose: () => void
  opportunityId: string
  nextNumber: number
}) {
  const router = useRouter()
  const { isRtl } = useI18n()
  const [isPending, startTransition] = useTransition()

  const [roundNumber, setRoundNumber] = useState(nextNumber)
  const [roundType, setRoundType] = useState('TECHNICAL_PHONE')
  const [interviewerName, setInterviewerName] = useState('')
  const [interviewerRole, setInterviewerRole] = useState('')
  const [userNotes, setUserNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const formData = new FormData()
      formData.append('roundNumber', String(roundNumber))
      formData.append('roundType', roundType)
      formData.append('interviewerName', interviewerName)
      formData.append('interviewerRole', interviewerRole)
      formData.append('userNotes', userNotes)

      const res = await createInterviewRoundAction(opportunityId, formData)
      if (res.success) {
        toast.success('Interview round created!')
        onClose()
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to create round')
      }
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isRtl ? 'إضافة جولة مقابلة جديدة' : 'Add Interview Round'}
      description={isRtl ? 'سجل رقم الجولة ونوعها وتفاصيل المقابلين.' : 'Record round stage, interviewer contact, and preparation notes.'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-text-muted mb-1">{isRtl ? 'رقم الجولة' : 'Round Number'}</label>
            <Input
              type="number"
              value={roundNumber}
              onChange={(e) => setRoundNumber(Number(e.target.value))}
              min={1}
              className="text-xs"
            />
          </div>
          <div>
            <label className="block text-text-muted mb-1">{isRtl ? 'نوع الجولة' : 'Round Type'}</label>
            <select
              value={roundType}
              onChange={(e) => setRoundType(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="RECRUITER_SCREEN">Recruiter Screen</option>
              <option value="TECHNICAL_PHONE">Technical Phone Screen</option>
              <option value="LIVE_CODING">Live Coding / Pair Programming</option>
              <option value="SYSTEM_DESIGN">System Design / Architecture</option>
              <option value="BEHAVIORAL_CULTURE">Behavioral / Culture Fit</option>
              <option value="MANAGEMENT_FINAL">Management / VP Final</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-text-muted mb-1">{isRtl ? 'اسم المقابل' : 'Interviewer Name'}</label>
            <Input
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              placeholder="e.g. Ahmed Mostafa"
              className="text-xs"
            />
          </div>
          <div>
            <label className="block text-text-muted mb-1">{isRtl ? 'المسمى الوظيفي' : 'Interviewer Role'}</label>
            <Input
              value={interviewerRole}
              onChange={(e) => setInterviewerRole(e.target.value)}
              placeholder="e.g. Frontend Tech Lead"
              className="text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-text-muted mb-1">{isRtl ? 'ملاحظات وتجهيزات' : 'Preparation Notes'}</label>
          <Textarea
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            rows={3}
            placeholder={isRtl ? 'التركيز على مهارات Next.js Server Components ومعايير الأداء...' : 'Focus on Next.js App Router, caching strategies, and Core Web Vitals...'}
            className="text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            {isRtl ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button size="sm" type="submit" disabled={isPending}>
            {isPending ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الجولة' : 'Save Round')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
