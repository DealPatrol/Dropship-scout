'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import {
  Search,
  Bookmark,
  History,
  Settings,
  Radar,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/dashboard', label: 'Search', icon: Search, exact: true },
  { href: '/dashboard/saved', label: 'Saved Products', icon: Bookmark, exact: false },
  { href: '/dashboard/history', label: 'Push History', icon: History, exact: false },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false },
]

interface DashboardShellProps {
  user: { id?: string; email?: string; name?: string } | null
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    try {
      await signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-background text-foreground">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden p-4 hover:bg-accent"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-0 top-16 md:static md:inset-auto w-64 border-r border-border bg-background p-4 flex flex-col transition-all duration-300 md:flex md:w-64',
          mobileOpen ? 'block' : 'hidden'
        )}
      >
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Radar className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">Dropship Scout</span>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <Separator className="my-4" />

        <div className="space-y-2">
          {user && (
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
              <p className="text-sm font-semibold text-foreground truncate">{user.email || user.name || 'User'}</p>
            </div>
          )}
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
