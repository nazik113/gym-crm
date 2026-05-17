'use client'
import { motion } from 'framer-motion'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { StatCard } from '@/components/shared/StatCard'
import { StatCardSkeleton } from '@/components/shared/Skeleton'
import { AttendanceChart } from '@/components/charts/AttendanceChart'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { PresenceWidget } from '@/components/admin/PresenceWidget'
import { ExpiringSubsWidget } from '@/components/admin/ExpiringSubsWidget'
import { Users, CreditCard, TrendingUp, Activity, Radio, CalendarCheck, AlertTriangle, DollarSign } from 'lucide-react'

export default function AdminDashboard() {
  const { data, isLoading } = useDashboard()
  const stats = data?.stats

  return (
    <div className="space-y-8">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back — here's what's happening today.</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Total Clients"        value={stats?.total_clients ?? 0}        icon={Users}         color="purple" delay={0}    />
            <StatCard label="Active Subscriptions" value={stats?.active_subscriptions ?? 0} icon={CreditCard}    color="cyan"   delay={0.05} />
            <StatCard label="Monthly Revenue"      value={`$${(stats?.monthly_revenue ?? 0).toFixed(0)}`} icon={DollarSign} color="green" delay={0.1} />
            <StatCard label="In Gym Right Now"     value={stats?.clients_in_gym ?? 0}       icon={Radio}         color="orange" delay={0.15} />
            <StatCard label="Today's Attendance"   value={stats?.today_attendance ?? 0}     icon={CalendarCheck} color="purple" delay={0.2}  />
            <StatCard label="Month Attendance"     value={stats?.month_attendance ?? 0}     icon={Activity}      color="cyan"   delay={0.25} />
            <StatCard label="Total Trainers"       value={stats?.total_trainers ?? 0}       icon={TrendingUp}    color="green"  delay={0.3}  />
            <StatCard label="Expiring Soon"        value={stats?.expiring_soon ?? 0}        icon={AlertTriangle} color="pink"   delay={0.35} />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart data={data?.attendance_chart ?? []} loading={isLoading} />
        <RevenueChart    data={data?.revenue_chart    ?? []} loading={isLoading} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PresenceWidget    clients={data?.currently_in_gym ?? []} loading={isLoading} />
        <ExpiringSubsWidget subs={data?.expiring_subscriptions ?? []} loading={isLoading} />
      </div>
    </div>
  )
}
