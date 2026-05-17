'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { nutritionApi } from '@/lib/api/nutrition'
import { toast } from 'sonner'
import { ArrowLeft, Apple, Plus, Trash2, X, Flame, User, Edit2, Check } from 'lucide-react'

const inputClass = "w-full bg-graphite-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"

const TIME_OPTIONS = ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack', 'Pre-workout', 'Post-workout']

export default function NutritionPlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const planId = Number(params.id)

  const [showAddMeal, setShowAddMeal] = useState(false)
  const [mealForm, setMealForm] = useState({ name: '', time_of_day: '', calories: '', protein_g: '', carbs_g: '', fats_g: '', notes: '' })
  const [editingMacros, setEditingMacros] = useState(false)
  const [macroForm, setMacroForm] = useState({ daily_calories: '', protein_g: '', carbs_g: '', fats_g: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['nutrition-plan', planId],
    queryFn: () => nutritionApi.get(planId).then(r => r.data),
    enabled: !!planId,
  })

  const plan = data?.data ?? data

  const addMeal = useMutation({
    mutationFn: () => nutritionApi.addMeal(planId, {
      ...mealForm,
      calories: mealForm.calories ? Number(mealForm.calories) : undefined,
      protein_g: mealForm.protein_g ? Number(mealForm.protein_g) : undefined,
      carbs_g: mealForm.carbs_g ? Number(mealForm.carbs_g) : undefined,
      fats_g: mealForm.fats_g ? Number(mealForm.fats_g) : undefined,
    }),
    onSuccess: () => {
      toast.success('Meal added')
      setShowAddMeal(false)
      setMealForm({ name: '', time_of_day: '', calories: '', protein_g: '', carbs_g: '', fats_g: '', notes: '' })
      qc.invalidateQueries({ queryKey: ['nutrition-plan', planId] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  })

  const deleteMeal = useMutation({
    mutationFn: (mealId: number) => nutritionApi.deleteMeal(mealId),
    onSuccess: () => { toast.success('Meal deleted'); qc.invalidateQueries({ queryKey: ['nutrition-plan', planId] }) },
  })

  const updateMacros = useMutation({
    mutationFn: () => nutritionApi.update(planId, {
      daily_calories: macroForm.daily_calories ? Number(macroForm.daily_calories) : undefined,
      protein_g: macroForm.protein_g ? Number(macroForm.protein_g) : undefined,
      carbs_g: macroForm.carbs_g ? Number(macroForm.carbs_g) : undefined,
      fats_g: macroForm.fats_g ? Number(macroForm.fats_g) : undefined,
    }),
    onSuccess: () => { toast.success('Macros updated'); setEditingMacros(false); qc.invalidateQueries({ queryKey: ['nutrition-plan', planId] }) },
  })

  const updateStatus = useMutation({
    mutationFn: (status: string) => nutritionApi.update(planId, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['nutrition-plan', planId] }) },
  })

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-8 bg-graphite-700 rounded w-48 animate-pulse" />
      <div className="glass-card p-6 border border-white/5 h-40 animate-pulse" />
    </div>
  )

  if (!plan) return <div className="text-center py-20 text-muted-foreground">Plan not found</div>

  const meals: any[] = plan.meals ?? []
  const totalCals = meals.reduce((s: number, m: any) => s + (m.calories ?? 0), 0)
  const totalProtein = meals.reduce((s: number, m: any) => s + (m.protein_g ?? 0), 0)
  const totalCarbs = meals.reduce((s: number, m: any) => s + (m.carbs_g ?? 0), 0)
  const totalFats = meals.reduce((s: number, m: any) => s + (m.fats_g ?? 0), 0)

  const startEdit = () => {
    setMacroForm({
      daily_calories: plan.daily_calories?.toString() ?? '',
      protein_g: plan.protein_g?.toString() ?? '',
      carbs_g: plan.carbs_g?.toString() ?? '',
      fats_g: plan.fats_g?.toString() ?? '',
    })
    setEditingMacros(true)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <button onClick={() => router.push('/trainer/nutrition')}
          className="w-9 h-9 rounded-xl bg-graphite-700 border border-white/8 flex items-center justify-center hover:bg-graphite-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{plan.title}</h1>
          {plan.client && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3" /> {plan.client.first_name} {plan.client.last_name}
            </p>
          )}
        </div>
        <select value={plan.status} onChange={e => updateStatus.mutate(e.target.value)}
          className="px-3 py-1.5 bg-graphite-800 border border-white/8 rounded-xl text-xs focus:outline-none focus:border-cyan-500/50">
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </motion.div>

      {/* Macros overview card */}
      <div className="glass-card p-5 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" /> Daily Targets</h2>
          {!editingMacros ? (
            <button onClick={startEdit} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditingMacros(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={() => updateMacros.mutate()} disabled={updateMacros.isPending}
                className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300">
                <Check className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          )}
        </div>
        {editingMacros ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Calories (kcal)', key: 'daily_calories' },
              { label: 'Protein (g)', key: 'protein_g' },
              { label: 'Carbs (g)', key: 'carbs_g' },
              { label: 'Fats (g)', key: 'fats_g' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                <input type="number" value={(macroForm as any)[f.key]}
                  onChange={e => setMacroForm({ ...macroForm, [f.key]: e.target.value })}
                  className={inputClass} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Calories', value: plan.daily_calories ? `${plan.daily_calories} kcal` : '—', color: 'text-orange-400' },
              { label: 'Protein', value: plan.protein_g ? `${plan.protein_g}g` : '—', color: 'text-blue-400' },
              { label: 'Carbs', value: plan.carbs_g ? `${plan.carbs_g}g` : '—', color: 'text-yellow-400' },
              { label: 'Fats', value: plan.fats_g ? `${plan.fats_g}g` : '—', color: 'text-red-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-graphite-700/40 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {meals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-muted-foreground mb-2">From meals:</p>
            <div className="flex gap-4 text-xs">
              {totalCals > 0 && <span className="text-orange-400">{totalCals} kcal</span>}
              {totalProtein > 0 && <span className="text-blue-400">P: {totalProtein.toFixed(0)}g</span>}
              {totalCarbs > 0 && <span className="text-yellow-400">C: {totalCarbs.toFixed(0)}g</span>}
              {totalFats > 0 && <span className="text-red-400">F: {totalFats.toFixed(0)}g</span>}
            </div>
          </div>
        )}
      </div>

      {/* Meals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Meals <span className="text-muted-foreground text-sm font-normal ml-1">({meals.length})</span></h2>
          <button onClick={() => setShowAddMeal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Meal
          </button>
        </div>

        {meals.length === 0 && !showAddMeal && (
          <div className="glass-card p-10 text-center border border-white/5 border-dashed">
            <Apple className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No meals yet — add the first one</p>
          </div>
        )}

        <div className="space-y-2">
          {meals.sort((a: any, b: any) => (a.order ?? 99) - (b.order ?? 99)).map((meal: any) => (
            <motion.div key={meal.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card p-4 border border-white/5 flex items-start justify-between gap-3 group">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{meal.name}</p>
                  {meal.time_of_day && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-graphite-700 text-muted-foreground">{meal.time_of_day}</span>
                  )}
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {meal.calories && <span className="text-orange-400">{meal.calories} kcal</span>}
                  {meal.protein_g && <span className="text-blue-400">P: {meal.protein_g}g</span>}
                  {meal.carbs_g && <span className="text-yellow-400">C: {meal.carbs_g}g</span>}
                  {meal.fats_g && <span className="text-red-400">F: {meal.fats_g}g</span>}
                </div>
                {meal.notes && <p className="text-xs text-muted-foreground mt-1 italic">{meal.notes}</p>}
              </div>
              <button onClick={() => deleteMeal.mutate(meal.id)}
                className="w-7 h-7 rounded-lg bg-red-500/0 group-hover:bg-red-500/10 border border-transparent group-hover:border-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Add Meal Form */}
        <AnimatePresence>
          {showAddMeal && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-card p-5 border border-cyan-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">New Meal</p>
                <button onClick={() => setShowAddMeal(false)}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Meal Name *</label>
                  <input value={mealForm.name} onChange={e => setMealForm({ ...mealForm, name: e.target.value })}
                    className={inputClass} placeholder="e.g. Grilled chicken + rice" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Time of Day</label>
                  <select value={mealForm.time_of_day} onChange={e => setMealForm({ ...mealForm, time_of_day: e.target.value })} className={inputClass}>
                    <option value="">Choose…</option>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Calories (kcal)</label>
                  <input type="number" value={mealForm.calories} onChange={e => setMealForm({ ...mealForm, calories: e.target.value })} className={inputClass} placeholder="500" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Protein (g)</label>
                  <input type="number" value={mealForm.protein_g} onChange={e => setMealForm({ ...mealForm, protein_g: e.target.value })} className={inputClass} placeholder="40" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Carbs (g)</label>
                  <input type="number" value={mealForm.carbs_g} onChange={e => setMealForm({ ...mealForm, carbs_g: e.target.value })} className={inputClass} placeholder="60" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fats (g)</label>
                  <input type="number" value={mealForm.fats_g} onChange={e => setMealForm({ ...mealForm, fats_g: e.target.value })} className={inputClass} placeholder="15" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                  <input value={mealForm.notes} onChange={e => setMealForm({ ...mealForm, notes: e.target.value })}
                    className={inputClass} placeholder="Optional notes…" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddMeal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                <button onClick={() => addMeal.mutate()} disabled={!mealForm.name || addMeal.isPending}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
                  {addMeal.isPending ? 'Adding…' : 'Add Meal'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
