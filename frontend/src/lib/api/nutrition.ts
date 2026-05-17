import api from './client'

export const nutritionApi = {
  list:       (params?: object) => api.get('/nutrition-plans', { params }),
  get:        (id: number) => api.get(`/nutrition-plans/${id}`),
  create:     (data: object) => api.post('/nutrition-plans', data),
  update:     (id: number, data: object) => api.put(`/nutrition-plans/${id}`, data),
  delete:     (id: number) => api.delete(`/nutrition-plans/${id}`),
  addMeal:    (planId: number, data: object) => api.post(`/nutrition-plans/${planId}/meals`, data),
  updateMeal: (mealId: number, data: object) => api.put(`/meals/${mealId}`, data),
  deleteMeal: (mealId: number) => api.delete(`/meals/${mealId}`),
  myNutrition:() => api.get('/my/nutrition'),
}
