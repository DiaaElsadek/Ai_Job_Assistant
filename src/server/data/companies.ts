import 'server-only'
import { prisma } from '@/src/server/db'
import type { Prisma } from '@prisma/client'

// ─── List companies with optional search and filtering ────

export interface ListCompaniesParams {
  userId: string
  search?: string
  priority?: string
  sortBy?: 'name' | 'priority' | 'createdAt' | 'lastResearchedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export async function listCompanies({
  userId,
  search,
  priority,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  page = 1,
  pageSize = 20,
}: ListCompaniesParams) {
  const where: Prisma.CompanyWhereInput = { userId }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { industry: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (priority) {
    where.priority = priority as Prisma.EnumPriorityFilter['equals']
  }

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            opportunities: true,
            contacts: true,
          },
        },
      },
    }),
    prisma.company.count({ where }),
  ])

  return {
    companies,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  }
}

// ─── Get single company with relations ────────────────────

export async function getCompany(id: string, userId: string) {
  return prisma.company.findFirst({
    where: { id, userId },
    include: {
      opportunities: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      contacts: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      outreachActivities: {
        orderBy: { activityDate: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          opportunities: true,
          contacts: true,
          outreachActivities: true,
        },
      },
    },
  })
}

// ─── Create ───────────────────────────────────────────────

export async function createCompany(
  userId: string,
  data: Prisma.CompanyCreateWithoutUserInput
) {
  return prisma.company.create({
    data: {
      ...data,
      userId,
    },
  })
}

// ─── Update ───────────────────────────────────────────────

export async function updateCompany(
  id: string,
  userId: string,
  data: Prisma.CompanyUpdateInput
) {
  return prisma.company.updateMany({
    where: { id, userId },
    data,
  })
}

// ─── Delete ───────────────────────────────────────────────

export async function deleteCompany(id: string, userId: string) {
  return prisma.company.deleteMany({
    where: { id, userId },
  })
}

// ─── List for select dropdowns ────────────────────────────

export async function listCompaniesForSelect(userId: string) {
  return prisma.company.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}
