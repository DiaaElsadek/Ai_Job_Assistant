import { requireAuth } from '@/src/server/auth'
import { listFollowUps } from '@/src/server/data/follow-ups'
import { listContactsForSelect } from '@/src/server/data/contacts'
import { listCompaniesForSelect } from '@/src/server/data/companies'
import { listOpportunitiesForSelect } from '@/src/server/data/opportunities'
import { FollowUpBoard } from '@/src/components/follow-ups/follow-up-board'

export const instant = false

interface FollowUpsPageProps {
  searchParams: Promise<{
    tab?: 'overdue' | 'today' | 'upcoming' | 'completed' | 'all'
    priority?: string
    search?: string
  }>
}

export default async function FollowUpsPage({ searchParams }: FollowUpsPageProps) {
  const session = await requireAuth()
  const userId = session.user!.id!

  const resolvedParams = await searchParams
  const tab = resolvedParams.tab || 'today'
  const priority = resolvedParams.priority
  const search = resolvedParams.search

  const [tasks, contacts, companies, opportunities] = await Promise.all([
    listFollowUps({
      userId,
      search,
      priority,
    }),
    listContactsForSelect(userId),
    listCompaniesForSelect(userId),
    listOpportunitiesForSelect(userId),
  ])

  // Format data
  const formattedTasks = {
    allTasks: tasks.allTasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      state: t.state,
      notes: t.notes,
      result: t.result,
      contact: t.contact
        ? {
            id: t.contact.id,
            fullName: t.contact.fullName,
            role: t.contact.role,
          }
        : null,
      company: t.company
        ? {
            id: t.company.id,
            name: t.company.name,
          }
        : null,
      opportunity: t.opportunity
        ? {
            id: t.opportunity.id,
            title: t.opportunity.title,
          }
        : null,
    })),
    overdue: tasks.overdue.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      state: t.state,
      notes: t.notes,
      result: t.result,
      contact: t.contact,
      company: t.company,
      opportunity: t.opportunity,
    })),
    today: tasks.today.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      state: t.state,
      notes: t.notes,
      result: t.result,
      contact: t.contact,
      company: t.company,
      opportunity: t.opportunity,
    })),
    upcoming: tasks.upcoming.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      state: t.state,
      notes: t.notes,
      result: t.result,
      contact: t.contact,
      company: t.company,
      opportunity: t.opportunity,
    })),
    completed: tasks.completed.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      state: t.state,
      notes: t.notes,
      result: t.result,
      contact: t.contact,
      company: t.company,
      opportunity: t.opportunity,
    })),
    counts: tasks.counts,
  }

  return (
    <FollowUpBoard
      tasks={formattedTasks}
      contacts={contacts}
      companies={companies}
      opportunities={opportunities.map((o) => ({ id: o.id, title: o.title }))}
      initialTab={tab}
      initialPriority={priority}
      initialSearch={search}
    />
  )
}

