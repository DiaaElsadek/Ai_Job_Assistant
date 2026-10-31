'use server'

import { requireAuth } from '@/src/server/auth'
import { prisma } from '@/src/server/db'

export interface SearchResultItem {
  id: string
  title: string
  subtitle?: string | null
  type: 'opportunity' | 'company' | 'contact'
  href: string
}

export async function globalOmniSearchAction(
  query: string
): Promise<{ success: boolean; results: SearchResultItem[] }> {
  try {
    const session = await requireAuth()
    const userId = session.user?.id
    if (!userId) return { success: false, results: [] }

    const q = query.trim()
    if (!q) return { success: true, results: [] }

    const [opps, companies, contacts] = await Promise.all([
      prisma.opportunity.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { company: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take: 5,
        include: { company: { select: { name: true } } },
      }),
      prisma.company.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { industry: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      prisma.contact.findMany({
        where: {
          userId,
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { role: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        include: { company: { select: { name: true } } },
      }),
    ])

    const results: SearchResultItem[] = [
      ...opps.map((o) => ({
        id: o.id,
        title: o.title,
        subtitle: o.company?.name ? `Opportunity • ${o.company.name}` : 'Opportunity',
        type: 'opportunity' as const,
        href: `/opportunities/${o.id}`,
      })),
      ...companies.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.industry ? `Company • ${c.industry}` : 'Target Company',
        type: 'company' as const,
        href: `/companies/${c.id}`,
      })),
      ...contacts.map((c) => ({
        id: c.id,
        title: c.fullName,
        subtitle: c.role
          ? `${c.role}${c.company?.name ? ` at ${c.company.name}` : ''}`
          : 'Contact',
        type: 'contact' as const,
        href: `/contacts/${c.id}`,
      })),
    ]

    return { success: true, results }
  } catch (error) {
    console.error('globalOmniSearchAction error:', error)
    return { success: false, results: [] }
  }
}

