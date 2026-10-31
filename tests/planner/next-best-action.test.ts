import { describe, it, expect } from 'vitest'
import { rankNextBestActions, type RawPlannerData } from '@/src/lib/planner/next-best-action'

describe('Daily Next Best Action Planner (F4)', () => {
  it('ranks overdue follow-ups with highest priority (CRITICAL score 100)', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const rawData: RawPlannerData = {
      followUps: [
        {
          id: 'task-1',
          title: 'Send portfolio link to Lead',
          dueDate: yesterday, // overdue
          priority: 'HIGH',
          contact: { id: 'c-1', fullName: 'Karim Tech Lead' },
        },
        {
          id: 'task-2',
          title: 'Check application status',
          dueDate: tomorrow, // not overdue
          priority: 'MEDIUM',
        },
      ],
      staleContacts: [
        {
          id: 'contact-1',
          fullName: 'Sara Recruiter',
          networkingPriority: 'HIGH',
          lastContactDate: new Date('2026-01-01'),
          company: { name: 'Instabug' },
        },
      ],
      urgentOpportunities: [
        {
          id: 'opp-1',
          title: 'Senior Next.js Developer',
          status: 'READY_TO_APPLY',
          priority: 'HIGH',
        },
      ],
    }

    const actions = rankNextBestActions(rawData)

    expect(actions.length).toBe(4)
    // First action should be overdue task
    expect(actions[0].id).toBe('task-task-1')
    expect(actions[0].priority).toBe('CRITICAL')
    expect(actions[0].score).toBe(100)
    expect(actions[0].entityName).toBe('Karim Tech Lead')

    // Second action should be follow-up due tomorrow or stale contact
    expect(actions[1].score).toBe(90) // Due tomorrow task
    expect(actions[2].score).toBe(75) // Stale contact
    expect(actions[3].score).toBe(65) // Opportunity
  })

  it('limits output to top 5 actions', () => {
    const past = new Date('2026-01-01')
    const rawData: RawPlannerData = {
      followUps: Array.from({ length: 10 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        dueDate: past,
        priority: 'HIGH',
      })),
      staleContacts: [],
      urgentOpportunities: [],
    }

    const actions = rankNextBestActions(rawData)
    expect(actions.length).toBe(5)
  })
})

