'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Briefcase,
  Building2,
  Users,
  MessageSquare,
  Clock,
  BarChart3,
  Settings,
  Languages,
  ArrowRight,
  Command,
  Loader2,
} from 'lucide-react'
import { globalOmniSearchAction, type SearchResultItem } from '@/src/server/actions/search'
import { useI18n } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const { isRtl, toggleLocale, locale } = useI18n()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await globalOmniSearchAction(query)
        if (res.success) {
          setResults(res.results)
          setSelectedIndex(0)
        }
      } catch (err) {
        console.error('Omni-search error:', err)
      } finally {
        setLoading(false)
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [query])

  // Static navigation shortcuts
  const navigationShortcuts = [
    {
      titleEn: 'Opportunities Pipeline',
      titleAr: 'قائمة فرص العمل والتقديم',
      href: '/opportunities',
      icon: Briefcase,
    },
    {
      titleEn: 'Target Companies',
      titleAr: 'الشركات المستهدفة',
      href: '/companies',
      icon: Building2,
    },
    {
      titleEn: 'Contacts & Networking',
      titleAr: 'جهات الاتصال وشبكة المعارف',
      href: '/contacts',
      icon: Users,
    },
    {
      titleEn: 'AI Message Studio',
      titleAr: 'ستوديو صياغة الرسائل بالذكاء',
      href: '/messages',
      icon: MessageSquare,
    },
    {
      titleEn: 'Follow-ups Board',
      titleAr: 'لوحة المهام والمتابعات',
      href: '/follow-ups',
      icon: Clock,
    },
    {
      titleEn: 'Pipeline Analytics',
      titleAr: 'لوحة تحليلات البحث عن عمل',
      href: '/analytics',
      icon: BarChart3,
    },
    {
      titleEn: 'Account Settings',
      titleAr: 'إعدادات الحساب والسيرة الذاتية',
      href: '/settings',
      icon: Settings,
    },
  ]

  const handleSelect = (href: string) => {
    onClose()
    router.push(href)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const max = results.length > 0 ? results.length : navigationShortcuts.length
      setSelectedIndex((prev) => (prev + 1) % max)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const max = results.length > 0 ? results.length : navigationShortcuts.length
      setSelectedIndex((prev) => (prev - 1 + max) % max)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results.length > 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex].href)
      } else if (navigationShortcuts[selectedIndex]) {
        handleSelect(navigationShortcuts[selectedIndex].href)
      }
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-bg-secondary border border-border rounded-xl shadow-2xl overflow-hidden divide-y divide-border"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 gap-3">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isRtl
                ? 'ابحث في الوظائف، الشركات، أو الأشخاص... (أو تنقل بالأسهم)'
                : 'Search opportunities, companies, contacts... (or use arrows)'
            }
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-accent shrink-0" />}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono bg-bg-tertiary border border-border text-text-muted">
            ESC
          </kbd>
        </div>

        {/* Results or Shortcuts */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {query.trim() ? (
            results.length === 0 && !loading ? (
              <div className="p-6 text-center text-xs text-text-muted">
                {isRtl ? 'لا توجد نتائج مطابقة لبحثك.' : 'No matching results found.'}
              </div>
            ) : (
              results.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.href)}
                  className={cn(
                    'w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors',
                    selectedIndex === idx ? 'bg-accent/15 text-accent' : 'hover:bg-bg-hover text-text-primary',
                    isRtl && 'text-right'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {item.type === 'opportunity' && <Briefcase className="w-4 h-4 text-info shrink-0" />}
                    {item.type === 'company' && <Building2 className="w-4 h-4 text-accent shrink-0" />}
                    {item.type === 'contact' && <Users className="w-4 h-4 text-success shrink-0" />}
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      {item.subtitle && <p className="text-[11px] text-text-muted">{item.subtitle}</p>}
                    </div>
                  </div>
                  <ArrowRight className={cn('w-3.5 h-3.5 text-text-muted shrink-0', isRtl && 'scale-x-[-1]')} />
                </button>
              ))
            )
          ) : (
            <div className="space-y-1">
              <p className="px-2.5 py-1 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                {isRtl ? 'التنقل السريع' : 'Quick Navigation'}
              </p>
              {navigationShortcuts.map((item, idx) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleSelect(item.href)}
                    className={cn(
                      'w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition-colors',
                      selectedIndex === idx ? 'bg-accent/15 text-accent' : 'hover:bg-bg-hover text-text-primary',
                      isRtl && 'flex-row-reverse text-right'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="font-medium">{isRtl ? item.titleAr : item.titleEn}</span>
                    </div>
                    <span className="text-[10px] text-text-muted font-mono">{item.href}</span>
                  </button>
                )
              })}

              {/* Language Switcher Shortcut */}
              <button
                type="button"
                onClick={() => {
                  toggleLocale()
                  onClose()
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs hover:bg-bg-hover text-text-primary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Languages className="w-4 h-4 text-accent shrink-0" />
                  <span className="font-medium">
                    {isRtl ? 'التبديل إلى الإنجليزية (Switch to English)' : 'التبديل إلى العربية (Switch to Arabic)'}
                  </span>
                </div>
                <span className="text-[10px] text-text-muted font-mono uppercase">
                  {locale === 'ar' ? 'EN' : 'AR'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-bg-tertiary/40 flex items-center justify-between text-[11px] text-text-muted">
          <span>{isRtl ? 'اضغط Enter للانتقال' : 'Press Enter to select'}</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-bg-card border border-border text-[10px] font-mono">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-bg-card border border-border text-[10px] font-mono">↓</kbd>
            {isRtl ? 'للتنقل' : 'to navigate'}
          </span>
        </div>
      </div>
    </div>
  )
}
