'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePresence, usePresenceMutation } from '@/lib/hooks/usePresence'
import { usePresenceStore } from '@/lib/stores/presence'
import { useSocket } from '@/lib/hooks/useSocket'
import { Radio, Search, LogOut, LogIn, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function PresencePage() {
  const [search, setSearch] = useState('')
  const { isLoading } = usePresence()
  const clients = usePresenceStore(s => s.clientsInGym)
  const count   = usePresenceStore(s => s.count)
  const { enter, leave } = usePresenceMutation()
  useSocket()

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  const handleLeave = async (clientId: number, name: string) => {
    await leave.mutateAsync(clientId)
    toast.success(`${name} marked as left`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold gradient-text">Gym Presence</h1>
            <motion.div animate={{ scale: [1,1.1,1] }} transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/20 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-400">Live</span>
            </motion.div>
          </div>
          <p className="text-muted-foreground mt-1">{count} client{count !== 1 ? 's' : ''} currently in the gym</p>
        </div>
        <div className="flex items-center gap-2 bg-graphite-700 border border-white/8 rounded-xl px-4 py-2.5 w-64">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none flex-1" />
        </div>
      </motion.div>

      {/* Grid */}
      {!isLoading && filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
          <Radio className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-xl font-semibold text-muted-foreground">No clients in gym</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Scan a QR code or manually check in a client</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence initial={false}>
            {filtered.map((client, i) => (
              <motion.div key={client.id}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="glass-card p-5 border border-green-500/15 hover:border-green-500/30 transition-all group"
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center text-lg font-bold text-white">
                      {client.first_name?.[0]}{client.last_name?.[0]}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-graphite-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{client.first_name} {client.last_name}</p>
                    {client.trainer && <p className="text-xs text-muted-foreground truncate">Trainer: {client.trainer.first_name}</p>}
                  </div>
                </div>

                {/* Time in gym */}
                <div className="mb-4 bg-green-500/10 rounded-xl px-3 py-2">
                  <p className="text-xs text-muted-foreground">In gym for</p>
                  <p className="text-sm font-semibold text-green-400">
                    {client.gym_entered_at ? formatDistanceToNow(new Date(client.gym_entered_at)) : '—'}
                  </p>
                </div>

                {/* Subscription badge */}
                {client.active_subscription && (
                  <div className="mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: client.active_subscription.plan?.color ?? '#6366F1' }} />
                    <span className="text-xs text-muted-foreground">{client.active_subscription.plan?.name}</span>
                  </div>
                )}

                {/* Leave button */}
                <button onClick={() => handleLeave(client.id, `${client.first_name} ${client.last_name}`)}
                  disabled={leave.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Mark as Left
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
