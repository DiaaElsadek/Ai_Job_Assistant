'use server'

import { revalidatePath } from 'next/cache'
import { companySchema } from '@/src/lib/validations'
import { requireAuth } from '@/src/server/auth'
import {
  createCompany as createCompanyDb,
  updateCompany as updateCompanyDb,
  deleteCompany as deleteCompanyDb,
} from '@/src/server/data/companies'

export interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

export async function createCompanyAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    const rawData = Object.fromEntries(formData.entries())
    const technologiesRaw = formData.get('technologies') as string
    const parsed = companySchema.safeParse({
      ...rawData,
      technologies: technologiesRaw
        ? technologiesRaw.split(',').map(t => t.trim()).filter(Boolean)
        : [],
    })

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0] ?? (parsed.error as unknown as { errors?: Array<{ message: string }> }).errors?.[0]
      return { success: false, error: firstIssue?.message ?? 'Validation failed' }
    }

    const company = await createCompanyDb(userId, {
      name: parsed.data.name,
      website: parsed.data.website || null,
      careersUrl: parsed.data.careersUrl || null,
      location: parsed.data.location || null,
      industry: parsed.data.industry || null,
      technologies: parsed.data.technologies,
      hiringNotes: parsed.data.hiringNotes || null,
      priority: parsed.data.priority,
      lastResearchedAt: parsed.data.lastResearchedAt ?? null,
      notes: parsed.data.notes || null,
    })

    revalidatePath('/companies')
    return { success: true, id: company.id }
  } catch (error) {
    console.error('createCompanyAction error:', error)
    return { success: false, error: 'Failed to create company' }
  }
}

export async function updateCompanyAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    const rawData = Object.fromEntries(formData.entries())
    const technologiesRaw = formData.get('technologies') as string
    const parsed = companySchema.safeParse({
      ...rawData,
      technologies: technologiesRaw
        ? technologiesRaw.split(',').map(t => t.trim()).filter(Boolean)
        : [],
    })

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0] ?? (parsed.error as unknown as { errors?: Array<{ message: string }> }).errors?.[0]
      return { success: false, error: firstIssue?.message ?? 'Validation failed' }
    }

    await updateCompanyDb(id, userId, {
      name: parsed.data.name,
      website: parsed.data.website || null,
      careersUrl: parsed.data.careersUrl || null,
      location: parsed.data.location || null,
      industry: parsed.data.industry || null,
      technologies: parsed.data.technologies,
      hiringNotes: parsed.data.hiringNotes || null,
      priority: parsed.data.priority,
      lastResearchedAt: parsed.data.lastResearchedAt ?? null,
      notes: parsed.data.notes || null,
    })

    revalidatePath('/companies')
    revalidatePath(`/companies/${id}`)
    return { success: true }
  } catch (error) {
    console.error('updateCompanyAction error:', error)
    return { success: false, error: 'Failed to update company' }
  }
}

export async function deleteCompanyAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await deleteCompanyDb(id, userId)
    revalidatePath('/companies')
    return { success: true }
  } catch (error) {
    console.error('deleteCompanyAction error:', error)
    return { success: false, error: 'Failed to delete company' }
  }
}
