import api from './client'

export const dashboardApi = {
  index: () => api.get('/dashboard'),
  stats: () => api.get('/dashboard/stats'),
}
