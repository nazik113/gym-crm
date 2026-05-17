'use client'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/shared/Skeleton'
import { DollarSign } from 'lucide-react'

interface Props { data: { month: string; revenue: number }[]; loading?: boolean }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-graphite-700 border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-cyan-400">${payload[0]?.value?.toFixed(0)}</p>
    </div>
  )
}

export function RevenueChart({ data, loading }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="glass-card p-6 border border-white/5"
    >
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold">Revenue (6 months)</h2>
      </div>
      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#06B6D4" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" fill="url(#revGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}
