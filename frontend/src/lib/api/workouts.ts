import api from './client'

export const workoutsApi = {
  list:          (params?: object)          => api.get('/workout-plans', { params }),
  get:           (id: number)               => api.get(`/workout-plans/${id}`),
  create:        (data: object)             => api.post('/workout-plans', data),
  update:        (id: number, data: object) => api.put(`/workout-plans/${id}`, data),
  delete:        (id: number)               => api.delete(`/workout-plans/${id}`),
  addDay:        (planId: number, data: object) => api.post(`/workout-plans/${planId}/days`, data),
  deleteDay:     (dayId: number)               => api.delete(`/workout-days/${dayId}`),
  addExercise:   (dayId: number, data: object)  => api.post(`/workout-days/${dayId}/exercises`, data),
  updateExercise:(exId: number, data: object)   => api.put(`/exercises/${exId}`, data),
  deleteExercise:(exId: number)                 => api.delete(`/exercises/${exId}`),
  myWorkouts:    ()                             => api.get('/my/workouts'),
}
