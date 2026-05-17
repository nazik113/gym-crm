'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import apiClient from '@/lib/api/client'
import { CalendarCheck, Clock, TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function ClientAttendancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => apiClient.get('/my/attendance').then(r => r.data),
  })

  const records: any[] = data?.data ?? []
  const thisMonth = records.filter(r => new Date(r.checked_in_at) > new Date(Date.now() - 30*24*60*60*1000))
  const thisWeek = records.filter(r => new Date(r.checked_in_at) > new Date(Date.now() - 7*24*60*60*1000))

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">Attendance</h1>
        <p className="text-muted-foreground mt-1">Your gym visit history</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Visits', value: records.length, color: 'text-purple-400' },
          { label: 'This Month', value: thisMonth.length, color: 'text-cyan-400' },
          { label: 'This Week', value: thisWeek.length, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center border border-white/5">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* List */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array.from({length:8}).map((_,i) => <div key={i} className="h-14 bg-graphite-700 rounded animate-pulse" />)}</div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No visits yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {records.map((rec: any, i: number) => (
              <motion.div key={rec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CalendarCheck className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {format(parseISO(rec.checked_in_at), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {format(parseISO(rec.checked_in_at), 'HH:mm')}
                    {rec.duration_minutes && ` · ${rec.duration_minutes} min`}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-graphite-700 text-muted-foreground capitalize">
                  {rec.check_in_method?.replace('_', ' ') ?? rec.type ?? 'visit'}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
