import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/src/server/auth', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('@/src/server/data/opportunities', () => ({
  createOpportunity: vi.fn(),
  updateOpportunity: vi.fn(),
  updateOpportunityStatus: vi.fn(),
  deleteOpportunity: vi.fn(),
}))

vi.mock('@/src/server/db', () => ({
  prisma: {
    opportunity: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/src/server/data/stage-history', () => ({
  recordStageTransition: vi.fn(),
}))

import { requireAuth } from '@/src/server/auth'
import { prisma } from '@/src/server/db'
import {
  createOpportunity,
  updateOpportunityStatus,
} from '@/src/server/data/opportunities'
import {
  createOpportunityAction,
  updateOpportunityStatusAction,
} from '@/src/server/actions/opportunities'

describe('Opportunity Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated user from creating an opportunity', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: undefined,
      expires: new Date().toISOString(),
    } as any)

    const formData = new FormData()
    formData.append('title', 'Senior Frontend Engineer')

    const result = await createOpportunityAction(formData)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  it('fails validation when opportunity title is missing', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: { id: 'user-uuid-1', email: 'owner@example.com' },
      expires: new Date().toISOString(),
    } as any)

    const formData = new FormData()
    formData.append('title', '') // empty title

    const result = await createOpportunityAction(formData)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Job title is required')
  })

  it('successfully creates an opportunity with parsed technologies and salary numbers', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: { id: 'user-uuid-1', email: 'owner@example.com' },
      expires: new Date().toISOString(),
    } as any)

    vi.mocked(createOpportunity).mockResolvedValueOnce({
      id: 'opp-uuid-1',
      title: 'Staff Next.js Engineer',
      userId: 'user-uuid-1',
      status: 'SAVED',
      priority: 'HIGH',
      requiredTechnologies: ['Next.js', 'React', 'TypeScript'],
      salaryMin: 50000,
      salaryMax: 75000,
      salaryCurrency: 'EGP',
    } as any)

    const formData = new FormData()
    formData.append('title', 'Staff Next.js Engineer')
    formData.append('priority', 'HIGH')
    formData.append('status', 'SAVED')
    formData.append('requiredTechnologies', 'Next.js, React, TypeScript')
    formData.append('salaryMin', '50000')
    formData.append('salaryMax', '75000')
    formData.append('salaryCurrency', 'EGP')

    const result = await createOpportunityAction(formData)
    expect(result.success).toBe(true)
    expect(result.id).toBe('opp-uuid-1')
    expect(createOpportunity).toHaveBeenCalledWith(
      'user-uuid-1',
      expect.objectContaining({
        title: 'Staff Next.js Engineer',
        priority: 'HIGH',
        requiredTechnologies: ['Next.js', 'React', 'TypeScript'],
        salaryMin: 50000,
        salaryMax: 75000,
      })
    )
  })

  it('updates opportunity status and invokes data access layer', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: { id: 'user-uuid-1', email: 'owner@example.com' },
      expires: new Date().toISOString(),
    } as any)

    vi.mocked(prisma.opportunity.findFirst).mockResolvedValueOnce({
      id: 'opp-uuid-1',
      status: 'SAVED',
    } as any)

    vi.mocked(updateOpportunityStatus).mockResolvedValueOnce({ count: 1 } as any)

    const result = await updateOpportunityStatusAction('opp-uuid-1', 'INTERVIEW')
    expect(result.success).toBe(true)
    expect(updateOpportunityStatus).toHaveBeenCalledWith('opp-uuid-1', 'user-uuid-1', 'INTERVIEW')
  })
})

