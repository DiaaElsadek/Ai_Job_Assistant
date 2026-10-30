import 'server-only'
import { prisma } from '@/src/server/db'
import type { Prisma, FollowUpState, Priority } from '@prisma/client'

// ─── List Follow-up Tasks ─────────────────────────────────

export interface ListFollowUpsParams {
  userId: string
  search?: string
  priority?: string
  state?: string
}

export async function listFollowUps({
  userId,
  search,
  priority,
  state,
}: ListFollowUpsParams) {
  const where: Prisma.FollowUpTaskWhereInput = { userId }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
      { contact: { fullName: { contains: search, mode: 'insensitive' } } },
      { company: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (priority) {
    where.priority = priority as Priority
  }

  if (state) {
    where.state = state as FollowUpState
  }

  const tasks = await prisma.followUpTask.findMany({
    where,
    orderBy: { dueDate: 'asc' },
    include: {
      contact: {
        select: {
          id: true,
          fullName: true,
          role: true,
          profileUrl: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      opportunity: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  // Categorize for convenient dashboard organization
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const overdue = tasks.filter(
    (t) => t.state === 'OPEN' && new Date(t.dueDate) < startOfToday
  )
  const today = tasks.filter((t) => {
    const d = new Date(t.dueDate)
    return t.state === 'OPEN' && d >= startOfToday && d <= endOfToday
  })
  const upcoming = tasks.filter(
    (t) => t.state === 'OPEN' && new Date(t.dueDate) > endOfToday
  )
  const completed = tasks.filter((t) => t.state === 'COMPLETED' || t.state === 'DISMISSED')

  return {
    allTasks: tasks,
    overdue,
    today,
    upcoming,
    completed,
    counts: {
      overdue: overdue.length,
      today: today.length,
      upcoming: upcoming.length,
      completed: completed.length,
      totalOpen: overdue.length + today.length + upcoming.length,
    },
  }
}

// ─── Create ───────────────────────────────────────────────

export async function createFollowUp(
  userId: string,
  data: Prisma.FollowUpTaskCreateWithoutUserInput
) {
  return prisma.followUpTask.create({
    data: {
      ...data,
      user: { connect: { id: userId } },
    },
    include: {
      contact: true,
      company: true,
    },
  })
}

// ─── Update ───────────────────────────────────────────────

export async function updateFollowUp(
  id: string,
  userId: string,
  data: Prisma.FollowUpTaskUpdateInput
) {
  return prisma.followUpTask.updateMany({
    where: { id, userId },
    data,
  })
}

// ─── Complete ─────────────────────────────────────────────

export async function completeFollowUp(
  id: string,
  userId: string,
  result?: string
) {
  return prisma.followUpTask.updateMany({
    where: { id, userId },
    data: {
      state: 'COMPLETED',
      result: result || null,
    },
  })
}

// ─── Snooze ───────────────────────────────────────────────

export async function snoozeFollowUp(
  id: string,
  userId: string,
  days: number
) {
  const current = await prisma.followUpTask.findFirst({
    where: { id, userId },
  })

  if (!current) return null

  const newDate = new Date(current.dueDate)
  newDate.setDate(newDate.getDate() + days)

  return prisma.followUpTask.updateMany({
    where: { id, userId },
    data: {
      dueDate: newDate,
      state: 'OPEN',
    },
  })
}

// ─── Dismiss ──────────────────────────────────────────────

export async function dismissFollowUp(id: string, userId: string) {
  return prisma.followUpTask.updateMany({
    where: { id, userId },
    data: {
      state: 'DISMISSED',
    },
  })
}

// ─── Delete ───────────────────────────────────────────────

export async function deleteFollowUp(id: string, userId: string) {
  return prisma.followUpTask.deleteMany({
    where: { id, userId },
  })
}

