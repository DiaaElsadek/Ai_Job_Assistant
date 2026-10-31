'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, UserPlus, AlertCircle, CheckCircle2, ArrowRight, Languages } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { useI18n } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'
import { registerUserAction } from '@/src/server/actions/auth'

export default function RegisterPage() {
  const router = useRouter()
  const { locale, toggleLocale, t, isRtl } = useI18n()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    formData.append('name', name)
    formData.append('email', email)
    formData.append('password', password)
    formData.append('confirmPassword', confirmPassword)

    try {
      const res = await registerUserAction(formData)

      if (!res.success) {
        setError(res.error || 'Failed to create account')
        setLoading(false)
        return
      }

      setSuccessMessage(res.message || t('auth.verifyEmailSubtitle'))
      setLoading(false)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3500)
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12 relative">
      {/* Top right language toggle */}
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
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-accent text-black font-bold shadow-md shadow-accent/10">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            {t('auth.registerTitle')}
          </h1>
          <p className="text-xs text-text-secondary">
            {t('auth.registerSubtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <UserPlus className="w-4 h-4 text-accent" />
            <span className="text-xs font-medium text-text-primary">
              {t('auth.register')}
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

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              id="register-name"
              type="text"
              label={t('auth.name')}
              placeholder={t('auth.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              id="register-email"
              type="email"
              label={t('auth.email')}
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <Input
              id="register-password"
              type="password"
              label={t('auth.password')}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <Input
              id="register-confirm-password"
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
              className="w-full mt-2"
              size="md"
              loading={loading}
              disabled={loading}
            >
              {loading ? t('auth.registering') : t('auth.registerBtn')}
              <ArrowRight className={cn('w-4 h-4 ml-1', isRtl && 'mr-1 ml-0 scale-x-[-1]')} />
            </Button>

            <div className="pt-2 text-center text-xs text-text-secondary border-t border-border/50">
              <span>{t('auth.alreadyHaveAccount')} </span>
              <Link href="/login" className="font-semibold text-accent hover:underline">
                {t('auth.signInBtn')}
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-[11px] text-text-muted">
          {t('auth.footerNote')}
        </p>
      </div>
    </div>
  )
}

