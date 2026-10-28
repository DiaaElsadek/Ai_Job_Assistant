import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'

function getOwnerCredentials() {
  const email = process.env.OWNER_EMAIL
  const passwordHash = process.env.OWNER_PASSWORD_HASH

  if (!email || !passwordHash) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: OWNER_EMAIL and OWNER_PASSWORD_HASH must be set in production.'
      )
    }
    console.warn(
      '⚠️  OWNER_EMAIL or OWNER_PASSWORD_HASH not set. Login will not work.'
    )
    return null
  }

  return { email, passwordHash }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Owner Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const owner = getOwnerCredentials()
        if (!owner) return null

        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null
        if (email !== owner.email) return null

        const isValid = await compare(password, owner.passwordHash)
        if (!isValid) return null

        return {
          id: 'a0000000-0000-0000-0000-000000000001',
          email: owner.email,
          name: 'Owner',
        }
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
      const isLoginPage = request.nextUrl.pathname === '/login'
      const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth')

      if (isApiAuth) return true
      if (isLoginPage) return true
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
