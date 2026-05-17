'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { format, formatDistanceToNow } from 'date-fns'
import apiClient from '@/lib/api/client'
import { clientsApi } from '@/lib/api/clients'
import { subscriptionsApi } from '@/lib/api/subscriptions'
import { presenceApi } from '@/lib/api/presence'
import { toast } from 'sonner'
import {
  ArrowLeft, User, CreditCard, Radio, QrCode, FileText, Ruler,
  Plus, Trash2, ChevronDown, CalendarClock, Activity, Dumbbell,
  AlertTriangle, CheckCircle2, Clock, X, LogIn, LogOut
} from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    active:    'bg-green-500/15 text-green-400 border-green-500/20',
    expired:   'bg-red-500/15 text-red-400 border-red-500/20',
    cancelled: 'bg-graphite-600 text-muted-foreground border-white/10',
    pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg[status] ?? cfg.pending}`}>
      {status}
    </span>
  )
}

export default function AdminClientDetailPage() {
  const [hydrated, setHydrated] = useState(false)
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const clientId = Number(params.id)

  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'notes' | 'measurements' | 'qr'>('overview')
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState('general')
  const [showAssignSub, setShowAssignSub] = useState(false)
  const [showAssignTrainer, setShowAssignTrainer] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [selectedTrainerId, setSelectedTrainerId] = useState('')
  const [extendDays, setExtendDays] = useState('30')

  useEffect(() => setHydrated(true), [])

  const { data: clientData, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.get(clientId).then(r => r.data),
    enabled: !!clientId,
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['client-attendance', clientId],
    queryFn: () => clientsApi.attendance(clientId, { per_page: 30 }).then(r => r.data),
    enabled: !!clientId,
  })

  const { data: notesData } = useQuery({
    queryKey: ['client-notes', clientId],
    queryFn: () => clientsApi.notes(clientId).then(r => r.data),
    enabled: !!clientId,
  })

  const { data: measurementsData } = useQuery({
    queryKey: ['client-measurements', clientId],
    queryFn: () => clientsApi.measurements(clientId).then(r => r.data),
    enabled: !!clientId,
  })

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionsApi.plans().then(r => r.data),
    enabled: showAssignSub,
  })

  const { data: trainersData } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => apiClient.get('/trainers').then(r => r.data),
    enabled: showAssignTrainer,
  })

  const addNote = useMutation({
    mutationFn: () => clientsApi.addNote(clientId, { content: noteContent, type: noteType }),
    onSuccess: () => {
      toast.success('Note added')
      setNoteContent('')
      qc.invalidateQueries({ queryKey: ['client-notes', clientId] })
    },
    onError: () => toast.error('Failed to add note'),
  })

  const deleteNote = useMutation({
    mutationFn: (noteId: number) => clientsApi.deleteNote(noteId),
    onSuccess: () => {
      toast.success('Note deleted')
      qc.invalidateQueries({ queryKey: ['client-notes', clientId] })
    },
  })

  const extendSub = useMutation({
    mutationFn: () => subscriptionsApi.extend(client.active_subscription.id, { days: Number(extendDays) }),
    onSuccess: () => {
      toast.success(`Subscription extended by ${extendDays} days`)
      qc.invalidateQueries({ queryKey: ['client', clientId] })
    },
    onError: () => toast.error('Failed to extend subscription'),
  })

  const deductSession = useMutation({
    mutationFn: () => subscriptionsApi.deductSession(client.active_subscription.id),
    onSuccess: () => {
      toast.success('Session deducted')
      qc.invalidateQueries({ queryKey: ['client', clientId] })
    },
    onError: () => toast.error('Failed to deduct session'),
  })

  const assignSub = useMutation({
    mutationFn: () => subscriptionsApi.assign(clientId, { plan_id: Number(selectedPlanId) }),
    onSuccess: () => {
      toast.success('Subscription assigned')
      setShowAssignSub(false)
      qc.invalidateQueries({ queryKey: ['client', clientId] })
    },
    onError: () => toast.error('Failed to assign subscription'),
  })

  const assignTrainer = useMutation({
    mutationFn: () => apiClient.post(`/trainers/${selectedTrainerId}/assign-client`, { client_id: clientId }),
    onSuccess: () => {
      toast.success('Trainer assigned')
      setShowAssignTrainer(false)
      qc.invalidateQueries({ queryKey: ['client', clientId] })
      qc.invalidateQueries({ queryKey: ['admin-clients'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to assign trainer'),
  })

  const markEnterGym = useMutation({
    mutationFn: () => presenceApi.enter(clientId),
    onSuccess: () => { toast.success('Client marked as in gym'); qc.invalidateQueries({ queryKey: ['client', clientId] }) },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  })

  const markLeaveGym = useMutation({
    mutationFn: () => presenceApi.leave(clientId),
    onSuccess: () => { toast.success('Client marked as left gym'); qc.invalidateQueries({ queryKey: ['client', clientId] }) },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  })

  if (!hydrated) return null

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-graphite-700 animate-pulse" />
          <div className="h-8 w-48 bg-graphite-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 border border-white/5 animate-pulse h-64" />
          <div className="lg:col-span-2 glass-card p-6 border border-white/5 animate-pulse h-64" />
        </div>
      </div>
    )
  }

  const client = clientData?.data ?? clientData
  if (!client) return <div className="text-center py-20 text-muted-foreground">Client not found</div>

  const sub = client.active_subscription
  const attendance: any[] = attendanceData?.data ?? []
  const notes: any[] = notesData?.data ?? notesData ?? []
  const measurements: any[] = measurementsData?.data ?? measurementsData ?? []
  const plans: any[] = plansData?.data ?? plansData ?? []
  const trainers: any[] = trainersData?.data ?? []

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'attendance', label: 'Attendance', icon: Activity },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'measurements', label: 'Measurements', icon: Ruler },
    { id: 'qr', label: 'QR Code', icon: QrCode },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back + Title */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/clients')}
          className="w-9 h-9 rounded-xl bg-graphite-700 border border-white/8 flex items-center justify-center hover:bg-graphite-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{client.first_name} {client.last_name}</h1>
          <p className="text-sm text-muted-foreground">{client.phone}</p>
        </div>
        {client.is_in_gym && (
          <span className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/20 rounded-full px-3 py-1 text-xs text-green-400 font-medium ml-2">
            <Radio className="w-3 h-3" /> In Gym Now
          </span>
        )}
      </motion.div>

      {/* Top cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Profile card */}
        <div className="glass-card p-6 border border-white/5 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
              {client.first_name?.[0]}{client.last_name?.[0]}
            </div>
            <div>
              <p className="text-lg font-bold">{client.first_name} {client.last_name}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                client.is_active
                  ? 'bg-green-500/15 text-green-400 border-green-500/20'
                  : 'bg-red-500/15 text-red-400 border-red-500/20'
              }`}>{client.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-mono">{client.phone}</span>
            </div>
            {client.date_of_birth && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Birthday</span>
                <span>{format(new Date(client.date_of_birth), 'MMM d, yyyy')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span>{format(new Date(client.created_at), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trainer</span>
              <div className="flex items-center gap-2">
                <span>{client.trainer ? `${client.trainer.first_name} ${client.trainer.last_name}` : '—'}</span>
                <button onClick={() => setShowAssignTrainer(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  {client.trainer ? 'Change' : 'Assign'}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-muted-foreground">Gym Status</span>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-xs font-medium ${client.is_in_gym ? 'text-green-400' : 'text-muted-foreground'}`}>
                  <Radio className="w-3 h-3" />{client.is_in_gym ? 'In Gym' : 'Not Present'}
                </span>
              </div>
            </div>
          </div>
          {/* Gym presence buttons */}
          <div className="flex gap-2 pt-2 border-t border-white/5">
            {client.is_in_gym ? (
              <button onClick={() => markLeaveGym.mutate()} disabled={markLeaveGym.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/15 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold hover:bg-red-500/25 disabled:opacity-50 transition-all">
                <LogOut className="w-3.5 h-3.5" /> {markLeaveGym.isPending ? 'Updating…' : 'Mark Left Gym'}
              </button>
            ) : (
              <button onClick={() => markEnterGym.mutate()} disabled={markEnterGym.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500/15 border border-green-500/20 text-green-400 rounded-xl text-xs font-semibold hover:bg-green-500/25 disabled:opacity-50 transition-all">
                <LogIn className="w-3.5 h-3.5" /> {markEnterGym.isPending ? 'Updating…' : 'Mark Entered Gym'}
              </button>
            )}
          </div>
        </div>

        {/* Subscription card */}
        <div className="lg:col-span-2 glass-card p-6 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-400" /> Subscription
            </h2>
            <button onClick={() => setShowAssignSub(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-graphite-700 border border-white/8 hover:border-cyan-500/30 text-muted-foreground hover:text-foreground transition-all">
              <Plus className="w-3 h-3" /> {sub ? 'New Subscription' : 'Assign Subscription'}
            </button>
          </div>
          {sub ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.plan?.color ?? '#6366F1' }} />
                <span className="text-xl font-bold">{sub.plan?.name}</span>
                <StatusBadge status={sub.status} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Sessions Left', value: sub.sessions_remaining ?? '∞', highlight: true },
                  { label: 'Expires', value: format(new Date(sub.expires_at), 'MMM d, yyyy') },
                  { label: 'Price Paid', value: `$${sub.price_paid}` },
                  { label: 'Started', value: format(new Date(sub.starts_at), 'MMM d, yyyy') },
                ].map(item => (
                  <div key={item.label} className="bg-graphite-700/60 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <p className={`text-lg font-bold ${item.highlight ? 'text-cyan-400' : ''}`}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <input value={extendDays} onChange={e => setExtendDays(e.target.value)}
                    className="w-16 px-2 py-1.5 bg-graphite-800 border border-white/8 rounded-lg text-sm text-center focus:outline-none focus:border-cyan-500/50"
                    type="number" min="1" max="365" />
                  <button onClick={() => extendSub.mutate()} disabled={extendSub.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-sm font-medium hover:bg-cyan-600/30 transition-all">
                    <CalendarClock className="w-4 h-4" />
                    Extend {extendDays}d
                  </button>
                </div>
                <button onClick={() => deductSession.mutate()} disabled={deductSession.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-500/15 border border-orange-500/25 text-orange-300 rounded-xl text-sm font-medium hover:bg-orange-500/25 transition-all">
                  <Dumbbell className="w-4 h-4" /> Deduct Session
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CreditCard className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground mb-4">No active subscription</p>
              <button onClick={() => setShowAssignSub(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-all">
                Assign Subscription
              </button>
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
                activeTab === tab.id
                  ? 'bg-graphite-600 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6 border border-white/5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" /> Recent Attendance
                </h3>
                {attendance.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">No attendance records</p>
                ) : (
                  <div className="space-y-2">
                    {attendance.slice(0, 8).map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-sm">{format(new Date(a.checked_in_at), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                        <div className="text-right">
                          {a.duration_minutes && <span className="text-xs text-muted-foreground">{a.duration_minutes}min</span>}
                          <span className="ml-2 text-xs text-graphite-400 capitalize">{a.check_in_method?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="glass-card p-6 border border-white/5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-cyan-400" /> Latest Measurements
                </h3>
                {measurements.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">No measurements recorded</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries({
                      'Weight': measurements[0]?.weight_kg ? `${measurements[0].weight_kg} kg` : null,
                      'Height': measurements[0]?.height_cm ? `${measurements[0].height_cm} cm` : null,
                      'Body Fat': measurements[0]?.body_fat_percent ? `${measurements[0].body_fat_percent}%` : null,
                      'Chest': measurements[0]?.chest_cm ? `${measurements[0].chest_cm} cm` : null,
                      'Waist': measurements[0]?.waist_cm ? `${measurements[0].waist_cm} cm` : null,
                      'Hips': measurements[0]?.hips_cm ? `${measurements[0].hips_cm} cm` : null,
                    }).filter(([, v]) => v).map(([label, value]) => (
                      <div key={label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className="text-sm font-semibold">{value}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-2">
                      Recorded {formatDistanceToNow(new Date(measurements[0].measured_at))} ago
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="glass-card border border-white/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="font-semibold">Attendance History</h3>
                <p className="text-sm text-muted-foreground">{attendance.length} records</p>
              </div>
              <div className="divide-y divide-white/5">
                {attendance.length === 0 ? (
                  <div className="py-16 text-center">
                    <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No attendance records yet</p>
                  </div>
                ) : attendance.map((a: any) => (
                  <div key={a.id} className="px-6 py-4 flex items-center justify-between hover:bg-graphite-700/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/15 border border-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{format(new Date(a.checked_in_at), 'EEEE, MMMM d, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(a.checked_in_at), 'HH:mm')} — {a.check_in_method?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {a.duration_minutes && (
                      <span className="text-sm text-muted-foreground">{a.duration_minutes} min</span>
                    )}
                  </div>
                ))}
              </div>
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
                    placeholder="Write a note..."
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
                              {note.author ? `${note.author.first_name} ${note.author.last_name}` : 'Unknown'} · {formatDistanceToNow(new Date(note.created_at))} ago
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

          {/* MEASUREMENTS */}
          {activeTab === 'measurements' && (
            <div className="glass-card border border-white/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="font-semibold">Measurements History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Date', 'Weight', 'Height', 'Body Fat', 'Muscle Mass', 'Chest', 'Waist', 'Hips'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
                          <Ruler className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-muted-foreground">No measurements recorded</p>
                        </td>
                      </tr>
                    ) : measurements.map((m: any) => (
                      <tr key={m.id} className="border-b border-white/5 hover:bg-graphite-700/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{format(new Date(m.measured_at), 'MMM d, yyyy')}</td>
                        <td className="px-4 py-3">{m.weight_kg ? `${m.weight_kg} kg` : '—'}</td>
                        <td className="px-4 py-3">{m.height_cm ? `${m.height_cm} cm` : '—'}</td>
                        <td className="px-4 py-3">{m.body_fat_percent ? `${m.body_fat_percent}%` : '—'}</td>
                        <td className="px-4 py-3">{m.muscle_mass_kg ? `${m.muscle_mass_kg} kg` : '—'}</td>
                        <td className="px-4 py-3">{m.chest_cm ? `${m.chest_cm} cm` : '—'}</td>
                        <td className="px-4 py-3">{m.waist_cm ? `${m.waist_cm} cm` : '—'}</td>
                        <td className="px-4 py-3">{m.hips_cm ? `${m.hips_cm} cm` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* QR */}
          {activeTab === 'qr' && (
            <div className="flex justify-center">
              <div className="glass-card p-8 border border-white/5 flex flex-col items-center gap-6 max-w-sm w-full">
                <h3 className="font-semibold">Member QR Code</h3>
                {client.qr_code ? (
                  <div className="p-4 bg-white rounded-2xl shadow-2xl">
                    <QRCodeSVG value={client.qr_code} size={220} level="H" includeMargin={false} />
                  </div>
                ) : (
                  <div className="w-56 h-56 rounded-2xl bg-graphite-700/50 border border-white/5 flex flex-col items-center justify-center gap-3">
                    <QrCode className="w-12 h-12 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No QR code assigned</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="font-semibold">{client.first_name} {client.last_name}</p>
                  {client.qr_code && <p className="text-xs text-muted-foreground font-mono mt-1">{client.qr_code}</p>}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Assign Subscription Modal */}
      <AnimatePresence>
        {showAssignSub && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowAssignSub(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 border border-white/10 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">Assign Subscription</h3>
                <button onClick={() => setShowAssignSub(false)} className="w-8 h-8 rounded-lg bg-graphite-700 flex items-center justify-center hover:bg-graphite-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Subscription Plan</label>
                  <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50">
                    <option value="">Select a plan...</option>
                    {plans.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} — ${p.price} / {p.duration_days}d</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowAssignSub(false)}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={() => assignSub.mutate()} disabled={!selectedPlanId || assignSub.isPending}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                    Assign
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Trainer Modal */}
      <AnimatePresence>
        {showAssignTrainer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowAssignTrainer(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 border border-white/10 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">Assign Trainer</h3>
                <button onClick={() => setShowAssignTrainer(false)} className="w-8 h-8 rounded-lg bg-graphite-700 flex items-center justify-center hover:bg-graphite-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Trainer</label>
                  <select value={selectedTrainerId} onChange={e => setSelectedTrainerId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50">
                    <option value="">Select a trainer...</option>
                    {trainers.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowAssignTrainer(false)}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={() => assignTrainer.mutate()} disabled={!selectedTrainerId || assignTrainer.isPending}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                    Assign
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
