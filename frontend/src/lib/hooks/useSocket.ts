'use client'
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/lib/stores/auth'
import { usePresenceStore } from '@/lib/stores/presence'

let socket: Socket | null = null

export function useSocket() {
  const { token, isAuthenticated } = useAuthStore()
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

    return () => {
      socket?.disconnect()
      socket = null
      initialized.current = false
    }
  }, [isAuthenticated, token])

  return socket
}

export { socket }
