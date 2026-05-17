'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { format, formatDistanceToNow } from 'date-fns'
import apiClient from '@/lib/api/client'
import { clientsApi } from '@/lib/api/clients'
import { workoutsApi } from '@/lib/api/workouts'
import { nutritionApi } from '@/lib/api/nutrition'
import { toast } from 'sonner'
import {
  ArrowLeft, User, Dumbbell, Salad, Ruler, FileText, Plus, Trash2, X,
  Radio, Activity, CheckCircle2, CreditCard
} from 'lucide-react'

export default function TrainerClientDetailPage() {
  const [hydrated, setHydrated] = useState(false)
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const clientId = Number(params.id)

  const [activeTab, setActiveTab] = useState<'overview' | 'workouts' | 'nutrition' | 'measurements' | 'notes'>('overview')
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState('general')
  const [showNewWorkout, setShowNewWorkout] = useState(false)
  const [showNewNutrition, setShowNewNutrition] = useState(false)
  const [workoutTitle, setWorkoutTitle] = useState('')
  const [workoutDesc, setWorkoutDesc] = useState('')
  const [nutritionTitle, setNutritionTitle] = useState('')
  const [nutritionCalories, setNutritionCalories] = useState('')

  useEffect(() => setHydrated(true), [])

  const { data: clientData, isLoading } = useQuery({
    queryKey: ['trainer-client', clientId],
    queryFn: () => clientsApi.get(clientId).then(r => r.data),
    enabled: !!clientId,
  })

  const { data: workoutsData } = useQuery({
    queryKey: ['trainer-client-workouts', clientId],
    queryFn: () => workoutsApi.list({ client_id: clientId }).then(r => r.data),
    enabled: !!clientId,
  })

  const { data: nutritionData } = useQuery({
    queryKey: ['trainer-client-nutrition', clientId],
    queryFn: () => nutritionApi.list({ client_id: clientId }).then(r => r.data),
    enabled: !!clientId,
  })

  const { data: measurementsData } = useQuery({
    queryKey: ['trainer-client-measurements', clientId],
    queryFn: () => clientsApi.measurements(clientId).then(r => r.data),
    enabled: !!clientId,
  })

  const { data: notesData } = useQuery({
    queryKey: ['trainer-client-notes', clientId],
    queryFn: () => clientsApi.notes(clientId).then(r => r.data),
    enabled: !!clientId,
  })

  const addNote = useMutation({
    mutationFn: () => clientsApi.addNote(clientId, { content: noteContent, type: noteType }),
    onSuccess: () => {
      toast.success('Note added')
      setNoteContent('')
      qc.invalidateQueries({ queryKey: ['trainer-client-notes', clientId] })
    },
  })

  const deleteNote = useMutation({
    mutationFn: (noteId: number) => clientsApi.deleteNote(noteId),
    onSuccess: () => {
      toast.success('Note deleted')
      qc.invalidateQueries({ queryKey: ['trainer-client-notes', clientId] })
    },
  })

  const createWorkout = useMutation({
    mutationFn: () => workoutsApi.create({
      client_id: clientId,
      title: workoutTitle,
      description: workoutDesc,
      status: 'active',
    }),
    onSuccess: (res: any) => {
      toast.success('Workout plan created')
      setShowNewWorkout(false)
      setWorkoutTitle('')
      setWorkoutDesc('')
      qc.invalidateQueries({ queryKey: ['trainer-client-workouts', clientId] })
      router.push(`/trainer/workouts/${res.data.id}`)
    },
    onError: () => toast.error('Failed to create workout plan'),
  })

  const createNutrition = useMutation({
    mutationFn: () => nutritionApi.create({
      client_id: clientId,
      title: nutritionTitle,
      daily_calories: nutritionCalories ? Number(nutritionCalories) : undefined,
      status: 'active',
    }),
    onSuccess: (res: any) => {
      toast.success('Nutrition plan created')
      setShowNewNutrition(false)
      setNutritionTitle('')
      setNutritionCalories('')
      qc.invalidateQueries({ queryKey: ['trainer-client-nutrition', clientId] })
      router.push(`/trainer/nutrition/${res.data.id}`)
    },
    onError: () => toast.error('Failed to create nutrition plan'),
  })

  if (!hydrated) return null

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-graphite-700 rounded animate-pulse" />
        <div className="glass-card p-6 border border-white/5 h-40 animate-pulse" />
      </div>
    )
  }

  const client = clientData?.data ?? clientData
  if (!client) return <div className="text-center py-20 text-muted-foreground">Client not found</div>

  const workouts: any[] = workoutsData?.data ?? []
  const nutrition: any[] = nutritionData?.data ?? []
  const rawMeasurements: any[] = measurementsData?.data ?? measurementsData ?? []
  const notes: any[] = notesData?.data ?? notesData ?? []

  const measurements = [...rawMeasurements].reverse()
  const measurementChart = measurements.map(m => ({
    date: format(new Date(m.measured_at), 'MMM d'),
    weight: m.weight_kg,
    bodyFat: m.body_fat_percent,
    muscle: m.muscle_mass_kg,
  }))

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition', icon: Salad },
    { id: 'measurements', label: 'Measurements', icon: Ruler },
    { id: 'notes', label: 'Notes', icon: FileText },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4">
        <button onClick={() => router.push('/trainer/clients')}
          className="w-9 h-9 rounded-xl bg-graphite-700 border border-white/8 flex items-center justify-center hover:bg-graphite-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{client.first_name} {client.last_name}</h1>
          <p className="text-sm text-muted-foreground">{client.phone}</p>
        </div>
        {client.is_in_gym && (
          <span className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/20 rounded-full px-3 py-1 text-xs text-green-400 font-medium">
            <Radio className="w-3 h-3" /> In Gym
          </span>
        )}
      </motion.div>

      {/* Client info card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card p-6 border border-white/5">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
            {client.first_name?.[0]}{client.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold">{client.first_name} {client.last_name}</p>
            <p className="text-sm text-muted-foreground">{client.phone}</p>
            {client.date_of_birth && (
              <p className="text-xs text-muted-foreground">Born {format(new Date(client.date_of_birth), 'MMMM d, yyyy')}</p>
            )}
          </div>
          {client.active_subscription && (
            <div className="flex items-center gap-3 bg-graphite-700/60 rounded-xl px-4 py-3">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-sm font-semibold">{client.active_subscription.plan?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {client.active_subscription.sessions_remaining != null
                    ? `${client.active_subscription.sessions_remaining} sessions left`
                    : `Expires ${format(new Date(client.active_subscription.expires_at), 'MMM d, yyyy')}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex gap-1 bg-graphite-800 rounded-xl p-1 border border-white/5 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-graphite-600 text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Workout Plans', value: workouts.length, sub: `${workouts.filter(w => w.status === 'active').length} active`, icon: Dumbbell, color: 'text-purple-400' },
                { label: 'Nutrition Plans', value: nutrition.length, sub: `${nutrition.filter(n => n.status === 'active').length} active`, icon: Salad, color: 'text-green-400' },
                { label: 'Measurements', value: rawMeasurements.length, sub: rawMeasurements.length > 0 ? `Last: ${formatDistanceToNow(new Date(rawMeasurements[0].measured_at))} ago` : 'No data', icon: Ruler, color: 'text-cyan-400' },
              ].map(stat => (
                <div key={stat.label} className="glass-card p-5 border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-graphite-700 flex items-center justify-center">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className="font-medium text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* WORKOUTS */}
          {activeTab === 'workouts' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowNewWorkout(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-all">
                  <Plus className="w-4 h-4" /> New Plan
                </button>
              </div>
              {workouts.length === 0 ? (
                <div className="glass-card py-16 text-center border border-white/5">
                  <Dumbbell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No workout plans yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {workouts.map((plan: any) => (
                    <div key={plan.id}
                      className="glass-card p-5 border border-white/5 hover:border-purple-500/20 transition-all cursor-pointer group"
                      onClick={() => router.push(`/trainer/workouts/${plan.id}`)}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold group-hover:text-purple-400 transition-colors">{plan.title}</p>
                          {plan.description && <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          plan.status === 'active' ? 'bg-green-500/15 text-green-400 border-green-500/20' : 'bg-graphite-600 text-muted-foreground border-white/10'
                        }`}>{plan.status}</span>
                      </div>
                      {plan.days?.length > 0 && (
                        <p className="text-xs text-muted-foreground">{plan.days.length} workout day{plan.days.length !== 1 ? 's' : ''}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Created {format(new Date(plan.created_at), 'MMM d, yyyy')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NUTRITION */}
          {activeTab === 'nutrition' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowNewNutrition(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-cyan-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-all">
                  <Plus className="w-4 h-4" /> New Plan
                </button>
              </div>
              {nutrition.length === 0 ? (
                <div className="glass-card py-16 text-center border border-white/5">
                  <Salad className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No nutrition plans yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {nutrition.map((plan: any) => (
                    <div key={plan.id}
                      className="glass-card p-5 border border-white/5 hover:border-green-500/20 transition-all cursor-pointer group"
                      onClick={() => router.push(`/trainer/nutrition/${plan.id}`)}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold group-hover:text-green-400 transition-colors">{plan.title}</p>
                          {plan.description && <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          plan.status === 'active' ? 'bg-green-500/15 text-green-400 border-green-500/20' : 'bg-graphite-600 text-muted-foreground border-white/10'
                        }`}>{plan.status}</span>
                      </div>
                      {plan.daily_calories && (
                        <div className="flex gap-4 mt-2">
                          <div><p className="text-xs text-muted-foreground">Calories</p><p className="text-sm font-semibold text-green-400">{plan.daily_calories} kcal</p></div>
                          {plan.protein_g && <div><p className="text-xs text-muted-foreground">Protein</p><p className="text-sm font-semibold">{plan.protein_g}g</p></div>}
                          {plan.carbs_g && <div><p className="text-xs text-muted-foreground">Carbs</p><p className="text-sm font-semibold">{plan.carbs_g}g</p></div>}
                          {plan.fats_g && <div><p className="text-xs text-muted-foreground">Fats</p><p className="text-sm font-semibold">{plan.fats_g}g</p></div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MEASUREMENTS CHART */}
          {activeTab === 'measurements' && (
            <div className="space-y-6">
              {rawMeasurements.length === 0 ? (
                <div className="glass-card py-16 text-center border border-white/5">
                  <Ruler className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No measurements recorded yet</p>
                </div>
              ) : (
                <>
                  {measurementChart.some(m => m.weight) && (
                    <div className="glass-card p-6 border border-white/5">
                      <h3 className="font-semibold mb-4 text-cyan-400">Weight (kg)</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={measurementChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                          <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1C1C1F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                          <Line type="monotone" dataKey="weight" stroke="#06B6D4" strokeWidth={2} dot={{ fill: '#06B6D4', r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {measurementChart.some(m => m.bodyFat) && (
                    <div className="glass-card p-6 border border-white/5">
                      <h3 className="font-semibold mb-4 text-orange-400">Body Fat (%)</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={measurementChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                          <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1C1C1F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                          <Line type="monotone" dataKey="bodyFat" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {measurementChart.some(m => m.muscle) && (
                    <div className="glass-card p-6 border border-white/5">
                      <h3 className="font-semibold mb-4 text-purple-400">Muscle Mass (kg)</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={measurementChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                          <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1C1C1F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                          <Line type="monotone" dataKey="muscle" stroke="#7C3AED" strokeWidth={2} dot={{ fill: '#7C3AED', r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="glass-card p-5 border border-white/5">
                <h3 className="font-semibold mb-4">Add Note</h3>
                <div className="space-y-3">
                  <select value={noteType} onChange={e => setNoteType(e.target.value)}
                    className="w-full px-3 py-2 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50">
                    <option value="general">General</option>
                    <option value="health">Health</option>
                    <option value="progress">Progress</option>
                    <option value="warning">Warning</option>
                  </select>
                  <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)}
                    placeholder="Write a note about this client..."
                    rows={3}
                    className="w-full px-3 py-2 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50 resize-none" />
                  <button onClick={() => addNote.mutate()} disabled={!noteContent.trim() || addNote.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                    <Plus className="w-4 h-4" /> Add Note
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {notes.length === 0 ? (
                  <div className="glass-card py-16 text-center border border-white/5">
                    <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No notes yet</p>
                  </div>
                ) : notes.map((note: any) => {
                  const typeColors: Record<string, string> = {
                    general: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    health: 'text-green-400 bg-green-500/10 border-green-500/20',
                    progress: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                    warning: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                  }
                  return (
                    <div key={note.id} className="glass-card p-5 border border-white/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeColors[note.type] ?? typeColors.general}`}>
                              {note.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(note.created_at))} ago
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{note.content}</p>
                        </div>
                        <button onClick={() => deleteNote.mutate(note.id)}
                          className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-colors flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* New Workout Modal */}
      <AnimatePresence>
        {showNewWorkout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowNewWorkout(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 border border-white/10 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">New Workout Plan</h3>
                <button onClick={() => setShowNewWorkout(false)} className="w-8 h-8 rounded-lg bg-graphite-700 flex items-center justify-center hover:bg-graphite-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Title</label>
                  <input value={workoutTitle} onChange={e => setWorkoutTitle(e.target.value)}
                    placeholder="e.g. Upper Body Strength"
                    className="w-full px-3 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Description (optional)</label>
                  <textarea value={workoutDesc} onChange={e => setWorkoutDesc(e.target.value)}
                    rows={3} placeholder="Plan description..."
                    className="w-full px-3 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50 resize-none" />
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowNewWorkout(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={() => createWorkout.mutate()} disabled={!workoutTitle.trim() || createWorkout.isPending}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Nutrition Modal */}
      <AnimatePresence>
        {showNewNutrition && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowNewNutrition(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 border border-white/10 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">New Nutrition Plan</h3>
                <button onClick={() => setShowNewNutrition(false)} className="w-8 h-8 rounded-lg bg-graphite-700 flex items-center justify-center hover:bg-graphite-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Title</label>
                  <input value={nutritionTitle} onChange={e => setNutritionTitle(e.target.value)}
                    placeholder="e.g. Cutting Diet Plan"
                    className="w-full px-3 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Daily Calories (optional)</label>
                  <input value={nutritionCalories} onChange={e => setNutritionCalories(e.target.value)}
                    type="number" placeholder="e.g. 2200"
                    className="w-full px-3 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowNewNutrition(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={() => createNutrition.mutate()} disabled={!nutritionTitle.trim() || createNutrition.isPending}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-cyan-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                    Create
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
