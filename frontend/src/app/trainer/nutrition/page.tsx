'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { nutritionApi } from '@/lib/api/nutrition'
import apiClient from '@/lib/api/client'
import { toast } from 'sonner'
import { Apple, Plus, User, Flame, X, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const STATUS_COLORS: Record<string, string> = {
  active:    'text-green-400 bg-green-500/10 border-green-500/20',
  draft:     'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  completed: 'text-muted-foreground bg-graphite-700/50 border-white/5',
}

export default function TrainerNutritionPage() {
  const qc = useQueryClient()
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ client_id: '', title: '', description: '', daily_calories: '', protein_g: '', carbs_g: '', fats_g: '', status: 'active' })

  const { data, isLoading } = useQuery({
    queryKey: ['nutrition-plans'],
    queryFn: () => nutritionApi.list().then(r => r.data),
  })
  const { data: clientsData } = useQuery({
    queryKey: ['trainer-clients'],
    queryFn: () => apiClient.get('/my-clients').then(r => r.data),
    enabled: showCreate,
  })

  const plans: any[] = data?.data ?? []
  const clients: any[] = clientsData?.data ?? []

  const createPlan = useMutation({
    mutationFn: () => nutritionApi.create({
      client_id: Number(form.client_id),
      title: form.title,
      description: form.description || undefined,
      daily_calories: form.daily_calories ? Number(form.daily_calories) : undefined,
      protein_g: form.protein_g ? Number(form.protein_g) : undefined,
      carbs_g: form.carbs_g ? Number(form.carbs_g) : undefined,
      fats_g: form.fats_g ? Number(form.fats_g) : undefined,
      status: form.status,
    }),
    onSuccess: (res: any) => {
      toast.success('Nutrition plan created')
      setShowCreate(false)
      setForm({ client_id: '', title: '', description: '', daily_calories: '', protein_g: '', carbs_g: '', fats_g: '', status: 'active' })
      qc.invalidateQueries({ queryKey: ['nutrition-plans'] })
      router.push(`/trainer/nutrition/${res.data.id}`)
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to create plan'),
  })

  const deletePlan = useMutation({
    mutationFn: (id: number) => nutritionApi.delete(id),
    onSuccess: () => { toast.success('Plan deleted'); qc.invalidateQueries({ queryKey: ['nutrition-plans'] }) },
  })

  const inputClass = "w-full bg-graphite-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Nutrition Plans</h1>
          <p className="text-muted-foreground mt-1">Design and assign meal programs for your clients</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> New Plan
        </motion.button>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-5 border border-white/5 animate-pulse space-y-3">
              <div className="h-5 bg-graphite-700 rounded w-3/4" />
              <div className="h-3 bg-graphite-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card p-12 border border-white/5 text-center">
          <Apple className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No nutrition plans yet</p>
          <button onClick={() => setShowCreate(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all">
            Create First Plan
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan: any, i: number) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5 border border-white/5 hover:border-cyan-500/20 transition-all group relative">
              <button onClick={() => deletePlan.mutate(plan.id)}
                className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all z-10">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
              <a href={`/trainer/nutrition/${plan.id}`} className="block pr-8">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold leading-snug hover:text-cyan-400 transition-colors">{plan.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLORS[plan.status] ?? STATUS_COLORS.draft}`}>
                    {plan.status}
                  </span>
                </div>
                {plan.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>}
                <div className="space-y-1.5">
                  {plan.daily_calories && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span className="text-muted-foreground">{plan.daily_calories} kcal/day</span>
                    </div>
                  )}
                  {(plan.protein_g || plan.carbs_g || plan.fats_g) && (
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {plan.protein_g && <span>P: <span className="text-blue-400">{plan.protein_g}g</span></span>}
                      {plan.carbs_g && <span>C: <span className="text-yellow-400">{plan.carbs_g}g</span></span>}
                      {plan.fats_g && <span>F: <span className="text-red-400">{plan.fats_g}g</span></span>}
                    </div>
                  )}
                  {plan.meals && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Apple className="w-3 h-3" /> {plan.meals.length} meal{plan.meals.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  {plan.client && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 pt-2 border-t border-white/5">
                      <User className="w-3 h-3" /> {plan.client.first_name} {plan.client.last_name}
                    </div>
                  )}
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Apple className="w-5 h-5 text-green-400" /> New Nutrition Plan
                </h2>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg bg-graphite-700 flex items-center justify-center hover:bg-graphite-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Client *</label>
                  <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className={inputClass}>
                    <option value="">Select client…</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Plan Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className={inputClass} placeholder="e.g. Bulking Plan 3000kcal" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className={inputClass + ' resize-none'} rows={2} placeholder="Optional…" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Daily Calories (kcal)</label>
                  <input type="number" value={form.daily_calories} onChange={e => setForm({ ...form, daily_calories: e.target.value })}
                    className={inputClass} placeholder="e.g. 2500" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Protein (g)</label>
                    <input type="number" value={form.protein_g} onChange={e => setForm({ ...form, protein_g: e.target.value })} className={inputClass} placeholder="150" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Carbs (g)</label>
                    <input type="number" value={form.carbs_g} onChange={e => setForm({ ...form, carbs_g: e.target.value })} className={inputClass} placeholder="250" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Fats (g)</label>
                    <input type="number" value={form.fats_g} onChange={e => setForm({ ...form, fats_g: e.target.value })} className={inputClass} placeholder="70" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputClass}>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                  <button onClick={() => createPlan.mutate()} disabled={createPlan.isPending || !form.client_id || !form.title}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                    {createPlan.isPending ? 'Creating…' : 'Create Plan'}
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
