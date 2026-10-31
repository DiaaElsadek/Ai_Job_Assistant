import 'server-only'
import { prisma } from '@/src/server/db'
import type { CVMatchResult } from '@/src/lib/ai/cv-matcher'

export async function getOpportunityMatchAnalysis(opportunityId: string, userId: string) {
  // Ensure opportunity belongs to user
  const opp = await prisma.opportunity.findFirst({
    where: { id: opportunityId, userId },
    select: { id: true },
  })
  if (!opp) return null

  return prisma.opportunityMatchAnalysis.findUnique({
    where: { opportunityId },
  })
}

export async function saveOpportunityMatchAnalysis(
  opportunityId: string,
  userId: string,
  data: CVMatchResult
) {
  // Ensure opportunity belongs to user
  const opp = await prisma.opportunity.findFirst({
    where: { id: opportunityId, userId },
    select: { id: true },
  })
  if (!opp) throw new Error('Opportunity not found or unauthorized')

  return prisma.opportunityMatchAnalysis.upsert({
    where: { opportunityId },
    update: {
      matchScore: data.matchScore,
      matchedSkills: data.matchedSkills,
      missingSkills: data.missingSkills,
      tailoredBullets: data.tailoredBullets,
      coverLetterDraft: data.coverLetterDraft || null,
      analyzedAt: new Date(),
    },
    create: {
      opportunityId,
      matchScore: data.matchScore,
      matchedSkills: data.matchedSkills,
      missingSkills: data.missingSkills,
      tailoredBullets: data.tailoredBullets,
      coverLetterDraft: data.coverLetterDraft || null,
    },
  })
}

