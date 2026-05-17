import api from './client'

export const authApi = {
  login:        (data: { phone: string; password: string }) => api.post('/auth/login', data),
  validateCode: (code: string) => api.post('/auth/validate-code', { code }),
  register:     (data: object) => api.post('/auth/register', data),
  me:           () => api.get('/auth/me'),
  logout:       () => api.post('/auth/logout'),
}
