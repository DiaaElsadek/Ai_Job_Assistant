'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/src/server/auth'
import { prisma } from '@/src/server/db'
import type { InterviewRoundType } from '@prisma/client'
import {
  createInterviewRound as createInterviewRoundDb,
  updateInterviewRound as updateInterviewRoundDb,
  deleteInterviewRound as deleteInterviewRoundDb,
  createStarStory as createStarStoryDb,
  deleteStarStory as deleteStarStoryDb,
} from '@/src/server/data/interviews'
import { generateInterviewQuestions, type InterviewQuestion } from '@/src/lib/ai/interview-prep'

export interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

export async function createInterviewRoundAction(
  opportunityId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    const roundNumber = Number(formData.get('roundNumber')) || 1
    const roundType = (formData.get('roundType') as InterviewRoundType) || 'TECHNICAL_PHONE'
    const scheduledAtRaw = formData.get('scheduledAt') as string
    const interviewerName = (formData.get('interviewerName') as string) || null
    const interviewerRole = (formData.get('interviewerRole') as string) || null
    const userNotes = (formData.get('userNotes') as string) || null

    const round = await createInterviewRoundDb(opportunityId, userId, {
      roundNumber,
      roundType,
      scheduledAt: scheduledAtRaw ? new Date(scheduledAtRaw) : null,
      interviewerName,
      interviewerRole,
      userNotes,
    })

    revalidatePath(`/opportunities/${opportunityId}`)
    return { success: true, id: round.id }
  } catch (error) {
    console.error('createInterviewRoundAction error:', error)
    return { success: false, error: 'Failed to create interview round' }
  }
}

export async function updateInterviewRoundAction(
  opportunityId: string,
  roundId: string,
  data: {
    scheduledAt?: Date | string | null
    interviewerName?: string | null
    interviewerRole?: string | null
    questionsAsked?: string[]
    userNotes?: string | null
    rating?: number | null
    completed?: boolean
  }
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await updateInterviewRoundDb(roundId, userId, {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    })

    revalidatePath(`/opportunities/${opportunityId}`)
    return { success: true }
  } catch (error) {
    console.error('updateInterviewRoundAction error:', error)
    return { success: false, error: 'Failed to update interview round' }
  }
}

export async function deleteInterviewRoundAction(
  opportunityId: string,
  roundId: string
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await deleteInterviewRoundDb(roundId, userId)

    revalidatePath(`/opportunities/${opportunityId}`)
    return { success: true }
  } catch (error) {
    console.error('deleteInterviewRoundAction error:', error)
    return { success: false, error: 'Failed to delete interview round' }
  }
}

export async function generateRoleQuestionsAction(
  opportunityId: string
): Promise<{ success: boolean; data?: InterviewQuestion[]; error?: string }> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, userId },
      include: { company: { select: { name: true } } },
    })

    if (!opp) return { success: false, error: 'Opportunity not found' }

    const questions = await generateInterviewQuestions({
      jobTitle: opp.title,
      technologies: opp.requiredTechnologies,
      companyName: opp.company?.name,
      description: opp.description || opp.rawPostingText,
    })

    return { success: true, data: questions }
  } catch (error) {
    console.error('generateRoleQuestionsAction error:', error)
    return { success: false, error: 'Failed to generate questions' }
  }
}

export async function createStarStoryAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    const title = (formData.get('title') as string) || 'Key Project Achievement'
    const situation = (formData.get('situation') as string) || ''
    const task = (formData.get('task') as string) || ''
    const action = (formData.get('action') as string) || ''
    const resultText = (formData.get('result') as string) || ''
    const roundId = (formData.get('roundId') as string) || null

    if (!situation.trim() || !action.trim() || !resultText.trim()) {
      return { success: false, error: 'Situation, Action, and Result are required for a STAR story.' }
    }

    const story = await createStarStoryDb(userId, {
      title,
      situation,
      task,
      action,
      result: resultText,
      roundId,
    })

    revalidatePath('/opportunities')
    return { success: true, id: story.id }
  } catch (error) {
    console.error('createStarStoryAction error:', error)
    return { success: false, error: 'Failed to create STAR story' }
  }
}

