'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { useSocket } from '@/lib/hooks/useSocket'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { authApi } from '@/lib/api/auth'
import { usePresenceStore } from '@/lib/stores/presence'
import {
  LayoutDashboard, Users, Dumbbell, CreditCard, CalendarCheck,
  Radio, QrCode, BarChart3, Settings, UserPlus, LogOut, Menu, X
} from 'lucide-react'

const NAV = [
  { href: '/admin/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/admin/clients',      label: 'Clients',      icon: Users },
  { href: '/admin/trainers',     label: 'Trainers',     icon: Dumbbell },
  { href: '/admin/subscriptions',label: 'Subscriptions',icon: CreditCard },
  { href: '/admin/attendance',   label: 'Attendance',   icon: CalendarCheck },
  { href: '/admin/presence',     label: 'Gym Presence', icon: Radio },
  { href: '/admin/codes',        label: 'Reg. Codes',   icon: UserPlus },
  { href: '/admin/analytics',    label: 'Analytics',    icon: BarChart3 },
  { href: '/admin/scanner',      label: 'QR Scanner',   icon: QrCode },
  { href: '/admin/settings',     label: 'Settings',     icon: Settings },
]

const BOTTOM_NAV = [
  { href: '/admin/dashboard',    label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/clients',      label: 'Clients',   icon: Users },
  { href: '/admin/presence',     label: 'Presence',  icon: Radio },
  { href: '/admin/analytics',    label: 'Analytics', icon: BarChart3 },
  { href: '/admin/scanner',      label: 'Scanner',   icon: QrCode },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const logout = useAuthStore(s => s.logout)
  const count = usePresenceStore(s => s.count)
  const [hydrated, setHydrated] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useSocket()

  useEffect(() => { setHydrated(true) }, [])
  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated || user?.role?.name !== 'admin') router.replace('/auth/login')
  }, [hydrated, isAuthenticated, user])

  if (!hydrated || !isAuthenticated) return null

  const handleLogout = async () => {
    await authApi.logout().catch(() => {})
    logout()
    router.replace('/auth/login')
  }

  return (
    <div className="flex h-screen bg-graphite-900 overflow-hidden">
      {/* Desktop sidebar */}
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop header */}
        <div className="hidden md:block">
          <AdminHeader />
        </div>

        {/* Mobile top bar */}
        <div className="md:hidden flex-shrink-0 h-14 bg-graphite-800/95 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold">GymCRM</span>
            {count > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-xs text-green-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="w-9 h-9 rounded-xl bg-graphite-700 flex items-center justify-center border border-white/8">
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)} />
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="md:hidden fixed top-14 right-0 bottom-0 z-50 w-64 bg-graphite-800 border-l border-white/5 flex flex-col">
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                  {NAV.map(({ href, label, icon: Icon }) => {
                    const active = pathname.startsWith(href)
                    const isPresence = href === '/admin/presence'
                    return (
                      <Link key={href} href={href}>
                        <div className={cn(
                          'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                          active ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                        )}>
                          <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-purple-400' : '')} />
                          <span className="flex-1">{label}</span>
                          {isPresence && count > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">{count}</span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </nav>
                <div className="p-4 border-t border-white/5">
                  <div className="flex items-center gap-3 mb-3 px-1">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs text-muted-foreground">Administrator</p>
                    </div>
                  </div>
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all w-full">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-graphite-800/95 backdrop-blur-sm border-t border-white/5 flex">
          {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} className="flex-1">
                <div className={cn(
                  'flex flex-col items-center justify-center py-2 gap-0.5 transition-all',
                  active ? 'text-purple-400' : 'text-muted-foreground'
                )}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{label}</span>
                </div>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
