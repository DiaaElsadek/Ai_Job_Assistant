'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/src/server/auth'
import { prisma } from '@/src/server/db'
import {
  generateCVMatchAnalysis,
  type CVMatchResult,
} from '@/src/lib/ai/cv-matcher'
import {
  saveOpportunityMatchAnalysis,
  getOpportunityMatchAnalysis,
} from '@/src/server/data/cv-match'

export interface MatchActionResult {
  success: boolean
  error?: string
  data?: CVMatchResult
}

export async function analyzeOpportunityMatchAction(
  opportunityId: string
): Promise<MatchActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    // Fetch opportunity and candidate CV profile in parallel
    const [opp, settings] = await Promise.all([
      prisma.opportunity.findFirst({
        where: { id: opportunityId, userId },
      }),
      prisma.settings.findFirst({
        where: { userId },
      }),
    ])

    if (!opp) {
      return { success: false, error: 'Opportunity not found' }
    }

    const cvText =
      settings?.cvSummary?.trim() ||
      `Senior Frontend Engineer specializing in ${settings?.preferredRole || 'React.js and Next.js'}. Targeting ${settings?.targetCountry || 'Egypt'} and remote international markets. Experienced with TypeScript, Tailwind CSS, API integrations, and modern full-stack workflows.`

    const matchResult = await generateCVMatchAnalysis({
      cvText,
      jobTitle: opp.title,
      jobDescription: opp.description || opp.rawPostingText,
      requiredTechnologies: opp.requiredTechnologies,
    })

    await saveOpportunityMatchAnalysis(opportunityId, userId, matchResult)

    revalidatePath(`/opportunities/${opportunityId}`)
    return { success: true, data: matchResult }
  } catch (error) {
    console.error('analyzeOpportunityMatchAction error:', error)
    return { success: false, error: 'Failed to analyze CV match' }
  }
}

