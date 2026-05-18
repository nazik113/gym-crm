'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/lib/stores/auth'
import apiClient from '@/lib/api/client'
import { useState, useRef } from 'react'
import { User, Phone, Calendar, Shield, Camera, Dumbbell, CreditCard, Activity, ChevronRight, Edit3, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClientProfilePage() {
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', date_of_birth: '' })

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => apiClient.get('/my/profile').then(r => r.data),
  })

  const { data: subData } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => apiClient.get('/my/subscription').then(r => r.data),
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => apiClient.get('/my/attendance').then(r => r.data),
  })

  const updateProfile = useMutation({
    mutationFn: (data: object) => apiClient.patch('/my/profile', data),
    onSuccess: (res) => {
      toast.success('Profile updated')
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      if (setUser) setUser({ ...user, ...res.data })
      setEditing(false)
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('avatar', file)
      return apiClient.post('/my/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { toast.success('Avatar updated'); qc.invalidateQueries({ queryKey: ['my-profile'] }) },
    onError: () => toast.error('Failed to upload avatar'),
  })

  const p = profile ?? user
  const sub = subData
  const visits = attendanceData?.data?.length ?? 0

  const startEdit = () => {
    setForm({ first_name: p?.first_name ?? '', last_name: p?.last_name ?? '', date_of_birth: p?.date_of_birth ?? '' })
    setEditing(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadAvatar.mutate(file)
  }

  const daysLeft = sub?.expires_at
    ? Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000))
    : null

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">My Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your account & membership info</p>
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
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white">
                {p?.first_name?.[0]}{p?.last_name?.[0]}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-cyan-500 border-2 border-graphite-900 flex items-center justify-center hover:bg-cyan-400 transition-colors"
              title="Change avatar">
              {uploadAvatar.isPending ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-3 h-3 text-white" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Name / edit */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    placeholder="First name"
                    className="flex-1 px-3 py-1.5 bg-graphite-700 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50" />
                  <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    placeholder="Last name"
                    className="flex-1 px-3 py-1.5 bg-graphite-700 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-graphite-700 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50" />
                <div className="flex gap-2">
                  <button onClick={() => updateProfile.mutate(form)} disabled={updateProfile.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 rounded-lg text-xs font-semibold text-white hover:bg-cyan-400 transition-colors disabled:opacity-50">
                    <Check className="w-3 h-3" /> Save
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-graphite-700 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-3 h-3" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold truncate">{p?.first_name} {p?.last_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-400 border border-purple-500/20">
                    <Shield className="w-3 h-3" /> Client
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
          { label: 'Sessions left', value: sub?.sessions_remaining ?? '—', icon: Activity, color: 'text-green-400' },
          { label: 'Days left', value: daysLeft ?? '—', icon: Calendar, color: 'text-cyan-400' },
          { label: 'Visits total', value: visits, icon: Dumbbell, color: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4 border border-white/5 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Personal info ──────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card border border-white/5 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personal Information</p>
        </div>
        {[
          { icon: Phone, label: 'Phone', value: p?.phone },
          { icon: Calendar, label: 'Date of Birth', value: p?.date_of_birth },
          { icon: User, label: 'Member since', value: p?.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
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

      {/* ── Subscription ───────────────────────────────── */}
      {sub && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card border border-white/5 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Subscription</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{sub.plan?.name ?? 'Subscription'}</p>
                  <p className="text-xs text-muted-foreground">Expires {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-GB') : '—'}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/20">
                {sub.status}
              </span>
            </div>
            {/* Progress bar */}
            {daysLeft !== null && sub.plan?.duration_days && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{daysLeft} days remaining</span>
                  <span>{sub.plan.duration_days} days total</span>
                </div>
                <div className="h-1.5 bg-graphite-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-green-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (daysLeft / sub.plan.duration_days) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Trainer ─────────────────────────────────────── */}
      {p?.trainer && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card p-5 border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {p.trainer.first_name?.[0]}{p.trainer.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">My Trainer</p>
            <p className="font-semibold">{p.trainer.first_name} {p.trainer.last_name}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      )}
    </div>
  )
}
