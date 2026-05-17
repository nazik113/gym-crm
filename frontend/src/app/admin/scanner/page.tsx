'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { qrApi } from '@/lib/api/qr'
import { toast } from 'sonner'
import { QrCode, X, User, CreditCard, Radio, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'

type ScanResult = { client: any; role: string; card: string; checked_in: boolean }

export default function QRScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    if (!scanning) return
    scannerRef.current = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 280, aspectRatio: 1 }, false)
    scannerRef.current.render(
      async (code) => {
        scannerRef.current?.clear()
        setScanning(false)
        await handleScan(code)
      },
      () => {}
    )
    return () => { scannerRef.current?.clear().catch(() => {}) }
  }, [scanning])

  const handleScan = async (code: string) => {
    try {
      setLoading(true)
      const res = await qrApi.scan(code)
      setResult(res.data)
      if (res.data.checked_in) toast.success(`${res.data.client.first_name} checked in!`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'QR not recognised')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">QR Scanner</h1>
        <p className="text-muted-foreground mt-1">Scan a client or trainer QR code</p>
      </motion.div>

      {/* Scanner card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-8 border border-white/5 text-center"
      >
        {!scanning ? (
          <div className="space-y-6">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
              <QrCode className="w-12 h-12 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Ready to Scan</h2>
              <p className="text-muted-foreground text-sm">Point the camera at a member's QR code</p>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setScanning(true)} disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-cyan-500 transition-all neon-glow-purple"
            >
              Start Scanning
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-green-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Camera active
              </p>
              <button onClick={() => { scannerRef.current?.clear(); setScanning(false) }}
                className="w-8 h-8 rounded-lg bg-graphite-700 flex items-center justify-center hover:bg-graphite-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div id="qr-reader" className="rounded-2xl overflow-hidden border border-white/10" />
          </div>
        )}
      </motion.div>

      {/* Scan result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-6 border border-purple-500/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" /> Scan Successful
              </h3>
              <button onClick={() => setResult(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Client info */}
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                {result.client.first_name?.[0]}{result.client.last_name?.[0]}
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold">{result.client.first_name} {result.client.last_name}</p>
                <p className="text-muted-foreground text-sm">{result.client.phone}</p>
                {result.checked_in && (
                  <span className="inline-flex items-center gap-1.5 mt-2 bg-green-500/15 border border-green-500/20 rounded-full px-3 py-1 text-xs text-green-400 font-medium">
                    <Radio className="w-3 h-3" /> Checked in just now
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              {result.client.active_subscription && (
                <div className="bg-graphite-700/60 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Subscription</p>
                  <p className="text-sm font-semibold">{result.client.active_subscription.plan?.name}</p>
                  <p className="text-xs text-muted-foreground">Expires {format(new Date(result.client.active_subscription.expires_at), 'MMM d, yyyy')}</p>
                </div>
              )}
              {result.client.active_subscription?.sessions_remaining != null && (
                <div className="bg-graphite-700/60 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Sessions Left</p>
                  <p className="text-2xl font-bold text-cyan-400">{result.client.active_subscription.sessions_remaining}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <a href={`/admin/clients/${result.client.id}`}
                className="flex-1 py-2.5 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-xl text-sm font-medium text-center hover:bg-purple-600/30 transition-all">
                Open Full Profile
              </a>
              <button onClick={() => { setResult(null); setScanning(true) }}
                className="flex-1 py-2.5 bg-graphite-700 border border-white/8 text-foreground rounded-xl text-sm font-medium hover:bg-graphite-600 transition-all">
                Scan Next
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
