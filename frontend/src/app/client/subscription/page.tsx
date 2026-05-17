'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import apiClient from '@/lib/api/client'
import { CreditCard, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function ClientSubscriptionPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => apiClient.get('/my/subscription').then(r => r.data),
  })

  const subs: any[] = data?.data ?? (data ? [data] : [])
  const activeSub = subs.find((s: any) => s.status === 'active')
  const history = subs.filter((s: any) => s.status !== 'active')

  const statusIcon: Record<string, any> = {
    active: CheckCircle2,
    expired: XCircle,
    cancelled: XCircle,
    pending: Clock,
  }
  const statusColor: Record<string, string> = {
    active: 'text-green-400 bg-green-500/15 border-green-500/20',
    expired: 'text-red-400 bg-red-500/15 border-red-500/20',
    cancelled: 'text-gray-400 bg-gray-500/15 border-gray-500/20',
    pending: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/20',
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">My Subscription</h1>
        <p className="text-muted-foreground mt-1">Your membership status</p>
      </motion.div>

      {isLoading ? (
        <div className="glass-card p-8 h-48 animate-pulse border border-white/5" />
      ) : activeSub ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass-card p-6 border border-white/5 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{activeSub.plan?.name}</h2>
              <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-medium border ${statusColor.active}`}>
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold gradient-text">${activeSub.price_paid}</p>
              <p className="text-xs text-muted-foreground">paid</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Sessions Remaining', value: activeSub.sessions_remaining != null ? activeSub.sessions_remaining : '∞', highlight: true },
              { label: 'Total Sessions', value: activeSub.plan?.sessions_count ?? '∞' },
              { label: 'Started', value: activeSub.starts_at ? format(parseISO(activeSub.starts_at), 'MMM d, yyyy') : '—' },
              { label: 'Expires', value: activeSub.expires_at ? format(parseISO(activeSub.expires_at), 'MMM d, yyyy') : 'Never' },
            ].map(item => (
              <div key={item.label} className="bg-graphite-700/60 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className={`text-xl font-bold ${item.highlight ? 'text-cyan-400' : ''}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {activeSub.plan?.description && (
            <div className="p-4 bg-graphite-700/40 rounded-xl border border-white/5">
              <p className="text-sm text-muted-foreground">{activeSub.plan.description}</p>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card p-12 text-center border border-white/5">
          <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">No Active Subscription</p>
          <p className="text-sm text-muted-foreground">Contact your gym administrator to get a subscription.</p>
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="font-semibold">Subscription History</h3>
          </div>
          <div className="divide-y divide-white/5">
            {history.map((sub: any) => {
              const Icon = statusIcon[sub.status] ?? Clock
              return (
                <div key={sub.id} className="px-6 py-4 flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${statusColor[sub.status]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{sub.plan?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {sub.starts_at ? format(parseISO(sub.starts_at), 'MMM d, yyyy') : '—'} – {sub.expires_at ? format(parseISO(sub.expires_at), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor[sub.status]}`}>{sub.status}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
