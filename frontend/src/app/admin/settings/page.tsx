'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/lib/stores/auth'
import apiClient from '@/lib/api/client'
import { toast } from 'sonner'
import { Settings, User, CreditCard, Plus, Trash2, X, Shield, DollarSign } from 'lucide-react'

export default function AdminSettingsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showCreatePlan, setShowCreatePlan] = useState(false)
  const [plan, setPlan] = useState({ name: '', price: '', duration_days: '', sessions_count: '', description: '' })

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => apiClient.get('/subscription-plans').then(r => r.data),
  })
  const plans: any[] = plansData?.data ?? []

  const createPlan = useMutation({
    mutationFn: () => apiClient.post('/subscription-plans', {
      ...plan, price: Number(plan.price), duration_days: Number(plan.duration_days), sessions_count: plan.sessions_count ? Number(plan.sessions_count) : null,
    }),
    onSuccess: () => {
      toast.success('Plan created')
      setShowCreatePlan(false)
      setPlan({ name: '', price: '', duration_days: '', sessions_count: '', description: '' })
      qc.invalidateQueries({ queryKey: ['subscription-plans'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  })

  const deletePlan = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/subscription-plans/${id}`),
    onSuccess: () => { toast.success('Plan deleted'); qc.invalidateQueries({ queryKey: ['subscription-plans'] }) },
  })

  const inputClass = "w-full bg-graphite-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"

  return (
    <div className="space-y-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-muted-foreground mt-1">System configuration</p>
      </motion.div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card p-6 border border-white/5">
        <h2 className="font-semibold flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-purple-400" /> Admin Profile
        </h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <p className="text-xl font-bold">{user?.first_name} {user?.last_name}</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-500/15 text-purple-400 border border-purple-500/20">
              <Shield className="w-3 h-3" /> Administrator
            </span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Phone', value: user?.phone },
            { label: 'Role', value: user?.role?.name },
          ].map(f => (
            <div key={f.label} className="bg-graphite-700/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">{f.label}</p>
              <p className="font-medium capitalize">{f.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Subscription Plans */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-6 border border-white/5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" /> Subscription Plans
          </h2>
          <button onClick={() => setShowCreatePlan(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Plan
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {plans.map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="bg-graphite-700/40 rounded-xl p-4 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{p.name}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-400"><DollarSign className="w-3 h-3" />{p.price}</span>
                  <span className="text-muted-foreground">{p.duration_days}d</span>
                  {p.sessions_count && <span className="text-muted-foreground">{p.sessions_count} sessions</span>}
                </div>
                {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
              </div>
              <button onClick={() => deletePlan.mutate(p.id)}
                className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </motion.div>
          ))}
          {plans.length === 0 && <p className="text-sm text-muted-foreground col-span-2 py-4 text-center">No plans yet</p>}
        </div>
      </motion.div>

      {/* System Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card p-6 border border-white/5">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-muted-foreground" /> System
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'Version', value: 'GymCRM v1.0' },
            { label: 'Backend', value: 'Laravel 12' },
            { label: 'Database', value: 'PostgreSQL 16' },
          ].map(item => (
            <div key={item.label} className="bg-graphite-700/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className="font-medium">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Create Plan Modal */}
      {showCreatePlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 border border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">New Subscription Plan</h3>
              <button onClick={() => setShowCreatePlan(false)} className="w-8 h-8 rounded-lg bg-graphite-700 flex items-center justify-center hover:bg-graphite-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Plan Name</label>
                <input value={plan.name} onChange={e => setPlan({...plan, name: e.target.value})} className={inputClass} placeholder="e.g. Monthly Premium" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground mb-1 block">Price ($)</label>
                  <input type="number" value={plan.price} onChange={e => setPlan({...plan, price: e.target.value})} className={inputClass} placeholder="49.99" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Duration (days)</label>
                  <input type="number" value={plan.duration_days} onChange={e => setPlan({...plan, duration_days: e.target.value})} className={inputClass} placeholder="30" /></div>
              </div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Sessions (optional)</label>
                <input type="number" value={plan.sessions_count} onChange={e => setPlan({...plan, sessions_count: e.target.value})} className={inputClass} placeholder="Unlimited if empty" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <input value={plan.description} onChange={e => setPlan({...plan, description: e.target.value})} className={inputClass} placeholder="Optional description" /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowCreatePlan(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                <button onClick={() => createPlan.mutate()} disabled={createPlan.isPending || !plan.name || !plan.price || !plan.duration_days}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                  Create Plan
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
