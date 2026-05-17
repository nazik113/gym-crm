'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'purple' | 'cyan' | 'green' | 'orange' | 'pink'
  delay?: number
}

const colorMap = {
  purple: { bg: 'bg-purple-500/15', border: 'border-purple-500/20', icon: 'text-purple-400', glow: 'shadow-purple-500/20' },
  cyan:   { bg: 'bg-cyan-500/15',   border: 'border-cyan-500/20',   icon: 'text-cyan-400',   glow: 'shadow-cyan-500/20'   },
  green:  { bg: 'bg-green-500/15',  border: 'border-green-500/20',  icon: 'text-green-400',  glow: 'shadow-green-500/20'  },
  orange: { bg: 'bg-orange-500/15', border: 'border-orange-500/20', icon: 'text-orange-400', glow: 'shadow-orange-500/20' },
  pink:   { bg: 'bg-pink-500/15',   border: 'border-pink-500/20',   icon: 'text-pink-400',   glow: 'shadow-pink-500/20'   },
}

export function StatCard({ label, value, icon: Icon, trend, color = 'purple', delay = 0 }: Props) {
  const c = colorMap[color]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn('glass-card p-6 border shadow-lg', c.border, c.glow)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <motion.p
            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: delay + 0.1, type: 'spring' }}
            className="text-3xl font-bold text-foreground"
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </motion.p>
          {trend && (
            <p className={cn('text-xs mt-1.5', trend.value >= 0 ? 'text-green-400' : 'text-red-400')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', c.bg)}>
          <Icon className={cn('w-6 h-6', c.icon)} />
        </div>
      </div>
    </motion.div>
  )
}
