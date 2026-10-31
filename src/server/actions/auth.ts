'use server'

import crypto from 'node:crypto'
import { hash } from 'bcryptjs'
import { prisma } from '@/src/server/db'
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/src/lib/validations'
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '@/src/server/services/email'

export interface AuthActionResult {
  success: boolean
  error?: string
  message?: string
}

/**
 * Multi-user registration action.
 * Creates a new user record, sets hashed password, generates verification token,
 * provisions default settings, and dispatches a verification email.
 */
export async function registerUserAction(formData: FormData): Promise<AuthActionResult> {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const parsed = registerSchema.safeParse(rawData)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0]
      return { success: false, error: firstIssue?.message || 'Invalid registration data' }
    }

    const { name, email, password } = parsed.data
    const normalizedEmail = email.trim().toLowerCase()

    // Check if an account already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser && existingUser.passwordHash) {
      return {
        success: false,
        error: 'An account with this email address already exists.',
      }
    }

    // Hash password with bcrypt (salt rounds = 12)
    const passwordHash = await hash(password, 12)

    // Generate crypto verification token (valid for 24 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    if (existingUser) {
      // Update existing record if created previously without password
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          passwordHash,
          emailVerificationToken: verificationToken,
          emailVerificationExpiresAt: verificationExpiresAt,
        },
      })
    } else {
      // Create new user and provision default settings
      await prisma.$transaction(async tx => {
        const newUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            name,
            passwordHash,
            emailVerificationToken: verificationToken,
            emailVerificationExpiresAt: verificationExpiresAt,
          },
        })

        await tx.settings.create({
          data: {
            userId: newUser.id,
            preferredRole: 'React.js / Next.js Frontend Developer',
            targetCountry: 'Egypt',
            preferredExperience: ['INTERNSHIP', 'FRESHER', 'JUNIOR'],
            workPreference: 'REMOTE',
            preferredLanguage: 'ENGLISH',
            dailyNetworkingTarget: 5,
            followUpDefaultDays: 3,
            theme: 'dark',
          },
        })
      })
    }

    // Send verification email via Resend (async, non-blocking)
    try {
      await sendVerificationEmail({
        email: normalizedEmail,
        name,
        token: verificationToken,
      })
    } catch (err) {
      console.warn('[Register] Verification email dispatch notice:', err)
    }

    return {
      success: true,
      message: 'Account created successfully! Please check your email to verify your address.',
    }
  } catch (error) {
    console.error('[Register] Unexpected registration error:', error)
    return { success: false, error: 'Registration failed. Please try again later.' }
  }
}

/**
 * Email verification action.
 * Confirms the verification token and activates emailVerified timestamp.
 */
export async function verifyEmailAction(token: string): Promise<AuthActionResult> {
  try {
    if (!token || typeof token !== 'string') {
      return { success: false, error: 'Verification token is missing.' }
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiresAt: { gte: new Date() },
      },
    })

    if (!user) {
      return {
        success: false,
        error: 'The verification link is invalid or has expired. Please request a new one.',
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    })

    return {
      success: true,
      message: 'Email verified successfully! You can now log in to your account.',
    }
  } catch (error) {
    console.error('[VerifyEmail] Error verifying email token:', error)
    return { success: false, error: 'Failed to verify email. Please try again.' }
  }
}

/**
 * Request password reset action.
 * Always returns success to prevent user enumeration attacks.
 */
export async function requestPasswordResetAction(formData: FormData): Promise<AuthActionResult> {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const parsed = forgotPasswordSchema.safeParse(rawData)

    if (!parsed.success) {
      return { success: false, error: 'Please enter a valid email address.' }
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase()
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (user && user.passwordHash) {
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiresAt: resetExpiresAt,
        },
      })

      try {
        await sendPasswordResetEmail({
          email: user.email,
          name: user.name || undefined,
          token: resetToken,
        })
      } catch (err) {
        console.warn('[ForgotPassword] Reset email dispatch notice:', err)
      }
    }

    // Generic response regardless of whether email was found
    return {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    }
  } catch (error) {
    console.error('[ForgotPassword] Error processing password reset request:', error)
    return { success: false, error: 'Failed to process request. Please try again.' }
  }
}

/**
 * Reset password action.
 * Verifies token validity, updates password hash, and invalidates the token.
 */
export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const parsed = resetPasswordSchema.safeParse(rawData)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0]
      return { success: false, error: firstIssue?.message || 'Invalid password reset data' }
    }

    const { token, password } = parsed.data

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: { gte: new Date() },
      },
    })

    if (!user) {
      return {
        success: false,
        error: 'The reset link is invalid or has expired. Please request a new password reset.',
      }
    }

    const passwordHash = await hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    })

    return {
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    }
  } catch (error) {
    console.error('[ResetPassword] Error resetting password:', error)
    return { success: false, error: 'Failed to reset password. Please try again.' }
  }
}

