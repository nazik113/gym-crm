import api from './client'

export const codesApi = {
  list:   (params?: object) => api.get('/registration-codes', { params }),
  create: (data: object) => api.post('/registration-codes', data),
  revoke: (id: number) => api.post(`/registration-codes/${id}/revoke`),
  delete: (id: number) => api.delete(`/registration-codes/${id}`),
}
