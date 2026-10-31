'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { useI18n } from '@/src/lib/i18n'

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { t, isRtl } = useI18n()

  const navItems = [
    { href: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/opportunities', label: t('nav.opportunities'), icon: Briefcase },
    { href: '/companies', label: t('nav.companies'), icon: Building2 },
    { href: '/contacts', label: t('nav.contacts'), icon: Users },
    { href: '/messages', label: t('nav.messages'), icon: MessageSquare },
    { href: '/follow-ups', label: t('nav.followUps'), icon: Bell },
    { href: '/analytics', label: t('nav.analytics'), icon: BarChart3 },
    { href: '/settings', label: t('nav.settings'), icon: Settings },
  ]

  const CollapseIcon = isRtl
    ? collapsed
      ? ChevronLeft
      : ChevronRight
    : collapsed
    ? ChevronRight
    : ChevronLeft

  return (
    <>
      {/* Mobile overlay */}
      <aside
        className={cn(
          'fixed top-0 z-40 h-full flex flex-col transition-all duration-200',
          isRtl ? 'right-0 border-l border-border' : 'left-0 border-r border-border',
          'bg-sidebar-bg',
          collapsed ? 'w-14' : 'w-60',
          'max-md:hidden'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 border-b border-border px-3 h-12 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent text-black shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-text-primary text-[15px] tracking-tight">
              {t('common.appName')}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          <ul className="space-y-0.5">
            {navItems.map(item => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-sidebar-active text-sidebar-text-active font-medium'
                        : 'text-sidebar-text hover:bg-sidebar-hover hover:text-text-primary'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-border px-2 py-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-1.5 rounded-md text-text-tertiary hover:bg-sidebar-hover hover:text-text-primary transition-colors"
            aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
            title={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          >
            <CollapseIcon className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Spacer to push main content */}
      <div
        className={cn(
          'shrink-0 transition-all duration-200 max-md:hidden',
          collapsed ? 'w-14' : 'w-60'
        )}
      />
    </>
  )
}
