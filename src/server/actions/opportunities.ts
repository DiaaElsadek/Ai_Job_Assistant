'use server'

import { revalidatePath } from 'next/cache'
import { opportunitySchema } from '@/src/lib/validations'
import { requireAuth } from '@/src/server/auth'
import type { OpportunityStatus } from '@prisma/client'
import {
  createOpportunity as createOpportunityDb,
  updateOpportunity as updateOpportunityDb,
  deleteOpportunity as deleteOpportunityDb,
  updateOpportunityStatus as updateOpportunityStatusDb,
} from '@/src/server/data/opportunities'

export interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

export async function createOpportunityAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    const rawData = Object.fromEntries(formData.entries())
    const technologiesRaw = formData.get('requiredTechnologies') as string
    const companyIdRaw = formData.get('companyId') as string
    const salaryMinRaw = formData.get('salaryMin') as string
    const salaryMaxRaw = formData.get('salaryMax') as string

    const parsed = opportunitySchema.safeParse({
      ...rawData,
      companyId: companyIdRaw ? companyIdRaw : null,
      salaryMin: salaryMinRaw ? Number(salaryMinRaw) : null,
      salaryMax: salaryMaxRaw ? Number(salaryMaxRaw) : null,
      requiredTechnologies: technologiesRaw
        ? technologiesRaw.split(',').map(t => t.trim()).filter(Boolean)
        : [],
    })

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0] ?? (parsed.error as unknown as { errors?: Array<{ message: string }> }).errors?.[0]
      return { success: false, error: firstIssue?.message ?? 'Validation failed' }
    }

    const opportunity = await createOpportunityDb(userId, {
      title: parsed.data.title,
      company: parsed.data.companyId ? { connect: { id: parsed.data.companyId } } : undefined,
      description: parsed.data.description || null,
      requiredTechnologies: parsed.data.requiredTechnologies,
      experienceLevel: parsed.data.experienceLevel,
      location: parsed.data.location || null,
      workArrangement: parsed.data.workArrangement,
      salaryMin: parsed.data.salaryMin ?? null,
      salaryMax: parsed.data.salaryMax ?? null,
      salaryCurrency: parsed.data.salaryCurrency || null,
      jobUrl: parsed.data.jobUrl || null,
      applicationUrl: parsed.data.applicationUrl || null,
      sourceName: parsed.data.sourceName || null,
      sourceUrl: parsed.data.sourceUrl || null,
      deadline: parsed.data.deadline ?? null,
      dateApplied: parsed.data.dateApplied ?? null,
      priority: parsed.data.priority,
      status: parsed.data.status,
      verificationFlag: parsed.data.verificationFlag,
      notes: parsed.data.notes || null,
    })

    revalidatePath('/opportunities')
    revalidatePath('/')
    if (parsed.data.companyId) {
      revalidatePath(`/companies/${parsed.data.companyId}`)
    }
    return { success: true, id: opportunity.id }
  } catch (error) {
    console.error('createOpportunityAction error:', error)
    return { success: false, error: 'Failed to create opportunity' }
  }
}

export async function updateOpportunityAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    const rawData = Object.fromEntries(formData.entries())
    const technologiesRaw = formData.get('requiredTechnologies') as string
    const companyIdRaw = formData.get('companyId') as string
    const salaryMinRaw = formData.get('salaryMin') as string
    const salaryMaxRaw = formData.get('salaryMax') as string

    const parsed = opportunitySchema.safeParse({
      ...rawData,
      companyId: companyIdRaw ? companyIdRaw : null,
      salaryMin: salaryMinRaw ? Number(salaryMinRaw) : null,
      salaryMax: salaryMaxRaw ? Number(salaryMaxRaw) : null,
      requiredTechnologies: technologiesRaw
        ? technologiesRaw.split(',').map(t => t.trim()).filter(Boolean)
        : [],
    })

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0] ?? (parsed.error as unknown as { errors?: Array<{ message: string }> }).errors?.[0]
      return { success: false, error: firstIssue?.message ?? 'Validation failed' }
    }

    await updateOpportunityDb(id, userId, {
      title: parsed.data.title,
      company: parsed.data.companyId
        ? { connect: { id: parsed.data.companyId } }
        : { disconnect: true },
      description: parsed.data.description || null,
      requiredTechnologies: parsed.data.requiredTechnologies,
      experienceLevel: parsed.data.experienceLevel,
      location: parsed.data.location || null,
      workArrangement: parsed.data.workArrangement,
      salaryMin: parsed.data.salaryMin ?? null,
      salaryMax: parsed.data.salaryMax ?? null,
      salaryCurrency: parsed.data.salaryCurrency || null,
      jobUrl: parsed.data.jobUrl || null,
      applicationUrl: parsed.data.applicationUrl || null,
      sourceName: parsed.data.sourceName || null,
      sourceUrl: parsed.data.sourceUrl || null,
      deadline: parsed.data.deadline ?? null,
      dateApplied: parsed.data.dateApplied ?? null,
      priority: parsed.data.priority,
      status: parsed.data.status,
      verificationFlag: parsed.data.verificationFlag,
      notes: parsed.data.notes || null,
    })

    revalidatePath('/opportunities')
    revalidatePath(`/opportunities/${id}`)
    revalidatePath('/')
    if (parsed.data.companyId) {
      revalidatePath(`/companies/${parsed.data.companyId}`)
    }
    return { success: true }
  } catch (error) {
    console.error('updateOpportunityAction error:', error)
    return { success: false, error: 'Failed to update opportunity' }
  }
}

export async function updateOpportunityStatusAction(
  id: string,
  status: OpportunityStatus
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await updateOpportunityStatusDb(id, userId, status)

    revalidatePath('/opportunities')
    revalidatePath(`/opportunities/${id}`)
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('updateOpportunityStatusAction error:', error)
    return { success: false, error: 'Failed to update status' }
  }
}

export async function deleteOpportunityAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await deleteOpportunityDb(id, userId)

    revalidatePath('/opportunities')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('deleteOpportunityAction error:', error)
    return { success: false, error: 'Failed to delete opportunity' }
  }
}

