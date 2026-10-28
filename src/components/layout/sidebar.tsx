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

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/messages', label: 'Message Studio', icon: MessageSquare },
  { href: '/follow-ups', label: 'Follow-ups', icon: Bell },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full flex flex-col border-r border-border transition-all duration-200',
          'bg-sidebar-bg',
          collapsed ? 'w-14' : 'w-60',
          // On mobile, hide collapsed sidebar behind a toggle
          'max-md:hidden'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 border-b border-border px-3 h-12 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent text-black">
            <Zap className="w-4 h-4" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-text-primary text-[15px] tracking-tight">
              JobFlow AI
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
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
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
