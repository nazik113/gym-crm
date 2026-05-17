'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import apiClient from '@/lib/api/client'
import { Ruler, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'

export default function ClientMeasurementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-measurements'],
    queryFn: () => apiClient.get('/my/measurements').then(r => r.data),
  })

  const measurements: any[] = (data?.data ?? []).slice().reverse()
  const latest = measurements[measurements.length - 1]
  const prev = measurements[measurements.length - 2]

  const trend = (curr: number, previous: number) => {
    if (!curr || !previous) return null
    const diff = curr - previous
    if (Math.abs(diff) < 0.1) return { icon: Minus, color: 'text-muted-foreground', text: 'stable' }
    if (diff > 0) return { icon: TrendingUp, color: 'text-red-400', text: `+${diff.toFixed(1)}` }
    return { icon: TrendingDown, color: 'text-green-400', text: diff.toFixed(1) }
  }

  const weightChart = measurements.map(m => ({
    date: m.measured_at ? format(parseISO(m.measured_at), 'MMM d') : '',
    weight: m.weight_kg,
  })).filter(m => m.weight)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">Measurements</h1>
        <p className="text-muted-foreground mt-1">Body composition tracking</p>
      </motion.div>

      {isLoading ? (
        <div className="glass-card p-8 h-48 animate-pulse border border-white/5" />
      ) : measurements.length === 0 ? (
        <div className="glass-card p-16 text-center border border-white/5">
          <Ruler className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">No Measurements Yet</p>
          <p className="text-sm text-muted-foreground">Your trainer will add measurements during your sessions.</p>
        </div>
      ) : (
        <>
          {/* Latest */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="glass-card p-6 border border-white/5">
            <h3 className="font-semibold mb-4">Latest Measurements</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Weight', value: latest?.weight_kg, unit: 'kg', prevVal: prev?.weight_kg },
                { label: 'Height', value: latest?.height_cm, unit: 'cm' },
                { label: 'Body Fat', value: latest?.body_fat_percent, unit: '%', prevVal: prev?.body_fat_percent },
                { label: 'Muscle Mass', value: latest?.muscle_mass_kg, unit: 'kg', prevVal: prev?.muscle_mass_kg },
                { label: 'Chest', value: latest?.chest_cm, unit: 'cm' },
                { label: 'Waist', value: latest?.waist_cm, unit: 'cm', prevVal: prev?.waist_cm },
              ].filter(m => m.value).map(m => {
                const t = m.prevVal ? trend(m.value, m.prevVal) : null
                const Icon = t?.icon
                return (
                  <div key={m.label} className="bg-graphite-700/50 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                    <p className="text-xl font-bold">{m.value}<span className="text-sm font-normal text-muted-foreground ml-1">{m.unit}</span></p>
                    {t && Icon && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${t.color}`}>
                        <Icon className="w-3 h-3" />{t.text}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Measured {latest?.measured_at ? format(parseISO(latest.measured_at), 'MMMM d, yyyy') : '—'}
            </p>
          </motion.div>

          {/* Weight Chart */}
          {weightChart.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card p-6 border border-white/5">
              <h3 className="font-semibold mb-4">Weight Progress</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="weight" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* History table */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5"><h3 className="font-semibold">History</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Date','Weight','Body Fat','Muscle','Waist'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...measurements].reverse().map((m: any) => (
                    <tr key={m.id} className="border-b border-white/5 hover:bg-graphite-700/30">
                      <td className="px-4 py-3 text-muted-foreground">{m.measured_at ? format(parseISO(m.measured_at), 'MMM d, yyyy') : '—'}</td>
                      <td className="px-4 py-3">{m.weight_kg ? `${m.weight_kg} kg` : '—'}</td>
                      <td className="px-4 py-3">{m.body_fat_percent ? `${m.body_fat_percent}%` : '—'}</td>
                      <td className="px-4 py-3">{m.muscle_mass_kg ? `${m.muscle_mass_kg} kg` : '—'}</td>
                      <td className="px-4 py-3">{m.waist_cm ? `${m.waist_cm} cm` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
