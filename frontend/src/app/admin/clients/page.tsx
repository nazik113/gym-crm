'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import apiClient from '@/lib/api/client'
import { Search, Users, Plus, Radio, CreditCard } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminClientsPage() {
  const [hydrated, setHydrated] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => setHydrated(true), [])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: () => apiClient.get('/clients', { params: { per_page: 100 } }).then(r => r.data),
  })

  const clients: any[] = data?.data ?? []

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  )

  if (!hydrated) return null

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Clients</h1>
          <p className="text-muted-foreground mt-1">{clients.length} total members</p>
        </div>
        <a href="/admin/codes"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all neon-glow-purple text-sm">
          <Plus className="w-4 h-4" /> Invite Client
        </a>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: clients.length, color: 'text-purple-400' },
          { label: 'In Gym Now', value: clients.filter(c => c.is_in_gym).length, color: 'text-green-400' },
          { label: 'Active Subs', value: clients.filter(c => c.active_subscription).length, color: 'text-cyan-400' },
          { label: 'No Sub', value: clients.filter(c => !c.active_subscription).length, color: 'text-orange-400' },
        ].map((s, i) => (
          <div key={s.label} className="glass-card p-4 border border-white/5">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50 transition-colors" />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trainer</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subscription</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-graphite-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">{search ? 'No clients match your search' : 'No clients yet'}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((client, i) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => router.push(`/admin/clients/${client.id}`)}
                    className="border-b border-white/5 hover:bg-graphite-700/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {client.first_name?.[0]}{client.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold group-hover:text-cyan-400 transition-colors">
                            {client.first_name} {client.last_name}
                          </p>
                          {client.is_in_gym && (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <Radio className="w-2.5 h-2.5" /> In gym
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{client.phone}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {client.trainer ? `${client.trainer.first_name} ${client.trainer.last_name}` : <span className="text-graphite-500">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {client.active_subscription ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: client.active_subscription.plan?.color ?? '#6366F1' }} />
                          <span className="text-xs">{client.active_subscription.plan?.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-orange-400 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" /> No sub
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.is_active
                          ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                          : 'bg-red-500/15 text-red-400 border border-red-500/20'
                      }`}>
                        {client.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {client.created_at ? format(new Date(client.created_at), 'MMM d, yyyy') : '—'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
