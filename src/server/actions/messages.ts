'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/src/server/auth'
import { prisma } from '@/src/server/db'
import type { MessageGoal, MessageLanguage, MessageTone, MessageStatus } from '@prisma/client'
import {
  generateOutreachMessage,
  type GenerateMessageInput,
} from '@/src/lib/ai/message-generator'
import { checkRateLimit } from '@/src/lib/rate-limiter'
import {
  createMessageDraft as createMessageDraftDb,
  updateMessageDraft as updateMessageDraftDb,
  addDraftRevision as addDraftRevisionDb,
  markMessageSent as markMessageSentDb,
  deleteMessageDraft as deleteMessageDraftDb,
} from '@/src/server/data/messages'

export interface ActionResult {
  success: boolean
  error?: string
  id?: string
  content?: string
  explanation?: string
}

export async function generateOutreachAction(params: {
  contactId?: string | null
  opportunityId?: string | null
  goal: MessageGoal
  language: MessageLanguage
  tone: MessageTone
  sourceFacts?: string
}): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    // Rate limiting: max 10 AI generations per minute
    const rateLimit = checkRateLimit(userId, { maxTokens: 10, refillRatePerMinute: 10 })
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `AI generation rate limit reached. Please wait ${rateLimit.resetInSeconds}s before generating another draft.`,
      }
    }

    // Fetch context from contact, opportunity, and candidate settings
    const [contact, opportunity, settings] = await Promise.all([
      params.contactId
        ? prisma.contact.findFirst({
            where: { id: params.contactId, userId },
            include: { company: true },
          })
        : null,
      params.opportunityId
        ? prisma.opportunity.findFirst({
            where: { id: params.opportunityId, userId },
            include: { company: true },
          })
        : null,
      prisma.settings.findFirst({ where: { userId } }),
    ])

    const input: GenerateMessageInput = {
      goal: params.goal,
      language: params.language,
      tone: params.tone,
      contactName: contact?.fullName,
      contactRole: contact?.role || undefined,
      companyName: contact?.company?.name || opportunity?.company?.name,
      opportunityTitle: opportunity?.title,
      technologies: opportunity?.requiredTechnologies?.length
        ? opportunity.requiredTechnologies
        : contact?.company?.technologies?.length
        ? contact.company.technologies
        : undefined,
      candidateRole: settings?.preferredRole,
      sourceFacts: params.sourceFacts || contact?.personalizationNotes || undefined,
    }

    const output = await generateOutreachMessage(input)

    return {
      success: true,
      content: output.content,
      explanation: output.explanation,
    }
  } catch (error) {
    console.error('generateOutreachAction error:', error)
    return { success: false, error: 'Failed to generate message' }
  }
}

export async function saveDraftAction(params: {
  id?: string
  contactId?: string | null
  opportunityId?: string | null
  goal: MessageGoal
  language: MessageLanguage
  tone: MessageTone
  content: string
  explanation?: string
  sourceFacts?: string[]
}): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    if (!params.content.trim()) {
      return { success: false, error: 'Message content cannot be empty' }
    }

    if (params.id) {
      // Update existing draft + add revision
      await updateMessageDraftDb(params.id, userId, {
        content: params.content,
        goal: params.goal,
        language: params.language,
        tone: params.tone,
        explanation: params.explanation || null,
        contact: params.contactId
          ? { connect: { id: params.contactId } }
          : { disconnect: true },
        opportunity: params.opportunityId
          ? { connect: { id: params.opportunityId } }
          : { disconnect: true },
      })

      await addDraftRevisionDb(
        params.id,
        params.content,
        params.explanation || 'User manual edit'
      )

      revalidatePath('/messages')
      revalidatePath(`/messages/${params.id}`)
      return { success: true, id: params.id }
    }

    // Create new draft
    const draft = await createMessageDraftDb(userId, {
      content: params.content,
      goal: params.goal,
      language: params.language,
      tone: params.tone,
      explanation: params.explanation || null,
      sourceFacts: params.sourceFacts || [],
      status: 'DRAFT',
      contact: params.contactId ? { connect: { id: params.contactId } } : undefined,
      opportunity: params.opportunityId ? { connect: { id: params.opportunityId } } : undefined,
    })

    // Create initial revision
    await addDraftRevisionDb(
      draft.id,
      params.content,
      params.explanation || 'Initial AI generated draft'
    )

    revalidatePath('/messages')
    revalidatePath('/')
    return { success: true, id: draft.id }
  } catch (error) {
    console.error('saveDraftAction error:', error)
    return { success: false, error: 'Failed to save draft' }
  }
}

export async function markDraftSentAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await markMessageSentDb(id, userId)

    revalidatePath('/messages')
    revalidatePath(`/messages/${id}`)
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('markDraftSentAction error:', error)
    return { success: false, error: 'Failed to mark draft as sent' }
  }
}

export async function deleteDraftAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, error: 'Unauthorized' }

    await deleteMessageDraftDb(id, userId)

    revalidatePath('/messages')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('deleteDraftAction error:', error)
    return { success: false, error: 'Failed to delete draft' }
  }
}

