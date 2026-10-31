'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Sun, Moon, LogOut, Menu, X, Zap, Languages, Search } from 'lucide-react'
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
} from 'lucide-react'
import { useTheme } from '@/src/components/theme-provider'
import { useI18n } from '@/src/lib/i18n'
import { cn } from '@/src/lib/utils'
import { signOut } from 'next-auth/react'
import { CommandPalette } from '@/src/components/layout/command-palette'

export function TopBar() {
  const { theme, toggleTheme } = useTheme()
  const { locale, toggleLocale, t, isRtl } = useI18n()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Listen for global Ctrl+K / Cmd+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const mobileNavItems = [
    { href: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/opportunities', label: t('nav.opportunities'), icon: Briefcase },
    { href: '/companies', label: t('nav.companies'), icon: Building2 },
    { href: '/contacts', label: t('nav.contacts'), icon: Users },
    { href: '/messages', label: t('nav.messages'), icon: MessageSquare },
    { href: '/follow-ups', label: t('nav.followUps'), icon: Bell },
    { href: '/analytics', label: t('nav.analytics'), icon: BarChart3 },
    { href: '/settings', label: t('nav.settings'), icon: Settings },
  ]

  // Derive page title from pathname
  const getPageTitle = () => {
    if (pathname === '/') return t('nav.dashboard')
    const segment = pathname.split('/')[1]
    switch (segment) {
      case 'opportunities':
        return t('nav.opportunities')
      case 'companies':
        return t('nav.companies')
      case 'contacts':
        return t('nav.contacts')
      case 'messages':
        return t('nav.messages')
      case 'follow-ups':
        return t('nav.followUps')
      case 'analytics':
        return t('nav.analytics')
      case 'settings':
        return t('nav.settings')
      default:
        return segment ? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ') : t('nav.dashboard')
    }
  }

  return (
    <>
      {/* Omni-search Command Palette (Ctrl+K) */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <header className="sticky top-0 z-30 flex items-center justify-between h-12 px-4 border-b border-border bg-bg-primary/80 backdrop-blur-sm">
        {/* Mobile menu button */}
        <button
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:bg-bg-hover"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={t('common.open')}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile logo */}
        <div className="md:hidden flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-accent text-black">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-text-primary text-sm">{t('common.appName')}</span>
        </div>

        {/* Page title (desktop) */}
        <h1 className="hidden md:block text-sm font-medium text-text-primary">
          {getPageTitle()}
        </h1>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Search Ctrl+K Button */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 px-2.5 h-8 rounded-md text-xs text-text-muted bg-bg-secondary border border-border hover:border-accent/40 hover:text-text-primary transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <span>{isRtl ? 'بحث سريع...' : 'Search...'}</span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-bg-tertiary border border-border">
              Ctrl+K
            </kbd>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors border border-border"
            title={locale === 'en' ? t('common.switchLanguage') : 'Switch to English'}
          >
            <Languages className="w-3.5 h-3.5 text-accent" />
            <span className="tracking-wide">{locale === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:bg-bg-hover transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={theme === 'dark' ? t('common.light') : t('common.dark')}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Sign Out */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:bg-bg-hover transition-colors"
            aria-label={t('common.signOut')}
            title={t('common.signOut')}
          >
            <LogOut className={cn("w-4 h-4", isRtl && "scale-x-[-1]")} />
          </button>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <nav
            className={cn(
              "absolute top-0 bottom-0 w-64 bg-sidebar-bg p-4 animate-slide-in",
              isRtl ? "right-0 border-l border-border" : "left-0 border-r border-border"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent text-black">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-semibold text-text-primary">{t('common.appName')}</span>
            </div>
            <ul className="space-y-1">
              {mobileNavItems.map(item => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                        isActive
                          ? 'bg-sidebar-active text-sidebar-text-active font-medium'
                          : 'text-sidebar-text hover:bg-sidebar-hover'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}
