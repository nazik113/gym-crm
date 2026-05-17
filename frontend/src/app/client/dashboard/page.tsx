'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/lib/stores/auth'
import apiClient from '@/lib/api/client'
import { CreditCard, CalendarCheck, Dumbbell, Apple, QrCode, Radio, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function ClientDashboardPage() {
  const user = useAuthStore(s => s.user)

  const { data: subData } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => apiClient.get('/my/subscription').then(r => r.data),
  })

  const { data: attData } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => apiClient.get('/my/attendance').then(r => r.data),
  })

  const { data: workoutData } = useQuery({
    queryKey: ['my-workouts'],
    queryFn: () => apiClient.get('/my/workouts').then(r => r.data),
  })

  const sub = subData?.data?.[0] ?? subData?.data
  const attendance: any[] = attData?.data ?? []
  const workouts: any[] = workoutData?.data ?? []

  const quickLinks = [
    { href: '/client/qr',           label: 'My QR Code',    icon: QrCode,         color: 'from-purple-500 to-cyan-500' },
    { href: '/client/subscription',  label: 'Subscription',  icon: CreditCard,     color: 'from-cyan-500 to-blue-500' },
    { href: '/client/workouts',      label: 'Workouts',      icon: Dumbbell,       color: 'from-green-500 to-teal-500' },
    { href: '/client/nutrition',     label: 'Nutrition',     icon: Apple,          color: 'from-orange-500 to-red-500' },
    { href: '/client/attendance',    label: 'Attendance',    icon: CalendarCheck,  color: 'from-blue-500 to-indigo-500' },
    { href: '/client/measurements',  label: 'Measurements',  icon: TrendingUp,     color: 'from-pink-500 to-rose-500' },
  ]

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">Welcome back, {user?.first_name}!</h1>
        <p className="text-muted-foreground mt-1">Here's your fitness overview</p>
      </motion.div>

      {/* Subscription Banner */}
      {sub && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass-card p-5 border border-white/5 flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{sub.plan?.name}</p>
            <p className="text-sm text-muted-foreground">
              {sub.expires_at ? `Expires ${sub.expires_at}` : 'Active'}
              {sub.sessions_remaining != null && ` · ${sub.sessions_remaining} sessions left`}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/20">
            {sub.status}
          </span>
        </motion.div>
      )}

      {/* Quick Links */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {quickLinks.map(({ href, label, icon: Icon, color }, i) => (
          <Link key={href} href={href}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
              className="glass-card p-5 flex flex-col items-center gap-3 border border-white/5 hover:border-white/15 transition-all cursor-pointer text-center group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium">{label}</p>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Visits', value: attendance.length, color: 'text-purple-400' },
          { label: 'This Month', value: attendance.filter((a: any) => new Date(a.checked_in_at) > new Date(Date.now() - 30*24*60*60*1000)).length, color: 'text-cyan-400' },
          { label: 'Workout Plans', value: workouts.length, color: 'text-green-400' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.05 }}
            className="glass-card p-4 text-center border border-white/5">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Attendance */}
      {attendance.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card p-6 border border-white/5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-purple-400" /> Recent Visits
          </h2>
          <div className="space-y-2">
            {attendance.slice(0, 5).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 text-sm">
                <span className="flex items-center gap-2">
                  <Radio className="w-3 h-3 text-green-400" />
                  {new Date(a.checked_in_at).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-muted-foreground text-xs">{new Date(a.checked_in_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
