'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import apiClient from '@/lib/api/client'
import { subscriptionsApi } from '@/lib/api/subscriptions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { CreditCard, Plus, Search, CalendarClock, Dumbbell, XCircle, X, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    active:    'bg-green-500/15 text-green-400 border-green-500/20',
    expired:   'bg-red-500/15 text-red-400 border-red-500/20',
    cancelled: 'bg-graphite-600 text-muted-foreground border-white/10',
    pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg[status] ?? cfg.pending}`}>
      {status}
    </span>
  )
}

export default function AdminSubscriptionsPage() {
  const [hydrated, setHydrated] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAssign, setShowAssign] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [extendTarget, setExtendTarget] = useState<any>(null)
  const [extendDays, setExtendDays] = useState('30')
  const router = useRouter()
  const qc = useQueryClient()

  useEffect(() => setHydrated(true), [])

  const { data: subsData, isLoading } = useQuery({
    queryKey: ['subscriptions', statusFilter],
    queryFn: () => apiClient.get('/subscriptions', {
      params: { per_page: 100, status: statusFilter !== 'all' ? statusFilter : undefined }
    }).then(r => r.data),
  })

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionsApi.plans().then(r => r.data),
    enabled: showAssign,
  })

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => apiClient.get('/clients', { params: { per_page: 200 } }).then(r => r.data),
    enabled: showAssign,
  })

  const subs: any[] = subsData?.data ?? []
  const plans: any[] = plansData?.data ?? plansData ?? []
  const clients: any[] = clientsData?.data ?? []

  const filtered = subs.filter(s => {
    const name = `${s.user?.first_name ?? ''} ${s.user?.last_name ?? ''} ${s.plan?.name ?? ''}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  const assignSub = useMutation({
    mutationFn: () => subscriptionsApi.assign(Number(selectedClientId), { plan_id: Number(selectedPlanId) }),
    onSuccess: () => {
      toast.success('Subscription assigned')
      setShowAssign(false)
      setSelectedClientId('')
      setSelectedPlanId('')
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
    },
    onError: () => toast.error('Failed to assign subscription'),
  })

  const extendSub = useMutation({
    mutationFn: () => subscriptionsApi.extend(extendTarget.id, { days: Number(extendDays) }),
    onSuccess: () => {
      toast.success(`Extended by ${extendDays} days`)
      setExtendTarget(null)
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
    },
    onError: () => toast.error('Failed to extend subscription'),
  })

  const deductSession = useMutation({
    mutationFn: (subId: number) => subscriptionsApi.deductSession(subId),
    onSuccess: () => {
      toast.success('Session deducted')
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
    },
    onError: () => toast.error('Failed to deduct session'),
  })

  const cancelSub = useMutation({
    mutationFn: (subId: number) => subscriptionsApi.cancel(subId),
    onSuccess: () => {
      toast.success('Subscription cancelled')
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
    },
    onError: () => toast.error('Failed to cancel subscription'),
  })

  if (!hydrated) return null

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">{subs.filter(s => s.status === 'active').length} active subscriptions</p>
        </div>
        <button onClick={() => setShowAssign(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all neon-glow-purple text-sm">
          <Plus className="w-4 h-4" /> Assign Subscription
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active', value: subs.filter(s => s.status === 'active').length, color: 'text-green-400' },
          { label: 'Expired', value: subs.filter(s => s.status === 'expired').length, color: 'text-red-400' },
          { label: 'Cancelled', value: subs.filter(s => s.status === 'cancelled').length, color: 'text-muted-foreground' },
          { label: 'Total Revenue', value: `$${subs.reduce((a, s) => a + Number(s.price_paid ?? 0), 0).toFixed(0)}`, color: 'text-cyan-400' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 border border-white/5">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by client or plan..."
            className="w-full pl-10 pr-4 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50 transition-colors" />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'expired', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                statusFilter === s
                  ? 'bg-graphite-600 text-foreground border border-white/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Client', 'Plan', 'Status', 'Expires', 'Sessions', 'Paid', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-graphite-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No subscriptions found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((sub, i) => (
                  <motion.tr key={sub.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-graphite-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <button onClick={() => router.push(`/admin/clients/${sub.user_id}`)}
                        className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                          {sub.user?.first_name?.[0]}{sub.user?.last_name?.[0]}
                        </div>
                        <span className="font-medium">{sub.user?.first_name} {sub.user?.last_name}</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.plan?.color ?? '#6366F1' }} />
                        <span>{sub.plan?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={sub.status} /></td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {sub.expires_at ? format(new Date(sub.expires_at), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {sub.sessions_remaining != null
                        ? <span className={`font-semibold ${sub.sessions_remaining === 0 ? 'text-red-400' : 'text-cyan-400'}`}>{sub.sessions_remaining}</span>
                        : <span className="text-muted-foreground">∞</span>}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">${sub.price_paid}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        {sub.status === 'active' && (
                          <>
                            <button onClick={() => { setExtendTarget(sub); setExtendDays('30') }}
                              title="Extend"
                              className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center hover:bg-cyan-500/20 transition-colors">
                              <CalendarClock className="w-3.5 h-3.5 text-cyan-400" />
                            </button>
                            <button onClick={() => deductSession.mutate(sub.id)}
                              title="Deduct session"
                              className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center hover:bg-orange-500/20 transition-colors">
                              <Dumbbell className="w-3.5 h-3.5 text-orange-400" />
                            </button>
                            <button onClick={() => {
                              if (confirm('Cancel this subscription?')) cancelSub.mutate(sub.id)
                            }}
                              title="Cancel"
                              className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Assign Sub Modal */}
      <AnimatePresence>
        {showAssign && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowAssign(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 border border-white/10 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">Assign Subscription</h3>
                <button onClick={() => setShowAssign(false)} className="w-8 h-8 rounded-lg bg-graphite-700 flex items-center justify-center hover:bg-graphite-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Client</label>
                  <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50">
                    <option value="">Select a client...</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.phone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Plan</label>
                  <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50">
                    <option value="">Select a plan...</option>
                    {plans.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} — ${p.price} / {p.duration_days}d</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button onClick={() => setShowAssign(false)}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={() => assignSub.mutate()} disabled={!selectedClientId || !selectedPlanId || assignSub.isPending}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                    Assign
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extend Modal */}
      <AnimatePresence>
        {extendTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setExtendTarget(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 border border-white/10 w-full max-w-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">Extend Subscription</h3>
                <button onClick={() => setExtendTarget(null)} className="w-8 h-8 rounded-lg bg-graphite-700 flex items-center justify-center hover:bg-graphite-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Extending subscription for <span className="text-foreground font-medium">{extendTarget.user?.first_name} {extendTarget.user?.last_name}</span>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Number of Days</label>
                  <input type="number" min="1" max="365" value={extendDays} onChange={e => setExtendDays(e.target.value)}
                    className="w-full px-3 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setExtendTarget(null)}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={() => extendSub.mutate()} disabled={!extendDays || extendSub.isPending}
                    className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-xl text-sm hover:bg-cyan-500 disabled:opacity-50 transition-all">
                    Extend {extendDays}d
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
