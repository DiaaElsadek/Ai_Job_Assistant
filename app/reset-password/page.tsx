'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Zap, Lock, AlertCircle, CheckCircle2, ArrowRight, Languages, Loader2 } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { useI18n } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'
import { resetPasswordAction } from '@/src/server/actions/auth'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { locale, t, isRtl } = useI18n()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-sm space-y-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-error/10 text-error mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-xs text-error">
          {locale === 'ar'
            ? 'رابط إعادة التعيين غير صالح أو مفقود. يرجى طلب رابط جديد.'
            : 'Reset token is missing or invalid. Please request a new link.'}
        </p>
        <Link href="/forgot-password" className="block w-full">
          <Button variant="outline" className="w-full" size="md">
            {t('auth.forgotPasswordTitle')}
          </Button>
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (password !== confirmPassword) {
      setError(locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError(
        locale === 'ar'
          ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل'
          : 'Password must be at least 8 characters'
      )
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('token', token)
    formData.append('password', password)
    formData.append('confirmPassword', confirmPassword)

    try {
      const res = await resetPasswordAction(formData)

      if (!res.success) {
        setError(res.error || 'Failed to reset password')
        setLoading(false)
        return
      }

      setSuccessMessage(res.message || 'Password reset successfully!')
      setLoading(false)

      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <Lock className="w-4 h-4 text-accent" />
        <span className="text-xs font-medium text-text-primary">
          {t('auth.resetPasswordTitle')}
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
          id="new-password"
          type="password"
          label={t('auth.password')}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        <Input
          id="confirm-new-password"
          type="password"
          label={t('auth.confirmPassword')}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        <Button
          type="submit"
          className="w-full"
          size="md"
          loading={loading}
          disabled={loading}
        >
          {loading ? t('auth.resetting') : t('auth.resetPasswordBtn')}
          <ArrowRight className={cn('w-4 h-4 ml-1', isRtl && 'mr-1 ml-0 scale-x-[-1]')} />
        </Button>

        <div className="pt-2 text-center text-xs text-text-secondary border-t border-border/50">
          <Link href="/login" className="font-semibold text-accent hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  const { locale, toggleLocale, t } = useI18n()

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
            {t('auth.resetPasswordTitle')}
          </h1>
          <p className="text-xs text-text-secondary">
            {t('auth.resetPasswordSubtitle')}
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-bg-secondary border border-border rounded-xl p-6 text-center">
              <Loader2 className="w-6 h-6 text-accent animate-spin mx-auto" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}

