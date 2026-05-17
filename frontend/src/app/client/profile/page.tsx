'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/lib/stores/auth'
import apiClient from '@/lib/api/client'
import { User, Phone, Calendar, Dumbbell, CreditCard, Shield } from 'lucide-react'

export default function ClientProfilePage() {
  const user = useAuthStore(s => s.user)

  const { data } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => apiClient.get('/my/profile').then(r => r.data),
  })

  const profile = data ?? user

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">My Profile</h1>
        <p className="text-muted-foreground mt-1">Your personal information</p>
      </motion.div>

      {/* Avatar card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card p-6 border border-white/5 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
          {profile?.first_name?.[0]}{profile?.last_name?.[0]}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{profile?.first_name} {profile?.last_name}</h2>
          <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-400 border border-purple-500/20">
            <Shield className="w-3 h-3" /> Client
          </span>
        </div>
      </motion.div>

      {/* Info fields */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-6 border border-white/5 space-y-5">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Personal Information</h3>
        {[
          { icon: User, label: 'First Name', value: profile?.first_name },
          { icon: User, label: 'Last Name', value: profile?.last_name },
          { icon: Phone, label: 'Phone', value: profile?.phone },
          { icon: Calendar, label: 'Date of Birth', value: profile?.date_of_birth },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-graphite-700 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium mt-0.5">{value ?? '—'}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Trainer */}
      {profile?.trainer && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card p-6 border border-white/5">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">My Trainer</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {profile.trainer.first_name?.[0]}{profile.trainer.last_name?.[0]}
            </div>
            <div>
              <p className="font-semibold">{profile.trainer.first_name} {profile.trainer.last_name}</p>
              <p className="text-xs text-muted-foreground">{profile.trainer.phone}</p>
            </div>
          </div>
        </motion.div>
      )}

      <p className="text-xs text-muted-foreground px-1">
        Personal information is managed by your gym administrator and cannot be edited here.
      </p>
    </div>
  )
}
