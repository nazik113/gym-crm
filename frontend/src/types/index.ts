export type Role = 'admin' | 'trainer' | 'client'

export interface User {
  id: number
  role_id: number
  role: { id: number; name: Role; display_name: string }
  phone: string
  first_name: string
  last_name: string
  full_name: string
  date_of_birth?: string
  avatar?: string
  qr_code?: string
  is_active: boolean
  is_in_gym: boolean
  gym_entered_at?: string
  trainer_id?: number
  trainer?: Pick<User, 'id' | 'first_name' | 'last_name' | 'avatar'>
  active_subscription?: Subscription
  created_at: string
}

export interface SubscriptionPlan {
  id: number
  name: string
  description?: string
  price: number
  duration_days: number
  sessions_count?: number
  is_active: boolean
  color: string
}

export interface Subscription {
  id: number
  user_id: number
  plan_id: number
  plan: SubscriptionPlan
  price_paid: number
  sessions_remaining?: number
  starts_at: string
  expires_at: string
  status: 'active' | 'expired' | 'cancelled' | 'pending'
  notes?: string
  created_at: string
}

export interface Attendance {
  id: number
  user_id: number
  subscription_id?: number
  checked_in_by?: number
  check_in_method: 'qr_scan' | 'manual' | 'system'
  checked_in_at: string
  checked_out_at?: string
  duration_minutes?: number
}

export interface WorkoutPlan {
  id: number
  client_id: number
  trainer_id: number
  title: string
  description?: string
  status: 'active' | 'completed' | 'draft'
  start_date?: string
  end_date?: string
  days?: WorkoutDay[]
}

export interface WorkoutDay {
  id: number
  plan_id: number
  name: string
  day_number: number
  muscle_groups?: string
  notes?: string
  exercises?: Exercise[]
}

export interface Exercise {
  id: number
  workout_day_id: number
  name: string
  category?: string
  sets?: number
  reps?: string
  weight_kg?: number
  rest_seconds?: number
  duration_minutes?: number
  instructions?: string
  video_url?: string
  order: number
}

export interface NutritionPlan {
  id: number
  client_id: number
  trainer_id: number
  title: string
  description?: string
  daily_calories?: number
  protein_g?: number
  carbs_g?: number
  fats_g?: number
  status: 'active' | 'completed' | 'draft'
  meals?: Meal[]
}

export interface Meal {
  id: number
  plan_id: number
  name: string
  time_of_day?: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fats_g?: number
  foods?: string[]
  notes?: string
  order: number
}

export interface Measurement {
  id: number
  client_id: number
  weight_kg?: number
  height_cm?: number
  body_fat_percent?: number
  muscle_mass_kg?: number
  chest_cm?: number
  waist_cm?: number
  hips_cm?: number
  notes?: string
  measured_at: string
}

export interface Note {
  id: number
  client_id: number
  author_id: number
  author?: Pick<User, 'id' | 'first_name' | 'last_name'>
  title?: string
  content: string
  type: 'general' | 'health' | 'progress' | 'warning'
  is_private: boolean
  created_at: string
}

export interface RegistrationCode {
  id: number
  code: string
  role: { name: Role; display_name: string }
  subscription_plan?: SubscriptionPlan
  status: 'active' | 'used' | 'expired' | 'revoked'
  activated_by?: Pick<User, 'id' | 'first_name' | 'last_name'>
  activated_at?: string
  expires_at?: string
  created_at: string
}

export interface DashboardStats {
  total_clients: number
  total_trainers: number
  active_subscriptions: number
  clients_in_gym: number
  today_attendance: number
  month_attendance: number
  expiring_soon: number
  monthly_revenue: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}
