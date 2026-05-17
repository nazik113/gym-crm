'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import apiClient from '@/lib/api/client'
import { Dumbbell, ChevronDown, ChevronUp, Calendar, Repeat } from 'lucide-react'

export default function ClientWorkoutsPage() {
  const [openPlan, setOpenPlan] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-workouts'],
    queryFn: () => apiClient.get('/my/workouts').then(r => r.data),
  })

  const plans: any[] = data?.data ?? []

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">My Workouts</h1>
        <p className="text-muted-foreground mt-1">{plans.length} workout plans from your trainer</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({length:3}).map((_,i) => <div key={i} className="glass-card p-5 h-20 animate-pulse border border-white/5" />)}</div>
      ) : plans.length === 0 ? (
        <div className="glass-card p-16 text-center border border-white/5">
          <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">No Workout Plans Yet</p>
          <p className="text-sm text-muted-foreground">Your trainer hasn't assigned any workout plans yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan: any, i: number) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card border border-white/5 overflow-hidden">
              <button onClick={() => setOpenPlan(openPlan === plan.id ? null : plan.id)}
                className="w-full px-6 py-5 flex items-center gap-4 hover:bg-graphite-700/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{plan.title ?? plan.name}</p>
                  <p className="text-xs text-muted-foreground">{plan.days?.length ?? 0} training days · {plan.goal ?? 'General fitness'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {plan.starts_at} – {plan.ends_at ?? 'ongoing'}
                  </span>
                  {openPlan === plan.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              <AnimatePresence>
                {openPlan === plan.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="border-t border-white/5 px-6 pb-6 pt-4 space-y-4">
                      {plan.description && (
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      )}
                      {(plan.days ?? []).map((day: any, di: number) => (
                        <div key={day.id ?? di} className="bg-graphite-700/40 rounded-xl p-4">
                          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                            Day {day.day_number}: {day.name ?? day.focus ?? 'Training Day'}
                          </h4>
                          {(day.exercises ?? []).length > 0 ? (
                            <div className="space-y-2">
                              {day.exercises.map((ex: any, ei: number) => (
                                <div key={ex.id ?? ei} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 text-sm">
                                  <span className="font-medium">{ex.name}</span>
                                  <div className="flex items-center gap-3 text-muted-foreground text-xs">
                                    {ex.sets && ex.reps && (
                                      <span className="flex items-center gap-1">
                                        <Repeat className="w-3 h-3" /> {ex.sets}×{ex.reps}
                                      </span>
                                    )}
                                    {ex.weight_kg && <span>{ex.weight_kg}kg</span>}
                                    {ex.duration_minutes && <span>{ex.duration_minutes}min</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No exercises added yet</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
