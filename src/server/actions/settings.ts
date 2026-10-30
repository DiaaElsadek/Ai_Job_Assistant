'use server'

import { revalidatePath } from 'next/cache'
import { settingsSchema } from '@/src/lib/validations'
import { requireAuth } from '@/src/server/auth'
import { updateUserSettings } from '@/src/server/data/settings'

export interface ActionResult {
  success: boolean
  error?: string
}

export async function updateSettingsAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    const rawData = Object.fromEntries(formData.entries())
    const experienceRaw = formData.getAll('preferredExperience') as string[]

    const parsed = settingsSchema.safeParse({
      ...rawData,
      preferredExperience: experienceRaw.length > 0 ? experienceRaw : undefined,
    })

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0] ?? (parsed.error as unknown as { errors?: Array<{ message: string }> }).errors?.[0]
      return { success: false, error: firstIssue?.message ?? 'Validation failed' }
    }

    await updateUserSettings(userId, {
      preferredRole: parsed.data.preferredRole,
      targetCountry: parsed.data.targetCountry,
      preferredExperience: parsed.data.preferredExperience,
      workPreference: parsed.data.workPreference,
      preferredLanguage: parsed.data.preferredLanguage,
      dailyNetworkingTarget: parsed.data.dailyNetworkingTarget,
      followUpDefaultDays: parsed.data.followUpDefaultDays,
      cvFileReference: parsed.data.cvFileReference || null,
      cvUrl: parsed.data.cvUrl || null,
      theme: parsed.data.theme,
    })

    revalidatePath('/settings')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('updateSettingsAction error:', error)
    return { success: false, error: 'Failed to update settings' }
  }
}

