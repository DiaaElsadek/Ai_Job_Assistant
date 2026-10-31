'use server'

import { revalidatePath } from 'next/cache'
import { contactSchema } from '@/src/lib/validations'
import { requireAuth } from '@/src/server/auth'
import type { RelationshipStatus } from '@prisma/client'
import {
  createContact as createContactDb,
  updateContact as updateContactDb,
  deleteContact as deleteContactDb,
  updateContactRelationshipStatus as updateContactRelationshipStatusDb,
  linkOpportunityToContact as linkOpportunityToContactDb,
  unlinkOpportunityFromContact as unlinkOpportunityFromContactDb,
  logCommunication as logCommunicationDb,
} from '@/src/server/data/contacts'

export interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

export async function createContactAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    const rawData = Object.fromEntries(formData.entries())
    const companyIdRaw = formData.get('companyId') as string

    const parsed = contactSchema.safeParse({
      ...rawData,
      companyId: companyIdRaw ? companyIdRaw : null,
    })

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0] ?? (parsed.error as unknown as { errors?: Array<{ message: string }> }).errors?.[0]
      return { success: false, error: firstIssue?.message ?? 'Validation failed' }
    }

    const contact = await createContactDb(userId, {
      fullName: parsed.data.fullName,
      role: parsed.data.role || null,
      company: parsed.data.companyId ? { connect: { id: parsed.data.companyId } } : undefined,
      profileUrl: parsed.data.profileUrl || null,
      publicSourceUrl: parsed.data.publicSourceUrl || null,
      category: parsed.data.category,
      location: parsed.data.location || null,
      reasonForTargeting: parsed.data.reasonForTargeting || null,
      personalizationNotes: parsed.data.personalizationNotes || null,
      relationshipStatus: parsed.data.relationshipStatus,
      lastContactDate: parsed.data.lastContactDate ?? null,
      nextFollowUpDate: parsed.data.nextFollowUpDate ?? null,
      networkingPriority: parsed.data.networkingPriority,
      verificationStatus: parsed.data.verificationStatus,
      notes: parsed.data.notes || null,
    })

    revalidatePath('/contacts')
    revalidatePath('/')
    if (parsed.data.companyId) {
      revalidatePath(`/companies/${parsed.data.companyId}`)
    }
    return { success: true, id: contact.id }
  } catch (error) {
    console.error('createContactAction error:', error)
    return { success: false, error: 'Failed to create contact' }
  }
}

export async function updateContactAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    const rawData = Object.fromEntries(formData.entries())
    const companyIdRaw = formData.get('companyId') as string

    const parsed = contactSchema.safeParse({
      ...rawData,
      companyId: companyIdRaw ? companyIdRaw : null,
    })

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0] ?? (parsed.error as unknown as { errors?: Array<{ message: string }> }).errors?.[0]
      return { success: false, error: firstIssue?.message ?? 'Validation failed' }
    }

    await updateContactDb(id, userId, {
      fullName: parsed.data.fullName,
      role: parsed.data.role || null,
      company: parsed.data.companyId
        ? { connect: { id: parsed.data.companyId } }
        : { disconnect: true },
      profileUrl: parsed.data.profileUrl || null,
      publicSourceUrl: parsed.data.publicSourceUrl || null,
      category: parsed.data.category,
      location: parsed.data.location || null,
      reasonForTargeting: parsed.data.reasonForTargeting || null,
      personalizationNotes: parsed.data.personalizationNotes || null,
      relationshipStatus: parsed.data.relationshipStatus,
      lastContactDate: parsed.data.lastContactDate ?? null,
      nextFollowUpDate: parsed.data.nextFollowUpDate ?? null,
      networkingPriority: parsed.data.networkingPriority,
      verificationStatus: parsed.data.verificationStatus,
      notes: parsed.data.notes || null,
    })

    revalidatePath('/contacts')
    revalidatePath(`/contacts/${id}`)
    revalidatePath('/')
    if (parsed.data.companyId) {
      revalidatePath(`/companies/${parsed.data.companyId}`)
    }
    return { success: true }
  } catch (error) {
    console.error('updateContactAction error:', error)
    return { success: false, error: 'Failed to update contact' }
  }
}

export async function updateContactRelationshipStatusAction(
  id: string,
  status: RelationshipStatus
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await updateContactRelationshipStatusDb(id, userId, status)

    revalidatePath('/contacts')
    revalidatePath(`/contacts/${id}`)
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('updateContactRelationshipStatusAction error:', error)
    return { success: false, error: 'Failed to update relationship status' }
  }
}

export async function linkOpportunityToContactAction(
  contactId: string,
  opportunityId: string
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await linkOpportunityToContactDb(contactId, opportunityId, userId)

    revalidatePath('/contacts')
    revalidatePath(`/contacts/${contactId}`)
    revalidatePath(`/opportunities/${opportunityId}`)
    return { success: true }
  } catch (error) {
    console.error('linkOpportunityToContactAction error:', error)
    return { success: false, error: 'Failed to link opportunity' }
  }
}

export async function unlinkOpportunityFromContactAction(
  contactId: string,
  opportunityId: string
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await unlinkOpportunityFromContactDb(contactId, opportunityId, userId)

    revalidatePath('/contacts')
    revalidatePath(`/contacts/${contactId}`)
    revalidatePath(`/opportunities/${opportunityId}`)
    return { success: true }
  } catch (error) {
    console.error('unlinkOpportunityFromContactAction error:', error)
    return { success: false, error: 'Failed to unlink opportunity' }
  }
}

export async function logTouchpointAction(
  contactId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    const type = (formData.get('type') as string) || 'LinkedIn Message'
    const content = (formData.get('content') as string) || ''
    const notes = (formData.get('notes') as string) || null
    const dateRaw = formData.get('date') as string
    const date = dateRaw ? new Date(dateRaw) : new Date()

    if (!content.trim()) {
      return { success: false, error: 'Touchpoint notes or summary are required' }
    }

    await logCommunicationDb(
      contactId,
      {
        type,
        content,
        date,
        notes,
      },
      userId
    )

    revalidatePath('/contacts')
    revalidatePath(`/contacts/${contactId}`)
    return { success: true }
  } catch (error) {
    console.error('logTouchpointAction error:', error)
    return { success: false, error: 'Failed to log touchpoint' }
  }
}

export async function deleteContactAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await deleteContactDb(id, userId)

    revalidatePath('/contacts')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('deleteContactAction error:', error)
    return { success: false, error: 'Failed to delete contact' }
  }
}

