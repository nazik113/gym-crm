'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/lib/stores/auth'
import apiClient from '@/lib/api/client'
import { useState, useRef } from 'react'
import {
  User, Phone, Calendar, Shield, Camera, Dumbbell,
  Activity, Edit3, Check, X, Users, Apple
} from 'lucide-react'
import toast from 'react-hot-toast'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function TrainerProfilePage() {
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', date_of_birth: '' })

  const { data: profile, isLoading } = useQuery({
    queryKey: ['trainer-profile'],
    queryFn: () => apiClient.get('/trainer/profile').then(r => r.data),
  })

  const { data: clientsData } = useQuery({
    queryKey: ['my-clients'],
    queryFn: () => apiClient.get('/my-clients').then(r => r.data),
  })

  const updateProfile = useMutation({
    mutationFn: (data: object) => apiClient.patch('/trainer/profile', data),
    onSuccess: (res) => {
      toast.success('Профиль обновлён')
      qc.invalidateQueries({ queryKey: ['trainer-profile'] })
      if (setUser) setUser({ ...user, ...res.data })
      setEditing(false)
    },
    onError: () => toast.error('Ошибка сохранения'),
  })

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('avatar', file)
      return apiClient.post('/trainer/profile/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      toast.success('Фото обновлено')
      qc.invalidateQueries({ queryKey: ['trainer-profile'] })
    },
    onError: () => toast.error('Ошибка загрузки фото'),
  })

  const p = profile ?? user
  const clients = clientsData?.data ?? []
  const activeClients = clients.filter((c: any) => c.is_active !== false)

  const startEdit = () => {
    setForm({
      first_name: p?.first_name ?? '',
      last_name: p?.last_name ?? '',
      date_of_birth: p?.date_of_birth ? p.date_of_birth.substring(0, 10) : '',
    })
    setEditing(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadAvatar.mutate(file)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">My Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your trainer account information</p>
      </motion.div>

      {/* ── Avatar + Name ─────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card p-6 border border-white/5">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {p?.avatar ? (
              <img src={p.avatar} alt="avatar" className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white">
                {p?.first_name?.[0]}{p?.last_name?.[0]}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-cyan-500 border-2 border-graphite-900 flex items-center justify-center hover:bg-cyan-400 transition-colors"
              title="Изменить фото">
              {uploadAvatar.isPending ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-3 h-3 text-white" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    placeholder="Имя"
                    className="flex-1 px-3 py-1.5 bg-graphite-700 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50" />
                  <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    placeholder="Фамилия"
                    className="flex-1 px-3 py-1.5 bg-graphite-700 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-graphite-700 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50" />
                <div className="flex gap-2">
                  <button onClick={() => updateProfile.mutate(form)} disabled={updateProfile.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 rounded-lg text-xs font-semibold text-white hover:bg-cyan-400 transition-colors disabled:opacity-50">
                    <Check className="w-3 h-3" /> Сохранить
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-graphite-700 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-3 h-3" /> Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold truncate">{p?.first_name} {p?.last_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                    <Shield className="w-3 h-3" /> Trainer
                  </span>
                </div>
                <button onClick={startEdit}
                  className="flex items-center gap-1 mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  <Edit3 className="w-3 h-3" /> Edit profile
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Stats row ──────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Clients', value: p?.clients_count ?? clients.length, icon: Users, color: 'text-cyan-400' },
          { label: 'Active Clients', value: activeClients.length, icon: Activity, color: 'text-green-400' },
          { label: 'Member since', value: p?.created_at ? new Date(p.created_at).getFullYear() : '—', icon: Calendar, color: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4 border border-white/5 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Personal Info ──────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card border border-white/5 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personal Information</p>
        </div>
        {[
          { icon: Phone,    label: 'Phone',          value: p?.phone },
          { icon: Calendar, label: 'Date of Birth',  value: formatDate(p?.date_of_birth) },
          { icon: User,     label: 'Member since',   value: p?.created_at ? new Date(p.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/5 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-graphite-700 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium mt-0.5">{value ?? '—'}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── My Clients ─────────────────────────────────── */}
      {clients.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card border border-white/5 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Clients</p>
            <span className="text-xs text-cyan-400 font-semibold">{clients.length} total</span>
          </div>
          <div className="divide-y divide-white/5">
            {clients.slice(0, 6).map((client: any) => (
              <div key={client.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border border-white/10 flex items-center justify-center text-sm font-bold text-foreground flex-shrink-0">
                  {client.first_name?.[0]}{client.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{client.first_name} {client.last_name}</p>
                  <p className="text-xs text-muted-foreground">{client.active_subscription?.plan?.name ?? 'No subscription'}</p>
                </div>
                <span className={`w-2 h-2 rounded-full ${client.is_active !== false ? 'bg-green-500' : 'bg-muted'}`} />
              </div>
            ))}
            {clients.length > 6 && (
              <div className="px-5 py-3 text-center">
                <a href="/trainer/clients" className="text-xs text-cyan-400 hover:text-cyan-300">
                  View all {clients.length} clients →
                </a>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
