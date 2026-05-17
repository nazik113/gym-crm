import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { presenceApi } from '@/lib/api/presence'
import { usePresenceStore } from '@/lib/stores/presence'
import { useEffect } from 'react'

export const usePresence = () => {
  const setClients = usePresenceStore(s => s.setClients)
  const query = useQuery({
    queryKey: ['presence'],
    queryFn:  () => presenceApi.list().then(r => r.data),
    refetchInterval: 15_000,
  })
  useEffect(() => { if (query.data) setClients(query.data.clients) }, [query.data])
  return query
}

export const usePresenceMutation = () => {
  const qc = useQueryClient()
  const enter = useMutation({
    mutationFn: (id: number) => presenceApi.enter(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['presence'] }),
  })
  const leave = useMutation({
    mutationFn: (id: number) => presenceApi.leave(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['presence'] }),
  })
  return { enter, leave }
}
