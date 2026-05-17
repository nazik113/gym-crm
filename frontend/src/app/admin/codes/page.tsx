'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { codesApi } from '@/lib/api/codes'
import { subscriptionsApi } from '@/lib/api/subscriptions'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Plus, Copy, CheckCheck, Trash2, Ban, KeyRound, RefreshCw } from 'lucide-react'
import type { RegistrationCode } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  active:  'bg-green-500/15 text-green-400 border-green-500/20',
  used:    'bg-blue-500/15 text-blue-400 border-blue-500/20',
  expired: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  revoked: 'bg-red-500/15 text-red-400 border-red-500/20',
}

export default function CodesPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [roleFilter, setRoleFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['codes', roleFilter],
    queryFn: () => codesApi.list({ role: roleFilter || undefined }).then(r => r.data),
  })
  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: () => subscriptionsApi.plans().then(r => r.data) })

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const selectedRole = watch('role_id')
  // We'd map role_id to role name; for simplicity treat "2" as trainer
  const isTrainer = false // would resolve from roles

  const createMutation = useMutation({
    mutationFn: (data: object) => codesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['codes'] }); setShowCreate(false); reset(); toast.success('Code generated!') },
    onError: () => toast.error('Failed to create code'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => codesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['codes'] }); toast.success('Code deleted') },
  })
  const revokeMutation = useMutation({
    mutationFn: (id: number) => codesApi.revoke(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['codes'] }); toast.success('Code revoked') },
  })

  const copyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success('Code copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const inputClass = "w-full bg-graphite-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Registration Codes</h1>
          <p className="text-muted-foreground mt-1">Invitation-only access codes for new members</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-cyan-500 transition-all neon-glow-purple text-sm"
        >
          <Plus className="w-4 h-4" /> Generate Code
        </motion.button>
      </motion.div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'client', 'trainer'].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium border transition-all ${roleFilter === r ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'border-white/8 text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
            {r === '' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
          </button>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="glass-card border border-white/5 overflow-hidden"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Code', 'Role', 'Subscription', 'Status', 'Activated By', 'Created', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((code: RegistrationCode, i: number) => (
              <motion.tr key={code.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="border-b border-white/5 hover:bg-white/2 transition-colors group"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg tracking-wider">{code.code}</code>
                    <button onClick={() => copyCode(code.id, code.code)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10">
                      {copiedId === code.id ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${code.role?.name === 'trainer' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' : 'bg-purple-500/15 text-purple-400 border-purple-500/20'}`}>
                    {code.role?.display_name}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{code.subscription_plan?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[code.status]}`}>{code.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {code.activated_by ? `${code.activated_by.first_name} ${code.activated_by.last_name}` : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(code.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {code.status === 'active' && (
                      <button onClick={() => revokeMutation.mutate(code.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-500/20 text-muted-foreground hover:text-orange-400 transition-colors">
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {code.status !== 'used' && (
                      <button onClick={() => deleteMutation.mutate(code.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {!isLoading && !data?.data?.length && (
          <div className="text-center py-16 text-muted-foreground">
            <KeyRound className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No codes found — generate your first code</p>
          </div>
        )}
      </motion.div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 w-full max-w-md border border-white/10"
            >
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-400" /> Generate Code
              </h2>
              <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Hidden First Name</label>
                    <input {...register('hidden_first_name')} placeholder="John" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Hidden Last Name</label>
                    <input {...register('hidden_last_name')} placeholder="Doe" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Hidden Phone</label>
                  <input {...register('hidden_phone')} placeholder="+1234567890" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Role *</label>
                  <select {...register('role_id', { required: true })} className={inputClass}>
                    <option value="">Select role</option>
                    <option value="3">Client</option>
                    <option value="2">Trainer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Subscription Plan (clients only)</label>
                  <select {...register('subscription_plan_id')} className={inputClass}>
                    <option value="">No subscription</option>
                    {(plans?.data ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Expires At (optional)</label>
                  <input {...register('expires_at')} type="datetime-local" className={inputClass} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:from-purple-500 hover:to-cyan-500 transition-all text-sm">
                    {createMutation.isPending ? 'Generating…' : 'Generate Code'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
