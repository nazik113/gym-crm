'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import apiClient from '@/lib/api/client'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react'

export default function AdminAnalyticsPage() {
  const { data: revenue } = useQuery({ queryKey: ['analytics-revenue'], queryFn: () => apiClient.get('/analytics/revenue').then(r => r.data) })
  const { data: attendance } = useQuery({ queryKey: ['analytics-attendance'], queryFn: () => apiClient.get('/analytics/attendance').then(r => r.data) })
  const { data: subs } = useQuery({ queryKey: ['analytics-subscriptions'], queryFn: () => apiClient.get('/analytics/subscriptions').then(r => r.data) })
  const { data: clients } = useQuery({ queryKey: ['analytics-clients'], queryFn: () => apiClient.get('/analytics/clients').then(r => r.data) })

  const revenueData: any[] = revenue?.data?.monthly ?? []
  const attendanceData: any[] = attendance?.data?.daily ?? []
  const subsData: any[] = revenue?.data?.by_plan ?? []
  const topClients: any[] = clients?.data?.top_visitors ?? []

  const COLORS = ['#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

  const CustomTooltip = ({ active, payload, label }: any) =>
    active && payload?.length ? (
      <div className="bg-graphite-800 border border-white/10 rounded-xl p-3 text-sm">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any) => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
      </div>
    ) : null

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">Analytics</h1>
        <p className="text-muted-foreground mt-1">Business performance overview</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-5">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h2 className="font-semibold">Monthly Revenue</h2>
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <Bar dataKey="revenue" fill="url(#revGrad)" radius={[4,4,0,0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>}
        </motion.div>

        {/* Attendance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold">Daily Attendance</h2>
          </div>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={false} name="Visits" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>}
        </motion.div>

        {/* Subscription breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold">Subscriptions by Plan</h2>
          </div>
          {subsData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={subsData} dataKey="count" nameKey="plan" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {subsData.map((_: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {subsData.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="flex-1 text-muted-foreground">{item.plan}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>}
        </motion.div>

        {/* Top clients */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-orange-400" />
            <h2 className="font-semibold">Most Active Clients</h2>
          </div>
          {topClients.length > 0 ? (
            <div className="space-y-3">
              {topClients.slice(0, 8).map((client: any, i: number) => (
                <div key={client.id ?? i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {client.first_name?.[0]}{client.last_name?.[0]}
                  </div>
                  <span className="flex-1 text-sm font-medium">{client.first_name} {client.last_name}</span>
                  <span className="text-sm font-bold text-cyan-400">{client.visits_this_month ?? client.visits_count ?? 0}</span>
                </div>
              ))}
            </div>
          ) : <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>}
        </motion.div>
      </div>
    </div>
  )
}
