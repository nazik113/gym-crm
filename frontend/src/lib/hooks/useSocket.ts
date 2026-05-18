'use client'
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/lib/stores/auth'
import { usePresenceStore } from '@/lib/stores/presence'
import toast from 'react-hot-toast'

let socket: Socket | null = null

const ICONS: Record<string, string> = {
  note:         '📝',
  workout:      '💪',
  nutrition:    '🥗',
  session:      '🎯',
  subscription: '💳',
  info:         'ℹ️',
}

export function useSocket() {
  const { token, isAuthenticated, user } = useAuthStore()
  const { addClient, removeClient } = usePresenceStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !token || initialized.current) return
    initialized.current = true

    socket = io(process.env.NEXT_PUBLIC_REALTIME_URL || '', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => console.log('🔌 Socket connected'))
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'))

    socket.on('presence:update', (data) => {
      if (data.event === 'client.entered') addClient(data.client)
      if (data.event === 'client.left')    removeClient(data.client_id)
    })

    // Realtime notifications — shown to clients
    socket.on('notification:received', (data: { message: string; type: string; timestamp: string }) => {
      const icon = ICONS[data.type] ?? ICONS.info
      toast(`${icon} ${data.message}`, {
        duration: 5000,
        style: {
          background: '#1e1e2e',
          color: '#e2e2e2',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          fontSize: '14px',
        },
      })
    })

    return () => {
      socket?.disconnect()
      socket = null
      initialized.current = false
    }
  }, [isAuthenticated, token])

  return socket
}

export { socket }
