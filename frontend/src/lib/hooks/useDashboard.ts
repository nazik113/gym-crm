import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api/dashboard'

export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: () => dashboardApi.index().then(r => r.data), refetchInterval: 30_000 })

export const useDashboardStats = () =>
  useQuery({ queryKey: ['dashboard','stats'], queryFn: () => dashboardApi.stats().then(r => r.data) })
