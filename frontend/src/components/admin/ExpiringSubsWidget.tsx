'use client'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { Skeleton } from '@/components/shared/Skeleton'
import type { Subscription } from '@/types'

interface Props { subs: Subscription[]; loading?: boolean }

export function ExpiringSubsWidget({ subs, loading }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      className="glass-card p-6 border border-orange-500/15"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-semibold">Expiring Soon</h2>
        </div>
        <Link href="/admin/subscriptions" className="text-xs text-muted-foreground hover:text-orange-400 transition-colors flex items-center gap-1">
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
        ) : subs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No subscriptions expiring soon</div>
        ) : subs.map((s: any) => {
          const daysLeft = differenceInDays(new Date(s.expires_at), new Date())
          return (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 hover:border-orange-500/20 transition-all">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-300">
                {s.user?.first_name?.[0]}{s.user?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.user?.first_name} {s.user?.last_name}</p>
                <p className="text-xs text-muted-foreground">{s.plan?.name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-xs font-bold ${daysLeft <= 2 ? 'text-red-400' : 'text-orange-400'}`}>{daysLeft}d left</p>
                <p className="text-xs text-muted-foreground">{format(new Date(s.expires_at), 'MMM d')}</p>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
