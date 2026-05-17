import api from './client'

export const subscriptionsApi = {
  plans:        ()           => api.get('/subscription-plans'),
  createPlan:   (data: object) => api.post('/subscription-plans', data),
  assign:       (clientId: number, data: object) => api.post(`/clients/${clientId}/subscriptions`, data),
  extend:       (subId: number, data: object) => api.patch(`/subscriptions/${subId}/extend`, data),
  deductSession:(subId: number) => api.patch(`/subscriptions/${subId}/deduct-session`),
  cancel:       (subId: number) => api.patch(`/subscriptions/${subId}/cancel`),
}
