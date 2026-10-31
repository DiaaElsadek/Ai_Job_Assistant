import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const emailFrom = process.env.EMAIL_FROM || 'JobFlow AI <notifications@jobflow.ai>'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || 'http://localhost:3000'

const resend = resendApiKey ? new Resend(resendApiKey) : null

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Sends a transactional email with graceful fallback to console logging
 * when RESEND_API_KEY is not configured (e.g. in local development).
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<SendEmailResult> {
  if (!resend) {
    console.log('\n================== [DEV TRANSACTIONAL EMAIL] ==================')
    console.log(`To: ${to}`)
    console.log(`From: ${emailFrom}`)
    console.log(`Subject: ${subject}`)
    console.log(`Text Content:\n${text}`)
    console.log('=================================================================\n')
    return { success: true, id: 'mock-dev-email-id' }
  }

  try {
    const data = await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
      text,
    })

    if (data.error) {
      console.error('[EmailService] Resend API error:', data.error)
      return { success: false, error: data.error.message }
    }

    return { success: true, id: data.data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email service error'
    console.error('[EmailService] Unexpected failure sending email:', err)
    return { success: false, error: message }
  }
}

/**
 * Email verification template & dispatch.
 */
export async function sendVerificationEmail({
  email,
  name,
  token,
}: {
  email: string
  name?: string
  token: string
}): Promise<SendEmailResult> {
  const verificationUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`
  const recipientName = name || 'there'

  const subject = 'Verify your JobFlow AI account'
  const text = `Hi ${recipientName},\n\nPlease verify your email address by visiting this link:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nBest regards,\nThe JobFlow AI Team`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="color: #0A66C2;">Welcome to JobFlow AI</h2>
      <p>Hi ${recipientName},</p>
      <p>Thank you for creating your JobFlow AI account. Please confirm your email address to activate all career networking features:</p>
      <div style="margin: 32px 0;">
        <a href="${verificationUrl}" style="background-color: #0A66C2; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:<br/><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p style="color: #888; font-size: 12px; margin-top: 32px;">This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.</p>
    </div>
  `

  return sendEmail({ to: email, subject, text, html })
}

/**
 * Password reset template & dispatch.
 */
export async function sendPasswordResetEmail({
  email,
  name,
  token,
}: {
  email: string
  name?: string
  token: string
}): Promise<SendEmailResult> {
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`
  const recipientName = name || 'there'

  const subject = 'Reset your JobFlow AI password'
  const text = `Hi ${recipientName},\n\nYou requested a password reset for your JobFlow AI account. Click the link below to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe JobFlow AI Team`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="color: #0A66C2;">Reset Your Password</h2>
      <p>Hi ${recipientName},</p>
      <p>We received a request to reset your JobFlow AI account password. Click the button below to choose a new password:</p>
      <div style="margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #0A66C2; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:<br/><a href="${resetUrl}">${resetUrl}</a></p>
      <p style="color: #888; font-size: 12px; margin-top: 32px;">This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this message.</p>
    </div>
  `

  return sendEmail({ to: email, subject, text, html })
}

/**
 * LinkedIn Token Expiry Warning template & dispatch.
 */
export async function sendLinkedInExpiryWarningEmail({
  email,
  name,
  daysRemaining,
}: {
  email: string
  name?: string
  daysRemaining: number
}): Promise<SendEmailResult> {
  const settingsUrl = `${appUrl}/settings`
  const recipientName = name || 'there'

  const subject = `⚠️ Action Required: Your LinkedIn authorization expires in ${daysRemaining} days`
  const text = `Hi ${recipientName},\n\nYour LinkedIn authorization on JobFlow AI will expire in ${daysRemaining} days. To ensure scheduled posts continue without interruption, please reconnect your account in Settings:\n${settingsUrl}\n\nBest regards,\nThe JobFlow AI Team`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="color: #e02424;">LinkedIn Authorization Expiring Soon</h2>
      <p>Hi ${recipientName},</p>
      <p>Your LinkedIn connection on JobFlow AI is scheduled to expire in <strong>${daysRemaining} days</strong>. In accordance with LinkedIn security standards, access tokens must be renewed every 60 days.</p>
      <p>To ensure your scheduled content dispatches smoothly without interruption, please take a moment to reconnect your account:</p>
      <div style="margin: 32px 0;">
        <a href="${settingsUrl}" style="background-color: #0A66C2; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reconnect LinkedIn
        </a>
      </div>
      <p style="color: #888; font-size: 12px; margin-top: 32px;">If you no longer wish to schedule posts, you can disconnect your account in Settings.</p>
    </div>
  `

  return sendEmail({ to: email, subject, text, html })
}

