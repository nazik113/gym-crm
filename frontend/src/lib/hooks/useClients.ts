import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '@/lib/api/clients'

export const useClients = (params?: object) =>
  useQuery({ queryKey: ['clients', params], queryFn: () => clientsApi.list(params).then(r => r.data) })

export const useClient = (id: number) =>
  useQuery({ queryKey: ['clients', id], queryFn: () => clientsApi.get(id).then(r => r.data), enabled: !!id })

export const useClientNotes = (id: number) =>
  useQuery({ queryKey: ['clients', id, 'notes'], queryFn: () => clientsApi.notes(id).then(r => r.data), enabled: !!id })

export const useAddNote = (clientId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: object) => clientsApi.addNote(clientId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients', clientId, 'notes'] }),
  })
}
