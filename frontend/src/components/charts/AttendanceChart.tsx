'use client'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/shared/Skeleton'
import { CalendarCheck } from 'lucide-react'

interface Props { data: { date: string; count: number }[]; loading?: boolean }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-graphite-700 border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-purple-400">{payload[0]?.value} visits</p>
    </div>
  )
}

export function AttendanceChart({ data, loading }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="glass-card p-6 border border-white/5"
    >
      <div className="flex items-center gap-2 mb-6">
        <CalendarCheck className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold">Attendance (30 days)</h2>
      </div>
      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={2} fill="url(#attGrad)" dot={false} activeDot={{ r: 5, fill: '#7C3AED' }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}
