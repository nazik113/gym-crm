'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import apiClient from '@/lib/api/client'
import { CalendarCheck, Clock, Search, TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function AdminAttendancePage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => apiClient.get('/attendance', { params: { per_page: 100 } }).then(r => r.data),
  })

  const records: any[] = data?.data ?? []
  const today = records.filter(r => new Date(r.checked_in_at).toDateString() === new Date().toDateString())
  const thisWeek = records.filter(r => new Date(r.checked_in_at) > new Date(Date.now() - 7*24*60*60*1000))

  const filtered = records.filter(r =>
    `${r.client?.first_name} ${r.client?.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">Attendance</h1>
        <p className="text-muted-foreground mt-1">Gym visit records</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-4">
        {[
          { label: 'Today', value: today.length, color: 'text-green-400' },
          { label: 'This Week', value: thisWeek.length, color: 'text-cyan-400' },
          { label: 'Total Records', value: records.length, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center border border-white/5">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by client name..."
          className="w-full pl-10 pr-4 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50" />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array.from({length:10}).map((_,i) => <div key={i} className="h-14 bg-graphite-700 rounded animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No attendance records</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Client','Date & Time','Duration','Method'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec: any, i: number) => (
                  <motion.tr key={rec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-white/5 hover:bg-graphite-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                          {rec.client?.first_name?.[0]}{rec.client?.last_name?.[0]}
                        </div>
                        <span className="font-medium">{rec.client?.first_name} {rec.client?.last_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {rec.checked_in_at ? format(parseISO(rec.checked_in_at), 'MMM d, yyyy · HH:mm') : '—'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {rec.duration_minutes ? `${rec.duration_minutes} min` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-graphite-700 text-muted-foreground capitalize">
                        {rec.check_in_method?.replace('_',' ') ?? rec.type ?? 'visit'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
