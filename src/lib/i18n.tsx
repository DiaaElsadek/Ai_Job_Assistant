'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import translationsData from '@/src/locales/translations.json'

export type Locale = 'en' | 'ar'
export type Direction = 'ltr' | 'rtl'

export const translations = translationsData as {
  en: typeof translationsData.en
  ar: typeof translationsData.ar
}

interface I18nContextValue {
  locale: Locale
  direction: Direction
  isRtl: boolean
  t: (path: string, params?: Record<string, string | number>) => string
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

const STORAGE_KEY = 'jobflow-locale'

function resolveNestedKey(obj: any, path: string): string | undefined {
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined
    }
    current = current[part]
  }
  return typeof current === 'string' ? current : undefined
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [mounted, setMounted] = useState(false)

  // Initialize from localStorage or cookie on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
      const initial: Locale = stored === 'ar' || stored === 'en' ? stored : 'en'
      setLocaleState(initial)
      applyLocaleToDocument(initial)
    } catch {
      // Fallback if localStorage unavailable
    }
    setMounted(true)
  }, [])

  const applyLocaleToDocument = (loc: Locale) => {
    const root = document.documentElement
    const dir: Direction = loc === 'ar' ? 'rtl' : 'ltr'
    root.setAttribute('lang', loc)
    root.setAttribute('dir', dir)
    // Also save in cookie for SSR consistency
    document.cookie = `${STORAGE_KEY}=${loc}; path=/; max-age=31536000; SameSite=Lax`
  }

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(STORAGE_KEY, newLocale)
    } catch {}
    applyLocaleToDocument(newLocale)
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'ar' : 'en')
  }, [locale, setLocale])

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      // 1. Try selected locale
      let text = resolveNestedKey(translations[locale], path)

      // 2. Fallback to English if missing
      if (!text && locale !== 'en') {
        text = resolveNestedKey(translations.en, path)
      }

      // 3. Fallback to path
      if (!text) {
        return path
      }

      // 4. Interpolate variables e.g. {name} or {count}
      if (params) {
        return Object.entries(params).reduce((acc, [key, val]) => {
          return acc.replaceAll(`{${key}}`, String(val))
        }, text)
      }

      return text
    },
    [locale]
  )

  const direction: Direction = locale === 'ar' ? 'rtl' : 'ltr'
  const isRtl = locale === 'ar'

  const value = useMemo(
    () => ({
      locale,
      direction,
      isRtl,
      t,
      setLocale,
      toggleLocale,
    }),
    [locale, direction, isRtl, t, setLocale, toggleLocale]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
