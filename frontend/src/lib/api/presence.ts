import api from './client'

export const presenceApi = {
  list:  ()           => api.get('/presence'),
  enter: (clientId: number) => api.post(`/presence/${clientId}/enter`),
  leave: (clientId: number) => api.post(`/presence/${clientId}/leave`),
}
