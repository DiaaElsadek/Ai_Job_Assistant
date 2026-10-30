import 'server-only'
import { prisma } from '@/src/server/db'
import type { Prisma, OpportunityStatus, Priority, ExperienceLevel, WorkArrangement } from '@prisma/client'

// ─── List opportunities with search and filtering ─────────

export interface ListOpportunitiesParams {
  userId: string
  search?: string
  status?: string
  priority?: string
  workArrangement?: string
  experienceLevel?: string
  companyId?: string
  sortBy?: 'title' | 'priority' | 'status' | 'createdAt' | 'deadline' | 'dateApplied'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export async function listOpportunities({
  userId,
  search,
  status,
  priority,
  workArrangement,
  experienceLevel,
  companyId,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  page = 1,
  pageSize = 20,
}: ListOpportunitiesParams) {
  const where: Prisma.OpportunityWhereInput = { userId }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
      { company: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (status) {
    where.status = status as OpportunityStatus
  }

  if (priority) {
    where.priority = priority as Priority
  }

  if (workArrangement) {
    where.workArrangement = workArrangement as WorkArrangement
  }

  if (experienceLevel) {
    where.experienceLevel = experienceLevel as ExperienceLevel
  }

  if (companyId) {
    where.companyId = companyId
  }

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            location: true,
          },
        },
        _count: {
          select: {
            contacts: true,
            messageDrafts: true,
          },
        },
      },
    }),
    prisma.opportunity.count({ where }),
  ])

  return {
    opportunities,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  }
}

// ─── Get single opportunity with relations ────────────────

export async function getOpportunity(id: string, userId: string) {
  return prisma.opportunity.findFirst({
    where: { id, userId },
    include: {
      company: true,
      contacts: {
        include: {
          contact: true,
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
      followUpTasks: {
        orderBy: { dueDate: 'asc' },
        take: 10,
      },
      _count: {
        select: {
          contacts: true,
          messageDrafts: true,
          outreachActivities: true,
          followUpTasks: true,
        },
      },
    },
  })
}

// ─── Create ───────────────────────────────────────────────

export async function createOpportunity(
  userId: string,
  data: Prisma.OpportunityCreateWithoutUserInput
) {
  return prisma.opportunity.create({
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

export async function updateOpportunity(
  id: string,
  userId: string,
  data: Prisma.OpportunityUpdateInput
) {
  return prisma.opportunity.updateMany({
    where: { id, userId },
    data,
  })
}

// ─── Update Status Only (Kanban Drag / Quick action) ──────

export async function updateOpportunityStatus(
  id: string,
  userId: string,
  status: OpportunityStatus
) {
  const updateData: Prisma.OpportunityUpdateManyMutationInput = { status }
  if (status === 'APPLIED') {
    updateData.dateApplied = new Date()
  }

  return prisma.opportunity.updateMany({
    where: { id, userId },
    data: updateData,
  })
}

// ─── Delete ───────────────────────────────────────────────

export async function deleteOpportunity(id: string, userId: string) {
  return prisma.opportunity.deleteMany({
    where: { id, userId },
  })
}

// ─── List for select dropdowns ────────────────────────────

export async function listOpportunitiesForSelect(userId: string) {
  return prisma.opportunity.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      company: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}
