'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Zap, ShieldCheck, AlertCircle, ArrowRight, Languages } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { useI18n } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const { t, isRtl } = useI18n()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError(t('auth.invalidCredentials'))
      return
    }

    setLoading(true)

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError(t('auth.invalidCredentials'))
        setLoading(false)
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError(t('auth.invalidCredentials'))
      setLoading(false)
    }
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <ShieldCheck className="w-4 h-4 text-accent" />
        <span className="text-xs font-medium text-text-primary">
          {t('auth.singleOwnerAccess')}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="login-email"
          type="email"
          label={t('auth.email')}
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-primary">{t('auth.password')}</span>
            <Link
              href="/forgot-password"
              className="text-xs text-accent hover:underline"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          size="md"
          loading={loading}
          disabled={loading}
        >
          {loading ? t('auth.signingIn') : t('auth.signInBtn')}
          <ArrowRight className={cn('w-4 h-4 ml-1', isRtl && 'mr-1 ml-0 scale-x-[-1]')} />
        </Button>

        <div className="pt-2 text-center text-xs text-text-secondary border-t border-border/50">
          <span>{t('auth.dontHaveAccount')} </span>
          <Link href="/register" className="font-semibold text-accent hover:underline">
            {t('auth.register')}
          </Link>
        </div>
      </form>
    </div>
  )
}

function LoginFormFallback() {
  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <ShieldCheck className="w-4 h-4 text-accent" />
        <span className="text-xs font-medium text-text-primary">
          Single-Owner Access
        </span>
      </div>
      <div className="space-y-4 animate-pulse">
        <div className="space-y-1">
          <div className="h-3 w-20 bg-bg-tertiary rounded" />
          <div className="h-8 bg-bg-tertiary rounded-md" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-16 bg-bg-tertiary rounded" />
          <div className="h-8 bg-bg-tertiary rounded-md" />
        </div>
        <div className="h-8 bg-accent/30 rounded-md" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { locale, toggleLocale, t } = useI18n()

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
            {t('auth.title')}
          </h1>
          <p className="text-xs text-text-secondary">
            {t('auth.subtitle')}
          </p>
        </div>

        {/* Card */}
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-[11px] text-text-muted">
          {t('auth.footerNote')}
        </p>
      </div>
    </div>
  )
}
