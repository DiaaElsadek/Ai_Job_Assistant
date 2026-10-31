'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, KeyRound, AlertCircle, CheckCircle2, ArrowRight, Languages } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { useI18n } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'
import { requestPasswordResetAction } from '@/src/server/actions/auth'

export default function ForgotPasswordPage() {
  const { locale, toggleLocale, t, isRtl } = useI18n()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!email) {
      setError(locale === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)

    try {
      const res = await requestPasswordResetAction(formData)

      if (!res.success) {
        setError(res.error || 'Failed to request password reset')
        setLoading(false)
        return
      }

      setSuccessMessage(res.message || 'Password reset link sent to your email.')
      setLoading(false)
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12 relative">
      <div className="absolute top-4 end-4">
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-primary border border-border shadow-xs transition-colors"
        >
          <Languages className="w-3.5 h-3.5 text-accent" />
          <span>{locale === 'en' ? 'العربية' : 'English'}</span>
        </button>
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-accent text-black font-bold shadow-md shadow-accent/10">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            {t('auth.forgotPasswordTitle')}
          </h1>
          <p className="text-xs text-text-secondary">
            {t('auth.forgotPasswordSubtitle')}
          </p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <KeyRound className="w-4 h-4 text-accent" />
            <span className="text-xs font-medium text-text-primary">
              {t('auth.forgotPassword')}
            </span>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 rounded-md bg-error/10 border border-error/20 text-error text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="flex items-start gap-2.5 p-3 rounded-md bg-success/10 border border-success/20 text-success text-xs"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="reset-email"
              type="email"
              label={t('auth.email')}
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="md"
              loading={loading}
              disabled={loading}
            >
              {loading ? t('auth.sending') : t('auth.sendResetLink')}
              <ArrowRight className={cn('w-4 h-4 ml-1', isRtl && 'mr-1 ml-0 scale-x-[-1]')} />
            </Button>

            <div className="pt-2 text-center text-xs text-text-secondary border-t border-border/50">
              <Link href="/login" className="font-semibold text-accent hover:underline">
                {t('auth.backToLogin')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

