'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Sun, Moon, LogOut, Menu, X, Zap } from 'lucide-react'
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
import { cn } from '@/src/lib/utils'
import { signOut } from 'next-auth/react'

const mobileNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/messages', label: 'Message Studio', icon: MessageSquare },
  { href: '/follow-ups', label: 'Follow-ups', icon: Bell },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function TopBar() {
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Derive page title from pathname
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    const segment = pathname.split('/')[1]
    if (!segment) return 'Dashboard'
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-12 px-4 border-b border-border bg-bg-primary/80 backdrop-blur-sm">
        {/* Mobile menu button */}
        <button
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:bg-bg-hover"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile logo */}
        <div className="md:hidden flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-accent text-black">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-text-primary text-sm">JobFlow AI</span>
        </div>

        {/* Page title (desktop) */}
        <h1 className="hidden md:block text-sm font-medium text-text-primary">
          {getPageTitle()}
        </h1>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:bg-bg-hover transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:bg-bg-hover transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
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
            className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar-bg border-r border-border p-4 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent text-black">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-semibold text-text-primary">JobFlow AI</span>
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
