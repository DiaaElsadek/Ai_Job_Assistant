import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/server/db'

export const OWNER_USER_ID = 'a0000000-0000-0000-0000-000000000001'

/**
 * Require authenticated session in Server Actions/Route Handlers.
 * Throws if not authenticated. Never rely on middleware alone.
 * Ensures the owner user record exists in the database.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Unauthorized')
  }

  const userId = session.user.id || OWNER_USER_ID

  try {
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: {
        id: userId,
        email: session.user.email,
        name: session.user.name || 'Owner',
      },
    })

    return {
      ...session,
      user: {
        ...session.user,
        id: user.id,
        email: user.email,
        name: user.name || 'Owner',
      },
    }
  } catch {
    return {
      ...session,
      user: {
        ...session.user,
        id: userId,
      },
    }
  }
}
