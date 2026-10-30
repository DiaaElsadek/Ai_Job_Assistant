import 'server-only'
import { prisma } from '@/src/server/db'
import type { Prisma, MessageGoal, MessageLanguage, MessageTone, MessageStatus } from '@prisma/client'

// ─── List Drafts ──────────────────────────────────────────

export interface ListMessageDraftsParams {
  userId: string
  goal?: string
  language?: string
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

export async function listMessageDrafts({
  userId,
  goal,
  language,
  status,
  search,
  page = 1,
  pageSize = 20,
}: ListMessageDraftsParams) {
  const where: Prisma.MessageDraftWhereInput = { userId }

  if (goal) where.goal = goal as MessageGoal
  if (language) where.language = language as MessageLanguage
  if (status) where.status = status as MessageStatus

  if (search) {
    where.OR = [
      { content: { contains: search, mode: 'insensitive' } },
      { contact: { fullName: { contains: search, mode: 'insensitive' } } },
      { opportunity: { title: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [drafts, total] = await Promise.all([
    prisma.messageDraft.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        contact: {
          select: {
            id: true,
            fullName: true,
            role: true,
            company: { select: { name: true } },
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: { revisions: true },
        },
      },
    }),
    prisma.messageDraft.count({ where }),
  ])

  return {
    drafts,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  }
}

// ─── Get Single Draft with Revisions ──────────────────────

export async function getMessageDraft(id: string, userId: string) {
  return prisma.messageDraft.findFirst({
    where: { id, userId },
    include: {
      contact: {
        include: {
          company: true,
        },
      },
      opportunity: {
        include: {
          company: true,
        },
      },
      revisions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

// ─── Create ───────────────────────────────────────────────

export async function createMessageDraft(
  userId: string,
  data: Prisma.MessageDraftCreateWithoutUserInput
) {
  return prisma.messageDraft.create({
    data: {
      ...data,
      user: { connect: { id: userId } },
    },
    include: {
      contact: true,
      opportunity: true,
    },
  })
}

// ─── Update ───────────────────────────────────────────────

export async function updateMessageDraft(
  id: string,
  userId: string,
  data: Prisma.MessageDraftUpdateInput
) {
  return prisma.messageDraft.updateMany({
    where: { id, userId },
    data,
  })
}

// ─── Add Revision ─────────────────────────────────────────

export async function addDraftRevision(
  draftId: string,
  content: string,
  explanation?: string
) {
  const revision = await prisma.messageRevision.create({
    data: {
      draftId,
      content,
      explanation: explanation || null,
    },
  })

  await prisma.messageDraft.update({
    where: { id: draftId },
    data: {
      content,
      updatedAt: new Date(),
    },
  })

  return revision
}

// ─── Mark Sent ────────────────────────────────────────────

export async function markMessageSent(id: string, userId: string) {
  return prisma.messageDraft.updateMany({
    where: { id, userId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
    },
  })
}

// ─── Delete ───────────────────────────────────────────────

export async function deleteMessageDraft(id: string, userId: string) {
  return prisma.messageDraft.deleteMany({
    where: { id, userId },
  })
}

