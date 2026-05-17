'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import apiClient from '@/lib/api/client'
import { useAuthStore } from '@/lib/stores/auth'
import { BarChart3, Users, Dumbbell, Calendar, TrendingUp } from 'lucide-react'

export default function TrainerStatsPage() {
  const user = useAuthStore(s => s.user)

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['trainer-clients-stats'],
    queryFn: () => apiClient.get('/my-clients').then(r => r.data),
  })

  const { data: workoutsData, isLoading: workoutsLoading } = useQuery({
    queryKey: ['trainer-workouts-stats'],
    queryFn: () => apiClient.get('/workout-plans').then(r => r.data),
  })

  const { data: nutritionData, isLoading: nutritionLoading } = useQuery({
    queryKey: ['trainer-nutrition-stats'],
    queryFn: () => apiClient.get('/nutrition-plans').then(r => r.data),
  })

  const clients: any[]   = clientsData?.data ?? []
  const workouts: any[]  = workoutsData?.data ?? (Array.isArray(workoutsData) ? workoutsData : [])
  const nutrition: any[] = nutritionData?.data ?? (Array.isArray(nutritionData) ? nutritionData : [])
  const isLoading = clientsLoading || workoutsLoading || nutritionLoading

  const stats = [
    { label: 'Total Clients',        value: clients.length,                                          icon: Users,    color: 'cyan'   },
    { label: 'Active Workout Plans', value: workouts.filter(w => w.status === 'active').length,      icon: Dumbbell, color: 'purple' },
    { label: 'Active Nutrition Plans',value: nutrition.filter(n => n.status === 'active').length,    icon: Calendar, color: 'green'  },
    { label: 'Clients In Gym',       value: clients.filter(c => c.is_in_gym).length,                 icon: TrendingUp,color:'orange' },
  ]

  const COLOR_MAP: Record<string, string> = {
    cyan:   'from-cyan-500 to-cyan-700',
    purple: 'from-purple-500 to-purple-700',
    green:  'from-green-500 to-green-700',
    orange: 'from-orange-500 to-orange-700',
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">My Statistics</h1>
        <p className="text-muted-foreground mt-1">Overview of your training activity</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5 border border-white/5"
          >
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-graphite-700" />
                <div className="h-7 bg-graphite-700 rounded w-1/2" />
                <div className="h-3 bg-graphite-700 rounded w-3/4" />
              </div>
            ) : (
              <>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLOR_MAP[stat.color]} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Client breakdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-6 border border-white/5">
        <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          Client Overview
        </h2>

        {clientsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-graphite-700" />
                <div className="flex-1 h-3 bg-graphite-700 rounded" />
                <div className="w-16 h-3 bg-graphite-700 rounded" />
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <p className="text-muted-foreground text-sm">No clients assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {clients.map((client: any, i: number) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-graphite-700/40 hover:bg-graphite-700/60 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {client.first_name?.[0]}{client.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{client.first_name} {client.last_name}</p>
                  <p className="text-xs text-muted-foreground">{client.active_subscription?.plan?.name ?? 'No subscription'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {client.is_in_gym && (
                    <span className="w-2 h-2 rounded-full bg-green-500" title="In gym" />
                  )}
                  {!client.is_active && (
                    <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                      Inactive
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
