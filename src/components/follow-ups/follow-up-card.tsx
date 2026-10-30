'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  Users,
  Briefcase,
  Pencil,
  Trash2,
  RotateCw,
} from 'lucide-react'
import { Badge, StatusBadge } from '@/src/components/ui/badge'
import {
  completeFollowUpAction,
  snoozeFollowUpAction,
  dismissFollowUpAction,
} from '@/src/server/actions/follow-ups'

export interface FollowUpTaskItem {
  id: string
  title: string
  dueDate: Date | string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  state: 'OPEN' | 'COMPLETED' | 'DISMISSED'
  notes: string | null
  result: string | null
  contact: {
    id: string
    fullName: string
    role?: string | null
  } | null
  company: {
    id: string
    name: string
  } | null
  opportunity: {
    id: string
    title: string
  } | null
}

interface FollowUpCardProps {
  task: FollowUpTaskItem
  onEdit: (task: FollowUpTaskItem) => void
  onDelete: (task: { id: string; title: string }) => void
}

export function FollowUpCard({ task, onEdit, onDelete }: FollowUpCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  const taskDue = new Date(task.dueDate)

  const isOverdue = task.state === 'OPEN' && taskDue < startOfToday
  const isDueToday = task.state === 'OPEN' && taskDue >= startOfToday && taskDue <= endOfToday
  const isDone = task.state === 'COMPLETED'

  const handleComplete = () => {
    startTransition(async () => {
      const res = await completeFollowUpAction(task.id)
      if (!res.success) {
        toast.error('Failed to complete task')
        return
      }
      toast.success('Task marked completed!')
      router.refresh()
    })
  }

  const handleSnooze = (days: number) => {
    startTransition(async () => {
      const res = await snoozeFollowUpAction(task.id, days)
      if (!res.success) {
        toast.error('Failed to snooze task')
        return
      }
      toast.success(`Snoozed for ${days} ${days === 1 ? 'day' : 'days'}`)
      router.refresh()
    })
  }

  return (
    <div
      className={`bg-bg-secondary border rounded-xl p-4 shadow-xs transition-all space-y-3 ${
        isOverdue
          ? 'border-error/40 bg-error/5'
          : isDueToday
          ? 'border-warning/50 bg-warning/5'
          : isDone
          ? 'border-border/50 opacity-70'
          : 'border-border hover:border-accent/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Complete Checkbox + Title */}
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            disabled={isPending || isDone}
            onClick={handleComplete}
            className={`mt-0.5 rounded-full transition-colors ${
              isDone
                ? 'text-success'
                : 'text-text-muted hover:text-success'
            }`}
            title={isDone ? 'Completed' : 'Click to mark complete'}
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>

          <div className="space-y-1">
            <h3
              className={`text-xs font-semibold text-text-primary ${
                isDone ? 'line-through text-text-muted' : ''
              }`}
            >
              {task.title}
            </h3>

            {task.notes && (
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {task.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right: Badges & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={task.priority} />
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="p-1 text-text-muted hover:text-accent rounded transition-colors"
            title="Edit task"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete({ id: task.id, title: task.title })}
            className="p-1 text-text-muted hover:text-error rounded transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Meta chips: Due Date, Contact, Company, Opportunity */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-[11px]">
        {/* Due date */}
        <span
          className={`inline-flex items-center gap-1 font-medium ${
            isOverdue
              ? 'text-error font-semibold'
              : isDueToday
              ? 'text-warning font-semibold'
              : 'text-text-muted'
          }`}
        >
          <Calendar className="w-3 h-3" />
          {isOverdue
            ? `Overdue (${taskDue.toLocaleDateString()})`
            : isDueToday
            ? 'Due Today'
            : `Due: ${taskDue.toLocaleDateString()}`}
        </span>

        {/* Linked Contact */}
        {task.contact && (
          <Link
            href={`/contacts/${task.contact.id}`}
            className="inline-flex items-center gap-1 text-text-secondary hover:text-accent font-medium px-2 py-0.5 rounded bg-bg-tertiary"
          >
            <Users className="w-3 h-3 text-text-muted" />
            <span>{task.contact.fullName}</span>
          </Link>
        )}

        {/* Linked Company */}
        {task.company && (
          <Link
            href={`/companies/${task.company.id}`}
            className="inline-flex items-center gap-1 text-text-secondary hover:text-accent font-medium px-2 py-0.5 rounded bg-bg-tertiary"
          >
            <Building2 className="w-3 h-3 text-text-muted" />
            <span>{task.company.name}</span>
          </Link>
        )}

        {/* Linked Opportunity */}
        {task.opportunity && (
          <Link
            href={`/opportunities/${task.opportunity.id}`}
            className="inline-flex items-center gap-1 text-text-secondary hover:text-accent font-medium px-2 py-0.5 rounded bg-bg-tertiary truncate max-w-[200px]"
          >
            <Briefcase className="w-3 h-3 text-text-muted shrink-0" />
            <span className="truncate">{task.opportunity.title}</span>
          </Link>
        )}

        {/* Snooze actions (for open tasks) */}
        {!isDone && (
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] text-text-muted mr-1">Snooze:</span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSnooze(1)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
            >
              +1d
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSnooze(3)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
            >
              +3d
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSnooze(7)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
            >
              +1w
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

