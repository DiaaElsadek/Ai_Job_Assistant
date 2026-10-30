'use server'

import { revalidatePath } from 'next/cache'
import { followUpSchema } from '@/src/lib/validations'
import { requireAuth } from '@/src/server/auth'
import {
  createFollowUp as createFollowUpDb,
  updateFollowUp as updateFollowUpDb,
  completeFollowUp as completeFollowUpDb,
  snoozeFollowUp as snoozeFollowUpDb,
  dismissFollowUp as dismissFollowUpDb,
  deleteFollowUp as deleteFollowUpDb,
} from '@/src/server/data/follow-ups'

export interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

export async function createFollowUpAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    const rawData = Object.fromEntries(formData.entries())
    const contactIdRaw = formData.get('contactId') as string
    const companyIdRaw = formData.get('companyId') as string
    const opportunityIdRaw = formData.get('opportunityId') as string

    const parsed = followUpSchema.safeParse({
      ...rawData,
      contactId: contactIdRaw ? contactIdRaw : null,
      companyId: companyIdRaw ? companyIdRaw : null,
      opportunityId: opportunityIdRaw ? opportunityIdRaw : null,
    })

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0] ?? (parsed.error as unknown as { errors?: Array<{ message: string }> }).errors?.[0]
      return { success: false, error: firstIssue?.message ?? 'Validation failed' }
    }

    const task = await createFollowUpDb(userId, {
      title: parsed.data.title,
      dueDate: parsed.data.dueDate,
      priority: parsed.data.priority,
      state: parsed.data.state,
      contact: parsed.data.contactId ? { connect: { id: parsed.data.contactId } } : undefined,
      company: parsed.data.companyId ? { connect: { id: parsed.data.companyId } } : undefined,
      opportunity: parsed.data.opportunityId ? { connect: { id: parsed.data.opportunityId } } : undefined,
      notes: parsed.data.notes || null,
    })

    revalidatePath('/follow-ups')
    revalidatePath('/')
    if (parsed.data.contactId) revalidatePath(`/contacts/${parsed.data.contactId}`)
    return { success: true, id: task.id }
  } catch (error) {
    console.error('createFollowUpAction error:', error)
    return { success: false, error: 'Failed to create follow-up task' }
  }
}

export async function updateFollowUpAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    const rawData = Object.fromEntries(formData.entries())
    const contactIdRaw = formData.get('contactId') as string
    const companyIdRaw = formData.get('companyId') as string
    const opportunityIdRaw = formData.get('opportunityId') as string

    const parsed = followUpSchema.safeParse({
      ...rawData,
      contactId: contactIdRaw ? contactIdRaw : null,
      companyId: companyIdRaw ? companyIdRaw : null,
      opportunityId: opportunityIdRaw ? opportunityIdRaw : null,
    })

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0] ?? (parsed.error as unknown as { errors?: Array<{ message: string }> }).errors?.[0]
      return { success: false, error: firstIssue?.message ?? 'Validation failed' }
    }

    await updateFollowUpDb(id, userId, {
      title: parsed.data.title,
      dueDate: parsed.data.dueDate,
      priority: parsed.data.priority,
      state: parsed.data.state,
      contact: parsed.data.contactId
        ? { connect: { id: parsed.data.contactId } }
        : { disconnect: true },
      company: parsed.data.companyId
        ? { connect: { id: parsed.data.companyId } }
        : { disconnect: true },
      opportunity: parsed.data.opportunityId
        ? { connect: { id: parsed.data.opportunityId } }
        : { disconnect: true },
      notes: parsed.data.notes || null,
      result: parsed.data.result || null,
    })

    revalidatePath('/follow-ups')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('updateFollowUpAction error:', error)
    return { success: false, error: 'Failed to update follow-up task' }
  }
}

export async function completeFollowUpAction(
  id: string,
  result?: string
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await completeFollowUpDb(id, userId, result)

    revalidatePath('/follow-ups')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('completeFollowUpAction error:', error)
    return { success: false, error: 'Failed to complete task' }
  }
}

export async function snoozeFollowUpAction(
  id: string,
  days: number
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await snoozeFollowUpDb(id, userId, days)

    revalidatePath('/follow-ups')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('snoozeFollowUpAction error:', error)
    return { success: false, error: 'Failed to snooze task' }
  }
}

export async function dismissFollowUpAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await dismissFollowUpDb(id, userId)

    revalidatePath('/follow-ups')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('dismissFollowUpAction error:', error)
    return { success: false, error: 'Failed to dismiss task' }
  }
}

export async function deleteFollowUpAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await deleteFollowUpDb(id, userId)

    revalidatePath('/follow-ups')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('deleteFollowUpAction error:', error)
    return { success: false, error: 'Failed to delete task' }
  }
}

