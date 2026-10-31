import 'server-only'
import { prisma } from '@/src/server/db'
import type { Prisma, ContactCategory, RelationshipStatus, Priority, VerificationFlag } from '@prisma/client'

// ─── List contacts with search and filtering ──────────────

export interface ListContactsParams {
  userId: string
  search?: string
  category?: string
  relationshipStatus?: string
  networkingPriority?: string
  companyId?: string
  sortBy?: 'fullName' | 'networkingPriority' | 'relationshipStatus' | 'createdAt' | 'lastContactDate' | 'nextFollowUpDate'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export async function listContacts({
  userId,
  search,
  category,
  relationshipStatus,
  networkingPriority,
  companyId,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  page = 1,
  pageSize = 20,
}: ListContactsParams) {
  const where: Prisma.ContactWhereInput = { userId }

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { role: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
      { company: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (category) {
    where.category = category as ContactCategory
  }

  if (relationshipStatus) {
    where.relationshipStatus = relationshipStatus as RelationshipStatus
  }

  if (networkingPriority) {
    where.networkingPriority = networkingPriority as Priority
  }

  if (companyId) {
    where.companyId = companyId
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        _count: {
          select: {
            opportunities: true,
            messageDrafts: true,
            communicationHistory: true,
          },
        },
      },
    }),
    prisma.contact.count({ where }),
  ])

  return {
    contacts,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  }
}

// ─── Get single contact with relations ────────────────────

export async function getContact(id: string, userId: string) {
  return prisma.contact.findFirst({
    where: { id, userId },
    include: {
      company: true,
      opportunities: {
        include: {
          opportunity: true,
        },
        orderBy: { assignedAt: 'desc' },
      },
      messageDrafts: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      outreachActivities: {
        orderBy: { activityDate: 'desc' },
        take: 10,
      },
      communicationHistory: {
        orderBy: { date: 'desc' },
        take: 20,
      },
      followUpTasks: {
        orderBy: { dueDate: 'asc' },
        take: 10,
      },
      _count: {
        select: {
          opportunities: true,
          messageDrafts: true,
          communicationHistory: true,
          followUpTasks: true,
        },
      },
    },
  })
}

// ─── Create ───────────────────────────────────────────────

export async function createContact(
  userId: string,
  data: Prisma.ContactCreateWithoutUserInput
) {
  return prisma.contact.create({
    data: {
      ...data,
      user: { connect: { id: userId } },
    },
    include: {
      company: {
        select: { id: true, name: true },
      },
    },
  })
}

// ─── Update ───────────────────────────────────────────────

export async function updateContact(
  id: string,
  userId: string,
  data: Prisma.ContactUpdateInput
) {
  return prisma.contact.updateMany({
    where: { id, userId },
    data,
  })
}

// ─── Update Relationship Status ───────────────────────────

export async function updateContactRelationshipStatus(
  id: string,
  userId: string,
  relationshipStatus: RelationshipStatus
) {
  return prisma.contact.updateMany({
    where: { id, userId },
    data: {
      relationshipStatus,
      lastContactDate: new Date(),
    },
  })
}

// ─── Link / Unlink Opportunity ────────────────────────────

export async function linkOpportunityToContact(
  contactId: string,
  opportunityId: string,
  userId?: string
) {
  if (userId) {
    const [contact, opportunity] = await Promise.all([
      prisma.contact.findFirst({ where: { id: contactId, userId } }),
      prisma.opportunity.findFirst({ where: { id: opportunityId, userId } }),
    ])
    if (!contact || !opportunity) {
      throw new Error('Contact or opportunity not found or unauthorized')
    }
  }

  return prisma.contactsOnOpportunities.upsert({
    where: {
      contactId_opportunityId: {
        contactId,
        opportunityId,
      },
    },
    update: {},
    create: {
      contactId,
      opportunityId,
    },
  })
}

export async function unlinkOpportunityFromContact(
  contactId: string,
  opportunityId: string,
  userId?: string
) {
  if (userId) {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, userId } })
    if (!contact) {
      throw new Error('Contact not found or unauthorized')
    }
  }

  return prisma.contactsOnOpportunities.deleteMany({
    where: {
      contactId,
      opportunityId,
    },
  })
}

// ─── Log Communication Touchpoint ─────────────────────────

export async function logCommunication(
  contactId: string,
  data: {
    type: string
    content: string
    date?: Date
    notes?: string | null
  },
  userId?: string
) {
  if (userId) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId },
    })
    if (!contact) {
      throw new Error('Contact not found or unauthorized')
    }
  }

  const entry = await prisma.communicationEntry.create({
    data: {
      contactId,
      type: data.type,
      content: data.content,
      date: data.date || new Date(),
      notes: data.notes || null,
    },
  })

  // Update contact's lastContactDate
  await prisma.contact.update({
    where: { id: contactId },
    data: { lastContactDate: data.date || new Date() },
  })

  return entry
}

// ─── Delete ───────────────────────────────────────────────

export async function deleteContact(id: string, userId: string) {
  return prisma.contact.deleteMany({
    where: { id, userId },
  })
}

// ─── List for select dropdowns ────────────────────────────

export async function listContactsForSelect(userId: string) {
  return prisma.contact.findMany({
    where: { userId },
    select: {
      id: true,
      fullName: true,
      role: true,
      company: { select: { name: true } },
    },
    orderBy: { fullName: 'asc' },
  })
}

