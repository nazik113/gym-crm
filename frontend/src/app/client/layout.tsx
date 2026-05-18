'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { authApi } from '@/lib/api/auth'
import { useSocket } from '@/lib/hooks/useSocket'
import { Toaster } from 'react-hot-toast'
import { QrCode, Calendar, Dumbbell, Apple, Ruler, LogOut, User, Menu, X } from 'lucide-react'

const NAV = [
  { href: '/client/profile',      label: 'My Profile',    icon: User },
  { href: '/client/qr',           label: 'My QR Code',    icon: QrCode },
  { href: '/client/subscription', label: 'Subscription',  icon: Calendar },
  { href: '/client/workouts',     label: 'Workouts',      icon: Dumbbell },
  { href: '/client/nutrition',    label: 'Nutrition',     icon: Apple },
  { href: '/client/measurements', label: 'Measurements',  icon: Ruler },
]

// Bottom nav items (5 max for mobile)
const BOTTOM_NAV = [
  { href: '/client/profile',      label: 'Profile',   icon: User },
  { href: '/client/workouts',     label: 'Workouts',  icon: Dumbbell },
  { href: '/client/subscription', label: 'Sub',       icon: Calendar },
  { href: '/client/nutrition',    label: 'Nutrition', icon: Apple },
  { href: '/client/qr',          label: 'QR Code',   icon: QrCode },
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const logout = useAuthStore(s => s.logout)
  const [hydrated, setHydrated] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useSocket()

  useEffect(() => { setHydrated(true) }, [])
  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated || user?.role?.name !== 'client') router.replace('/auth/login')
  }, [hydrated, isAuthenticated, user])

  if (!hydrated || !isAuthenticated) return null

  const handleLogout = async () => {
    await authApi.logout().catch(() => {})
    logout()
    router.replace('/auth/login')
  }

  return (
    <div className="flex h-screen bg-graphite-900 overflow-hidden">

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="hidden md:flex w-60 h-screen bg-graphite-800 border-r border-white/5 flex-col flex-shrink-0"
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">GymCRM</p>
              <p className="text-xs text-muted-foreground">Client Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    active
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  <Icon className={cn('w-4 h-4', active ? 'text-cyan-400' : '')} />
                  {label}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name ?? `${user?.first_name} ${user?.last_name}`}</p>
              <p className="text-xs text-muted-foreground">Client</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all w-full">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </motion.aside>

      {/* ── Mobile Header ───────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-graphite-800/95 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold">GymCRM</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 rounded-xl bg-graphite-700 flex items-center justify-center border border-white/8">
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ───────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed top-0 right-0 bottom-0 z-40 w-64 bg-graphite-800 border-l border-white/5 flex flex-col pt-14">
              <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {NAV.map(({ href, label, icon: Icon }) => {
                  const active = pathname.startsWith(href)
                  return (
                    <Link key={href} href={href}>
                      <div className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                        active
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      )}>
                        <Icon className={cn('w-4 h-4', active ? 'text-cyan-400' : '')} />
                        {label}
                      </div>
                    </Link>
                  )
                })}
              </nav>
              <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 mb-3 px-1">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-muted-foreground">Client</p>
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

      {/* ── Main Content ───────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Mobile top spacer */}
        <div className="md:hidden h-14 flex-shrink-0" />
        <div className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">{children}</div>
      </main>

      {/* ── Toast Notifications ────────────────────────── */}
      <Toaster position="top-right" />

      {/* ── Mobile Bottom Nav ──────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-graphite-800/95 backdrop-blur-sm border-t border-white/5 flex">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className="flex-1">
              <div className={cn(
                'flex flex-col items-center justify-center py-2 gap-0.5 transition-all',
                active ? 'text-cyan-400' : 'text-muted-foreground'
              )}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
