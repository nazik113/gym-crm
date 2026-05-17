'use client'
import { useAuthStore } from '@/lib/stores/auth'
import { usePresenceStore } from '@/lib/stores/presence'
import { motion } from 'framer-motion'
import { Users, Bell, Search } from 'lucide-react'

export function AdminHeader() {
  const user = useAuthStore(s => s.user)
  const count = usePresenceStore(s => s.count)

  return (
    <header className="h-16 bg-graphite-800/50 border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0 backdrop-blur-sm">
      {/* Search */}
      <div className="flex items-center gap-2 bg-graphite-700 border border-white/8 rounded-xl px-4 py-2 w-72">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input placeholder="Search clients, trainers..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none flex-1" />
      </div>

      <div className="flex items-center gap-4">
        {/* Gym presence badge */}
        <motion.div animate={{ scale: count > 0 ? [1, 1.05, 1] : 1 }} transition={{ duration: 1, repeat: Infinity }}
          className="flex items-center gap-2 bg-green-500/15 border border-green-500/25 rounded-xl px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <Users className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-semibold text-green-400">{count} in gym</span>
        </motion.div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl bg-graphite-700 border border-white/8 flex items-center justify-center hover:bg-graphite-600 transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">3</span>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}
