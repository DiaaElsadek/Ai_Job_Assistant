import { describe, it, expect, vi, beforeEach } from 'vitest'
import { compare } from 'bcryptjs'

// Mock server-only
vi.mock('server-only', () => ({}))

// Mock database
vi.mock('@/src/server/db', () => {
  const mockUser = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }
  const mockSettings = {
    create: vi.fn(),
  }

  return {
    prisma: {
      user: mockUser,
      settings: mockSettings,
      $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) =>
        cb({ user: mockUser, settings: mockSettings })
      ),
    },
  }
})

// Mock email service
vi.mock('@/src/server/services/email', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true }),
}))

import { prisma } from '@/src/server/db'
import {
  registerUserAction,
  verifyEmailAction,
  requestPasswordResetAction,
  resetPasswordAction,
} from '@/src/server/actions/auth'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/src/server/services/email'

describe('Step 0: Multi-User Authentication & Email Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Registration (registerUserAction)', () => {
    it('rejects registration when passwords do not match', async () => {
      const formData = new FormData()
      formData.append('name', 'Ahmed Test')
      formData.append('email', 'ahmed@example.com')
      formData.append('password', 'SecretPass123')
      formData.append('confirmPassword', 'DifferentPass456')

      const res = await registerUserAction(formData)
      expect(res.success).toBe(false)
      expect(res.error).toContain('Passwords do not match')
      expect(prisma.user.create).not.toHaveBeenCalled()
    })

    it('rejects registration when password is shorter than 8 characters', async () => {
      const formData = new FormData()
      formData.append('name', 'Ahmed Test')
      formData.append('email', 'ahmed@example.com')
      formData.append('password', 'Short1')
      formData.append('confirmPassword', 'Short1')

      const res = await registerUserAction(formData)
      expect(res.success).toBe(false)
      expect(res.error).toContain('at least 8 characters')
    })

    it('rejects registration if email is already registered with password', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-uuid-1',
        email: 'ahmed@example.com',
        passwordHash: '$2b$12$somethinghashed',
      } as any)

      const formData = new FormData()
      formData.append('name', 'Ahmed Test')
      formData.append('email', 'ahmed@example.com')
      formData.append('password', 'ValidPass123')
      formData.append('confirmPassword', 'ValidPass123')

      const res = await registerUserAction(formData)
      expect(res.success).toBe(false)
      expect(res.error).toContain('already exists')
    })

    it('successfully registers a new user with hashed password and dispatches verification email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: 'new-user-uuid',
        email: 'newuser@example.com',
        name: 'New Candidate',
      } as any)

      const formData = new FormData()
      formData.append('name', 'New Candidate')
      formData.append('email', 'NewUser@example.com') // Mixed case
      formData.append('password', 'SuperSecure123!')
      formData.append('confirmPassword', 'SuperSecure123!')

      const res = await registerUserAction(formData)
      expect(res.success).toBe(true)

      // Verify user was created in transaction
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'newuser@example.com', // Normalized lowercase
            name: 'New Candidate',
            emailVerificationToken: expect.any(String),
            emailVerificationExpiresAt: expect.any(Date),
          }),
        })
      )

      // Verify password was hashed (not stored plain)
      const createCall = vi.mocked(prisma.user.create).mock.calls[0][0]
      const storedHash = (createCall.data as any).passwordHash
      expect(storedHash).not.toBe('SuperSecure123!')
      const isMatch = await compare('SuperSecure123!', storedHash)
      expect(isMatch).toBe(true)

      // Verify email was dispatched
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newuser@example.com',
          name: 'New Candidate',
          token: expect.any(String),
        })
      )
    })
  })

  describe('Email Verification (verifyEmailAction)', () => {
    it('returns error if verification token is invalid or expired', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null)

      const res = await verifyEmailAction('invalid-or-expired-token')
      expect(res.success).toBe(false)
      expect(res.error).toContain('invalid or has expired')
    })

    it('successfully verifies email and clears verification token', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
        id: 'user-uuid-1',
        email: 'verified@example.com',
        emailVerificationToken: 'valid-token-123',
      } as any)

      const res = await verifyEmailAction('valid-token-123')
      expect(res.success).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: {
          emailVerified: expect.any(Date),
          emailVerificationToken: null,
          emailVerificationExpiresAt: null,
        },
      })
    })
  })

  describe('Password Reset Flow', () => {
    it('generates a password reset token and sends email when user exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-uuid-1',
        email: 'user@example.com',
        name: 'Reset Candidate',
        passwordHash: '$2b$12$existinghash',
      } as any)

      const formData = new FormData()
      formData.append('email', 'user@example.com')

      const res = await requestPasswordResetAction(formData)
      expect(res.success).toBe(true)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: {
          passwordResetToken: expect.any(String),
          passwordResetExpiresAt: expect.any(Date),
        },
      })

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          token: expect.any(String),
        })
      )
    })

    it('returns generic success even if email does not exist to prevent user enumeration', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      const formData = new FormData()
      formData.append('email', 'nonexistent@example.com')

      const res = await requestPasswordResetAction(formData)
      expect(res.success).toBe(true)
      expect(prisma.user.update).not.toHaveBeenCalled()
      expect(sendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('successfully resets password with valid token', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
        id: 'user-uuid-1',
        email: 'user@example.com',
        passwordResetToken: 'valid-reset-token',
      } as any)

      const formData = new FormData()
      formData.append('token', 'valid-reset-token')
      formData.append('password', 'BrandNewPassword999')
      formData.append('confirmPassword', 'BrandNewPassword999')

      const res = await resetPasswordAction(formData)
      expect(res.success).toBe(true)

      const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0]
      expect(updateCall.data).toEqual(
        expect.objectContaining({
          passwordHash: expect.any(String),
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        })
      )

      const updatedHash = (updateCall.data as any).passwordHash
      const isMatch = await compare('BrandNewPassword999', updatedHash)
      expect(isMatch).toBe(true)
    })
  })
})
