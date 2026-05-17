'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/lib/api/client'
import { StatCard } from '@/components/shared/StatCard'
import { StatCardSkeleton } from '@/components/shared/Skeleton'
import { Users, Dumbbell, Apple, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

export default function TrainerDashboard() {
  const user = useAuthStore(s => s.user)
  const { data, isLoading } = useQuery({
    queryKey: ['trainer-dashboard'],
    queryFn: () => api.get('/my-clients').then(r => r.data),
  })
  const clients = data?.data ?? []

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">Welcome, {user?.first_name} 👋</h1>
        <p className="text-muted-foreground mt-1">Manage your clients and training plans</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array.from({ length: 4 }).map((_,i) => <StatCardSkeleton key={i} />) : (
          <>
            <StatCard label="My Clients"      value={clients.length}                                icon={Users}       color="cyan"   delay={0}    />
            <StatCard label="Active Plans"     value={clients.filter((c:any) => c.workout_plans?.length).length} icon={Dumbbell} color="purple" delay={0.05} />
            <StatCard label="Nutrition Plans"  value={clients.filter((c:any) => c.nutrition_plans?.length).length} icon={Apple}  color="green"  delay={0.1}  />
            <StatCard label="This Month Sessions" value={0}                                         icon={TrendingUp}  color="orange" delay={0.15} />
          </>
        )}
      </div>

      {/* Client list */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-6 border border-white/5">
        <h2 className="text-lg font-semibold mb-5">My Clients</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {clients.map((c: any, i: number) => (
            <motion.a key={c.id} href={`/trainer/clients/${c.id}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-graphite-700/50 hover:bg-graphite-700 border border-white/5 hover:border-cyan-500/20 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {c.first_name?.[0]}{c.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{c.first_name} {c.last_name}</p>
                <p className="text-xs text-muted-foreground">{c.active_subscription?.plan?.name ?? 'No subscription'}</p>
              </div>
              {c.is_in_gym && <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />}
            </motion.a>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
