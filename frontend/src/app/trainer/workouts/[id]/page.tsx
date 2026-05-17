'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { workoutsApi } from '@/lib/api/workouts'
import { toast } from 'sonner'
import {
  ArrowLeft, Dumbbell, Plus, Trash2, X, ChevronDown, ChevronUp,
  User, Calendar, Repeat, Weight
} from 'lucide-react'

const inputClass = "w-full bg-graphite-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"

export default function WorkoutPlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const planId = Number(params.id)

  const [openDay, setOpenDay] = useState<number | null>(null)
  const [showAddDay, setShowAddDay] = useState(false)
  const [dayForm, setDayForm] = useState({ name: '', day_number: '1', muscle_groups: '', notes: '' })
  const [showAddExercise, setShowAddExercise] = useState<number | null>(null)
  const [exForm, setExForm] = useState({ name: '', sets: '', reps: '', weight_kg: '', rest_seconds: '', instructions: '', category: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['workout-plan', planId],
    queryFn: () => workoutsApi.get(planId).then(r => r.data),
    enabled: !!planId,
  })

  const plan = data?.data ?? data

  const addDay = useMutation({
    mutationFn: () => workoutsApi.addDay(planId, { ...dayForm, day_number: Number(dayForm.day_number) }),
    onSuccess: () => {
      toast.success('Day added')
      setShowAddDay(false)
      setDayForm({ name: '', day_number: '1', muscle_groups: '', notes: '' })
      qc.invalidateQueries({ queryKey: ['workout-plan', planId] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  })

  const deleteDay = useMutation({
    mutationFn: (dayId: number) => workoutsApi.deleteDay(dayId),
    onSuccess: () => { toast.success('Day deleted'); qc.invalidateQueries({ queryKey: ['workout-plan', planId] }) },
  })

  const addExercise = useMutation({
    mutationFn: (dayId: number) => workoutsApi.addExercise(dayId, {
      ...exForm,
      sets: exForm.sets ? Number(exForm.sets) : null,
      weight_kg: exForm.weight_kg ? Number(exForm.weight_kg) : null,
      rest_seconds: exForm.rest_seconds ? Number(exForm.rest_seconds) : null,
    }),
    onSuccess: () => {
      toast.success('Exercise added')
      setShowAddExercise(null)
      setExForm({ name: '', sets: '', reps: '', weight_kg: '', rest_seconds: '', instructions: '', category: '' })
      qc.invalidateQueries({ queryKey: ['workout-plan', planId] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  })

  const deleteExercise = useMutation({
    mutationFn: (exId: number) => workoutsApi.deleteExercise(exId),
    onSuccess: () => { toast.success('Exercise deleted'); qc.invalidateQueries({ queryKey: ['workout-plan', planId] }) },
  })

  const updateStatus = useMutation({
    mutationFn: (status: string) => workoutsApi.update(planId, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['workout-plan', planId] }) },
  })

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-8 bg-graphite-700 rounded w-48 animate-pulse" />
      <div className="glass-card p-6 border border-white/5 h-40 animate-pulse" />
    </div>
  )

  if (!plan) return <div className="text-center py-20 text-muted-foreground">Plan not found</div>

  const days: any[] = plan.days ?? []

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <button onClick={() => router.push('/trainer/workouts')}
          className="w-9 h-9 rounded-xl bg-graphite-700 border border-white/8 flex items-center justify-center hover:bg-graphite-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{plan.title}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-3 mt-0.5">
            {plan.client && <span className="flex items-center gap-1"><User className="w-3 h-3" />{plan.client.first_name} {plan.client.last_name}</span>}
            {plan.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{plan.start_date}{plan.end_date ? ` → ${plan.end_date}` : ''}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={plan.status} onChange={e => updateStatus.mutate(e.target.value)}
            className="px-3 py-1.5 bg-graphite-800 border border-white/8 rounded-xl text-xs focus:outline-none focus:border-cyan-500/50">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </motion.div>

      {/* Description */}
      {plan.description && (
        <div className="glass-card p-4 border border-white/5">
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>
      )}

      {/* Days */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Training Days <span className="text-muted-foreground text-sm font-normal ml-1">({days.length})</span></h2>
          <button onClick={() => setShowAddDay(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Day
          </button>
        </div>

        {days.length === 0 && !showAddDay && (
          <div className="glass-card p-10 text-center border border-white/5 border-dashed">
            <Dumbbell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No training days yet — add the first one</p>
          </div>
        )}

        {days.sort((a: any, b: any) => a.day_number - b.day_number).map((day: any) => (
          <motion.div key={day.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card border border-white/5 overflow-hidden">
            <button onClick={() => setOpenDay(openDay === day.id ? null : day.id)}
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-graphite-700/30 transition-colors text-left">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 flex items-center justify-center text-sm font-bold text-cyan-400 flex-shrink-0">
                {day.day_number}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{day.name}</p>
                {day.muscle_groups && <p className="text-xs text-muted-foreground">{day.muscle_groups}</p>}
              </div>
              <span className="text-xs text-muted-foreground">{(day.exercises ?? []).length} exercises</span>
              <button onClick={e => { e.stopPropagation(); deleteDay.mutate(day.id) }}
                className="w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-colors flex-shrink-0"
                title="Delete day">
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
              {openDay === day.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            <AnimatePresence>
              {openDay === day.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="border-t border-white/5 px-5 py-4 space-y-3">
                    {(day.exercises ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">No exercises yet</p>
                    ) : (
                      <div className="space-y-2">
                        {day.exercises.map((ex: any) => (
                          <div key={ex.id} className="flex items-center justify-between bg-graphite-700/40 rounded-xl px-4 py-3 group">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{ex.name}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                {ex.sets && ex.reps && <span className="flex items-center gap-1"><Repeat className="w-3 h-3" />{ex.sets}×{ex.reps}</span>}
                                {ex.weight_kg && <span className="flex items-center gap-1"><Weight className="w-3 h-3" />{ex.weight_kg}kg</span>}
                                {ex.rest_seconds && <span>{ex.rest_seconds}s rest</span>}
                                {ex.category && <span className="text-purple-400">{ex.category}</span>}
                              </div>
                              {ex.instructions && <p className="text-xs text-muted-foreground mt-1 italic">{ex.instructions}</p>}
                            </div>
                            <button onClick={() => deleteExercise.mutate(ex.id)}
                              className="w-7 h-7 rounded-lg bg-red-500/0 group-hover:bg-red-500/10 border border-transparent group-hover:border-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ml-2">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {showAddExercise === day.id ? (
                      <div className="bg-graphite-700/30 rounded-xl p-4 space-y-3 border border-white/8">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Exercise</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <input value={exForm.name} onChange={e => setExForm({ ...exForm, name: e.target.value })}
                              className={inputClass} placeholder="Exercise name *" />
                          </div>
                          <input value={exForm.category} onChange={e => setExForm({ ...exForm, category: e.target.value })}
                            className={inputClass} placeholder="Category (e.g. chest)" />
                          <input value={exForm.sets} onChange={e => setExForm({ ...exForm, sets: e.target.value })}
                            className={inputClass} placeholder="Sets" type="number" />
                          <input value={exForm.reps} onChange={e => setExForm({ ...exForm, reps: e.target.value })}
                            className={inputClass} placeholder="Reps (e.g. 8-12)" />
                          <input value={exForm.weight_kg} onChange={e => setExForm({ ...exForm, weight_kg: e.target.value })}
                            className={inputClass} placeholder="Weight (kg)" type="number" step="0.5" />
                          <input value={exForm.rest_seconds} onChange={e => setExForm({ ...exForm, rest_seconds: e.target.value })}
                            className={inputClass} placeholder="Rest (seconds)" type="number" />
                          <div className="col-span-2">
                            <input value={exForm.instructions} onChange={e => setExForm({ ...exForm, instructions: e.target.value })}
                              className={inputClass} placeholder="Instructions (optional)" />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { setShowAddExercise(null); setExForm({ name: '', sets: '', reps: '', weight_kg: '', rest_seconds: '', instructions: '', category: '' }) }}
                            className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                          <button onClick={() => addExercise.mutate(day.id)} disabled={!exForm.name || addExercise.isPending}
                            className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-semibold hover:bg-cyan-500 disabled:opacity-50 transition-colors">
                            Add Exercise
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowAddExercise(day.id)}
                        className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors py-1">
                        <Plus className="w-3.5 h-3.5" /> Add exercise
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Add Day Inline Form */}
        {showAddDay && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 border border-cyan-500/20 space-y-3">
            <p className="text-sm font-semibold">New Training Day</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Day Number</label>
                <input type="number" value={dayForm.day_number} onChange={e => setDayForm({ ...dayForm, day_number: e.target.value })}
                  className={inputClass} min="1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                <input value={dayForm.name} onChange={e => setDayForm({ ...dayForm, name: e.target.value })}
                  className={inputClass} placeholder="e.g. Chest & Triceps" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Muscle Groups</label>
                <input value={dayForm.muscle_groups} onChange={e => setDayForm({ ...dayForm, muscle_groups: e.target.value })}
                  className={inputClass} placeholder="e.g. chest, triceps, shoulders" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAddDay(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={() => addDay.mutate()} disabled={!dayForm.name || addDay.isPending}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
                {addDay.isPending ? 'Adding…' : 'Add Day'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
