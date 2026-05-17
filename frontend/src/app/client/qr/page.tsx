'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import apiClient from '@/lib/api/client'
import { useAuthStore } from '@/lib/stores/auth'
import { QrCode, RefreshCw } from 'lucide-react'

export default function ClientQRPage() {
  const user = useAuthStore(s => s.user)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-qr'],
    queryFn: () => apiClient.get('/qr/my').then(r => r.data),
  })

  const qrValue = data?.qr_code ?? user?.qr_code ?? ''

  return (
    <div className="min-h-full flex flex-col items-center justify-center space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold gradient-text">My QR Code</h1>
        <p className="text-muted-foreground mt-2">Show this to the trainer or scanner to check in</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8 border border-white/5 flex flex-col items-center gap-6"
      >
        {isLoading ? (
          <div className="w-64 h-64 rounded-2xl bg-graphite-700/50 animate-pulse flex items-center justify-center">
            <QrCode className="w-16 h-16 text-muted-foreground/30" />
          </div>
        ) : isError ? (
          <div className="w-64 h-64 rounded-2xl bg-destructive/10 border border-destructive/20 flex flex-col items-center justify-center gap-3">
            <QrCode className="w-12 h-12 text-destructive/50" />
            <p className="text-sm text-muted-foreground">Failed to load QR code</p>
          </div>
        ) : (
          <div className="p-4 bg-white rounded-2xl shadow-2xl">
            <QRCodeSVG
              value={qrValue}
              size={220}
              level="H"
              includeMargin={false}
            />
          </div>
        )}

        <div className="text-center">
          <p className="text-lg font-semibold">{user?.first_name} {user?.last_name}</p>
          <p className="text-xs text-muted-foreground font-mono mt-1">{qrValue}</p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-graphite-700 hover:bg-graphite-600 text-sm text-muted-foreground hover:text-foreground transition-all border border-white/5"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xs text-muted-foreground text-center max-w-xs"
      >
        Your QR code is unique to your account. Keep it safe and do not share it with others.
      </motion.p>
    </div>
  )
}
