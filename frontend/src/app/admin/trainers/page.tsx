'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import apiClient from '@/lib/api/client'
import { toast } from 'sonner'
import { Dumbbell, Phone, Users, Plus, X, Search } from 'lucide-react'

export default function AdminTrainersPage() {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', password: '' })
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => apiClient.get('/trainers').then(r => r.data),
  })
  const trainers: any[] = data?.data ?? []
  const filtered = trainers.filter(t =>
    `${t.first_name} ${t.last_name} ${t.phone}`.toLowerCase().includes(search.toLowerCase())
  )

  const createTrainer = useMutation({
    mutationFn: () => apiClient.post('/trainers', form),
    onSuccess: () => {
      toast.success('Trainer created')
      setShowCreate(false)
      setForm({ first_name: '', last_name: '', phone: '', password: '' })
      qc.invalidateQueries({ queryKey: ['trainers'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to create trainer'),
  })

  const toggleActive = useMutation({
    mutationFn: (id: number) => apiClient.post(`/users/${id}/toggle-active`),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['trainers'] }) },
  })

  const inputClass = "w-full bg-graphite-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Trainers</h1>
          <p className="text-muted-foreground mt-1">{trainers.length} staff members</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all text-sm">
          <Plus className="w-4 h-4" /> Add Trainer
        </button>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search trainers..."
          className="w-full pl-10 pr-4 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50" />
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length:6}).map((_,i) => <div key={i} className="glass-card p-6 h-40 animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((trainer: any, i: number) => (
            <motion.div key={trainer.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
              className="glass-card p-6 border border-white/5 hover:border-cyan-500/20 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {trainer.first_name?.[0]}{trainer.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{trainer.first_name} {trainer.last_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />{trainer.phone}
                    </p>
                  </div>
                </div>
                <button onClick={() => toggleActive.mutate(trainer.id)}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer ${
                    trainer.is_active
                      ? 'bg-green-500/15 text-green-400 border-green-500/20 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/20'
                      : 'bg-red-500/15 text-red-400 border-red-500/20 hover:bg-green-500/15 hover:text-green-400 hover:border-green-500/20'
                  } transition-colors`}>
                  {trainer.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{trainer.clients_count ?? 0} clients</span>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-muted-foreground">No trainers found</div>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 border border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Add Trainer</h3>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg bg-graphite-700 flex items-center justify-center hover:bg-graphite-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground mb-1 block">First Name</label>
                  <input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className={inputClass} placeholder="John" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Last Name</label>
                  <input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className={inputClass} placeholder="Doe" /></div>
              </div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputClass} placeholder="+1 234 567 8900" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Password</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className={inputClass} placeholder="••••••••" /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                <button onClick={() => createTrainer.mutate()} disabled={createTrainer.isPending || !form.first_name || !form.phone || !form.password}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                  Create Trainer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
