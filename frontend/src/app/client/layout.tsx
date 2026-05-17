'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { authApi } from '@/lib/api/auth'
import { QrCode, Calendar, Dumbbell, Apple, Ruler, LogOut, User } from 'lucide-react'

const NAV = [
  { href: '/client/profile',      label: 'My Profile',     icon: User },
  { href: '/client/qr',           label: 'My QR Code',     icon: QrCode },
  { href: '/client/subscription',  label: 'Subscription',   icon: Calendar },
  { href: '/client/workouts',      label: 'Workouts',       icon: Dumbbell },
  { href: '/client/nutrition',     label: 'Nutrition',      icon: Apple },
  { href: '/client/measurements',  label: 'Measurements',   icon: Ruler },
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const logout = useAuthStore(s => s.logout)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

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
      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-60 h-screen bg-graphite-800 border-r border-white/5 flex flex-col flex-shrink-0"
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
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">Client</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        <div className="flex-1 p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
