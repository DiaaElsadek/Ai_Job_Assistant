'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Bell,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { EmptyState } from '@/src/components/ui/empty-state'
import { FollowUpCard, type FollowUpTaskItem } from './follow-up-card'
import { FollowUpDialog, type FollowUpFormDataInput } from './follow-up-dialog'
import { DeleteFollowUpDialog } from './delete-follow-up-dialog'

interface FollowUpBoardProps {
  tasks: {
    allTasks: FollowUpTaskItem[]
    overdue: FollowUpTaskItem[]
    today: FollowUpTaskItem[]
    upcoming: FollowUpTaskItem[]
    completed: FollowUpTaskItem[]
    counts: {
      overdue: number
      today: number
      upcoming: number
      completed: number
      totalOpen: number
    }
  }
  contacts: { id: string; fullName: string }[]
  companies: { id: string; name: string }[]
  opportunities: { id: string; title: string }[]
  initialTab?: 'overdue' | 'today' | 'upcoming' | 'completed' | 'all'
  initialPriority?: string
  initialSearch?: string
}

export function FollowUpBoard({
  tasks,
  contacts,
  companies,
  opportunities,
  initialTab = 'today',
  initialPriority = '',
  initialSearch = '',
}: FollowUpBoardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<FollowUpFormDataInput | null>(null)
  const [deletingTask, setDeletingTask] = useState<{ id: string; title: string } | null>(null)

  const [activeTab, setActiveTab] = useState<'overdue' | 'today' | 'upcoming' | 'completed' | 'all'>(
    // If there are overdue tasks, default to overdue tab
    tasks.counts.overdue > 0 && !searchParams.get('tab') ? 'overdue' : initialTab
  )
  const [search, setSearch] = useState(initialSearch)
  const [priority, setPriority] = useState(initialPriority)

  const handleTabChange = (tab: 'overdue' | 'today' | 'upcoming' | 'completed' | 'all') => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`/follow-ups?${params.toString()}`)
  }

  // Determine which tasks to display based on active tab and filters
  let displayedTasks: FollowUpTaskItem[] = []
  if (activeTab === 'overdue') displayedTasks = tasks.overdue
  else if (activeTab === 'today') displayedTasks = tasks.today
  else if (activeTab === 'upcoming') displayedTasks = tasks.upcoming
  else if (activeTab === 'completed') displayedTasks = tasks.completed
  else displayedTasks = tasks.allTasks

  if (priority) {
    displayedTasks = displayedTasks.filter((t) => t.priority === priority)
  }

  if (search) {
    const s = search.toLowerCase()
    displayedTasks = displayedTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(s) ||
        t.contact?.fullName.toLowerCase().includes(s) ||
        t.company?.name.toLowerCase().includes(s) ||
        t.opportunity?.title.toLowerCase().includes(s)
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            Follow-up Queue
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Stay on top of networking check-ins, application follow-ups, and promised touchpoints.
          </p>
        </div>

        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Schedule Follow-up
        </Button>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => handleTabChange('overdue')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'overdue'
              ? 'bg-error/15 text-error font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-error" />
          Overdue
          {tasks.counts.overdue > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-error text-white font-bold">
              {tasks.counts.overdue}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('today')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'today'
              ? 'bg-warning/15 text-warning font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-warning" />
          Due Today
          {tasks.counts.today > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-warning text-black font-bold">
              {tasks.counts.today}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('upcoming')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-info/15 text-info font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-info" />
          Upcoming
          <span className="text-[10px] text-text-muted">({tasks.counts.upcoming})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('completed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'completed'
              ? 'bg-success/15 text-success font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          Completed
          <span className="text-[10px] text-text-muted">({tasks.counts.completed})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-bg-tertiary text-text-primary font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          All Tasks
          <span className="text-[10px] text-text-muted">({tasks.counts.totalOpen})</span>
        </button>
      </div>

      {/* Filter inputs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search follow-up tasks, contacts, or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      {/* Task List */}
      {displayedTasks.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6" />}
          title={
            activeTab === 'overdue'
              ? 'No overdue follow-ups!'
              : activeTab === 'today'
              ? 'All clear for today!'
              : 'No follow-up tasks found'
          }
          description={
            activeTab === 'overdue'
              ? 'Great job keeping up with your networking outreach.'
              : activeTab === 'today'
              ? 'You have zero follow-ups due today.'
              : 'Schedule reminders so you never forget to check back with a contact or hiring manager.'
          }
          action={
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Schedule Follow-up
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {displayedTasks.map((task) => (
            <FollowUpCard
              key={task.id}
              task={task}
              onEdit={(t) => setEditingTask(t)}
              onDelete={(t) => setDeletingTask(t)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <FollowUpDialog
        open={createDialogOpen || !!editingTask}
        onClose={() => {
          setCreateDialogOpen(false)
          setEditingTask(null)
        }}
        task={editingTask}
        contacts={contacts}
        companies={companies}
        opportunities={opportunities}
      />

      <DeleteFollowUpDialog
        open={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        task={deletingTask}
      />
    </div>
  )
}

