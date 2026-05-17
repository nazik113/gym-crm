import { create } from 'zustand'
import type { User } from '@/types'

interface PresenceState {
  clientsInGym: User[]
  count: number
  setClients: (clients: User[]) => void
  addClient:  (client: User) => void
  removeClient:(clientId: number) => void
}

export const usePresenceStore = create<PresenceState>((set) => ({
  clientsInGym: [],
  count: 0,
  setClients:   (clients) => set({ clientsInGym: clients, count: clients.length }),
  addClient:    (client)  => set((s) => ({ clientsInGym: [...s.clientsInGym, client], count: s.count + 1 })),
  removeClient: (id)      => set((s) => ({
    clientsInGym: s.clientsInGym.filter((c) => c.id !== id),
    count: Math.max(0, s.count - 1),
  })),
}))
