'use client'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import type { User } from '@/types'
import { Radio, ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/shared/Skeleton'
import { format } from 'date-fns'

interface Props { clients: User[]; loading?: boolean }

export function PresenceWidget({ clients, loading }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="glass-card p-6 border border-white/5"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <Radio className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold">Currently in Gym</h2>
          <span className="ml-1 bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">{clients.length}</span>
        </div>
        <Link href="/admin/presence" className="text-xs text-muted-foreground hover:text-purple-400 transition-colors flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-graphite-700/50">
              <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
              <div className="flex-1"><Skeleton className="h-3.5 w-32 mb-1.5" /><Skeleton className="h-3 w-20" /></div>
            </div>
          ))
        ) : clients.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No clients in gym right now</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {clients.map((c) => (
              <motion.div key={c.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-graphite-700/50 hover:bg-graphite-700 transition-colors"
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-graphite-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.first_name} {c.last_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Entered {c.gym_entered_at ? format(new Date(c.gym_entered_at), 'HH:mm') : '—'}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}
