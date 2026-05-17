'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import apiClient from '@/lib/api/client'
import { Users, Search, Radio } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'

export default function TrainerClientsPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['trainer-clients'],
    queryFn: () => apiClient.get('/my-clients').then(r => r.data),
  })

  const clients: any[] = data?.data ?? []

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">My Clients</h1>
        <p className="text-muted-foreground mt-1">Manage and track your assigned clients</p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Clients', value: clients.length, color: 'cyan' },
          { label: 'In Gym Now', value: clients.filter(c => c.is_in_gym).length, color: 'green' },
          { label: 'Active Subs', value: clients.filter(c => c.active_subscription).length, color: 'purple' },
          { label: 'No Subscription', value: clients.filter(c => !c.active_subscription).length, color: 'orange' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="glass-card p-4 border border-white/5"
          >
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Client list */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card p-5 border border-white/5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-graphite-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-graphite-700 rounded w-3/4" />
                    <div className="h-3 bg-graphite-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 border border-white/5 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{search ? 'No clients match your search' : 'No clients assigned yet'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((client, i) => (
              <motion.a
                key={client.id}
                href={`/trainer/clients/${client.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -2 }}
                className="glass-card p-5 border border-white/5 hover:border-cyan-500/20 transition-all block"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {client.first_name?.[0]}{client.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{client.first_name} {client.last_name}</p>
                      {client.is_in_gym && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <Radio className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{client.phone}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                  {client.active_subscription ? (
                    <div>
                      <p className="text-xs text-cyan-400 font-medium">{client.active_subscription.plan?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Expires {format(new Date(client.active_subscription.expires_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-orange-400">No active subscription</p>
                  )}
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
