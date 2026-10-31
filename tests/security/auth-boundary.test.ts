import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock server-only
vi.mock('server-only', () => ({}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock auth
vi.mock('@/src/server/auth', () => ({
  requireAuth: vi.fn(),
}))

// Mock database
vi.mock('@/src/server/db', () => ({
  prisma: {
    contact: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    opportunity: {
      findFirst: vi.fn(),
    },
    communicationEntry: {
      create: vi.fn(),
    },
    contactsOnOpportunities: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

import { requireAuth } from '@/src/server/auth'
import { prisma } from '@/src/server/db'
import { logCommunication, linkOpportunityToContact } from '@/src/server/data/contacts'
import { logTouchpointAction } from '@/src/server/actions/contacts'

describe('Auth Boundary & Multi-Tenant Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests in logTouchpointAction', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: undefined,
      expires: new Date().toISOString(),
    } as any)

    const formData = new FormData()
    formData.append('type', 'LinkedIn Message')
    formData.append('content', 'Connecting regarding Frontend Lead position')

    const result = await logTouchpointAction('contact-uuid-1', formData)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  it('throws an error when logCommunication is called for a contact belonging to another user', async () => {
    // Contact not found for this userId
    vi.mocked(prisma.contact.findFirst).mockResolvedValueOnce(null)

    await expect(
      logCommunication(
        'foreign-contact-id',
        {
          type: 'LinkedIn Message',
          content: 'Hello from unauthorized tenant',
        },
        'user-uuid-1'
      )
    ).rejects.toThrow('Contact not found or unauthorized')

    expect(prisma.communicationEntry.create).not.toHaveBeenCalled()
  })

  it('successfully creates touchpoint when contact belongs to authenticated user', async () => {
    const mockContact = {
      id: 'contact-uuid-1',
      userId: 'user-uuid-1',
      fullName: 'Ahmed Recruiter',
    }
    vi.mocked(prisma.contact.findFirst).mockResolvedValueOnce(mockContact as any)
    vi.mocked(prisma.communicationEntry.create).mockResolvedValueOnce({
      id: 'entry-uuid-1',
      contactId: 'contact-uuid-1',
      type: 'LinkedIn Message',
      content: 'Follow-up regarding technical interview',
      date: new Date(),
      notes: null,
      createdAt: new Date(),
    })
    vi.mocked(prisma.contact.update).mockResolvedValueOnce(mockContact as any)

    const entry = await logCommunication(
      'contact-uuid-1',
      {
        type: 'LinkedIn Message',
        content: 'Follow-up regarding technical interview',
      },
      'user-uuid-1'
    )

    expect(entry.id).toBe('entry-uuid-1')
    expect(prisma.contact.update).toHaveBeenCalledWith({
      where: { id: 'contact-uuid-1' },
      data: { lastContactDate: expect.any(Date) },
    })
  })

  it('blocks linking opportunity to contact if either belongs to another user', async () => {
    // Contact found, but opportunity belongs to someone else
    vi.mocked(prisma.contact.findFirst).mockResolvedValueOnce({ id: 'c-1', userId: 'u-1' } as any)
    vi.mocked(prisma.opportunity.findFirst).mockResolvedValueOnce(null)

    await expect(
      linkOpportunityToContact('c-1', 'foreign-opp-id', 'u-1')
    ).rejects.toThrow('Contact or opportunity not found or unauthorized')

    expect(prisma.contactsOnOpportunities.upsert).not.toHaveBeenCalled()
  })
})
