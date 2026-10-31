'use server'

import { revalidatePath } from 'next/cache'
import { opportunitySchema } from '@/src/lib/validations'
import { requireAuth } from '@/src/server/auth'
import { prisma } from '@/src/server/db'
import type { OpportunityStatus, RejectionReason } from '@prisma/client'
import {
  createOpportunity as createOpportunityDb,
  updateOpportunity as updateOpportunityDb,
  deleteOpportunity as deleteOpportunityDb,
  updateOpportunityStatus as updateOpportunityStatusDb,
} from '@/src/server/data/opportunities'
import { createCompany as createCompanyDb } from '@/src/server/data/companies'
import { recordStageTransition } from '@/src/server/data/stage-history'
import { parseJobPostingText, type ParsedJobPosting } from '@/src/lib/ai/job-parser'

export interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

export interface ParseJobResult {
  success: boolean
  error?: string
  data?: ParsedJobPosting
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
  status: OpportunityStatus,
  options?: {
    rejectionReason?: RejectionReason
    notes?: string
  }
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    // Fetch existing status
    const existing = await prisma.opportunity.findFirst({
      where: { id, userId },
      select: { status: true },
    })

    await updateOpportunityStatusDb(id, userId, status)

    // Record stage history log
    if (existing && existing.status !== status) {
      await recordStageTransition({
        opportunityId: id,
        fromStatus: existing.status,
        toStatus: status,
        rejectionReason: options?.rejectionReason,
        notes: options?.notes,
      })
    }

    revalidatePath('/opportunities')
    revalidatePath(`/opportunities/${id}`)
    revalidatePath('/analytics')
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

export async function parseJobPostingAction(
  rawText: string,
  url?: string
): Promise<ParseJobResult> {
  try {
    const session = await requireAuth()
    if (!session.user?.id) return { success: false, error: 'Unauthorized' }

    let textToParse = rawText.trim()

    if (!textToParse && url) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        })
        if (response.ok) {
          const html = await response.text()
          textToParse = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        }
      } catch (err) {
        console.warn('URL scraping failed:', err)
      }
    }

    if (!textToParse) {
      return { success: false, error: 'Please provide job posting text or an accessible URL.' }
    }

    const parsed = await parseJobPostingText(textToParse)
    return { success: true, data: parsed }
  } catch (error) {
    console.error('parseJobPostingAction error:', error)
    return { success: false, error: 'Failed to extract job details' }
  }
}

export async function importOpportunityAction(
  data: ParsedJobPosting,
  options?: {
    companyId?: string
    createCompanyIfMissing?: boolean
    jobUrl?: string
  }
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    let targetCompanyId = options?.companyId || null

    if (!targetCompanyId && options?.createCompanyIfMissing && data.companyName) {
      const existing = await prisma.company.findFirst({
        where: {
          userId,
          name: { equals: data.companyName.trim(), mode: 'insensitive' },
        },
      })

      if (existing) {
        targetCompanyId = existing.id
      } else {
        const newCompany = await createCompanyDb(userId, {
          name: data.companyName.trim(),
          website: data.companyWebsite || null,
          location: data.location || null,
          technologies: data.requiredTechnologies || [],
          priority: 'HIGH',
        })
        targetCompanyId = newCompany.id
      }
    }

    const opp = await createOpportunityDb(userId, {
      title: data.title || 'Software Engineer',
      company: targetCompanyId ? { connect: { id: targetCompanyId } } : undefined,
      description: data.description || null,
      requiredTechnologies: data.requiredTechnologies || [],
      experienceLevel: data.experienceLevel || 'SENIOR',
      workArrangement: data.workArrangement || 'REMOTE',
      location: data.location || null,
      salaryMin: data.salaryMin ?? null,
      salaryMax: data.salaryMax ?? null,
      salaryCurrency: data.salaryCurrency || null,
      jobUrl: options?.jobUrl || null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      priority: 'HIGH',
      status: 'TO_REVIEW',
      notes: data.notes || null,
    })

    revalidatePath('/opportunities')
    revalidatePath('/companies')
    revalidatePath('/')
    return { success: true, id: opp.id }
  } catch (error) {
    console.error('importOpportunityAction error:', error)
    return { success: false, error: 'Failed to import opportunity' }
  }
}

