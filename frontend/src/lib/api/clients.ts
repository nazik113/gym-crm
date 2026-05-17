import api from './client'

export const clientsApi = {
  list:           (params?: object) => api.get('/clients', { params }),
  get:            (id: number) => api.get(`/clients/${id}`),
  create:         (data: object) => api.post('/clients', data),
  update:         (id: number, data: object) => api.put(`/clients/${id}`, data),
  delete:         (id: number) => api.delete(`/clients/${id}`),
  subscription:   (id: number) => api.get(`/clients/${id}/subscription`),
  attendance:     (id: number, params?: object) => api.get(`/clients/${id}/attendance`, { params }),
  measurements:   (id: number) => api.get(`/clients/${id}/measurements`),
  addMeasurement: (id: number, data: object) => api.post(`/clients/${id}/measurements`, data),
  notes:          (id: number) => api.get(`/clients/${id}/notes`),
  addNote:        (id: number, data: object) => api.post(`/clients/${id}/notes`, data),
  deleteNote:     (noteId: number) => api.delete(`/notes/${noteId}`),
}
