'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import apiClient from '@/lib/api/client'
import { Apple, ChevronDown, ChevronUp, Flame, Beef, Wheat } from 'lucide-react'

export default function ClientNutritionPage() {
  const [openPlan, setOpenPlan] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-nutrition'],
    queryFn: () => apiClient.get('/my/nutrition').then(r => r.data),
  })

  const plans: any[] = data?.data ?? []

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">My Nutrition</h1>
        <p className="text-muted-foreground mt-1">{plans.length} nutrition plans from your trainer</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({length:2}).map((_,i) => <div key={i} className="glass-card p-5 h-20 animate-pulse border border-white/5" />)}</div>
      ) : plans.length === 0 ? (
        <div className="glass-card p-16 text-center border border-white/5">
          <Apple className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">No Nutrition Plans Yet</p>
          <p className="text-sm text-muted-foreground">Your trainer hasn't assigned any nutrition plans yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan: any, i: number) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card border border-white/5 overflow-hidden">
              <button onClick={() => setOpenPlan(openPlan === plan.id ? null : plan.id)}
                className="w-full px-6 py-5 flex items-center gap-4 hover:bg-graphite-700/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                  <Apple className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{plan.title ?? plan.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {plan.daily_calories && (
                      <span className="flex items-center gap-1 text-xs text-orange-400">
                        <Flame className="w-3 h-3" /> {plan.daily_calories} kcal
                      </span>
                    )}
                    {plan.protein_g && <span className="text-xs text-blue-400">{plan.protein_g}g protein</span>}
                    {plan.carbs_g && <span className="text-xs text-green-400">{plan.carbs_g}g carbs</span>}
                    {plan.fats_g && <span className="text-xs text-yellow-400">{plan.fats_g}g fats</span>}
                  </div>
                </div>
                {openPlan === plan.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {openPlan === plan.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="border-t border-white/5 px-6 pb-6 pt-4 space-y-4">
                      {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}

                      {/* Macro summary */}
                      {(plan.protein_g || plan.carbs_g || plan.fats_g) && (
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Protein', value: plan.protein_g, unit: 'g', color: 'text-blue-400', icon: Beef },
                            { label: 'Carbs', value: plan.carbs_g, unit: 'g', color: 'text-green-400', icon: Wheat },
                            { label: 'Fats', value: plan.fats_g, unit: 'g', color: 'text-yellow-400', icon: Flame },
                          ].map(macro => macro.value && (
                            <div key={macro.label} className="bg-graphite-700/40 rounded-xl p-3 text-center">
                              <p className={`text-xl font-bold ${macro.color}`}>{macro.value}{macro.unit}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{macro.label}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Meals */}
                      {(plan.meals ?? []).map((meal: any, mi: number) => (
                        <div key={meal.id ?? mi} className="bg-graphite-700/40 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm">{meal.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {(meal.time_of_day ?? meal.time) && <span>{meal.time_of_day ?? meal.time}</span>}
                              {meal.calories && <span className="flex items-center gap-1 text-orange-400"><Flame className="w-3 h-3" />{meal.calories}</span>}
                            </div>
                          </div>
                          {meal.description && <p className="text-xs text-muted-foreground">{meal.description}</p>}
                          {(meal.protein_g || meal.carbs_g || meal.fats_g) && (
                            <div className="flex gap-3 mt-2 text-xs">
                              {meal.protein_g && <span className="text-blue-400">{meal.protein_g}g P</span>}
                              {meal.carbs_g && <span className="text-green-400">{meal.carbs_g}g C</span>}
                              {meal.fats_g && <span className="text-yellow-400">{meal.fats_g}g F</span>}
                            </div>
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
