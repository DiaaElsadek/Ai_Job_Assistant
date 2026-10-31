import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/src/server/db'

function getOwnerCredentials() {
  const email = process.env.OWNER_EMAIL
  const passwordHash = process.env.OWNER_PASSWORD_HASH

  if (!email || !passwordHash) {
    return null
  }

  return { email, passwordHash }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        const normalizedEmail = email.trim().toLowerCase()

        // 1. Check registered multi-user in database
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          })

          if (dbUser && dbUser.passwordHash) {
            const isValid = await compare(password, dbUser.passwordHash)
            if (isValid) {
              return {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name || dbUser.email.split('@')[0],
              }
            }
          }
        } catch (err) {
          console.error('[Auth] Database lookup error during authorization:', err)
        }

        // 2. Fallback to owner credentials (backward compatibility)
        const owner = getOwnerCredentials()
        if (owner && normalizedEmail === owner.email.trim().toLowerCase()) {
          const isOwnerValid = await compare(password, owner.passwordHash)
          if (isOwnerValid) {
            return {
              id: 'a0000000-0000-0000-0000-000000000001',
              email: owner.email,
              name: 'Owner',
            }
          }
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user
      const { pathname } = request.nextUrl

      const isPublicPath =
        pathname === '/login' ||
        pathname === '/register' ||
        pathname === '/verify-email' ||
        pathname === '/forgot-password' ||
        pathname === '/reset-password'
      const isApiAuth = pathname.startsWith('/api/auth')
      const isCronApi = pathname.startsWith('/api/cron')
      const isLinkedInApi = pathname.startsWith('/api/linkedin')

      if (isApiAuth || isCronApi || isLinkedInApi || isPublicPath) return true
      return isLoggedIn
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  trustHost: true,
})
