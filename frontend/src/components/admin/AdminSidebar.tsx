'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { usePresenceStore } from '@/lib/stores/presence'
import {
  LayoutDashboard, Users, Dumbbell, CreditCard, CalendarCheck,
  Radio, QrCode, BarChart3, Settings, UserPlus, LogOut
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { authApi } from '@/lib/api/auth'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/admin/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/clients',      label: 'Clients',     icon: Users },
  { href: '/admin/trainers',     label: 'Trainers',    icon: Dumbbell },
  { href: '/admin/subscriptions',label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/attendance',   label: 'Attendance',  icon: CalendarCheck },
  { href: '/admin/presence',     label: 'Gym Presence', icon: Radio },
  { href: '/admin/codes',        label: 'Reg. Codes',  icon: UserPlus },
  { href: '/admin/analytics',    label: 'Analytics',   icon: BarChart3 },
  { href: '/admin/scanner',      label: 'QR Scanner',  icon: QrCode },
  { href: '/admin/settings',     label: 'Settings',    icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const count = usePresenceStore(s => s.count)
  const logout = useAuthStore(s => s.logout)
  const router = useRouter()

  const handleLogout = async () => {
    await authApi.logout().catch(() => {})
    logout()
    router.replace('/auth/login')
  }

  return (
    <motion.aside
      initial={{ x: -280 }} animate={{ x: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-64 h-screen bg-graphite-800 border-r border-white/5 flex flex-col flex-shrink-0"
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">GymCRM</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          const isPresence = href === '/admin/presence'
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  active
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-purple-400' : 'group-hover:text-foreground')} />
                <span className="flex-1">{label}</span>
                {isPresence && count > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                    {count}
                  </span>
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </motion.aside>
  )
}
