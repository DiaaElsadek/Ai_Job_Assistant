'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Zap, CheckCircle2, AlertCircle, Loader2, ArrowRight, Languages } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { useI18n } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'
import { verifyEmailAction } from '@/src/server/actions/auth'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { t, isRtl } = useI18n()

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setSuccess(false)
      setMessage(t('auth.verifyEmailError'))
      return
    }

    let isMounted = true

    async function runVerification() {
      try {
        const res = await verifyEmailAction(token as string)
        if (!isMounted) return

        if (res.success) {
          setSuccess(true)
          setMessage(res.message || t('auth.verifyEmailSuccess'))
        } else {
          setSuccess(false)
          setMessage(res.error || t('auth.verifyEmailError'))
        }
      } catch {
        if (!isMounted) return
        setSuccess(false)
        setMessage(t('auth.verifyEmailError'))
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    runVerification()

    return () => {
      isMounted = false
    }
  }, [token, t])

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-sm space-y-5 text-center">
      {loading ? (
        <div className="py-6 space-y-3 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-xs text-text-secondary">{t('auth.verifyEmailSubtitle')}</p>
        </div>
      ) : success ? (
        <div className="py-4 space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 text-success">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-text-primary">
              {t('auth.verifyEmailSuccess')}
            </h2>
            <p className="text-xs text-text-secondary">{message}</p>
          </div>
          <Link href="/login" className="block w-full">
            <Button className="w-full" size="md">
              {t('auth.goToLogin')}
              <ArrowRight className={cn('w-4 h-4 ml-1', isRtl && 'mr-1 ml-0 scale-x-[-1]')} />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="py-4 space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-error/10 text-error">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-error">
              {t('auth.verifyEmailError')}
            </h2>
            <p className="text-xs text-text-secondary">{message}</p>
          </div>
          <Link href="/login" className="block w-full">
            <Button variant="outline" className="w-full" size="md">
              {t('auth.backToLogin')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
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
            {t('auth.verifyEmailTitle')}
          </h1>
        </div>

        <Suspense
          fallback={
            <div className="bg-bg-secondary border border-border rounded-xl p-6 text-center">
              <Loader2 className="w-6 h-6 text-accent animate-spin mx-auto" />
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  )
}

